'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { startExamAttempt, saveExamAnswer, submitExamAttempt } from '@/lib/api/exams';
import type { StartAttemptResponse } from '@/types/exam';
import { Button } from '@/components/ui/button';
import { Clock, Send, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STUDENT_USER_ID_KEY = 'studentUserId'; // from localStorage / session
const CQ_PARTS = ['a', 'b', 'c', 'd'] as const;

function getStudentUserId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STUDENT_USER_ID_KEY) ?? '';
}

export default function WrittenExamPage() {
  const { id: examId } = useParams<{ id: string }>();
  const router = useRouter();
  const studentUserId = getStudentUserId();

  const [examData, setExamData] = useState<StartAttemptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [expandedQ, setExpandedQ] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  // answers: { [questionId]: { text: '...' } for single; { a: '...', b: '...' } for CQ }
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load exam ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!studentUserId) { setError('Not logged in.'); setLoading(false); return; }
    startExamAttempt(examId, studentUserId).then(res => {
      if (res.success && res.data) {
        setExamData(res.data);
        // Pre-fill from answeredMap
        const init: Record<string, Record<string, string>> = {};
        for (const [qid, ans] of Object.entries(res.data.answeredMap || {})) {
          init[qid] = ans as Record<string, string>;
        }
        setAnswers(init);
        // Expand first question
        if (res.data.questions.length > 0) {
          setExpandedQ({ [res.data.questions[0].questionId]: true });
        }
        // Timer
        if (res.data.exam.durationMinutes) {
          setTimeLeft(res.data.exam.durationMinutes * 60);
        }
      } else {
        setError(res.message ?? 'Failed to start exam');
      }
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [examId, studentUserId]);

  // ─── Countdown ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) { handleAutoSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, submitted]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── Auto-save ────────────────────────────────────────────────────────────
  const saveAnswer = useCallback(async (questionId: string, answerObj: Record<string, string>) => {
    if (!examId || !studentUserId) return;
    await saveExamAnswer(examId, { studentUserId, questionId, answer: answerObj });
  }, [examId, studentUserId]);

  const onAnswerChange = (questionId: string, key: string, value: string) => {
    setAnswers(prev => {
      const updated = { ...prev, [questionId]: { ...(prev[questionId] ?? {}), [key]: value } };
      // Debounced auto-save
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        saveAnswer(questionId, updated[questionId]);
      }, 1500);
      return updated;
    });
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!examData || submitting) return;
    setSubmitting(true);
    try {
      // Save all pending answers first
      for (const [qid, ans] of Object.entries(answers)) {
        await saveAnswer(qid, ans);
      }
      const res = await submitExamAttempt(examId, { studentUserId });
      if (res.success) setSubmitted(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (!examData || submitting || submitted) return;
    for (const [qid, ans] of Object.entries(answers)) {
      await saveAnswer(qid, ans);
    }
    await submitExamAttempt(examId, { studentUserId, antiCheatLog: { reason: 'time_up' } });
    setSubmitted(true);
  };

  // ─── Submitted ───────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-10 max-w-md w-full text-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 mb-2">Submitted!</h1>
            <p className="text-sm text-slate-500">Your written exam has been submitted successfully. Results will be available after your teacher evaluates your answers.</p>
          </div>
          <Button className="w-full h-12 rounded-2xl bg-indigo-600 text-white font-black" onClick={() => router.push('/student/exams')}>
            Back to Exams
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !examData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <p className="font-black text-slate-800">{error ?? 'Exam not found'}</p>
          <Button variant="outline" className="rounded-2xl" onClick={() => router.push('/student/exams')}>Go Back</Button>
        </div>
      </div>
    );
  }

  const { exam, questions } = examData;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Written Exam</p>
            <h1 className="text-base font-black text-slate-900 truncate">{exam.title}</h1>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {timeLeft !== null && (
              <div className={cn(
                'flex items-center gap-2 rounded-2xl px-4 py-2 font-black text-sm',
                timeLeft < 300 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700'
              )}>
                <Clock className="h-4 w-4" />
                {formatTime(timeLeft)}
              </div>
            )}
            <Button
              className="h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-5"
              onClick={() => setShowConfirm(true)}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" /> Submit
            </Button>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        {questions.map((eq, qi) => {
          const qType = eq.question?.type;
          const isCQ = qType === 'CQ';
          const isExpanded = expandedQ[eq.questionId] ?? false;
          const meta = eq.question?.meta as { parts?: Record<string, number> } | undefined;
          const parts = meta?.parts;

          return (
            <div key={eq.questionId} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Question header */}
              <button
                type="button"
                className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-slate-50/80 transition-colors"
                onClick={() => setExpandedQ(p => ({ ...p, [eq.questionId]: !isExpanded }))}
              >
                <span className="h-8 w-8 rounded-xl bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0">{qi + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border',
                      isCQ ? 'border-violet-200 text-violet-700 bg-violet-50' : 'border-blue-200 text-blue-700 bg-blue-50'
                    )}>{isCQ ? 'CQ' : 'Single'}</span>
                    <span className="text-xs text-slate-400">{Number(eq.marks)} marks</span>
                    {answers[eq.questionId] && Object.values(answers[eq.questionId]).some(v => v.trim()) && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Answered
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800 line-clamp-2" dangerouslySetInnerHTML={{ __html: eq.question?.prompt ?? '' }} />
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
              </button>

              {/* Answer area */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-6 pb-6 pt-4 space-y-4">
                  <div className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: eq.question?.prompt ?? '' }} />

                  {isCQ ? (
                    <div className="space-y-4">
                      {CQ_PARTS.map(part => {
                        const maxM = parts?.[part];
                        if (!maxM) return null;
                        return (
                          <div key={part} className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-500 block">
                              ({part}) — {maxM} marks
                            </label>
                            <textarea
                              rows={4}
                              value={answers[eq.questionId]?.[part] ?? ''}
                              onChange={e => onAnswerChange(eq.questionId, part, e.target.value)}
                              placeholder={`Write your answer for part (${part})…`}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all resize-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-slate-500 block">Your Answer</label>
                      <textarea
                        rows={6}
                        value={answers[eq.questionId]?.['text'] ?? ''}
                        onChange={e => onAnswerChange(eq.questionId, 'text', e.target.value)}
                        placeholder="Write your answer here…"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all resize-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 max-w-sm w-full space-y-5">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Send className="h-6 w-6 text-amber-600" />
              </div>
              <h2 className="font-black text-slate-900 text-lg">Submit exam?</h2>
              <p className="text-sm text-slate-500 mt-1">You cannot change your answers after submission.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-2xl font-black" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button className="flex-1 rounded-2xl bg-indigo-600 text-white font-black" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Yes, Submit'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
