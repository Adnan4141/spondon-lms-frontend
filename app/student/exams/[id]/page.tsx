'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { startExamAttempt, getAttemptResult, getExamStudentView, getExamPdfDownloadUrl } from '@/lib/api/exams';
import type { StartAttemptResponse, AttemptResultResponse, ExamStudentView, StudentExamResultStatus } from '@/types/exam';
import { LazyExamTakingView as ExamTakingView } from '@/components/student/exam-window/LazyExamTakingView';
import { WrittenUploadLightbox } from '@/components/student/exam-window/WrittenUploadLightbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Timer, AlertTriangle, CheckCircle2, Loader2, Eye, Trophy, XCircle, Building2, FileText, PenLine, CalendarClock, Info, Clock, ChevronRight, ChevronLeft, RefreshCw, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isOfflineDeliveryExam } from '@/lib/exam-workflow';
import { centreQuestionPaperCopy } from '@/features/student/exam-state';

import {
  detectQuestionLang,
  getExamUiStrings,
  getOptionLabel,
  type Lang,
} from '@/components/student/exam-window/examUiCopy';

type Phase = 'loading' | 'waiting' | 'offline' | 'exam' | 'result';
type ResultQuestion = AttemptResultResponse['questions'][number];
type ResultDisplayItem =
  | { kind: 'single'; id: string; firstQuestionIndex: number; questions: [ResultQuestion] }
  | { kind: 'passage'; id: string; firstQuestionIndex: number; questions: ResultQuestion[] };

type AttemptRecoveryPayload = {
  attemptId?: string | null;
  latestCompletedAttemptId?: string | null;
};

function buildResultDisplayItems(questions: ResultQuestion[]): ResultDisplayItem[] {
  const items: ResultDisplayItem[] = [];
  questions.forEach((q, index) => {
    const passage = q.question?.type === 'MCQ' ? q.question?.passage : null;
    if (!passage?.id) {
      items.push({ kind: 'single', id: q.id, firstQuestionIndex: index, questions: [q] });
      return;
    }
    const lastItem = items[items.length - 1];
    const lastPassageId =
      lastItem?.kind === 'passage' ? lastItem.questions[0]?.question?.passage?.id ?? null : null;
    if (lastItem?.kind === 'passage' && lastPassageId === passage.id) {
      lastItem.questions.push(q);
      return;
    }
    items.push({ kind: 'passage', id: `passage-${passage.id}-${index}`, firstQuestionIndex: index, questions: [q] });
  });
  return items;
}

function getAttemptRecoveryPayload(error: unknown): AttemptRecoveryPayload {
  if (!(error instanceof ApiError) || !error.body || typeof error.body !== 'object') return {};
  const body = error.body as {
    data?: { attemptId?: string | null; latestCompletedAttemptId?: string | null };
  };
  return {
    attemptId: body.data?.attemptId ?? null,
    latestCompletedAttemptId: body.data?.latestCompletedAttemptId ?? null,
  };
}

function hasPendingWrittenEvaluation(result: AttemptResultResponse | null): boolean {
  if (!result) return false;
  if (result.attempt.obtainedMarks != null) return false;
  return result.questions.some((question) => {
    const type = question.question?.type;
    return type === 'CQ' || type === 'SHORT';
  });
}

function isSubmissionPdfUrl(url: string): boolean {
  return /\.pdf($|\?)/i.test(url);
}

function getProvisionalMcqScore(result: AttemptResultResponse | null): { obtained: number; total: number } | null {
  if (!result) return null;
  let obtained = 0;
  let total = 0;
  result.questions.forEach((question) => {
    if (question.question?.type !== 'MCQ') return;
    total += Number(question.marks || 0);
    obtained += Number(question.studentAnswer?.obtainedMarks || 0);
  });
  return total > 0 ? { obtained: Math.max(0, obtained), total } : null;
}

function offlineResultStatusCopy(status?: StudentExamResultStatus | null): {
  label: string;
  message: string;
  className: string;
} | null {
  switch (status) {
    case 'NOT_SUBMITTED':
      return {
        label: 'Result not published',
        message: 'Result has not been published yet. Please check back after the exam authority processes the scripts.',
        className: 'border-slate-200 bg-white text-slate-700',
      };
    case 'PENDING_BRANCH_APPROVAL':
      return {
        label: 'Branch approval pending',
        message: 'Your result entry is waiting for branch approval.',
        className: 'border-amber-200 bg-amber-100/80 text-amber-950',
      };
    case 'PENDING_CENTRAL_APPROVAL':
      return {
        label: 'Central approval pending',
        message: 'Branch approval is complete. Central approval is pending.',
        className: 'border-blue-200 bg-blue-50 text-blue-900',
      };
    case 'PUBLISHED':
      return {
        label: 'Result published',
        message: 'Your result has been published.',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      };
    case 'LEGACY_RESULT':
      return {
        label: 'Result available',
        message: 'Your result is available from the previous offline result system.',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      };
    default:
      return null;
  }
}

export default function StudentExamTakingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const examId = params.id as string;
  const viewMode = searchParams.get('view');

  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [examMeta, setExamMeta] = useState<ExamStudentView | null>(null);

  const [attemptData, setAttemptData] = useState<StartAttemptResponse | null>(null);
  const [result, setResult] = useState<AttemptResultResponse | null>(null);
  const [countdown, setCountdown] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<'mcq' | 'written'>('mcq');
  const [refreshingResult, setRefreshingResult] = useState(false);
  const [uploadLightbox, setUploadLightbox] = useState<{ url: string; label: string } | null>(null);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shellLang: Lang = 'en';
  const baseUi = getExamUiStrings(shellLang);
  const examDisplayTitle = result?.exam.title || attemptData?.exam.title || examMeta?.title || examId;

  const openResultAttempt = useCallback(async (attemptId: string, nextNotice?: string | null) => {
    const resultRes = await getAttemptResult(attemptId);
    if (!resultRes.success || !resultRes.data) {
      throw new Error(resultRes.message || 'Could not load results');
    }
    setResult(resultRes.data);
    setAttemptData(null);
    setNotice(nextNotice ?? null);
    setError(null);
    setPhase('result');
  }, []);

  const recoverLatestAttempt = useCallback(async (
    studentId: string,
    reason: string,
    preferredAttemptId?: string | null,
  ): Promise<boolean> => {
    const candidateIds = [preferredAttemptId].filter(Boolean) as string[];
    for (const candidateId of candidateIds) {
      try {
        await openResultAttempt(candidateId, reason);
        return true;
      } catch {
        // Fall through to student-view recovery.
      }
    }

    const viewRes = await getExamStudentView(examId, studentId);
    if (!viewRes.success || !viewRes.data) {
      setError(reason);
      setPhase('loading');
      return false;
    }

    setExamMeta(viewRes.data);
    const latestAttemptId = viewRes.data.latestCompletedAttemptId;
    if (!latestAttemptId) {
      setError(reason);
      setPhase('loading');
      return false;
    }

    await openResultAttempt(latestAttemptId, reason);
    return true;
  }, [examId, openResultAttempt]);

  const beginAttempt = useCallback(async (studentId: string): Promise<boolean> => {
    try {
      const res = await startExamAttempt(examId, studentId);
      if (!res.success || !res.data) {
        setError(res.message || 'Could not start exam');
        setPhase('loading');
        return false;
      }
      setNotice(null);
      setError(null);
      setResult(null);
      setAttemptData(res.data);
      setPhase('exam');
      return true;
    } catch (e: unknown) {
      const reason = e instanceof Error ? e.message : 'Failed to start exam';
      const recovery = getAttemptRecoveryPayload(e);
      const recovered = await recoverLatestAttempt(
        studentId,
        reason,
        recovery.attemptId ?? recovery.latestCompletedAttemptId ?? null,
      ).catch(() => false);
      if (recovered) return false;
      setError(reason);
      setPhase('loading');
      return false;
    }
  }, [examId, recoverLatestAttempt]);

  // Initialize: student-safe exam view, then offline panel or online attempt
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      queueMicrotask(() => setError('Please log in to take the exam'));
      return;
    }
    const user = JSON.parse(userStr);
    queueMicrotask(() => setUserId(user.id));

    const run = async () => {
      try {
        const viewRes = await getExamStudentView(examId, user.id);
        if (!viewRes.success || !viewRes.data) {
          setError(viewRes.message || 'Could not load exam');
          return;
        }
        setExamMeta(viewRes.data);

        if (isOfflineDeliveryExam(viewRes.data)) {
          setPhase('offline');
          return;
        }

        if (viewMode === 'result') {
          const latestAttemptId = viewRes.data.latestCompletedAttemptId;
          if (!latestAttemptId) {
            setError('Results not available yet');
            return;
          }
          await openResultAttempt(latestAttemptId);
          return;
        }

        // Check if startAt is in the future — show waiting screen
        if (viewRes.data.startAt && new Date(viewRes.data.startAt) > new Date()) {
          setPhase('waiting');
          return;
        }

        await beginAttempt(user.id);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to start exam');
      }
    };
    run();
  }, [beginAttempt, examId, openResultAttempt, viewMode]);

  // Countdown ticker for waiting phase
  useEffect(() => {
    if (phase !== 'waiting' || !examMeta?.startAt) return;
    const tick = () => {
      const diff = new Date(examMeta.startAt!).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('');
        // Auto-start when time arrives
        void beginAttempt(userId);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(
        h > 0
          ? `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
          : `${m}m ${String(s).padStart(2, '0')}s`,
      );
      waitTimerRef.current = setTimeout(tick, 1000);
    };
    tick();
    return () => { if (waitTimerRef.current) clearTimeout(waitTimerRef.current); };
  }, [beginAttempt, phase, examMeta, examId, userId]);

  // Waiting — exam not started yet
  if (phase === 'waiting' && examMeta) {
    const startDate = new Date(examMeta.startAt!);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 mx-auto">
            <CalendarClock className="h-10 w-10 text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400 mb-1">Upcoming Exam</p>
            <h1 className="text-2xl font-black text-slate-900">{examDisplayTitle}</h1>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6">
            <p className="text-xs font-bold text-slate-500 mb-1">Exam starts at</p>
            <p className="text-base font-black text-indigo-800">
              {startDate.toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}
            </p>
          </div>
          {countdown && (
            <div className="rounded-2xl bg-slate-900 text-white px-8 py-5">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1">Time Remaining</p>
              <p className="text-2xl font-black tabular-nums">{countdown}</p>
            </div>
          )}
          <p className="text-sm font-medium text-slate-500">Exam will start automatically at the scheduled time.</p>
          <button
            onClick={() => router.push('/student/exams')}
            className="text-sm font-bold text-indigo-600 underline underline-offset-2"
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        {error ? (
          <div className="text-center space-y-4">
            <AlertTriangle className="h-16 w-16 text-rose-400 mx-auto" />
            <p className="text-xl font-bold text-rose-600">{error}</p>
            <Button variant="outline" onClick={() => router.back()} className="mt-4">
              {baseUi.submitConfirmGoBack}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <Loader2 className="h-16 w-16 animate-spin text-indigo-600" />
            <p className="text-xl font-bold text-slate-500 animate-pulse">{baseUi.loading}</p>
          </div>
        )}
      </div>
    );
  }

  // Offline exam — schedule & centre info (no in-app question PDF; no browser attempt)
  if (phase === 'offline' && examMeta) {
    const lang: Lang = 'en';
    const ui =
      lang === 'en'
        ? {
            title: 'Offline exam',
            sub: 'Take this exam at your centre on paper. The question paper will be provided at the exam centre.',
            centreNote: centreQuestionPaperCopy(),
            course: 'Course',
            branch: 'Branch',
            batch: 'Batch',
            window: 'Schedule',
            open: 'Opens',
            closes: 'Closes',
            solve: 'Solution / marks sheet (PDF)',
            sets: 'Question sets prepared',
            leaderboard: 'View leaderboard',
            back: 'Back to exams',
          }
        : {
            title: 'Offline Exam',
            sub: 'এই পরীক্ষা কেন্দ্রে কাগজে দেওয়া হয়। প্রশ্নপত্র পরীক্ষার কেন্দ্রে দেওয়া হবে।',
            centreNote: 'প্রশ্নপত্র পরীক্ষার কেন্দ্রে দেওয়া হবে।',
            course: 'Course',
            branch: 'Branch',
            batch: 'Batch',
            window: 'Schedule',
            open: 'Opens',
            closes: 'Closes',
            solve: 'Solution / Marks Sheet (PDF)',
            sets: 'Question sets prepared',
            leaderboard: 'লিডারবোর্ড দেখুন',
            back: 'Back to Exams',
          };
    let showSolve = false;
    if (examMeta.solveSheetVisibility === 'IMMEDIATELY') showSolve = true;
    else if (examMeta.solveSheetVisibility === 'SCHEDULED' && examMeta.solveSheetScheduledAt) {
      showSolve = new Date() >= new Date(examMeta.solveSheetScheduledAt);
    }
    const solveHref =
      examMeta.solveSheetUrl && showSolve ? getExamPdfDownloadUrl(examMeta.solveSheetUrl) : null;
    const resultStatus = offlineResultStatusCopy(examMeta.resultStatus);

    return (
      <div className={cn('mx-auto min-h-[60vh] w-full max-w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8')}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <Button variant="ghost" className="rounded-xl hover:bg-slate-200/50 font-black uppercase tracking-wider text-xs" onClick={() => router.push('/student/exams')}>
            <ChevronLeft className="mr-1.5 h-4 w-4" /> {ui.back}
          </Button>
          {examMeta.showLeaderboard ? (
            <Button
              variant="outline"
              className="h-10 rounded-xl font-black uppercase tracking-widest text-[10px] border-amber-250 bg-amber-50/80 text-amber-905 hover:bg-amber-100 shadow-sm transition"
              onClick={() => router.push(`/student/leaderboard/${examId}`)}
            >
              <Trophy className="h-4 w-4 mr-2 text-amber-600" />
              {ui.leaderboard}
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start max-w-full">
          {/* Left Column: Details & Syllabus */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <Badge variant="outline" className="mb-1 text-[9px] font-black uppercase bg-orange-100 text-orange-850 border-orange-200">
                  OFFLINE EXAM
                </Badge>
                <h1 className="text-2xl font-black text-slate-900 leading-tight">{examDisplayTitle}</h1>
              </div>
            </div>
            
            <p className="text-slate-655 font-medium leading-relaxed">{ui.sub}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class & Course Info</p>
                <ul className="space-y-2 text-sm font-bold text-slate-705">
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-505 shrink-0" />
                    <span className="text-slate-500 font-semibold">{ui.course}:</span> {examMeta.course?.name ?? '—'}
                  </li>
                  <li className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-rose-400 shrink-0" />
                    <span className="text-slate-500 font-semibold">{ui.branch}:</span> {examMeta.branch?.name ?? '—'}
                  </li>
                  {examMeta.batch?.name ? (
                    <li className="flex items-center gap-2">
                      <PenLine className="h-4 w-4 text-violet-500 shrink-0" />
                      <span className="text-slate-500 font-semibold">{ui.batch}:</span> {examMeta.batch.name}
                    </li>
                  ) : null}
                </ul>
              </div>

              <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{ui.window}</p>
                <ul className="space-y-2 text-xs font-bold text-slate-705">
                  <li className="flex items-center justify-between">
                    <span className="text-slate-500">{ui.open}:</span>
                    <span>{examMeta.startAt ? new Date(examMeta.startAt).toLocaleString('en-GB') : 'Any time'}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-slate-500">{ui.closes}:</span>
                    <span>{examMeta.endAt ? new Date(examMeta.endAt).toLocaleString('en-GB') : 'As announced'}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span className="text-indigo-650">{examMeta.durationMinutes ? `${examMeta.durationMinutes} mins` : 'As announced'}</span>
                  </li>
                </ul>
              </div>
            </div>

            {examMeta.syllabusHtml ? (
              <div className="rounded-2xl border border-slate-100 p-5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syllabus Details</p>
                <div className="prose prose-sm max-w-none text-slate-700 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: examMeta.syllabusHtml }} />
              </div>
            ) : null}
          </div>

          {/* Right Column: Center Notification & Results */}
          <div className="space-y-6 lg:sticky lg:top-20">
            <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-amber-600 shrink-0" />
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-850">Important Notice</h3>
              </div>
              <p className="text-sm font-bold text-amber-900 leading-relaxed bg-white border border-amber-100 rounded-2xl p-4">
                {ui.centreNote}
              </p>
            </div>

            {resultStatus ? (
              <div className={cn('rounded-3xl border p-6 space-y-2 shadow-2xs', resultStatus.className)}>
                <p className="text-[10px] font-black uppercase tracking-widest">{resultStatus.label}</p>
                <p className="text-sm font-bold leading-relaxed">{resultStatus.message}</p>
              </div>
            ) : null}

            {solveHref ? (
              <Button className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center gap-2" asChild>
                <a href={solveHref} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4" />
                  {ui.solve}
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Result view
  if (phase === 'result') {
    const resultLang: Lang = 'en';
    const resultUi = getExamUiStrings(resultLang);
    const pendingWrittenEvaluation = hasPendingWrittenEvaluation(result);
    const provisionalMcqScore = getProvisionalMcqScore(result);
    const resultHeroVariant = !result
      ? 'submitted'
      : result.resultHidden
        ? 'hidden'
        : pendingWrittenEvaluation
          ? 'pending_eval'
          : result.attempt.obtainedMarks != null
            ? 'published'
            : 'submitted';
    const heroConfig = {
      published: {
        Icon: CheckCircle2,
        wrapperClass: 'bg-emerald-100 text-emerald-605',
        iconClass: 'text-emerald-600',
        title: resultUi.resultPublishedTitle,
      },
      pending_eval: {
        Icon: Clock,
        wrapperClass: 'bg-amber-100 text-amber-605',
        iconClass: 'text-amber-600',
        title: resultUi.evaluationPendingTitle,
      },
      hidden: {
        Icon: Info,
        wrapperClass: 'bg-slate-100 text-slate-605',
        iconClass: 'text-slate-600',
        title: resultUi.resultHiddenTitle,
      },
      submitted: {
        Icon: CheckCircle2,
        wrapperClass: 'bg-indigo-100 text-indigo-650',
        iconClass: 'text-indigo-600',
        title: resultUi.examSubmitted,
      },
    } as const;
    const hero = heroConfig[resultHeroVariant];
    const HeroIcon = hero.Icon;

    const refreshResult = async () => {
      if (!result?.attempt?.id) return;
      setRefreshingResult(true);
      try {
        await openResultAttempt(result.attempt.id);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Could not refresh result');
      } finally {
        setRefreshingResult(false);
      }
    };

    const getTimeTaken = () => {
      if (!result?.attempt?.startedAt || !result?.attempt?.submittedAt) return null;
      const start = new Date(result.attempt.startedAt).getTime();
      const end = new Date(result.attempt.submittedAt).getTime();
      const diffMs = end - start;
      if (diffMs <= 0) return null;
      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    };

    const resultDisplayItems = buildResultDisplayItems(result?.questions ?? []);
    const resultQuestionIndexById = new Map((result?.questions ?? []).map((q, index) => [q.id, index]));
    const mcqResultItems = resultDisplayItems.filter((item) => item.questions[0]?.question?.type === 'MCQ');
    const writtenResultItems = resultDisplayItems.filter((item) => item.questions[0]?.question?.type !== 'MCQ');
    const hasResultMixed = mcqResultItems.length > 0 && writtenResultItems.length > 0;
    const activeResultItems = hasResultMixed
      ? (resultTab === 'mcq' ? mcqResultItems : writtenResultItems)
      : resultDisplayItems;
    const solutionJumpItems = activeResultItems.flatMap((item) => {
      if (item.kind === 'single') {
        const q = item.questions[0];
        const idx = resultQuestionIndexById.get(q.id) ?? item.firstQuestionIndex;
        return [{
          id: q.id,
          label: `${idx + 1}`,
          isCorrect: q.studentAnswer?.isCorrect,
          isWritten: q.question?.type === 'CQ' || q.question?.type === 'SHORT',
          isEvaluated: q.studentAnswer?.obtainedMarks != null,
        }];
      }
      return item.questions.map((q) => {
        const idx = resultQuestionIndexById.get(q.id) ?? item.firstQuestionIndex;
        return {
          id: q.id,
          label: `${idx + 1}`,
          isCorrect: q.studentAnswer?.isCorrect,
          isWritten: q.question?.type === 'CQ' || q.question?.type === 'SHORT',
          isEvaluated: q.studentAnswer?.obtainedMarks != null,
        };
      });
    });

    const scrollToResultQuestion = (questionId: string) => {
      document.getElementById(`result-q-${questionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const renderResultQuestion = (eq: ResultQuestion, idx: number) => {
      const q = eq.question;
      if (!q) return null;
      const qLang = detectQuestionLang(q, resultLang);
      const qUi = getExamUiStrings(qLang);
      const studentAns = eq.studentAnswer;
      const isCorrect = studentAns?.isCorrect;

      return (
        <div
          id={`result-q-${eq.id}`}
          key={eq.id}
          className={cn(
            'scroll-mt-28 rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-sm duration-150',
            isCorrect === true ? 'border-emerald-200' : isCorrect === false ? 'border-rose-200' : 'border-slate-200',
          )}
        >
          <div className="mb-3 flex items-start justify-between">
            <span className="text-sm font-black text-slate-400">#{idx + 1}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">
                {eq.marks} {qUi.marksLabel}
              </span>
              {isCorrect === true && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              {isCorrect === false && <XCircle className="h-5 w-5 text-rose-500" />}
            </div>
          </div>
          {q.type === 'CQ' && q.cqBlock ? (
            <div className="mb-4 space-y-3">
              <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-violet-650">{resultUi.stimulusLabel}</p>
                <div className="prose prose-sm max-w-none text-slate-700 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: q.cqBlock.stimulus }} />
              </div>
              {q.cqBlock.parts.map((part) => {
                const partEvaluation = studentAns?.evaluations?.find(
                  (evaluation) => evaluation.subPartKey === part.label,
                );
                return (
                <div key={`${q.cqBlock?.groupId}-${part.label}`} className="grid grid-cols-[36px_1fr_auto] gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="font-black text-violet-750">({part.label})</span>
                  <div className="prose prose-sm max-w-none text-slate-700 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: part.prompt }} />
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="h-fit border-violet-200 bg-white text-violet-700">
                      {part.marks}
                    </Badge>
                    {partEvaluation?.marksAwarded != null ? (
                      <span className="text-[10px] font-black text-emerald-700">
                        {resultUi.partMarksLabel(part.label, partEvaluation.marksAwarded)}
                      </span>
                    ) : studentAns && (q.type === 'CQ' || q.type === 'SHORT') ? (
                      <span className="text-[10px] font-bold text-amber-700">{resultUi.partPendingLabel}</span>
                    ) : null}
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <div className="prose prose-sm mb-4 max-w-none text-slate-805 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: q.prompt }} />
          )}
          {(q.type === 'CQ' || q.type === 'SHORT') && (
            <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/40 p-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-violet-650">
                {q.type === 'SHORT'
                  ? resultUi.yourShortAnswer
                  : resultUi.yourWrittenAnswer}
              </p>
              <p className="whitespace-pre-wrap text-sm font-semibold text-slate-800">
                {studentAns?.answer?.text?.trim() ? studentAns.answer.text : '—'}
              </p>
              {studentAns?.writtenSubmission?.pages?.length || studentAns?.writtenSubmission?.finalPdfUrl ? (
                <div className="mt-3 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-violet-650">
                    {resultUi.uploadedPagesLabel}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {studentAns?.writtenSubmission?.pages?.map((page, pageIndex) => {
                      const pageUrl = getExamPdfDownloadUrl(page.url);
                      const isPdf = isSubmissionPdfUrl(pageUrl);
                      const pageLabel = resultUi.pageLabel(pageIndex + 1);
                      return (
                        <button
                          key={`${page.url}-${pageIndex}`}
                          type="button"
                          onClick={() => setUploadLightbox({ url: pageUrl, label: pageLabel })}
                          className="group block overflow-hidden rounded-xl border border-violet-200 bg-white text-left transition hover:shadow-md"
                        >
                          {isPdf ? (
                            <div className="flex h-28 w-24 flex-col items-center justify-center gap-1 bg-violet-50/80 px-2 text-center">
                              <FileText className="h-6 w-6 text-violet-600" />
                              <span className="text-[10px] font-black uppercase text-violet-700">
                                {pageLabel}
                              </span>
                            </div>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={pageUrl}
                              alt={pageLabel}
                              className="h-28 w-24 object-cover transition duration-155 group-hover:scale-105"
                            />
                          )}
                        </button>
                      );
                    })}
                    {studentAns?.writtenSubmission?.finalPdfUrl ? (
                      <button
                        type="button"
                        onClick={() => setUploadLightbox({
                          url: getExamPdfDownloadUrl(studentAns.writtenSubmission!.finalPdfUrl!),
                          label: resultUi.combinedPdfLabel,
                        })}
                        className="flex h-28 w-24 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 px-2 text-center transition hover:shadow-md"
                      >
                        <FileText className="h-6 w-6 text-emerald-700" />
                        <span className="text-[10px] font-black uppercase text-emerald-800">
                          {resultUi.combinedPdfLabel}
                        </span>
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {studentAns?.obtainedMarks != null ? (
                <p className="mt-3 text-sm font-black text-violet-850">
                  {resultUi.writtenMarksLabel}: {studentAns.obtainedMarks}
                </p>
              ) : (
                <p className="mt-3 text-xs font-bold text-amber-700">
                  {resultUi.evaluationPendingNote}
                </p>
              )}
            </div>
          )}
          {q.options && q.options.length > 0 && q.type !== 'CQ' && q.type !== 'SHORT' && (
            <div className="space-y-2 mt-4">
              {q.options.map((opt) => {
                const isSelected = studentAns?.answer?.selectedOptionId === opt.id;
                const isCorrectOpt = opt.isCorrect;
                return (
                  <div
                    key={opt.id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3.5 text-sm transition group',
                      isCorrectOpt
                        ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                        : isSelected && !isCorrectOpt
                          ? 'border-rose-350 bg-rose-50/30'
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/20',
                    )}
                  >
                    <span className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-black transition-colors',
                      isCorrectOpt
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                        : isSelected && !isCorrectOpt
                          ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                          : 'bg-slate-50 text-slate-650 border-slate-200 group-hover:bg-slate-100'
                    )}>
                      {getOptionLabel(opt.label, qLang)}
                    </span>
                    <span className="font-semibold text-slate-700" dangerouslySetInnerHTML={{ __html: opt.text }} />
                    {isCorrectOpt && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-500" />}
                    {isSelected && !isCorrectOpt && <XCircle className="ml-auto h-4 w-4 shrink-0 text-rose-500" />}
                  </div>
                );
              })}
            </div>
          )}
          {q.explanation && (
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-indigo-500 shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">{qUi.explanationLabel}</p>
              </div>
              <div className="prose prose-sm max-w-none text-slate-655 font-medium leading-relaxed pl-6" dangerouslySetInnerHTML={{ __html: q.explanation }} />
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="min-h-screen bg-slate-50/50 py-6">
        <WrittenUploadLightbox
          url={uploadLightbox?.url ?? null}
          label={uploadLightbox?.label}
          onClose={() => setUploadLightbox(null)}
        />
        <div className="mx-auto w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div className="sticky top-0 z-20 mb-6 border border-slate-200/80 bg-white/80 px-6 py-4 backdrop-blur-md shadow-2xs rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-black text-slate-905">{examDisplayTitle}</p>
              <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className={cn("inline-block h-2 w-2 rounded-full", 
                  resultHeroVariant === 'published' ? 'bg-emerald-500' :
                  resultHeroVariant === 'pending_eval' ? 'bg-amber-500 animate-pulse' : 'bg-indigo-500'
                )} />
                {hero.title}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-bold border-slate-200 hover:bg-slate-50 text-slate-700 transition"
              onClick={() => router.push('/student/exams')}
            >
              {resultUi.backToExamList}
            </Button>
          </div>

          {result && (
            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start max-w-full">
              {/* Left Column: Stats & Status Summary (Sticky) */}
              <div className="space-y-6 lg:sticky lg:top-[90px]">
                {notice ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4 text-left text-sm font-bold text-amber-900 flex items-start gap-3 shadow-xs">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <span>{notice}</span>
                  </div>
                ) : null}

                {/* Status Header & Summary Card */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                  <div className="text-center">
                    <div className={cn('inline-flex items-center justify-center h-16 w-16 rounded-full mb-4 shadow-inner', hero.wrapperClass)}>
                      <HeroIcon className={cn('h-8 w-8', hero.iconClass)} />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-905 tracking-tight">{hero.title}</h1>
                    <p className="text-xs font-medium text-slate-500 mt-1">{examDisplayTitle}</p>
                  </div>

                  {result.attempt.status === 'AUTO_SUBMITTED' ? (
                    <div className="flex justify-center">
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-amber-955">
                        {resultUi.autoSubmittedLabel}
                      </Badge>
                    </div>
                  ) : null}

                  {result.resultHidden ? (
                    <div className="text-center space-y-4 pt-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                        {resultUi.resultHiddenLabel}
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        {result.resultHiddenMessage ?? resultUi.resultHiddenMessage}
                      </p>
                      <div className="flex justify-center pt-2">
                        <Button
                          variant="outline"
                          className="h-10 rounded-xl font-bold border-slate-200 hover:bg-slate-50"
                          disabled={refreshingResult}
                          onClick={() => void refreshResult()}
                        >
                          {refreshingResult ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin text-indigo-600" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4 text-indigo-650" />
                          )}
                          {resultUi.refreshResult}
                        </Button>
                      </div>
                    </div>
                  ) : pendingWrittenEvaluation ? (
                    <div className="space-y-6 pt-2">
                      <p className="text-xs font-medium text-slate-600 text-center">
                        {resultUi.evaluationPendingMessage}
                      </p>
                      
                      {/* Visual Stepper */}
                      <div className="relative mx-auto w-full px-4 py-2">
                        <div className="absolute left-8 right-8 top-5 h-0.5 bg-slate-100">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 w-1/2" />
                        </div>
                        
                        <div className="relative flex justify-between">
                          {/* Step 1 */}
                          <div className="flex flex-col items-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-50 text-emerald-600 shadow-xs">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <span className="mt-2 text-center text-[9px] font-black uppercase tracking-wider text-emerald-700">
                              {resultUi.timelineSubmitted}
                            </span>
                          </div>

                          {/* Step 2 */}
                          <div className="flex flex-col items-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-500 bg-amber-50 text-amber-600 shadow-xs animate-pulse">
                              <Clock className="h-5 w-5" />
                            </div>
                            <span className="mt-2 text-center text-[9px] font-black uppercase tracking-wider text-amber-700">
                              {resultUi.timelineMarking}
                            </span>
                          </div>

                          {/* Step 3 */}
                          <div className="flex flex-col items-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
                              <Circle className="h-3 w-3" />
                            </div>
                            <span className="mt-2 text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                              {resultUi.timelineResult}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 grid-cols-1 pt-4 border-t border-slate-100">
                        {provisionalMcqScore ? (
                          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-indigo-500 mb-1.5">
                              {resultUi.provisionalMcqScoreLabel}
                            </p>
                            <p className="text-2xl font-black text-indigo-700">
                              {provisionalMcqScore.obtained}
                              <span className="text-sm text-indigo-300"> / {provisionalMcqScore.total}</span>
                            </p>
                          </div>
                        ) : null}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1.5">
                            {resultUi.totalExamMarksLabel}
                          </p>
                          <p className="text-2xl font-black text-slate-905">{result.attempt.totalMarks ?? 0}</p>
                        </div>
                        {provisionalMcqScore ? (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 flex items-start gap-2.5">
                            <Info className="h-4 w-4 text-amber-605 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-amber-600 mb-0.5">
                                {resultUi.writtenPendingLabel}
                              </p>
                              <p className="text-xs font-bold text-amber-905 leading-relaxed">{resultUi.evaluationPendingNote}</p>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex justify-center pt-2">
                        <Button
                          variant="outline"
                          className="w-full h-10 rounded-xl font-bold border-slate-200 hover:bg-slate-50"
                          disabled={refreshingResult}
                          onClick={() => void refreshResult()}
                        >
                          {refreshingResult ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin text-indigo-650" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4 text-indigo-655" />
                          )}
                          {resultUi.refreshResult}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="grid gap-4 grid-cols-1">
                      {/* Obtained Score */}
                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4 text-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-indigo-500 mb-1">{baseUi.scoreLabel}</p>
                        <div className="flex items-baseline gap-1 justify-center">
                          <span className="text-3xl font-black text-indigo-700">{result.attempt.obtainedMarks ?? 0}</span>
                          <span className="text-xs font-bold text-indigo-400">/ {result.attempt.totalMarks ?? 0}</span>
                        </div>
                      </div>

                      {/* Percentage */}
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-4 text-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-605 mb-1">Percentage</p>
                        <div className="flex items-center justify-center gap-1.5">
                          <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
                          <span className="text-3xl font-black text-emerald-705">
                            {result.attempt.totalMarks && result.attempt.obtainedMarks != null
                              ? Math.round((result.attempt.obtainedMarks / result.attempt.totalMarks) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>

                      {/* Time Taken */}
                      <div className="rounded-2xl border border-slate-205 bg-slate-50/50 p-4 text-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Time Taken</p>
                        <div className="flex items-center justify-center gap-1.5">
                          <Clock className="h-4 w-4 text-slate-550 shrink-0" />
                          <span className="text-xl font-black text-slate-705">
                            {getTimeTaken() || '—'}
                          </span>
                        </div>
                      </div>
                      </div>

                      {result.exam.examEngine === 'MULTI_SUBJECT'
                        && Array.isArray(result.attempt.subjectBreakdown)
                        && result.attempt.subjectBreakdown.length > 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                              Subject breakdown
                            </p>
                            {result.attempt.passed != null ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'rounded-lg text-[9px] font-black uppercase px-2.5 py-1',
                                  result.attempt.passed
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    : 'border-rose-200 bg-rose-50 text-rose-800',
                                )}
                              >
                                {result.attempt.passed ? 'Overall pass' : 'Overall fail'}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[320px] text-left text-sm">
                              <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  <th className="pb-2 pr-3">Subject</th>
                                  <th className="pb-2 pr-3 text-right">Score</th>
                                  <th className="pb-2 pr-3 text-right">Cutoff</th>
                                  <th className="pb-2 text-right">Result</th>
                                </tr>
                              </thead>
                              <tbody>
                                {result.attempt.subjectBreakdown.map((row) => (
                                  <tr key={row.subjectId} className="border-b border-slate-50 last:border-0">
                                    <td className="py-2.5 pr-3 font-bold text-slate-800">{row.name}</td>
                                    <td className="py-2.5 pr-3 text-right font-semibold text-slate-700 tabular-nums">
                                      {row.score}
                                      <span className="text-slate-400 font-medium"> / {row.totalPossible}</span>
                                    </td>
                                    <td className="py-2.5 pr-3 text-right text-slate-500 tabular-nums">{row.cutoff}</td>
                                    <td className="py-2.5 text-right">
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          'rounded-md text-[9px] font-black uppercase',
                                          row.passed
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            : 'border-rose-200 bg-rose-50 text-rose-700',
                                        )}
                                      >
                                        {row.passed ? 'Pass' : 'Fail'}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {result.exam.showLeaderboard ? (
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-2xl border-amber-250 bg-amber-50/80 font-black uppercase tracking-widest text-[10px] text-amber-900 hover:bg-amber-100 shadow-sm transition"
                    onClick={() => router.push(`/student/leaderboard/${examId}`)}
                  >
                    <Trophy className="mr-2 h-4 w-4 text-amber-600" />
                    {resultUi.leaderboardLabel}
                  </Button>
                ) : null}
              </div>

              {/* Right Column: Solution & Questions */}
              <div className="space-y-6">
                {/* Show questions with solutions */}
                {result.showSolutions && result.questions.length > 0 && (
                  <div className="space-y-5">
                    {/* Sticky wrapper for Solve Sheet headers */}
                    <div className="sticky top-[80px] lg:top-[90px] z-10 space-y-3 bg-slate-50/95 backdrop-blur-xs py-3 -my-3">
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 flex items-center gap-2">
                          <Eye className="h-4 w-4 text-slate-405" /> {resultUi.solutionsLabel}
                        </h2>
                        {hasResultMixed && (
                          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-50/50 p-1 shadow-inner">
                            {(['mcq', 'written'] as const).map((tab) => (
                              <button
                                key={tab}
                                type="button"
                                onClick={() => setResultTab(tab)}
                                className={cn(
                                  'h-8 rounded-xl px-5 text-xs font-black uppercase tracking-wider transition-all duration-200',
                                  resultTab === tab 
                                    ? 'bg-white text-indigo-600 border border-slate-100 shadow-xs' 
                                    : 'text-slate-500 hover:bg-slate-100/50',
                                )}
                              >
                                {tab === 'mcq' ? resultUi.mcqTabLabel : resultUi.writtenTabLabel}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Color coded jump list */}
                      {solutionJumpItems.length > 1 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {resultUi.jumpToQuestionLabel}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {solutionJumpItems.map((item) => {
                              let btnClass = 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100';
                              if (item.isCorrect === true) {
                                btnClass = 'border-emerald-250 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70';
                              } else if (item.isCorrect === false) {
                                btnClass = 'border-rose-250 bg-rose-50 text-rose-700 hover:bg-rose-100/70';
                              } else if (item.isWritten) {
                                if (item.isEvaluated) {
                                  btnClass = 'border-violet-250 bg-violet-50 text-violet-750 hover:bg-violet-100/70';
                                } else {
                                  btnClass = 'border-amber-255 bg-amber-50 text-amber-755 hover:bg-amber-100/70';
                                }
                              }
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => scrollToResultQuestion(item.id)}
                                  className={cn(
                                    "h-8 w-10 flex items-center justify-center rounded-xl border text-xs font-black transition-all",
                                    btnClass
                                  )}
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Question cards list */}
                    <div className="space-y-4">
                      {activeResultItems.map((item) => {
                        if (item.kind === 'single') {
                          const idx = resultQuestionIndexById.get(item.questions[0].id) ?? item.firstQuestionIndex;
                          return renderResultQuestion(item.questions[0], idx);
                        }
                        const passage = item.questions[0]?.question?.passage;
                        return (
                          <div key={item.id} className="space-y-4 rounded-3xl border border-indigo-100 bg-indigo-50/20 p-5 shadow-xs">
                            {passage ? (
                              <div className="rounded-2xl border border-slate-150 bg-white p-5 shadow-xs">
                                <div className="mb-3 flex items-center justify-between gap-2">
                                  <p className="text-xs font-black uppercase tracking-wider text-indigo-755">{resultUi.passageLabel}</p>
                                  <Badge variant="outline" className="text-[10px] font-black bg-indigo-50 text-indigo-700 border-indigo-100">
                                    {item.questions.length} MCQ
                                  </Badge>
                                </div>
                                <div className="prose prose-sm max-w-none text-slate-650 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: passage.content }} />
                              </div>
                            ) : null}
                            {item.questions.map((eq) => renderResultQuestion(eq, resultQuestionIndexById.get(eq.id) ?? item.firstQuestionIndex))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!result && (
            <div className="text-center py-12 space-y-6 bg-white border border-slate-200 rounded-3xl p-8 max-w-lg mx-auto">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-650 shadow-inner">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">{resultUi.examSubmitted}</h2>
              <Button onClick={() => router.push('/student/exams')} className="h-12 rounded-2xl px-8 bg-indigo-600 hover:bg-indigo-700 transition w-full">
                {resultUi.backToExamList}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!attemptData) return null;

  return (
    <ExamTakingView
      examId={examId}
      studentUserId={userId}
      attemptData={attemptData}
      onSubmitted={(data) => {
        setResult(data);
        setNotice(null);
        setPhase('result');
      }}
      onAutoSubmitted={({ message, attemptId }) => {
        void recoverLatestAttempt(userId, message, attemptId ?? null).catch(() => {
          setError(message);
          setPhase('loading');
        });
      }}
    />
  );
}
