'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listExamResultBatches,
  getExamResultBatchDetail,
  postExamResultSingle,
  postExamResultBulkManual,
  postExamResultBulkExcel,
  approveResultBatchBranch,
  approveResultBatchCentral,
  rejectResultBatch,
  deleteResultBatch,
  type ResultBatchSummary,
} from '@/lib/api/exam-result-batches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ClipboardList,
  Loader2,
  Upload,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Shield,
  Building2,
  Trash2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function statusStyle(s: string) {
  switch (s) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-900 border-amber-200';
    case 'APPROVED_BY_BRANCH':
      return 'bg-sky-50 text-sky-900 border-sky-200';
    case 'APPROVED_BY_CENTRAL':
      return 'bg-emerald-50 text-emerald-900 border-emerald-200';
    case 'REJECTED':
      return 'bg-rose-50 text-rose-900 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

const inputClass =
  'h-11 rounded-xl border-slate-200 bg-slate-50/50 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20';

export function ExamResultBatchesPanel({ examId, branchId }: { examId: string; branchId: string }) {
  const { toast } = useToast();
  const [batches, setBatches] = useState<ResultBatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, any>>({});

  const [rollNo, setRollNo] = useState('');
  const [marks, setMarks] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [comments, setComments] = useState('');
  const [bulkJson, setBulkJson] = useState(
    '[\n  { "rollNo": "1001", "marksObtained": 45, "totalMarks": 50 }\n]',
  );

  const refresh = useCallback(async () => {
    const res = await listExamResultBatches(examId);
    if (res.success && res.data) setBatches(res.data);
  }, [examId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const toggleExpand = async (batchId: string) => {
    if (expanded === batchId) {
      setExpanded(null);
      return;
    }
    setExpanded(batchId);
    if (!detail[batchId]) {
      const res = await getExamResultBatchDetail(examId, batchId);
      if (res.success && res.data) {
        setDetail((d) => ({ ...d, [batchId]: res.data }));
      }
    }
  };

  const handleSingle = async () => {
    if (!rollNo.trim() || marks === '') {
      toast({ title: 'Missing fields', description: 'Roll and marks are required.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const res = await postExamResultSingle(examId, {
        rollNo: rollNo.trim(),
        marksObtained: Number(marks),
        totalMarks: totalMarks ? Number(totalMarks) : undefined,
        comments: comments || undefined,
        branchId,
      });
      if (res.success) {
        toast({ title: 'Saved', description: 'Result batch created.', variant: 'success' });
        setRollNo('');
        setMarks('');
        setTotalMarks('');
        setComments('');
        await refresh();
      } else {
        toast({ title: 'Error', description: res.message || 'Failed', variant: 'destructive' });
      }
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleBulk = async () => {
    let rows: unknown[];
    try {
      rows = JSON.parse(bulkJson);
    } catch {
      toast({ title: 'Invalid JSON', variant: 'destructive' });
      return;
    }
    if (!Array.isArray(rows) || !rows.length) {
      toast({ title: 'Empty', description: 'Provide a non-empty array.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const res = await postExamResultBulkManual(examId, rows as any[], branchId);
      if (res.success && res.data) {
        const ins = res.data.inserted ?? 0;
        const errs = res.data.errors?.length ?? 0;
        toast({
          title: 'Imported',
          description: `${ins} row(s). ${errs ? `${errs} error(s).` : ''}`,
          variant: errs ? 'default' : 'success',
        });
        await refresh();
      } else {
        toast({ title: 'Error', description: res.message, variant: 'destructive' });
      }
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const res = await postExamResultBulkExcel(examId, file, branchId);
      if (res.success && res.data) {
        toast({
          title: 'Excel processed',
          description: `${res.data.inserted ?? 0} row(s) inserted.`,
          variant: 'success',
        });
        await refresh();
      }
    } catch (err: unknown) {
      toast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Error',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const act = async (label: string, fn: () => Promise<{ success?: boolean; message?: string }>) => {
    setBusy(true);
    try {
      const res = await fn();
      if (!res?.success) {
        toast({ title: res?.message || 'Action failed', variant: 'destructive' });
        return;
      }
      toast({ title: label, variant: 'success' });
      setExpanded(null);
      setDetail({});
      await refresh();
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-100/80">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <ClipboardList className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Single result</h3>
          </div>
          <div className="space-y-3">
            <Input
              className={inputClass}
              placeholder="Roll / registration no."
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                className={inputClass}
                type="number"
                placeholder="Marks obtained"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
              />
              <Input
                className={inputClass}
                type="number"
                placeholder="Total (optional)"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
              />
            </div>
            <Input
              className={inputClass}
              placeholder="Comments (optional)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
            <Button
              type="button"
              className="h-11 w-full rounded-xl bg-slate-900 font-bold uppercase tracking-wider text-[10px] hover:bg-indigo-600"
              disabled={busy}
              onClick={handleSingle}
            >
              Submit single result
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-100/80">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Bulk manual (JSON)</h3>
          </div>
          <textarea
            className="mb-3 min-h-[140px] w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 font-mono text-xs leading-relaxed"
            value={bulkJson}
            onChange={(e) => setBulkJson(e.target.value)}
            spellCheck={false}
          />
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl border-violet-200 font-bold uppercase tracking-wider text-[10px] text-violet-900 hover:bg-violet-50"
            disabled={busy}
            onClick={handleBulk}
          >
            Import JSON rows
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-emerald-200/80 bg-emerald-50/20 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-emerald-900">Excel import</p>
            <p className="text-xs text-emerald-800/80">
              Columns: roll (col A), … , marks (col C), total (col D), comments (col E)
            </p>
          </div>
          <label>
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcel} disabled={busy} />
            <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700">
              <Upload className="h-4 w-4" />
              Upload sheet
            </span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Result batches</h3>
        <div className="space-y-2">
          {batches.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No batches yet. Submit results above.
            </p>
          ) : (
            batches.map((b) => {
              const open = expanded === b.id;
              const d = detail[b.id];
              return (
                <div
                  key={b.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                    onClick={() => toggleExpand(b.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn('text-[10px] font-bold uppercase', statusStyle(b.approvalStatus))}>
                          {b.approvalStatus.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs font-bold text-slate-500">{b.inputMode.replace(/_/g, ' ')}</span>
                        <span className="text-xs tabular-nums text-slate-400">{b.totalRecords} records</span>
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                        {new Date(b.createdAt).toLocaleString()}
                      </p>
                      <p className="truncate text-xs text-slate-500">Uploader: {b.uploaderUser?.fullName ?? '—'}</p>
                    </div>
                    {open ? <ChevronUp className="h-5 w-5 shrink-0 text-slate-400" /> : <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />}
                  </button>

                  {open && (
                    <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4">
                      <div className="mb-4 flex flex-wrap gap-2">
                        {b.approvalStatus === 'PENDING' ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              className="rounded-lg bg-sky-600 font-bold text-xs hover:bg-sky-700"
                              disabled={busy}
                              onClick={() =>
                                act('Branch approved', () => approveResultBatchBranch(examId, b.id) as Promise<any>)
                              }
                            >
                              <Building2 className="mr-1.5 h-3.5 w-3.5" />
                              Branch approve
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-lg border-rose-200 text-rose-700"
                              disabled={busy}
                              onClick={() => act('Rejected', () => rejectResultBatch(examId, b.id) as Promise<any>)}
                            >
                              <XCircle className="mr-1.5 h-3.5 w-3.5" />
                              Reject
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="rounded-lg text-slate-600"
                              disabled={busy}
                              onClick={() => {
                                if (confirm('Delete this pending batch?')) {
                                  act('Deleted', () => deleteResultBatch(examId, b.id) as Promise<any>);
                                }
                              }}
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </>
                        ) : null}
                        {b.approvalStatus === 'APPROVED_BY_BRANCH' ? (
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-lg bg-emerald-600 font-bold text-xs hover:bg-emerald-700"
                            disabled={busy}
                            onClick={() =>
                              act('Central approved', () => approveResultBatchCentral(examId, b.id) as Promise<any>)
                            }
                          >
                            <Shield className="mr-1.5 h-3.5 w-3.5" />
                            Central approve
                          </Button>
                        ) : null}
                        {b.approvalStatus === 'APPROVED_BY_CENTRAL' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" /> Published to students
                          </span>
                        ) : null}
                      </div>

                      {d?.results ? (
                        <div className="max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-slate-50 text-left font-bold uppercase text-slate-500">
                              <tr>
                                <th className="px-3 py-2">Student</th>
                                <th className="px-3 py-2">Roll</th>
                                <th className="px-3 py-2 text-right">Marks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {d.results.slice(0, 50).map((r: any) => (
                                <tr key={r.id}>
                                  <td className="px-3 py-2 font-medium">{r.student?.fullName}</td>
                                  <td className="px-3 py-2">{r.rollNo}</td>
                                  <td className="px-3 py-2 text-right tabular-nums">
                                    {Number(r.marks)} / {Number(r.totalMarks)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {d.results.length > 50 ? (
                            <p className="border-t border-slate-100 px-3 py-2 text-center text-[10px] text-slate-400">
                              +{d.results.length - 50} more
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">Loading rows…</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
