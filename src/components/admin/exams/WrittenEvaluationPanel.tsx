'use client';

import { useState, useEffect, useCallback } from 'react';
import { listWrittenAttempts, getWrittenAttempt, saveWrittenEvaluation, finalizeWrittenEvaluation } from '@/lib/api/exams';
import type { WrittenAttemptSummary, WrittenAttemptDetail, WrittenQuestionWithAnswer } from '@/types/exam';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronLeft, User, CheckCircle, Clock, AlertCircle, Save, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WrittenEvaluationPanelProps {
  examId: string;
  teacherUserId: string; // pass logged-in admin/teacher userId
}

const CQ_PARTS = ['a', 'b', 'c', 'd'];

function getEvalStatus(status: string) {
  if (status === 'EVALUATED') return { label: 'Evaluated', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (status === 'PARTIAL') return { label: 'Partial', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'Pending', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
}

export function WrittenEvaluationPanel({ examId, teacherUserId }: WrittenEvaluationPanelProps) {
  const { toast } = useToast();
  const [attempts, setAttempts] = useState<WrittenAttemptSummary[]>([]);
  const [selected, setSelected] = useState<WrittenAttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  // Local eval state: { [answerId_subPartKey]: { marks, remarks } }
  const [evalMap, setEvalMap] = useState<Record<string, { marks: string; remarks: string }>>({});

  const loadAttempts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listWrittenAttempts(examId);
      if (res.success && res.data) setAttempts(res.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [examId]);

  useEffect(() => { loadAttempts(); }, [loadAttempts]);

  const openAttempt = async (attemptId: string) => {
    setDetailLoading(true);
    try {
      const res = await getWrittenAttempt(examId, attemptId);
      if (res.success && res.data) {
        setSelected(res.data);
        // Pre-fill evalMap from existing evaluations
        const map: Record<string, { marks: string; remarks: string }> = {};
        for (const q of (res.data.questions as WrittenQuestionWithAnswer[])) {
          if (!q.studentAnswer) continue;
          for (const ev of q.studentAnswer.evaluations) {
            const key = `${q.studentAnswer.id}__${ev.subPartKey ?? 'WHOLE'}`;
            map[key] = { marks: String(ev.marksAwarded ?? ''), remarks: ev.remarks ?? '' };
          }
        }
        setEvalMap(map);
      }
    } catch { /* ignore */ } finally { setDetailLoading(false); }
  };

  const evalKey = (answerId: string, subPartKey: string | null) =>
    `${answerId}__${subPartKey ?? 'WHOLE'}`;

  const setEval = (answerId: string, subPartKey: string | null, field: 'marks' | 'remarks', value: string) => {
    const k = evalKey(answerId, subPartKey);
    setEvalMap(prev => ({ ...prev, [k]: { marks: '', remarks: '', ...prev[k], [field]: value } }));
  };

  const saveAll = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      for (const q of selected.questions as WrittenQuestionWithAnswer[]) {
        if (!q.studentAnswer) continue;
        const isCQ = q.question.type === 'CQ';

        if (isCQ) {
          for (const part of CQ_PARTS) {
            const k = evalKey(q.studentAnswer.id, part);
            const entry = evalMap[k];
            if (!entry || entry.marks === '') continue;
            await saveWrittenEvaluation({
              attemptId: selected.attempt.id,
              answerId: q.studentAnswer.id,
              subPartKey: part,
              marksAwarded: Number(entry.marks),
              remarks: entry.remarks || undefined,
              teacherUserId,
            });
          }
        } else {
          const k = evalKey(q.studentAnswer.id, null);
          const entry = evalMap[k];
          if (!entry || entry.marks === '') continue;
          await saveWrittenEvaluation({
            attemptId: selected.attempt.id,
            answerId: q.studentAnswer.id,
            subPartKey: undefined,
            marksAwarded: Number(entry.marks),
            remarks: entry.remarks || undefined,
            teacherUserId,
          });
        }
      }
      toast({ title: 'Saved', description: 'Evaluation saved successfully', variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save evaluation', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const finalize = async () => {
    if (!selected) return;
    setFinalizing(true);
    try {
      await saveAll();
      await finalizeWrittenEvaluation(examId, selected.attempt.id);
      toast({ title: 'Finalized', description: 'Result published to student', variant: 'success' });
      setSelected(null);
      await loadAttempts();
    } catch {
      toast({ title: 'Error', description: 'Failed to finalize', variant: 'destructive' });
    } finally { setFinalizing(false); }
  };

  // ─── Detail View ────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setSelected(null)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <p className="font-black text-slate-900 text-base">{selected.student?.fullName}</p>
            <p className="text-xs text-slate-400">{selected.student?.mobile} · Submitted {selected.attempt.submittedAt ? new Date(selected.attempt.submittedAt).toLocaleString() : '—'}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl font-black text-xs" onClick={saveAll} disabled={saving}>
              <Save className="h-3.5 w-3.5 mr-1" />{saving ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs" onClick={finalize} disabled={finalizing}>
              <Lock className="h-3.5 w-3.5 mr-1" />{finalizing ? 'Finalizing...' : 'Finalize & Publish'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {(selected.questions as WrittenQuestionWithAnswer[]).map((q, qi) => {
            const isCQ = q.question.type === 'CQ';
            const parts = isCQ ? (q.question.meta?.parts as Record<string, number> | undefined) : null;
            const ans = q.studentAnswer;

            return (
              <div key={q.examQuestionId} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-xl bg-indigo-600 text-white text-xs font-black flex items-center justify-center">{qi + 1}</span>
                    <Badge variant="outline" className={cn('text-[9px] font-black uppercase', isCQ ? 'border-violet-200 text-violet-700 bg-violet-50' : 'border-blue-200 text-blue-700 bg-blue-50')}>
                      {isCQ ? 'CQ' : 'Single'}
                    </Badge>
                    <span className="text-xs text-slate-500 font-medium">Total: {Number(q.marks)} marks</span>
                  </div>
                  {ans?.obtainedMarks != null && (
                    <span className="text-sm font-black text-emerald-600">{ans.obtainedMarks}/{Number(q.marks)}</span>
                  )}
                </div>

                <div className="px-6 py-4 space-y-4">
                  <div className="text-sm font-medium text-slate-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.question.prompt }} />

                  {isCQ ? (
                    <div className="space-y-4">
                      {CQ_PARTS.map(part => {
                        const partText = ans?.answer?.[part] ?? '';
                        const maxMarks = parts?.[part];
                        if (!maxMarks && !partText) return null;
                        const k = evalKey(ans?.id ?? '', part);
                        const entry = evalMap[k] ?? { marks: '', remarks: '' };
                        return (
                          <div key={part} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-500 uppercase">Sub-part ({part}){maxMarks ? ` — ${maxMarks} marks` : ''}</span>
                            </div>
                            <div className="rounded-lg bg-white border border-slate-200 p-3 text-sm text-slate-700 min-h-[60px] whitespace-pre-wrap">
                              {partText || <span className="text-slate-300 italic">No answer</span>}
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-3">
                              <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Marks{maxMarks ? ` / ${maxMarks}` : ''}</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={maxMarks}
                                  value={entry.marks}
                                  onChange={e => setEval(ans?.id ?? '', part, 'marks', e.target.value)}
                                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Remarks</label>
                                <input
                                  type="text"
                                  value={entry.remarks}
                                  onChange={e => setEval(ans?.id ?? '', part, 'remarks', e.target.value)}
                                  placeholder="Optional teacher remark..."
                                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-xl bg-white border border-slate-200 p-4 text-sm text-slate-700 min-h-[80px] whitespace-pre-wrap">
                        {ans?.answer?.['text'] || <span className="text-slate-300 italic">No answer</span>}
                      </div>
                      <div className="grid grid-cols-[120px_1fr] gap-3">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Marks / {Number(q.marks)}</label>
                          <input
                            type="number"
                            min={0}
                            max={Number(q.marks)}
                            value={evalMap[evalKey(ans?.id ?? '', null)]?.marks ?? ''}
                            onChange={e => setEval(ans?.id ?? '', null, 'marks', e.target.value)}
                            className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Remarks</label>
                          <input
                            type="text"
                            value={evalMap[evalKey(ans?.id ?? '', null)]?.remarks ?? ''}
                            onChange={e => setEval(ans?.id ?? '', null, 'remarks', e.target.value)}
                            placeholder="Optional remark..."
                            className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Attempts List ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Student Submissions</p>
        <Button variant="outline" size="sm" className="rounded-xl font-black text-xs" onClick={loadAttempts}>Refresh</Button>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto" />
        </div>
      ) : attempts.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400 font-medium">No submissions yet.</div>
      ) : (
        <div className="space-y-2">
          {attempts.map(a => {
            const { label, cls } = getEvalStatus(a.evaluationStatus);
            return (
              <button
                key={a.id}
                onClick={() => openAttempt(a.id)}
                disabled={detailLoading}
                className="w-full rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-200 transition-all px-6 py-4 flex items-center gap-4 text-left shadow-sm"
              >
                <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-slate-900 truncate">{a.student?.fullName}</p>
                  <p className="text-xs text-slate-400">{a.student?.mobile} · {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : 'In Progress'}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {a.obtainedMarks != null && (
                    <span className="text-sm font-black text-emerald-600">{a.totalAwarded}/{Number(a.totalMarks)}</span>
                  )}
                  <Badge variant="outline" className={cn('text-[9px] font-black uppercase', cls)}>{label}</Badge>
                  {a.evaluationStatus === 'PENDING' && <AlertCircle className="h-4 w-4 text-rose-400" />}
                  {a.evaluationStatus === 'EVALUATED' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                  {a.evaluationStatus === 'PARTIAL' && <Clock className="h-4 w-4 text-amber-500" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
