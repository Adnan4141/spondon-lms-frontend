'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { startExamAttempt, getAttemptResult, getExamStudentView, getExamPdfDownloadUrl } from '@/lib/api/exams';
import type { StartAttemptResponse, AttemptResultResponse, ExamStudentView } from '@/types/exam';
import { ExamTakingView } from '@/components/student/exam-window/ExamTakingView';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Timer, AlertTriangle, CheckCircle2, Loader2, Eye, Trophy, XCircle, Building2, Download, FileText, PenLine, CalendarClock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isOfflineDeliveryExam } from '@/lib/exam-workflow';

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
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shellLang: Lang = examMeta?.language === 'en' ? 'en' : 'bn';
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

  // Offline / hall exam — instructions + PDF (no browser attempt)
  if (phase === 'offline' && examMeta) {
    const lang: Lang = examMeta.language === 'en' ? 'en' : 'bn';
    const ui =
      lang === 'en'
        ? {
            title: 'Offline hall exam',
            sub: 'Take this exam at your centre on paper. MCQ (OMR) and written parts are on the PDF.',
            course: 'Course',
            branch: 'Branch',
            batch: 'Batch',
            window: 'Schedule',
            open: 'Opens',
            closes: 'Closes',
            pdf: 'Download question paper (PDF)',
            noPdf: 'Your teacher will upload the PDF soon. Check back later.',
            solve: 'Solution / marks sheet (PDF)',
            sets: 'Question sets prepared',
            back: 'Back to exams',
          }
        : {
            title: 'Offline Hall Exam',
            sub: 'This exam is held on paper. The PDF may contain both MCQ and written (essay) sections.',
            course: 'Course',
            branch: 'Branch',
            batch: 'Batch',
            window: 'Schedule',
            open: 'Opens',
            closes: 'Closes',
            pdf: 'Download Question Paper (PDF)',
            noPdf: 'Your teacher will upload the PDF soon. Check back later.',
            solve: 'Solution / Marks Sheet (PDF)',
            sets: 'Question sets prepared',
            back: 'Back to Exams',
          };

    const pdfHref = examMeta.pdfUrl ? getExamPdfDownloadUrl(examMeta.pdfUrl) : null;
    let showSolve = false;
    if (examMeta.solveSheetVisibility === 'IMMEDIATELY') showSolve = true;
    else if (examMeta.solveSheetVisibility === 'SCHEDULED' && examMeta.solveSheetScheduledAt) {
      showSolve = new Date() >= new Date(examMeta.solveSheetScheduledAt);
    }
    const solveHref =
      examMeta.solveSheetUrl && showSolve ? getExamPdfDownloadUrl(examMeta.solveSheetUrl) : null;

    return (
      <div className="min-h-[60vh] max-w-2xl mx-auto space-y-8 py-6">
        <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <Badge variant="outline" className="mb-1 text-[9px] font-black uppercase bg-orange-100 text-orange-800 border-orange-200">
                OFFLINE
              </Badge>
              <h1 className="text-2xl font-black text-slate-900">{examDisplayTitle}</h1>
            </div>
          </div>
          <p className="text-slate-600 font-medium leading-relaxed mb-6">{ui.sub}</p>
          <ul className="space-y-2 text-sm font-bold text-slate-700 mb-6">
            <li className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
              {ui.course}: {examMeta.course?.name ?? '—'}
            </li>
            <li className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-rose-400 shrink-0" />
              {ui.branch}: {examMeta.branch?.name ?? '—'}
            </li>
            {examMeta.batch?.name ? (
              <li className="flex items-center gap-2">
                <PenLine className="h-4 w-4 text-violet-500 shrink-0" />
                {ui.batch}: {examMeta.batch.name}
              </li>
            ) : null}
            <li className="flex items-center gap-2 text-slate-500">
              <Timer className="h-4 w-4 shrink-0" />
              {examMeta.durationMinutes
                ? `${examMeta.durationMinutes} minutes`
                : 'Duration: as announced'}
            </li>
          </ul>
          <div className="rounded-2xl bg-white border border-slate-100 p-4 text-sm font-bold text-slate-600 mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{ui.window}</p>
            <p>
              {ui.open}:{' '}
              {examMeta.startAt
                ? new Date(examMeta.startAt).toLocaleString('en-GB')
                : 'Any time'}
            </p>
            <p>
              {ui.closes}:{' '}
              {examMeta.endAt
                ? new Date(examMeta.endAt).toLocaleString('en-GB')
                : 'As announced'}
            </p>
          </div>
          {examMeta.syllabusHtml ? (
            <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-4 text-sm text-slate-700 mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">
                Syllabus
              </p>
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: examMeta.syllabusHtml }} />
            </div>
          ) : null}
          {examMeta._count?.sets != null && (
            <p className="text-xs font-bold text-slate-500 mb-4">
              {ui.sets}: {examMeta._count.sets}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            {pdfHref ? (
              <Button className="h-12 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest text-[10px]" asChild>
                <a href={pdfHref} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  {ui.pdf}
                </a>
              </Button>
            ) : (
              <p className="text-sm font-bold text-amber-800 bg-amber-100/80 rounded-2xl px-4 py-3">{ui.noPdf}</p>
            )}
            {solveHref ? (
              <Button variant="outline" className="h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] border-slate-200" asChild>
                <a href={solveHref} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 mr-2" />
                  {ui.solve}
                </a>
              </Button>
            ) : null}
          </div>
        </div>
        <Button variant="outline" className="h-12 rounded-2xl font-bold" onClick={() => router.push('/student/exams')}>
          {ui.back}
        </Button>
      </div>
    );
  }

  // Result view
  if (phase === 'result') {
    const resultLang: Lang = result?.exam.language === 'en' ? 'en' : shellLang;
    const resultUi = getExamUiStrings(resultLang);
    const pendingWrittenEvaluation = hasPendingWrittenEvaluation(result);
    const provisionalMcqScore = getProvisionalMcqScore(result);
    const resultDisplayItems = buildResultDisplayItems(result?.questions ?? []);
    const resultQuestionIndexById = new Map((result?.questions ?? []).map((q, index) => [q.id, index]));
    const mcqResultItems = resultDisplayItems.filter((item) => item.questions[0]?.question?.type === 'MCQ');
    const writtenResultItems = resultDisplayItems.filter((item) => item.questions[0]?.question?.type !== 'MCQ');
    const hasResultMixed = mcqResultItems.length > 0 && writtenResultItems.length > 0;
    const activeResultItems = hasResultMixed
      ? (resultTab === 'mcq' ? mcqResultItems : writtenResultItems)
      : resultDisplayItems;
    const renderResultQuestion = (eq: ResultQuestion, idx: number) => {
      const q = eq.question;
      if (!q) return null;
      const qLang = detectQuestionLang(q, resultLang);
      const qUi = getExamUiStrings(qLang);
      const studentAns = eq.studentAnswer;
      const isCorrect = studentAns?.isCorrect;

      return (
        <div
          key={eq.id}
          className={cn(
            'rounded-2xl border bg-white p-5',
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
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-violet-600">Stimulus</p>
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: q.cqBlock.stimulus }} />
              </div>
              {q.cqBlock.parts.map((part) => (
                <div key={`${q.cqBlock?.groupId}-${part.label}`} className="grid grid-cols-[36px_1fr_auto] gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="font-black text-violet-700">({part.label})</span>
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: part.prompt }} />
                  <Badge variant="outline" className="h-fit border-violet-200 bg-white text-violet-700">
                    {part.marks}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="prose prose-sm mb-4 max-w-none" dangerouslySetInnerHTML={{ __html: q.prompt }} />
          )}
          {(q.type === 'CQ' || q.type === 'SHORT') && (
            <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/40 p-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-violet-600">
                {q.type === 'SHORT'
                  ? 'Your short answer'
                  : 'Your written answer'}
              </p>
              <p className="whitespace-pre-wrap text-sm font-medium text-slate-800">
                {studentAns?.answer?.text?.trim() ? studentAns.answer.text : '—'}
              </p>
              {studentAns?.writtenSubmission?.pages?.length ? (
                <div className="mt-3 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">
                    Uploaded pages
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {studentAns.writtenSubmission.pages.map((page, pageIndex) => (
                      <a
                        key={`${page.url}-${pageIndex}`}
                        href={getExamPdfDownloadUrl(page.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-700"
                      >
                        Page {pageIndex + 1}
                      </a>
                    ))}
                    {studentAns.writtenSubmission.finalPdfUrl ? (
                      <a
                        href={getExamPdfDownloadUrl(studentAns.writtenSubmission.finalPdfUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700"
                      >
                        Combined PDF
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {studentAns?.obtainedMarks != null ? (
                <p className="mt-3 text-sm font-black text-violet-800">
                  Marks: {studentAns.obtainedMarks}
                </p>
              ) : (
                <p className="mt-3 text-xs font-bold text-amber-700">
                  {'Written answers are marked by your teacher; score may appear later.'}
                </p>
              )}
            </div>
          )}
          {q.options && q.options.length > 0 && q.type !== 'CQ' && q.type !== 'SHORT' && (
            <div className="space-y-2">
              {q.options.map((opt) => {
                const isSelected = studentAns?.answer?.selectedOptionId === opt.id;
                const isCorrectOpt = opt.isCorrect;
                return (
                  <div
                    key={opt.id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 text-sm',
                      isCorrectOpt ? 'border-emerald-300 bg-emerald-50' : '',
                      isSelected && !isCorrectOpt ? 'border-rose-300 bg-rose-50' : '',
                      !isSelected && !isCorrectOpt ? 'border-slate-100 bg-white' : '',
                    )}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-black">
                      {getOptionLabel(opt.label, qLang)}
                    </span>
                    <span className="font-medium text-slate-700" dangerouslySetInnerHTML={{ __html: opt.text }} />
                    {isCorrectOpt && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-500" />}
                    {isSelected && !isCorrectOpt && <XCircle className="ml-auto h-4 w-4 shrink-0 text-rose-500" />}
                  </div>
                );
              })}
            </div>
          )}
          {q.explanation && (
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-indigo-500">{qUi.explanationLabel}</p>
              <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: q.explanation }} />
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 mb-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-900">{resultUi.examCompleted}</h1>
            {result && (
              <p className="text-lg font-medium text-slate-500 mt-2">{examDisplayTitle}</p>
            )}
          </div>

          {result && (
            <div className="space-y-8">
              {notice ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-left text-sm font-bold text-amber-900">
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{notice}</span>
                  </div>
                </div>
              ) : null}

              {/* Score card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
                {result.attempt.status === 'AUTO_SUBMITTED' ? (
                  <Badge variant="outline" className="mb-4 border-amber-200 bg-amber-50 text-[10px] font-black uppercase tracking-[0.2em] text-amber-900">
                    Auto submitted
                  </Badge>
                ) : null}
                {pendingWrittenEvaluation ? (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-2">
                      Teacher evaluation pending
                    </p>
                    <h2 className="text-3xl font-black text-slate-900">
                      Your exam has been submitted
                    </h2>
                    <p className="mt-3 text-sm font-medium text-slate-500">
                      {'Written answers are still being evaluated. Final score and percentage will appear after marking is complete.'}
                    </p>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      {provisionalMcqScore ? (
                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 text-left">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-2">
                            Provisional MCQ score
                          </p>
                          <p className="text-3xl font-black text-indigo-700">
                            {provisionalMcqScore.obtained}
                            <span className="text-lg text-indigo-300"> / {provisionalMcqScore.total}</span>
                          </p>
                        </div>
                      ) : null}
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                          Total exam marks
                        </p>
                        <p className="text-3xl font-black text-slate-900">{result.attempt.totalMarks ?? 0}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{baseUi.scoreLabel}</p>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-6xl font-black text-indigo-600">{result.attempt.obtainedMarks ?? 0}</span>
                      <span className="text-2xl font-bold text-slate-400">/ {result.attempt.totalMarks ?? 0}</span>
                    </div>
                    {result.attempt.totalMarks && result.attempt.obtainedMarks != null ? (
                      <div className="mt-4">
                        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-6 py-2">
                          <Trophy className="h-4 w-4 text-amber-500" />
                          <span className="text-lg font-black text-indigo-600">
                            {Math.round((result.attempt.obtainedMarks / result.attempt.totalMarks) * 100)}%
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              {result.exam.showLeaderboard ? (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl border-amber-200 bg-amber-50/80 font-black uppercase tracking-widest text-[10px] text-amber-900 hover:bg-amber-100"
                    onClick={() => router.push(`/student/leaderboard/${examId}`)}
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    Leaderboard
                  </Button>
                </div>
              ) : null}

              {/* Show questions with solutions */}
              {result.showSolutions && result.questions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5" /> {resultUi.solutionsLabel}
                    </h2>
                    {hasResultMixed && (
                      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                        {(['mcq', 'written'] as const).map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setResultTab(tab)}
                            className={cn(
                              'h-8 rounded-xl px-5 text-xs font-black uppercase tracking-wider transition-all',
                              resultTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white',
                            )}
                          >
                            {tab === 'mcq' ? 'MCQ' : 'Written'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {activeResultItems.map((item) => {
                    if (item.kind === 'single') {
                      const idx = resultQuestionIndexById.get(item.questions[0].id) ?? item.firstQuestionIndex;
                      return renderResultQuestion(item.questions[0], idx);
                    }
                    const passage = item.questions[0]?.question?.passage;
                    return (
                      <div key={item.id} className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                        {passage ? (
                          <div className="rounded-xl bg-white p-4">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-sm font-black text-indigo-700">
                                {passage.title || 'Passage'}
                              </p>
                              <Badge variant="outline" className="text-[10px] font-black">
                                {item.questions.length} MCQ
                              </Badge>
                            </div>
                            <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: passage.content }} />
                          </div>
                        ) : null}
                        {item.questions.map((eq) => renderResultQuestion(eq, resultQuestionIndexById.get(eq.id) ?? item.firstQuestionIndex))}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-center gap-4">
                <Button variant="outline" className="h-12 rounded-2xl px-8 font-bold" onClick={() => router.push('/student/exams')}>
                  {resultUi.backToExamList}
                </Button>
              </div>
            </div>
          )}

          {!result && (
            <div className="text-center">
              <p className="text-slate-500 font-medium mb-4">{resultUi.examSubmitted}</p>
              <Button onClick={() => router.push('/student/exams')} className="h-12 rounded-2xl px-8 bg-indigo-600">
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
