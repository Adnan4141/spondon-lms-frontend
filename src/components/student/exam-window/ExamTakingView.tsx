'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AttemptResultResponse, StartAttemptResponse } from '@/types/exam';
import {
  saveExamAnswers,
  saveExamAnswer,
  sendExamHeartbeat,
  submitExamAttempt,
  getAttemptResult,
} from '@/lib/api/exams';
import { detectQuestionLang, getExamUiStrings, type Lang } from './examUiCopy';
import type { AnswerPayload, AttemptQuestion, ExamDisplayItem, ExamDisplaySection, HybridTabKey } from './exam-taking-types';
import {
  buildDisplayItems,
  buildDisplaySections,
  buildDisplayTabLayouts,
  displayItemAnswered,
  displayItemFlagged,
  formatSectionLabel,
  inferExamFlow,
  isQuestionAnswered,
  summarizeDisplayTab,
  writtenPages,
} from './exam-display-utils';
import { McqQuestionBlock } from './McqQuestionBlock';
import { WrittenQuestionBlock } from './WrittenQuestionBlock';
import { PassageGroupBlock } from './PassageGroupBlock';

export function ExamTakingView({
  examId,
  studentUserId,
  attemptData,
  onSubmitted,
  onAutoSubmitted,
}: {
  examId: string;
  studentUserId: string;
  attemptData: StartAttemptResponse;
  onSubmitted: (result: AttemptResultResponse | null) => void;
  onAutoSubmitted: (payload: { message: string; attemptId?: string | null }) => void;
}) {
  const questions = attemptData.questions;
  const examFlow = attemptData.examFlow ?? inferExamFlow(questions);
  const settings = attemptData.exam.settings as { proctorStrict?: boolean } | null | undefined;
  const proctorStrict = !!settings?.proctorStrict;
  const displayItems = useMemo(() => buildDisplayItems(questions), [questions]);
  const tabLayouts = useMemo(() => buildDisplayTabLayouts(displayItems), [displayItems]);
  const displaySections = useMemo(
    () => buildDisplaySections(displayItems, questions, attemptData.sections),
    [attemptData.sections, displayItems, questions],
  );
  const availableTabKeys = useMemo(
    () => (['mcq', 'written'] as HybridTabKey[]).filter((tabKey) => tabLayouts[tabKey].displayIndices.length > 0),
    [tabLayouts],
  );

  const [activeTab, setActiveTab] = useState<HybridTabKey>(() => (tabLayouts.mcq.displayIndices.length ? 'mcq' : 'written'));
  const [currentIndexByTab, setCurrentIndexByTab] = useState<Record<HybridTabKey, number>>(() => ({
    mcq: tabLayouts.mcq.displayIndices[0] ?? 0,
    written: tabLayouts.written.displayIndices[0] ?? 0,
  }));
  const [answers, setAnswers] = useState<Record<string, AnswerPayload>>(() => ({
    ...(attemptData.answeredMap || {}),
  }));
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [connectionState, setConnectionState] = useState<'stable' | 'reconnecting' | 'timed-out'>('stable');
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

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
  const sessionClosedRef = useRef(false);
  const statusCopy = {
    saveFailed: 'Latest answers could not be synced. Keep this tab open and try again.',
    saveFailedShort: 'Save failed',
    submitFailed: 'Could not submit the exam. Please try again.',
    reconnecting: 'Connection unstable. Trying to reconnect...',
    reconnectingShort: 'Reconnecting...',
    autoSubmitted: 'This session was auto-submitted by the server.',
    autoSubmittedShort: 'Auto-submitted',
    saving: 'Saving...',
    saved: 'Saved',
  };

  const getAttemptIdFromError = useCallback((error: unknown): string | null => {
    if (!(error instanceof ApiError) || !error.body || typeof error.body !== 'object') return null;
    const body = error.body as { data?: { attemptId?: string | null } };
    return body.data?.attemptId ?? null;
  }, []);

  useEffect(() => {
    setCurrentIndexByTab((prev) => {
      const next = {
        mcq: tabLayouts.mcq.displayIndices.includes(prev.mcq) ? prev.mcq : (tabLayouts.mcq.displayIndices[0] ?? 0),
        written: tabLayouts.written.displayIndices.includes(prev.written)
          ? prev.written
          : (tabLayouts.written.displayIndices[0] ?? 0),
      };
      return next.mcq === prev.mcq && next.written === prev.written ? prev : next;
    });
    setActiveTab((prev) => (availableTabKeys.includes(prev) ? prev : (availableTabKeys[0] ?? 'mcq')));
  }, [availableTabKeys, tabLayouts]);

  const queueDirty = useCallback((questionId: string) => {
    dirtyRef.current.add(questionId);
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(async () => {
      saveDebounceRef.current = null;
      if (savingRef.current || dirtyRef.current.size === 0) return;
      savingRef.current = true;
      setSaveState('saving');
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
        setSaveState('saved');
        setRuntimeError(null);
      } catch {
        ids.forEach((id) => dirtyRef.current.add(id));
        setSaveState('error');
        setRuntimeError(statusCopy.saveFailed);
      } finally {
        savingRef.current = false;
      }
    }, 500);
  }, [examId, statusCopy.saveFailed, studentUserId]);

  useEffect(() => {
    const id = setInterval(() => {
      if (dirtyRef.current.size === 0 || savingRef.current) return;
      const ids = Array.from(dirtyRef.current);
      dirtyRef.current.clear();
      savingRef.current = true;
      setSaveState('saving');
      const batch = ids.map((questionId) => ({
        questionId,
        answer: answersRef.current[questionId] ?? {},
      }));
      saveExamAnswers(examId, { studentUserId, answers: batch })
        .then((res) => {
          if (res.success) {
            setLastSavedAt(new Date().toISOString());
            setSaveState('saved');
            setRuntimeError(null);
          }
        })
        .catch(() => {
          ids.forEach((i) => dirtyRef.current.add(i));
          setSaveState('error');
          setRuntimeError(statusCopy.saveFailed);
        })
        .finally(() => {
          savingRef.current = false;
        });
    }, 45_000);
    return () => clearInterval(id);
  }, [examId, statusCopy.saveFailed, studentUserId]);

  useEffect(() => {
    const sendHeartbeat = async () => {
      if (sessionClosedRef.current) return;
      try {
        await sendExamHeartbeat(examId, studentUserId);
        setConnectionState('stable');
      } catch (error) {
        if (sessionClosedRef.current) return;
        if (error instanceof ApiError && error.status === 409) {
          sessionClosedRef.current = true;
          setConnectionState('timed-out');
          setRuntimeError(error.message || statusCopy.autoSubmitted);
          onAutoSubmitted({
            message: error.message || statusCopy.autoSubmitted,
            attemptId: getAttemptIdFromError(error),
          });
          return;
        }
        setConnectionState('reconnecting');
        setRuntimeError(statusCopy.reconnecting);
      }
    };

    const intervalMs = Math.max(5, attemptData.exam.disconnectGraceSeconds ?? 10) * 1000;
    const id = setInterval(() => {
      void sendHeartbeat();
    }, Math.min(10_000, intervalMs));
    void sendHeartbeat();
    return () => clearInterval(id);
  }, [attemptData.exam.disconnectGraceSeconds, examId, getAttemptIdFromError, onAutoSubmitted, statusCopy.autoSubmitted, statusCopy.reconnecting, studentUserId]);

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

  const toggleMarkForReviewItem = useCallback(
    (item: ExamDisplayItem) => {
      const shouldMark = !item.questions.every((q) => !!answersRef.current[q.questionId]?.markedForReview);
      setAnswers((prev) => {
        const next = { ...prev };
        item.questions.forEach((q) => {
          const current = next[q.questionId] || {};
          next[q.questionId] = {
            ...current,
            markedForReview: shouldMark,
          };
        });
        return next;
      });
      item.questions.forEach((q) => queueDirty(q.questionId));
    },
    [queueDirty],
  );

  const handleSubmit = async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    setShowSubmitConfirm(false);
    setRuntimeError(null);
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
      const antiCheatLog =
        auto ||
        antiCheatRef.current.tabSwitches > 0 ||
        antiCheatRef.current.blurEvents > 0 ||
        antiCheatRef.current.visibilityEvents > 0
          ? { ...antiCheatRef.current, ...(auto ? { reason: 'auto_submit' } : {}) }
          : undefined;
      const res = await submitExamAttempt(examId, {
        studentUserId,
        antiCheatLog,
      });
      if (res.success && res.data?.attemptId) {
        const resultRes = await getAttemptResult(res.data.attemptId);
        onSubmitted(resultRes.success ? resultRes.data ?? null : null);
      } else {
        setRuntimeError(statusCopy.submitFailed);
      }
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 409) {
        sessionClosedRef.current = true;
        onAutoSubmitted({
          message: e.message || statusCopy.autoSubmitted,
          attemptId: getAttemptIdFromError(e),
        });
      } else {
        setRuntimeError(e instanceof Error ? e.message : statusCopy.submitFailed);
      }
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

  const tabSummaries = useMemo(
    () => ({
      mcq: summarizeDisplayTab(tabLayouts.mcq, displayItems, answers),
      written: summarizeDisplayTab(tabLayouts.written, displayItems, answers),
    }),
    [answers, displayItems, tabLayouts],
  );
  const showHybridTabs = examFlow === 'MIXED' && availableTabKeys.length > 1;
  const activeTabLayout = tabLayouts[activeTab];
  const activeTabSummary = tabSummaries[activeTab];
  const fallbackIndex = activeTabLayout.displayIndices[0] ?? 0;
  const currentIndex = activeTabLayout.displayIndices.includes(currentIndexByTab[activeTab])
    ? currentIndexByTab[activeTab]
    : fallbackIndex;
  const currentItem = displayItems[currentIndex];
  const currentQ = currentItem?.questions[0];
  const answeredCount = questions.filter((q) => isQuestionAnswered(q, answers)).length;
  const markedCount = questions.filter((q) => !!answers[q.questionId]?.markedForReview).length;
  const mcqAnsweredCount = questions.filter((q) => q.question?.type === 'MCQ' && isQuestionAnswered(q, answers)).length;
  const mcqQuestionCount = questions.filter((q) => q.question?.type === 'MCQ').length;
  const writtenQuestionCount = questions.filter((q) => q.question?.type === 'CQ' || q.question?.type === 'SHORT').length;
  const writtenUploadCompletedCount = questions.filter(
    (q) => (q.question?.type === 'CQ' || q.question?.type === 'SHORT') && writtenPages(answers[q.questionId]).length > 0,
  ).length;
  const unansweredOrUnuploadedCount =
    Math.max(0, mcqQuestionCount - mcqAnsweredCount)
    + Math.max(0, writtenQuestionCount - writtenUploadCompletedCount);
  const totalQuestions = questions.length;
  const totalDisplayItems = displayItems.length;
  const isTimeLow = timeLeft !== null && timeLeft < 300;
  const currentLang = detectQuestionLang(currentQ?.question, examBaseLang);
  const ui = getExamUiStrings(currentLang);
  const syncStatusLabel =
    connectionState === 'timed-out'
      ? statusCopy.autoSubmittedShort
      : connectionState === 'reconnecting'
        ? statusCopy.reconnectingShort
        : saveState === 'saving'
          ? statusCopy.saving
          : saveState === 'error'
            ? statusCopy.saveFailedShort
            : lastSavedAt
              ? `${ui.lastSaved}: ${new Date(lastSavedAt).toLocaleTimeString()}`
              : null;
  const syncStatusTone =
    connectionState === 'timed-out' || saveState === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : connectionState === 'reconnecting'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  const activeSections = useMemo(
    () =>
      displaySections
        .map((section) => {
          const visibleIndices = section.displayIndices.filter((displayIndex) => activeTabLayout.displayIndexSet.has(displayIndex));
          if (!visibleIndices.length) return null;
          return {
            ...section,
            displayIndices: visibleIndices,
            questionCount: visibleIndices.reduce(
              (sum, displayIndex) => sum + (displayItems[displayIndex]?.questions.length ?? 0),
              0,
            ),
          } satisfies ExamDisplaySection;
        })
        .filter(Boolean) as ExamDisplaySection[],
    [activeTabLayout, displayItems, displaySections],
  );
  const activeSectionIdx = activeSections.findIndex((section) => section.displayIndices.includes(currentIndex));
  const [showNav, setShowNav] = useState(false);
  const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const questionNumberFor = useCallback(
    (q: AttemptQuestion) => activeTabLayout.questionNumberByItemId.get(q.id) ?? questions.findIndex((candidate) => candidate.id === q.id) + 1,
    [activeTabLayout, questions],
  );
  const updateWrittenAnswer = useCallback(
    (questionId: string, nextAnswer: AnswerPayload) => {
      setAnswers((prev) => ({ ...prev, [questionId]: nextAnswer }));
      queueDirty(questionId);
    },
    [queueDirty],
  );

  // Keyboard shortcuts: 1-4 for options, left/right for nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      const activeIndices = activeTabLayout.displayIndices;
      const currentItemPosition = activeIndices.indexOf(currentIndex);
      if (e.key === 'ArrowLeft' && currentItemPosition > 0) {
        setCurrentIndexByTab((prev) => ({ ...prev, [activeTab]: activeIndices[currentItemPosition - 1] ?? prev[activeTab] }));
      }
      if (e.key === 'ArrowRight' && currentItemPosition >= 0 && currentItemPosition < activeIndices.length - 1) {
        setCurrentIndexByTab((prev) => ({ ...prev, [activeTab]: activeIndices[currentItemPosition + 1] ?? prev[activeTab] }));
      }
      const opts = currentItem?.kind === 'single' ? currentQ?.question?.options : undefined;
      if (opts && opts.length > 0 && currentQ) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= opts.length) {
          handleSelectOption(currentQ.questionId, opts[num - 1].id);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab, activeTabLayout, currentIndex, currentItem, currentQ, handleSelectOption]);

  const currentItemMeta = activeTabLayout.navMetaByDisplayIndex.get(currentIndex);
  const activeItemPosition = activeTabLayout.displayIndices.indexOf(currentIndex);
  const activeQuestionTotal = activeTabLayout.questionCount || totalQuestions;
  const currentSectionLabel = formatSectionLabel(currentQ?.sectionKey, currentQ?.question?.type ?? null);

  const setCurrentIndex = useCallback(
    (displayIndex: number) => {
      setCurrentIndexByTab((prev) => ({ ...prev, [activeTab]: displayIndex }));
    },
    [activeTab],
  );

  return (
    <div className="fixed inset-0 z-50 flex bg-white">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
              onClick={() => setShowNav(p => !p)}
            >
              <span className="text-[11px] font-black">{currentItemMeta?.label ?? currentIndex + 1}</span>
            </button>
            <h1 className="max-w-[200px] truncate text-base font-black text-slate-900 sm:max-w-[300px] sm:text-lg">
              {attemptData.exam.title || examId}
            </h1>
            <Badge variant="outline" className="text-[9px] font-black uppercase shrink-0 hidden sm:inline-flex">
              {attemptData.setName}
            </Badge>
            {examFlow === 'MIXED' ? (
              <Badge variant="outline" className="text-[9px] font-black uppercase shrink-0 border-blue-200 text-blue-700 hidden sm:inline-flex">
                Mixed
              </Badge>
            ) : null}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {syncStatusLabel ? (
              <span className={cn('hidden rounded-xl border px-2.5 py-1 text-[10px] font-black md:inline', syncStatusTone)}>
                {syncStatusLabel}
              </span>
            ) : null}
            {timeLeft !== null && (
              <div
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 font-mono text-sm sm:text-lg font-black',
                  isTimeLow ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-700',
                )}
              >
                <Timer className="h-4 w-4" />
                {formatTime(timeLeft)}
              </div>
            )}
            <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-3 sm:px-4 py-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-500" />
              <span className="text-xs sm:text-sm font-black text-indigo-700">
                {answeredCount}/{totalQuestions}
              </span>
            </div>
            <Button
              className="h-9 sm:h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-[10px] px-4 sm:px-6"
              onClick={() => setShowSubmitConfirm(true)}
              disabled={submitting}
            >
              <Send className="h-3.5 w-3.5 sm:mr-2" />
              <span className="hidden sm:inline">{ui.submit}</span>
            </Button>
          </div>
        </div>
        {showHybridTabs ? (
          <div className="h-32 border-t border-slate-100 bg-slate-50/95 px-4 py-3 sm:px-6 lg:h-20">
            <div className="flex h-full flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid w-full max-w-xl grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                {availableTabKeys.map((tabKey) => {
                  const layout = tabLayouts[tabKey];
                  const summary = tabSummaries[tabKey];
                  const active = activeTab === tabKey;
                  return (
                    <button
                      key={tabKey}
                      type="button"
                      onClick={() => {
                        setActiveTab(tabKey);
                        setShowNav(false);
                      }}
                      className={cn(
                        'h-14 rounded-xl px-4 text-left transition-all',
                        active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black uppercase tracking-[0.18em]">{layout.label}</span>
                        <span className={cn('text-[10px] font-black', active ? 'text-white/75' : 'text-slate-400')}>
                          {layout.questionCount} Q
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <span className={cn('text-sm font-black', active ? 'text-white' : 'text-slate-900')}>
                          {summary.answeredCount}/{layout.questionCount}
                        </span>
                        <span className={cn('text-[10px] font-bold', active ? 'text-white/60' : 'text-slate-400')}>
                          {layout.itemCount} items
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex shrink-0 items-center gap-2 overflow-x-auto whitespace-nowrap text-xs font-bold text-slate-500">
                <span className="rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-sm">
                  Overall {answeredCount}/{totalQuestions}
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-sm">
                  {activeTabLayout.label} {activeTabSummary.answeredCount}/{activeTabLayout.questionCount}
                </span>
                {activeTabSummary.flaggedCount > 0 ? (
                  <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 shadow-sm">
                    Flagged {activeTabSummary.flaggedCount}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
        {runtimeError ? (
          <div className="border-t border-rose-100 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 sm:px-6 md:hidden">
            {runtimeError}
          </div>
        ) : null}
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className={cn('flex flex-1', showHybridTabs ? 'pt-[193px] lg:pt-[145px]' : 'pt-[65px]')}>
        {/* Mobile nav overlay */}
        {showNav && (
          <div className="fixed inset-0 z-[55] bg-black/30 lg:hidden" onClick={() => setShowNav(false)} />
        )}
        <div className={cn(
          'w-64 border-r border-slate-200 bg-slate-50 p-4 overflow-y-auto shrink-0 transition-transform duration-200',
          'fixed lg:relative inset-y-0 left-0 z-[56] pt-[72px] lg:pt-4',
          showHybridTabs && 'pt-[201px] lg:pt-4',
          showNav ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}>
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{activeTabLayout.label} navigation</p>
            <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>{activeTabSummary.answeredCount}/{activeTabLayout.questionCount} answered</span>
              <span>{activeTabLayout.itemCount} items</span>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {activeTabLayout.displayIndices.map((displayIndex) => {
              const item = displayItems[displayIndex];
              const navMeta = activeTabLayout.navMetaByDisplayIndex.get(displayIndex);
              const isAnswered = displayItemAnswered(item, answers);
              const isFlagged = displayItemFlagged(item, answers);
              const isCurrent = displayIndex === currentIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(displayIndex);
                    setShowNav(false);
                  }}
                  className={cn(
                    'relative h-10 rounded-xl text-sm font-black transition-all',
                    'w-10',
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-lg scale-110'
                      : isAnswered
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300',
                  )}
                  title={undefined}
                >
                  {navMeta?.label ?? displayIndex + 1}
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
          {runtimeError ? (
            <div className="shrink-0 border-b border-rose-100 bg-rose-50 px-6 py-3 text-sm font-bold text-rose-700 hidden md:block">
              {runtimeError}
            </div>
          ) : null}
          {activeSections.length > 1 ? (
            <div className="shrink-0 border-b border-slate-100 bg-slate-50/80 px-6 py-2 flex flex-wrap gap-2">
              {activeSections.map((sec, si) => {
                const on = activeSectionIdx === si;
                return (
                  <button
                    key={`${sec.key}-${si}`}
                    type="button"
                    onClick={() => setCurrentIndex(sec.displayIndices[0] ?? 0)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wider',
                      on ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-200',
                    )}
                  >
                    {sec.label} ({sec.questionCount})
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto p-8">
            {currentItem && currentQ?.question ? (
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-black text-lg">
                      {currentItemMeta?.label ?? currentIndex + 1}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-400">
                        {ui.questionLabel(questionNumberFor(currentQ), activeQuestionTotal)}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[9px] font-black">
                          {currentItem.questions.reduce((sum, q) => sum + Number(q.marks || 0), 0)} {ui.marksLabel}
                        </Badge>
                        {currentQ.negativeMarks ? (
                          <Badge variant="outline" className="text-[9px] font-black text-rose-600 border-rose-200">
                            -{currentQ.negativeMarks} {ui.negativeLabel}
                          </Badge>
                        ) : null}
                        {showHybridTabs ? (
                          <Badge variant="outline" className="text-[9px] font-black border-slate-200 text-slate-500">
                            {activeTabLayout.label}
                          </Badge>
                        ) : null}
                        {currentQ.sectionKey ? (
                          <Badge variant="outline" className="text-[9px] font-black border-slate-200 text-slate-500">
                            {currentSectionLabel}
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
                      displayItemFlagged(currentItem, answers)
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-slate-200 text-slate-500',
                    )}
                    onClick={() => toggleMarkForReviewItem(currentItem)}
                  >
                    <Flag
                      className={cn(
                        'h-3.5 w-3.5 mr-1',
                        displayItemFlagged(currentItem, answers) && 'fill-amber-500',
                      )}
                    />
                    {displayItemFlagged(currentItem, answers) ? ui.unflag : ui.flag}
                  </Button>
                </div>

                {currentQ.question.type === 'CQ' || currentQ.question.type === 'SHORT' ? (
                  <WrittenQuestionBlock
                    q={currentQ}
                    examId={examId}
                    attemptId={attemptData.attempt.id}
                    answer={answers[currentQ.questionId]}
                    lang={currentLang}
                    onAnswerChange={updateWrittenAnswer}
                    onTextChange={handleTextAnswer}
                  />
                ) : (
                  <div className="space-y-5">
                    {currentQ.question.passage ? (
                      <div className="sticky top-0 z-10 rounded-2xl border border-indigo-100 bg-indigo-50/95 p-6 shadow-sm backdrop-blur">
                        <p className="mb-3 text-sm font-black text-indigo-700">উদ্দীপক</p>
                        <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: currentQ.question.passage.content }} />
                      </div>
                    ) : null}
                    <McqQuestionBlock
                      q={currentQ}
                      questionNumber={questionNumberFor(currentQ)}
                      totalQuestions={activeQuestionTotal}
                      answer={answers[currentQ.questionId]}
                      lang={currentLang}
                      onSelect={handleSelectOption}
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
                disabled={activeItemPosition <= 0}
                onClick={() => {
                  const prevIndex = activeTabLayout.displayIndices[activeItemPosition - 1];
                  if (prevIndex != null) setCurrentIndex(prevIndex);
                }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> {ui.prevQuestion}
              </Button>
              <span className="text-sm font-medium text-slate-400">
                Item {Math.max(activeItemPosition + 1, 1)} / {activeTabLayout.itemCount || totalDisplayItems}
              </span>
              <Button
                className="h-10 rounded-xl px-6 font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={activeItemPosition < 0 || activeItemPosition >= activeTabLayout.itemCount - 1}
                onClick={() => {
                  const nextIndex = activeTabLayout.displayIndices[activeItemPosition + 1];
                  if (nextIndex != null) setCurrentIndex(nextIndex);
                }}
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
                <span className="text-emerald-600">MCQ answered</span>
                <span className="text-emerald-700">{mcqAnsweredCount}/{mcqQuestionCount}</span>
              </div>
              {writtenQuestionCount > 0 ? (
                <div className="flex justify-between p-3 rounded-xl bg-blue-50 text-sm font-bold">
                  <span className="text-blue-600">Written uploads</span>
                  <span className="text-blue-700">{writtenUploadCompletedCount}/{writtenQuestionCount}</span>
                </div>
              ) : null}
              <div className="flex justify-between p-3 rounded-xl bg-emerald-50 text-sm font-bold">
                <span className="text-emerald-600">{ui.answered}</span>
                <span className="text-emerald-700">{answeredCount}/{totalQuestions}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-rose-50 text-sm font-bold">
                <span className="text-rose-600">Unanswered / unuploaded</span>
                <span className="text-rose-700">{unansweredOrUnuploadedCount}</span>
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
            <p className="text-lg font-bold text-slate-600">
              Submitting...
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}