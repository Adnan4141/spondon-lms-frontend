'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { startExamAttempt, saveExamAnswer, submitExamAttempt, getAttemptResult } from '@/lib/api/exams';
import type { StartAttemptResponse, AttemptResultResponse } from '@/types/exam';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Timer,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Flag,
  Eye,
  Trophy,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Phase = 'loading' | 'exam' | 'submitting' | 'result';

type Lang = 'bn' | 'en';

const isBanglaText = (v?: string | null): boolean => {
  if (!v) return false;
  // Unicode range for Bangla script
  return /[\u0980-\u09FF]/.test(v);
};

const detectQuestionLang = (question?: { prompt?: string; options?: { text?: string }[] } | null, fallback: Lang = 'bn'): Lang => {
  const prompt = question?.prompt || '';
  const optionText = (question?.options || []).map((o) => o?.text || '').join(' ');
  const combined = `${prompt} ${optionText}`;
  return isBanglaText(combined) ? 'bn' : 'en';
};

const bnOptionLetters: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: 'ক',
  B: 'খ',
  C: 'গ',
  D: 'ঘ',
};

const getOptionLabel = (label: string, lang: Lang): string => {
  if (lang === 'bn') {
    const upper = label?.toUpperCase?.() || label;
    if (upper === 'A' || upper === 'B' || upper === 'C' || upper === 'D') return bnOptionLetters[upper as 'A' | 'B' | 'C' | 'D'];
    return label;
  }

  // English: convert Bangla option letters back to A/B/C/D (if stored that way).
  const bnToEn: Record<string, 'A' | 'B' | 'C' | 'D'> = {
    [bnOptionLetters.A]: 'A',
    [bnOptionLetters.B]: 'B',
    [bnOptionLetters.C]: 'C',
    [bnOptionLetters.D]: 'D',
  };
  return bnToEn[label] ?? label;
};

const getExamUiStrings = (lang: Lang) => {
  if (lang === 'en') {
    return {
      loading: 'Loading exam...',
      loginToTakeExam: 'Please log in to take the exam',
      startFailed: 'Failed to start the exam',
      submitting: 'Submitting your paper...',
      examSubmitted: 'Exam submitted',
      examCompleted: 'Exam completed!',

      submit: 'Submit',
      submitConfirmTitle: 'Submit this exam?',
      submitConfirmGoBack: 'Go back',

      questionNavigation: 'Question navigation',
      legendAnswered: 'Answered',
      legendUnanswered: 'Unanswered',
      legendCurrent: 'Current question',
      legendFlagged: 'Review later',

      questionLabel: (idx: number, total: number) => `Question ${idx} / ${total}`,
      marksLabel: 'Marks',
      negativeLabel: 'Negative',

      flag: 'Flag',
      unflag: 'Unflag',

      cqLabel: 'Write your answer:',
      cqPlaceholder: 'Write your answer here...',

      prevQuestion: 'Previous question',
      nextQuestion: 'Next question',

      totalQuestions: 'Total questions',
      answered: 'Answered',
      unanswered: 'Unanswered',
      flagged: 'Flagged',

      backToExamList: 'Back to exam list',
      scoreLabel: 'Your score',
      solutionsLabel: 'Solution Sheet',
      explanationLabel: 'Explanation',
    };
  }

  return {
    loading: 'পরীক্ষা লোড হচ্ছে...',
    loginToTakeExam: 'পরীক্ষা দিতে লগইন করুন',
    startFailed: 'পরীক্ষা শুরু করা যায়নি',
    submitting: 'উত্তরপত্র জমা হচ্ছে...',
    examSubmitted: 'পরীক্ষা জমা হয়েছে',
    examCompleted: 'পরীক্ষা সম্পন্ন!',

    submit: 'জমা দিন',
    submitConfirmTitle: 'পরীক্ষা জমা দিবেন?',
    submitConfirmGoBack: 'ফিরে যান',

    questionNavigation: 'প্রশ্ন নেভিগেশন',
    legendAnswered: 'উত্তর দেওয়া হয়েছে',
    legendUnanswered: 'উত্তর দেওয়া হয়নি',
    legendCurrent: 'বর্তমান প্রশ্ন',
    legendFlagged: 'পরে দেখব',

    questionLabel: (idx: number, total: number) => `প্রশ্ন ${idx} / ${total}`,
    marksLabel: 'মার্কস',
    negativeLabel: 'নেগেটিভ',

    flag: 'পতাকা দিন',
    unflag: 'পতাকা সরান',

    cqLabel: 'আপনার উত্তর লিখুন:',
    cqPlaceholder: 'এখানে আপনার উত্তর লিখুন...',

    prevQuestion: 'আগের প্রশ্ন',
    nextQuestion: 'পরের প্রশ্ন',

    totalQuestions: 'মোট প্রশ্ন',
    answered: 'উত্তর দেওয়া',
    unanswered: 'উত্তর দেওয়া হয়নি',
    flagged: 'পতাকা দেওয়া',

    backToExamList: 'পরীক্ষা তালিকায় ফিরুন',
    scoreLabel: 'আপনার স্কোর',
    solutionsLabel: 'সমাধান পত্র',
    explanationLabel: 'ব্যাখ্যা',
  };
};

export default function StudentExamTakingPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

  // Exam state
  const [attemptData, setAttemptData] = useState<StartAttemptResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Result state
  const [result, setResult] = useState<AttemptResultResponse | null>(null);

  const examBaseLang: Lang = attemptData?.exam.language === 'en' ? 'en' : 'bn';
  const baseUi = getExamUiStrings(examBaseLang);

  // Anti-cheat
  const antiCheatRef = useRef({ tabSwitches: 0, blurEvents: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveQueueRef = useRef<Set<string>>(new Set());
  const savingRef = useRef(false);
  const handleSubmitRef = useRef<(auto?: boolean) => void>(() => {});

  // Initialize exam
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      setError('পরীক্ষা দিতে লগইন করুন');
      return;
    }
    const user = JSON.parse(userStr);
    setUserId(user.id);

    const startExam = async () => {
      try {
        const res = await startExamAttempt(examId, user.id);
        if (res.success && res.data) {
          setAttemptData(res.data);
          setAnswers(res.data.answeredMap || {});
          
          // Set timer
          if (res.data.exam.durationMinutes) {
            const startTime = new Date(res.data.attempt.startedAt).getTime();
            const endTime = startTime + res.data.exam.durationMinutes * 60 * 1000;
            const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
            setTimeLeft(remaining);
          }
          
          setPhase('exam');
        } else {
          setError(res.message || 'পরীক্ষা শুরু করা যায়নি');
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'পরীক্ষা শুরু ব্যর্থ');
      }
    };
    startExam();
  }, [examId]);

  // Timer countdown
  const hasTime = timeLeft !== null;
  useEffect(() => {
    if (phase !== 'exam' || !hasTime) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmitRef.current(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, hasTime]);

  // Anti-cheat: visibility change detection
  useEffect(() => {
    if (phase !== 'exam') return;

    const handleVisibility = () => {
      if (document.hidden) {
        antiCheatRef.current.tabSwitches++;
        antiCheatRef.current.blurEvents++;
        if (antiCheatRef.current.tabSwitches >= 3) {
          handleSubmitRef.current(true);
        }
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Save answer to server (debounced)
  const answersRef = useRef(answers);
  answersRef.current = answers;
  
  const processSaveQueue = useCallback(async () => {
    if (savingRef.current || saveQueueRef.current.size === 0) return;
    savingRef.current = true;
    
    const queuedIds = Array.from(saveQueueRef.current);
    saveQueueRef.current.clear();
    
    for (const qId of queuedIds) {
      try {
        await saveExamAnswer(examId, {
          studentUserId: userId,
          questionId: qId,
          answer: answersRef.current[qId],
        });
      } catch (_err) {
        console.error('Save failed for', qId);
      }
    }
    savingRef.current = false;
  }, [examId, userId]);

  const handleSelectOption = useCallback((questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const updated = { ...prev, [questionId]: { selectedOptionId: optionId } };
      saveQueueRef.current.add(questionId);
      setTimeout(() => processSaveQueue(), 500);
      return updated;
    });
  }, [processSaveQueue]);

  const handleTextAnswer = useCallback((questionId: string, text: string) => {
    setAnswers((prev) => {
      const updated = { ...prev, [questionId]: { text } };
      saveQueueRef.current.add(questionId);
      setTimeout(() => processSaveQueue(), 1500);
      return updated;
    });
  }, [processSaveQueue]);

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const handleSubmit = async (_auto = false) => {
    if (phase === 'submitting') return;
    setPhase('submitting');
    setShowSubmitConfirm(false);
    
    // Flush remaining saves
    for (const qId of saveQueueRef.current) {
      try {
        await saveExamAnswer(examId, { studentUserId: userId, questionId: qId, answer: answers[qId] });
      } catch { /* best effort */ }
    }
    saveQueueRef.current.clear();
    
    try {
      const res = await submitExamAttempt(examId, {
        studentUserId: userId,
        antiCheatLog: antiCheatRef.current,
      });
      
      if (res.success && res.data?.attemptId) {
        // Load result
        const resultRes = await getAttemptResult(res.data.attemptId);
        if (resultRes.success && resultRes.data) {
          setResult(resultRes.data);
        }
      }
      setPhase('result');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'জমা দেওয়া ব্যর্থ');
      setPhase('exam');
    }
  };
  handleSubmitRef.current = handleSubmit;

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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

  // Submitting state
  if (phase === 'submitting') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="h-16 w-16 animate-spin text-indigo-600" />
          <p className="text-xl font-bold text-slate-600">{baseUi.submitting}</p>
        </div>
      </div>
    );
  }

  // Result view
  if (phase === 'result') {
    const resultLang: Lang = result?.exam.language === 'en' ? 'en' : examBaseLang;
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

                        {q.options && q.options.length > 0 && (
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

  // Main exam-taking UI
  if (!attemptData) return null;
  
  const questions = attemptData.questions;
  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const isTimeLow = timeLeft !== null && timeLeft < 300; // < 5 minutes

  // Decide language from the current question content
  const currentLang = detectQuestionLang(currentQ?.question as any, examBaseLang);
  const ui = getExamUiStrings(currentLang);
  const showSidebar = true;

  return (
    <div className="fixed inset-0 z-50 flex bg-white">
      {/* Header bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-white border-b border-slate-200 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-black text-slate-900 truncate max-w-[300px]">
            {attemptData.exam.title}
          </h1>
          <Badge variant="outline" className="text-[9px] font-black uppercase">
            {attemptData.setName}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          {timeLeft !== null && (
            <div className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-lg font-black",
              isTimeLow ? "bg-rose-50 text-rose-600 animate-pulse" : "bg-slate-100 text-slate-700"
            )}>
              <Timer className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
          )}

          {/* Progress pill */}
          <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2">
            <CheckCircle2 className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-black text-indigo-700">{answeredCount}/{totalQuestions}</span>
          </div>

          <Button
            className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-[10px] px-6"
            onClick={() => setShowSubmitConfirm(true)}
          >
            <Send className="h-3.5 w-3.5 mr-2" /> {ui.submit}
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 pt-[60px]">
        {/* Question sidebar */}
        {showSidebar && (
          <div className="w-64 border-r border-slate-200 bg-slate-50 p-4 overflow-y-auto">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">{ui.questionNavigation}</p>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const qId = q.questionId;
                const isAnswered = !!answers[qId];
                const isFlagged = flagged.has(qId);
                const isCurrent = idx === currentIndex;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "h-10 w-10 rounded-xl text-sm font-black transition-all relative",
                      isCurrent ? "bg-indigo-600 text-white shadow-lg scale-110" :
                      isAnswered ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                      "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300"
                    )}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <Flag className="absolute -top-1 -right-1 h-3 w-3 text-amber-500 fill-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-2 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-emerald-100 border border-emerald-200" />
                {ui.legendAnswered}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-white border border-slate-200" />
                {ui.legendUnanswered}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-indigo-600" />
                {ui.legendCurrent}
              </div>
              <div className="flex items-center gap-2">
                <Flag className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                {ui.legendFlagged}
              </div>
            </div>
          </div>
        )}

        {/* Question content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            {currentQ && currentQ.question && (
              <div className="max-w-3xl mx-auto">
                {/* Question header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-black text-lg">
                      {currentIndex + 1}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-400">
                        {ui.questionLabel(currentIndex + 1, totalQuestions)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] font-black">{currentQ.marks} {ui.marksLabel}</Badge>
                        {currentQ.negativeMarks && (
                          <Badge variant="outline" className="text-[9px] font-black text-rose-600 border-rose-200">
                            -{currentQ.negativeMarks} {ui.negativeLabel}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "rounded-xl font-bold text-xs",
                      flagged.has(currentQ.questionId)
                        ? "border-amber-300 bg-amber-50 text-amber-700"
                        : "border-slate-200 text-slate-500"
                    )}
                    onClick={() => toggleFlag(currentQ.questionId)}
                  >
                    <Flag className={cn("h-3.5 w-3.5 mr-1", flagged.has(currentQ.questionId) && "fill-amber-500")} />
                    {flagged.has(currentQ.questionId) ? ui.unflag : ui.flag}
                  </Button>
                </div>

                {/* Passage */}
                {currentQ.question.passage && (
                  <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
                    {currentQ.question.passage.title && (
                      <p className="text-sm font-black text-indigo-700 mb-2">{currentQ.question.passage.title}</p>
                    )}
                    <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: currentQ.question.passage.content }} />
                  </div>
                )}

                {/* Question prompt */}
                <div className="prose prose-lg max-w-none mb-8 font-medium text-slate-800" dangerouslySetInnerHTML={{ __html: currentQ.question.prompt }} />

                {/* MCQ options */}
                {currentQ.question.options && currentQ.question.options.length > 0 && (
                  <div className="space-y-3">
                    {currentQ.question.options.map((opt) => {
                      const isSelected = answers[currentQ.questionId]?.selectedOptionId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectOption(currentQ.questionId, opt.id)}
                          className={cn(
                            "flex items-center gap-4 w-full rounded-2xl border p-5 text-left transition-all",
                            isSelected
                              ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200 shadow-md"
                              : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
                          )}
                        >
                          <span className={cn(
                            "flex-shrink-0 h-10 w-10 rounded-xl border-2 flex items-center justify-center text-sm font-black transition-all",
                            isSelected
                              ? "border-indigo-500 bg-indigo-600 text-white"
                              : "border-slate-300 bg-white text-slate-600"
                          )}>
                            {getOptionLabel(opt.label, currentLang)}
                          </span>
                          <span className={cn(
                            "text-base font-medium transition-colors",
                            isSelected ? "text-indigo-700" : "text-slate-700"
                          )} dangerouslySetInnerHTML={{ __html: opt.text }} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* CQ text input */}
                {currentQ.question.type === 'CQ' && (
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-500">{ui.cqLabel}</label>
                    <textarea
                      className="w-full min-h-[200px] rounded-2xl border border-slate-200 bg-slate-50/50 p-5 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all resize-y"
                      value={answers[currentQ.questionId]?.text || ''}
                      onChange={(e) => handleTextAnswer(currentQ.questionId, e.target.value)}
                      placeholder={ui.cqPlaceholder}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom navigation */}
          <div className="shrink-0 border-t border-slate-200 bg-white px-8 py-4">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <Button
                variant="outline"
                className="h-10 rounded-xl px-6 font-bold text-sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> {ui.prevQuestion}
              </Button>
              
              <span className="text-sm font-medium text-slate-400">
                {currentIndex + 1} / {totalQuestions}
              </span>

              <Button
                className="h-10 rounded-xl px-6 font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={currentIndex === totalQuestions - 1}
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
              >
                {ui.nextQuestion} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit confirmation modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <AlertTriangle className="h-14 w-14 text-amber-500 mx-auto mb-3" />
              <h2 className="text-2xl font-black text-slate-900">{ui.submitConfirmTitle}</h2>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 text-sm font-bold">
                  <span className="text-slate-500">{ui.totalQuestions}</span>
                <span className="text-slate-900">{totalQuestions}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-emerald-50 text-sm font-bold">
                  <span className="text-emerald-600">{ui.answered}</span>
                <span className="text-emerald-700">{answeredCount}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-rose-50 text-sm font-bold">
                  <span className="text-rose-600">{ui.unanswered}</span>
                <span className="text-rose-700">{totalQuestions - answeredCount}</span>
              </div>
              {flagged.size > 0 && (
                <div className="flex justify-between p-3 rounded-xl bg-amber-50 text-sm font-bold">
                    <span className="text-amber-600">{ui.flagged}</span>
                  <span className="text-amber-700">{flagged.size}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-2xl font-bold"
                onClick={() => setShowSubmitConfirm(false)}
              >
                  {ui.submitConfirmGoBack}
              </Button>
              <Button
                className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black"
                onClick={() => handleSubmit(false)}
              >
                  <Send className="h-4 w-4 mr-2" /> {ui.submit}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
