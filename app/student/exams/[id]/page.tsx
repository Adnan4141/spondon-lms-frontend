'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { startExamAttempt, getAttemptResult, getExamStudentView, getExamPdfDownloadUrl } from '@/lib/api/exams';
import type { StartAttemptResponse, AttemptResultResponse, ExamStudentView } from '@/types/exam';
import { ExamTakingView } from '@/components/student/exam-window/ExamTakingView';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Timer, AlertTriangle, CheckCircle2, Loader2, Eye, Trophy, XCircle, Building2, Download, FileText, PenLine, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  detectQuestionLang,
  getExamUiStrings,
  getOptionLabel,
  type Lang,
} from '@/components/student/exam-window/examUiCopy';

type Phase = 'loading' | 'waiting' | 'offline' | 'exam' | 'result';

export default function StudentExamTakingPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [examMeta, setExamMeta] = useState<ExamStudentView | null>(null);

  const [attemptData, setAttemptData] = useState<StartAttemptResponse | null>(null);
  const [result, setResult] = useState<AttemptResultResponse | null>(null);
  const [countdown, setCountdown] = useState('');
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shellLang: Lang = examMeta?.language === 'en' ? 'en' : 'bn';
  const baseUi = getExamUiStrings(shellLang);

  // Initialize: student-safe exam view, then offline panel or online attempt
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      setError('পরীক্ষা দিতে লগইন করুন');
      return;
    }
    const user = JSON.parse(userStr);
    setUserId(user.id);

    const run = async () => {
      try {
        const viewRes = await getExamStudentView(examId, user.id);
        if (!viewRes.success || !viewRes.data) {
          setError(viewRes.message || 'পরীক্ষা লোড করা যায়নি');
          return;
        }
        setExamMeta(viewRes.data);

        if (viewRes.data.mode === 'OFFLINE') {
          setPhase('offline');
          return;
        }

        if (viewRes.data.mode === 'WRITTEN') {
          router.replace(`/student/exams/${examId}/written`);
          return;
        }

        // Check if startAt is in the future — show waiting screen
        if (viewRes.data.startAt && new Date(viewRes.data.startAt) > new Date()) {
          setPhase('waiting');
          return;
        }

        const res = await startExamAttempt(examId, user.id);
        if (res.success && res.data) {
          setAttemptData(res.data);
          setPhase('exam');
        } else {
          setError(res.message || 'পরীক্ষা শুরু করা যায়নি');
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'পরীক্ষা শুরু ব্যর্থ');
      }
    };
    run();
  }, [examId, router]);

  // Countdown ticker for waiting phase
  useEffect(() => {
    if (phase !== 'waiting' || !examMeta?.startAt) return;
    const tick = () => {
      const diff = new Date(examMeta.startAt!).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('');
        // Auto-start when time arrives
        startExamAttempt(examId, userId).then((res) => {
          if (res.success && res.data) {
            setAttemptData(res.data);
            setPhase('exam');
          } else {
            setError(res.message || 'পরীক্ষা শুরু করা যায়নি');
            setPhase('loading');
          }
        });
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(
        h > 0
          ? `${h} ঘণ্টা ${String(m).padStart(2, '0')} মিনিট ${String(s).padStart(2, '0')} সেকেন্ড`
          : `${m} মিনিট ${String(s).padStart(2, '0')} সেকেন্ড`,
      );
      waitTimerRef.current = setTimeout(tick, 1000);
    };
    tick();
    return () => { if (waitTimerRef.current) clearTimeout(waitTimerRef.current); };
  }, [phase, examMeta, examId, userId]);

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
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400 mb-1">আসন্ন পরীক্ষা</p>
            <h1 className="text-2xl font-black text-slate-900">{examMeta.title}</h1>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6">
            <p className="text-xs font-bold text-slate-500 mb-1">পরীক্ষা শুরু হবে</p>
            <p className="text-base font-black text-indigo-800">
              {startDate.toLocaleString('bn-BD', { dateStyle: 'full', timeStyle: 'short' })}
            </p>
          </div>
          {countdown && (
            <div className="rounded-2xl bg-slate-900 text-white px-8 py-5">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1">বাকি সময়</p>
              <p className="text-2xl font-black tabular-nums">{countdown}</p>
            </div>
          )}
          <p className="text-sm font-medium text-slate-500">নির্ধারিত সময়ে স্বয়ংক্রিয়ভাবে পরীক্ষা শুরু হবে।</p>
          <button
            onClick={() => router.push('/student/exams')}
            className="text-sm font-bold text-indigo-600 underline underline-offset-2"
          >
            পরীক্ষার তালিকায় ফিরুন
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
            title: 'হলে অনুষ্ঠিত পরীক্ষা',
            sub: 'এটি কাগজে দেওয়া হয়। PDF এ এমসিকিউ ও লিখিত (রচনামূলক) উভয় অংশ থাকতে পারে।',
            course: 'কোর্স',
            branch: 'শাখা',
            batch: 'ব্যাচ',
            window: 'সময়সূচি',
            open: 'শুরু',
            closes: 'শেষ',
            pdf: 'প্রশ্নপত্র PDF ডাউনলোড',
            noPdf: 'শিক্ষক PDF আপলোড করলে এখানে লিংক আসবে।',
            solve: 'সমাধান / মাননির্ধারণ শিট (PDF)',
            sets: 'প্রশ্ন সেট প্রস্তুত',
            back: 'পরীক্ষার তালিকা',
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
              <h1 className="text-2xl font-black text-slate-900">{examMeta.title}</h1>
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
                ? `${examMeta.durationMinutes} ${lang === 'en' ? 'minutes' : 'মিনিট'}`
                : lang === 'en'
                  ? 'Duration: as announced'
                  : 'সময়: ঘোষণা অনুযায়ী'}
            </li>
          </ul>
          <div className="rounded-2xl bg-white border border-slate-100 p-4 text-sm font-bold text-slate-600 mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{ui.window}</p>
            <p>
              {ui.open}:{' '}
              {examMeta.startAt
                ? new Date(examMeta.startAt).toLocaleString(lang === 'en' ? 'en-GB' : 'bn-BD')
                : lang === 'en'
                  ? 'Any time'
                  : 'যেকোনো সময়'}
            </p>
            <p>
              {ui.closes}:{' '}
              {examMeta.endAt
                ? new Date(examMeta.endAt).toLocaleString(lang === 'en' ? 'en-GB' : 'bn-BD')
                : lang === 'en'
                  ? 'As announced'
                  : 'ঘোষণা অনুযায়ী'}
            </p>
          </div>
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

    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 mb-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-900">{resultUi.examCompleted}</h1>
            {result && (
              <p className="text-lg font-medium text-slate-500 mt-2">{result.exam.title}</p>
            )}
          </div>

          {result && (
            <div className="space-y-8">
              {/* Score card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{baseUi.scoreLabel}</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-6xl font-black text-indigo-600">{result.attempt.obtainedMarks ?? 0}</span>
                  <span className="text-2xl font-bold text-slate-400">/ {result.attempt.totalMarks ?? 0}</span>
                </div>
                {result.attempt.totalMarks && result.attempt.obtainedMarks != null && (
                  <div className="mt-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-6 py-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <span className="text-lg font-black text-indigo-600">
                        {Math.round((result.attempt.obtainedMarks / result.attempt.totalMarks) * 100)}%
                      </span>
                    </div>
                  </div>
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
                    {resultLang === 'en' ? 'Leaderboard' : 'লিডারবোর্ড'}
                  </Button>
                </div>
              ) : null}

              {/* Show questions with solutions */}
              {result.showSolutions && result.questions.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5" /> {resultUi.solutionsLabel}
                  </h2>
                  {result.questions.map((eq, idx) => {
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
                          "rounded-2xl border p-6 bg-white",
                          isCorrect === true ? "border-emerald-200" : isCorrect === false ? "border-rose-200" : "border-slate-200"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-sm font-black text-slate-400">#{idx + 1}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">
                              {eq.marks} {qUi.marksLabel}
                            </span>
                            {isCorrect === true && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                            {isCorrect === false && <XCircle className="h-5 w-5 text-rose-500" />}
                          </div>
                        </div>
                        
                        <div className="prose prose-sm max-w-none mb-4" dangerouslySetInnerHTML={{ __html: q.prompt }} />

                        {(q.type === 'CQ' || q.type === 'SHORT') && (
                          <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/40 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 mb-2">
                              {q.type === 'SHORT'
                                ? qLang === 'en'
                                  ? 'Your short answer'
                                  : 'আপনার সংক্ষিপ্ত উত্তর'
                                : qLang === 'en'
                                  ? 'Your written answer'
                                  : 'আপনার লিখিত উত্তর'}
                            </p>
                            <p className="text-sm text-slate-800 whitespace-pre-wrap font-medium">
                              {studentAns?.answer?.text?.trim() ? studentAns.answer.text : qLang === 'en' ? '—' : '(জমা দেওয়া নেই)'}
                            </p>
                            {studentAns?.obtainedMarks != null ? (
                              <p className="mt-3 text-sm font-black text-violet-800">
                                {qLang === 'en' ? 'Marks' : 'নম্বর'}: {studentAns.obtainedMarks}
                              </p>
                            ) : (
                              <p className="mt-3 text-xs font-bold text-amber-700">
                                {qLang === 'en'
                                  ? 'Written answers are marked by your teacher; score may appear later.'
                                  : 'লিখিত উত্তর শিক্ষক মূল্যায়ন করবেন; নম্বর পরে দেখাতে পারে।'}
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
                                    "flex items-center gap-3 rounded-xl border p-3 text-sm",
                                    isCorrectOpt ? "border-emerald-300 bg-emerald-50" : "",
                                    isSelected && !isCorrectOpt ? "border-rose-300 bg-rose-50" : "",
                                    !isSelected && !isCorrectOpt ? "border-slate-100 bg-white" : ""
                                  )}
                                >
                                  <span className="flex-shrink-0 h-7 w-7 rounded-lg border flex items-center justify-center text-xs font-black">
                                    {getOptionLabel(opt.label, qLang)}
                                  </span>
                                  <span className="font-medium text-slate-700" dangerouslySetInnerHTML={{ __html: opt.text }} />
                                  {isCorrectOpt && <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto flex-shrink-0" />}
                                  {isSelected && !isCorrectOpt && <XCircle className="h-4 w-4 text-rose-500 ml-auto flex-shrink-0" />}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {q.explanation && (
                          <div className="mt-4 rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">{qUi.explanationLabel}</p>
                            <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: q.explanation }} />
                          </div>
                        )}
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
        setPhase('result');
      }}
      onSubmitFailed={(msg) => {
        setError(msg);
        setPhase('loading');
      }}
    />
  );
}
