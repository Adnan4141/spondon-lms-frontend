'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Timer,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  CheckCircle2,
  Flag,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AttemptResultResponse, ExamSectionBlock, StartAttemptResponse } from '@/types/exam';
import { saveExamAnswers, saveExamAnswer, submitExamAttempt, getAttemptResult } from '@/lib/api/exams';
import { detectQuestionLang, getExamUiStrings, getOptionLabel, type Lang } from './examUiCopy';

type AnswerPayload = Record<string, unknown>;

function inferSections(questions: StartAttemptResponse['questions']): ExamSectionBlock[] {
  const sections: ExamSectionBlock[] = [];
  let lastKey: string | null = null;
  questions.forEach((q, i) => {
    const key =
      (q.sectionKey && String(q.sectionKey)) ||
      (q.question?.type === 'MCQ' ? 'MCQ' : q.question?.type === 'SHORT' ? 'SHORT' : 'CQ');
    if (sections.length === 0 || key !== lastKey) {
      sections.push({ key, label: key, questionIndices: [i] });
      lastKey = key;
    } else {
      sections[sections.length - 1].questionIndices.push(i);
    }
  });
  return sections;
}

function inferExamFlow(questions: StartAttemptResponse['questions']): 'MCQ_ONLY' | 'WRITTEN_ONLY' | 'MIXED' {
  const types = new Set(questions.map((q) => q.question?.type).filter(Boolean) as string[]);
  const hasMcq = types.has('MCQ');
  const hasWritten = types.has('CQ') || types.has('SHORT');
  if (hasMcq && hasWritten) return 'MIXED';
  if (hasMcq) return 'MCQ_ONLY';
  return 'WRITTEN_ONLY';
}

export function ExamTakingView({
  examId,
  studentUserId,
  attemptData,
  onSubmitted,
  onSubmitFailed,
}: {
  examId: string;
  studentUserId: string;
  attemptData: StartAttemptResponse;
  onSubmitted: (result: AttemptResultResponse | null) => void;
  onSubmitFailed: (msg: string) => void;
}) {
  const questions = attemptData.questions;
  const sections = attemptData.sections?.length ? attemptData.sections : inferSections(questions);
  const examFlow = attemptData.examFlow ?? inferExamFlow(questions);
  const settings = attemptData.exam.settings as { proctorStrict?: boolean } | null | undefined;
  const proctorStrict = !!settings?.proctorStrict;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerPayload>>(() => ({
    ...(attemptData.answeredMap || {}),
  }));
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState<number | null>(() => {
    if (!attemptData.exam.durationMinutes) return null;
    const startTime = new Date(attemptData.attempt.startedAt).getTime();
    const endTime = startTime + attemptData.exam.durationMinutes * 60 * 1000;
    return Math.max(0, Math.floor((endTime - Date.now()) / 1000));
  });

  const examBaseLang: Lang = attemptData.exam.language === 'en' ? 'en' : 'bn';
  const antiCheatRef = useRef({ tabSwitches: 0, blurEvents: 0, visibilityEvents: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const dirtyRef = useRef(new Set<string>());
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const handleSubmitRef = useRef<(auto?: boolean) => void>(() => {});

  const queueDirty = useCallback((questionId: string) => {
    dirtyRef.current.add(questionId);
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(async () => {
      saveDebounceRef.current = null;
      if (savingRef.current || dirtyRef.current.size === 0) return;
      savingRef.current = true;
      const ids = Array.from(dirtyRef.current);
      dirtyRef.current.clear();
      const batch = ids.map((questionId) => ({
        questionId,
        answer: answersRef.current[questionId] ?? {},
      }));
      try {
        const res = await saveExamAnswers(examId, { studentUserId, answers: batch });
        if (res.success && res.data && typeof res.data === 'object' && 'lastSavedAt' in res.data) {
          setLastSavedAt((res.data as { lastSavedAt?: string }).lastSavedAt ?? new Date().toISOString());
        } else {
          setLastSavedAt(new Date().toISOString());
        }
      } catch {
        ids.forEach((id) => dirtyRef.current.add(id));
      } finally {
        savingRef.current = false;
      }
    }, 500);
  }, [examId, studentUserId]);

  useEffect(() => {
    const id = setInterval(() => {
      if (dirtyRef.current.size === 0 || savingRef.current) return;
      const ids = Array.from(dirtyRef.current);
      dirtyRef.current.clear();
      savingRef.current = true;
      const batch = ids.map((questionId) => ({
        questionId,
        answer: answersRef.current[questionId] ?? {},
      }));
      saveExamAnswers(examId, { studentUserId, answers: batch })
        .then((res) => {
          if (res.success) setLastSavedAt(new Date().toISOString());
        })
        .catch(() => ids.forEach((i) => dirtyRef.current.add(i)))
        .finally(() => {
          savingRef.current = false;
        });
    }, 45_000);
    return () => clearInterval(id);
  }, [examId, studentUserId]);

  const hasTime = timeLeft !== null;
  useEffect(() => {
    if (!hasTime) return;
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
  }, [hasTime]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        antiCheatRef.current.tabSwitches++;
        antiCheatRef.current.blurEvents++;
        antiCheatRef.current.visibilityEvents++;
        if (proctorStrict && antiCheatRef.current.tabSwitches >= 3) {
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
  }, [proctorStrict]);

  const handleSelectOption = useCallback(
    (questionId: string, optionId: string) => {
      setAnswers((prev) => {
        const cur = prev[questionId] || {};
        return {
          ...prev,
          [questionId]: {
            ...cur,
            selectedOptionId: optionId,
            markedForReview: !!cur.markedForReview,
          },
        };
      });
      queueDirty(questionId);
    },
    [queueDirty],
  );

  const handleTextAnswer = useCallback(
    (questionId: string, text: string) => {
      setAnswers((prev) => {
        const cur = prev[questionId] || {};
        return {
          ...prev,
          [questionId]: {
            ...cur,
            text,
            markedForReview: !!cur.markedForReview,
          },
        };
      });
      queueDirty(questionId);
    },
    [queueDirty],
  );

  const toggleMarkForReview = useCallback(
    (questionId: string) => {
      setAnswers((prev) => {
        const cur = prev[questionId] || {};
        return {
          ...prev,
          [questionId]: {
            ...cur,
            markedForReview: !cur.markedForReview,
          },
        };
      });
      queueDirty(questionId);
    },
    [queueDirty],
  );

  const handleSubmit = async (_auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    setShowSubmitConfirm(false);
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = null;
    }
    const allIds = Object.keys(answersRef.current);
    dirtyRef.current.clear();
    for (const qId of allIds) {
      try {
        await saveExamAnswer(examId, {
          studentUserId,
          questionId: qId,
          answer: answersRef.current[qId],
        });
      } catch {
        /* best effort */
      }
    }
    try {
      const res = await submitExamAttempt(examId, {
        studentUserId,
        antiCheatLog: antiCheatRef.current,
      });
      if (res.success && res.data?.attemptId) {
        const resultRes = await getAttemptResult(res.data.attemptId);
        onSubmitted(resultRes.success ? resultRes.data ?? null : null);
      } else {
        onSubmitFailed('Submit failed');
      }
    } catch (e: unknown) {
      onSubmitFailed(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setSubmitting(false);
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

  const currentQ = questions[currentIndex];
  const answeredCount = questions.filter((q) => {
    const a = answers[q.questionId];
    if (!a) return false;
    if (a.selectedOptionId) return true;
    if (typeof a.text === 'string' && a.text.trim()) return true;
    return false;
  }).length;
  const markedCount = questions.filter((q) => !!answers[q.questionId]?.markedForReview).length;
  const totalQuestions = questions.length;
  const isTimeLow = timeLeft !== null && timeLeft < 300;

  const currentLang = detectQuestionLang(currentQ?.question as any, examBaseLang);
  const ui = getExamUiStrings(currentLang);

  const activeSectionIdx = sections.findIndex((s) => s.questionIndices.includes(currentIndex));

  return (
    <div className="fixed inset-0 z-50 flex bg-white">
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-white border-b border-slate-200 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <h1 className="text-lg font-black text-slate-900 truncate max-w-[300px]">{attemptData.exam.title}</h1>
          <Badge variant="outline" className="text-[9px] font-black uppercase shrink-0">
            {attemptData.setName}
          </Badge>
          {examFlow === 'MIXED' ? (
            <Badge variant="outline" className="text-[9px] font-black uppercase shrink-0 border-violet-200 text-violet-700">
              Mixed
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {lastSavedAt ? (
            <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
              {ui.lastSaved}: {new Date(lastSavedAt).toLocaleTimeString()}
            </span>
          ) : null}
          {timeLeft !== null && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-lg font-black',
                isTimeLow ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-700',
              )}
            >
              <Timer className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
          )}
          <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2">
            <CheckCircle2 className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-black text-indigo-700">
              {answeredCount}/{totalQuestions}
            </span>
          </div>
          <Button
            className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-[10px] px-6"
            onClick={() => setShowSubmitConfirm(true)}
            disabled={submitting}
          >
            <Send className="h-3.5 w-3.5 mr-2" /> {ui.submit}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 pt-[60px]">
        <div className="w-64 border-r border-slate-200 bg-slate-50 p-4 overflow-y-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">{ui.questionNavigation}</p>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const qId = q.questionId;
              const t = answers[qId]?.text;
              const isAnswered =
                !!answers[qId]?.selectedOptionId || (typeof t === 'string' && t.trim().length > 0);
              const isFlagged = !!answers[qId]?.markedForReview;
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    'h-10 w-10 rounded-xl text-sm font-black transition-all relative',
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-lg scale-110'
                      : isAnswered
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300',
                  )}
                >
                  {idx + 1}
                  {isFlagged ? (
                    <Flag className="absolute -top-1 -right-1 h-3 w-3 text-amber-500 fill-amber-500" />
                  ) : null}
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

        <div className="flex-1 flex flex-col overflow-hidden">
          {examFlow === 'MIXED' && sections.length > 1 ? (
            <div className="shrink-0 border-b border-slate-100 bg-slate-50/80 px-6 py-2 flex flex-wrap gap-2">
              {sections.map((sec, si) => {
                const on = activeSectionIdx === si;
                return (
                  <button
                    key={`${sec.key}-${si}`}
                    type="button"
                    onClick={() => setCurrentIndex(sec.questionIndices[0] ?? 0)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wider',
                      on ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-200',
                    )}
                  >
                    {sec.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto p-8">
            {currentQ?.question ? (
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-black text-lg">
                      {currentIndex + 1}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-400">
                        {ui.questionLabel(currentIndex + 1, totalQuestions)}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[9px] font-black">
                          {currentQ.marks} {ui.marksLabel}
                        </Badge>
                        {currentQ.negativeMarks ? (
                          <Badge variant="outline" className="text-[9px] font-black text-rose-600 border-rose-200">
                            -{currentQ.negativeMarks} {ui.negativeLabel}
                          </Badge>
                        ) : null}
                        {currentQ.sectionKey ? (
                          <Badge variant="outline" className="text-[9px] font-black border-slate-200 text-slate-500">
                            {currentQ.sectionKey}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'rounded-xl font-bold text-xs',
                      answers[currentQ.questionId]?.markedForReview
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-slate-200 text-slate-500',
                    )}
                    onClick={() => toggleMarkForReview(currentQ.questionId)}
                  >
                    <Flag
                      className={cn(
                        'h-3.5 w-3.5 mr-1',
                        answers[currentQ.questionId]?.markedForReview && 'fill-amber-500',
                      )}
                    />
                    {answers[currentQ.questionId]?.markedForReview ? ui.unflag : ui.flag}
                  </Button>
                </div>

                {currentQ.question.passage ? (
                  <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
                    {currentQ.question.passage.title ? (
                      <p className="text-sm font-black text-indigo-700 mb-2">{currentQ.question.passage.title}</p>
                    ) : null}
                    <div
                      className="prose prose-sm max-w-none text-slate-700"
                      dangerouslySetInnerHTML={{ __html: currentQ.question.passage.content }}
                    />
                  </div>
                ) : null}

                <div
                  className="prose prose-lg max-w-none mb-8 font-medium text-slate-800"
                  dangerouslySetInnerHTML={{ __html: currentQ.question.prompt }}
                />

                {currentQ.question.options && currentQ.question.options.length > 0 ? (
                  <div className="space-y-3">
                    {currentQ.question.options.map((opt) => {
                      const isSelected = answers[currentQ.questionId]?.selectedOptionId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(currentQ.questionId, opt.id)}
                          className={cn(
                            'flex items-center gap-4 w-full rounded-2xl border p-5 text-left transition-all',
                            isSelected
                              ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200 shadow-md'
                              : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30',
                          )}
                        >
                          <span
                            className={cn(
                              'flex-shrink-0 h-10 w-10 rounded-xl border-2 flex items-center justify-center text-sm font-black transition-all',
                              isSelected
                                ? 'border-indigo-500 bg-indigo-600 text-white'
                                : 'border-slate-300 bg-white text-slate-600',
                            )}
                          >
                            {getOptionLabel(opt.label, currentLang)}
                          </span>
                          <span
                            className={cn(
                              'text-base font-medium transition-colors',
                              isSelected ? 'text-indigo-700' : 'text-slate-700',
                            )}
                            dangerouslySetInnerHTML={{ __html: opt.text }}
                          />
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {(currentQ.question.type === 'CQ' || currentQ.question.type === 'SHORT') && (
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-500">{ui.cqLabel}</label>
                    <textarea
                      className="w-full min-h-[200px] rounded-2xl border border-slate-200 bg-slate-50/50 p-5 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all resize-y"
                      value={(answers[currentQ.questionId]?.text as string) || ''}
                      onChange={(e) => handleTextAnswer(currentQ.questionId, e.target.value)}
                      placeholder={ui.cqPlaceholder}
                    />
                  </div>
                )}
              </div>
            ) : null}
          </div>

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

      {showSubmitConfirm ? (
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
              {markedCount > 0 ? (
                <div className="flex justify-between p-3 rounded-xl bg-amber-50 text-sm font-bold">
                  <span className="text-amber-600">{ui.flagged}</span>
                  <span className="text-amber-700">{markedCount}</span>
                </div>
              ) : null}
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
                disabled={submitting}
              >
                <Send className="h-4 w-4 mr-2" /> {ui.submit}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {submitting ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/90">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-14 w-14 animate-spin text-indigo-600" />
            <p className="text-lg font-bold text-slate-600">Submitting…</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
