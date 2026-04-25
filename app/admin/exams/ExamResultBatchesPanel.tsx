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
  Plus,
  Minus,
  Table,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type InputMode = 'single' | 'bulk' | 'excel';

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
  'h-10 rounded-xl border-slate-200 bg-slate-50/50 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-sm';

interface BulkRow {
  rollNo: string;
  marks: string;
  total: string;
  comments: string;
}

const emptyBulkRow = (): BulkRow => ({ rollNo: '', marks: '', total: '', comments: '' });

export function ExamResultBatchesPanel({ examId, branchId }: { examId: string; branchId: string }) {
  const { toast } = useToast();
  const [batches, setBatches] = useState<ResultBatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, any>>({});
  const [mode, setMode] = useState<InputMode>('single');
  const [batchSearch, setBatchSearch] = useState('');

  // Single mode
  const [rollNo, setRollNo] = useState('');
  const [marks, setMarks] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [comments, setComments] = useState('');

  // Bulk table mode
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([emptyBulkRow(), emptyBulkRow(), emptyBulkRow()]);

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
    return () => { cancelled = true; };
  }, [refresh]);

  const toggleExpand = async (batchId: string) => {
    if (expanded === batchId) { setExpanded(null); return; }
    setExpanded(batchId);
    if (!detail[batchId]) {
      const res = await getExamResultBatchDetail(examId, batchId);
      if (res.success && res.data) setDetail((d) => ({ ...d, [batchId]: res.data }));
    }
  };

  // ── Single submit ────────────────────────────────────────────────────────
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
        toast({ title: 'Saved', description: 'Result created.', variant: 'success' });
        setRollNo(''); setMarks(''); setTotalMarks(''); setComments('');
        await refresh();
      } else {
        toast({ title: 'Error', description: res.message || 'Failed', variant: 'destructive' });
      }
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally { setBusy(false); }
  };

  // ── Bulk table submit ────────────────────────────────────────────────────
  const updateBulkRow = (idx: number, field: keyof BulkRow, value: string) => {
    setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const addBulkRow = () => setBulkRows(prev => [...prev, emptyBulkRow()]);

  const removeBulkRow = (idx: number) => {
    if (bulkRows.length <= 1) return;
    setBulkRows(prev => prev.filter((_, i) => i !== idx));
  };

  const handleBulkTable = async () => {
    const validRows = bulkRows.filter(r => r.rollNo.trim() && r.marks.trim());
    if (validRows.length === 0) {
      toast({ title: 'No data', description: 'Fill at least one row with roll and marks.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const apiRows = validRows.map(r => ({
        rollNo: r.rollNo.trim(),
        marksObtained: Number(r.marks),
        totalMarks: r.total ? Number(r.total) : undefined,
        comments: r.comments || undefined,
      }));
      const res = await postExamResultBulkManual(examId, apiRows, branchId);
      if (res.success && res.data) {
        const ins = res.data.inserted ?? 0;
        const errs = res.data.errors?.length ?? 0;
        toast({
          title: 'Imported',
          description: `${ins} row(s) saved. ${errs ? `${errs} error(s).` : ''}`,
          variant: errs ? 'default' : 'success',
        });
        setBulkRows([emptyBulkRow(), emptyBulkRow(), emptyBulkRow()]);
        await refresh();
      } else {
        toast({ title: 'Error', description: res.message, variant: 'destructive' });
      }
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally { setBusy(false); }
  };

  // ── Excel upload ─────────────────────────────────────────────────────────
  const handleExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const res = await postExamResultBulkExcel(examId, file, branchId);
      if (res.success && res.data) {
        toast({ title: 'Excel processed', description: `${res.data.inserted ?? 0} row(s) inserted.`, variant: 'success' });
        await refresh();
      }
    } catch (err: unknown) {
      toast({ title: 'Import failed', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' });
    } finally { setBusy(false); e.target.value = ''; }
  };

  // ── Batch actions ────────────────────────────────────────────────────────
  const act = async (label: string, fn: () => Promise<{ success?: boolean; message?: string }>) => {
    setBusy(true);
    try {
      const res = await fn();
      if (!res?.success) { toast({ title: res?.message || 'Action failed', variant: 'destructive' }); return; }
      toast({ title: label, variant: 'success' });
      setExpanded(null); setDetail({});
      await refresh();
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const filteredBatches = batchSearch.trim()
    ? batches.filter(b =>
        (b.uploaderUser?.fullName ?? '').toLowerCase().includes(batchSearch.toLowerCase()) ||
        b.approvalStatus.toLowerCase().includes(batchSearch.toLowerCase()) ||
        b.inputMode.toLowerCase().includes(batchSearch.toLowerCase())
      )
    : batches;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  const modeConfig: { id: InputMode; label: string; icon: typeof ClipboardList }[] = [
    { id: 'single', label: 'Single Entry', icon: ClipboardList },
    { id: 'bulk', label: 'Bulk Table', icon: Table },
    { id: 'excel', label: 'Excel Upload', icon: FileSpreadsheet },
  ];

  return (
    <div className="space-y-8">
      {/* ── Mode selector tabs ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1 w-fit">
        {modeConfig.map(m => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all',
                active
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* ── Single entry ────────────────────────────────────────────────── */}
      {mode === 'single' && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm max-w-lg">
          <div className="space-y-3">
            <Input className={inputClass} placeholder="Roll / registration no." value={rollNo} onChange={(e) => setRollNo(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input className={inputClass} type="number" placeholder="Marks obtained" value={marks} onChange={(e) => setMarks(e.target.value)} />
              <Input className={inputClass} type="number" placeholder="Total marks" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
            </div>
            <Input className={inputClass} placeholder="Comments (optional)" value={comments} onChange={(e) => setComments(e.target.value)} />
            <Button
              type="button"
              className="h-10 w-full rounded-xl bg-slate-900 font-bold uppercase tracking-wider text-[10px] hover:bg-indigo-600"
              disabled={busy}
              onClick={handleSingle}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit result
            </Button>
          </div>
        </div>
      )}

      {/* ── Bulk table ──────────────────────────────────────────────────── */}
      {mode === 'bulk' && (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 w-8">#</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Roll No.</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 w-28">Marks</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 w-28">Total</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Comments</th>
                  <th className="px-3 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bulkRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-3 py-1.5 text-xs font-bold text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="px-3 py-1.5">
                      <input
                        className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="1001"
                        value={row.rollNo}
                        onChange={e => updateBulkRow(idx, 'rollNo', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="number"
                        className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="45"
                        value={row.marks}
                        onChange={e => updateBulkRow(idx, 'marks', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="number"
                        className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="50"
                        value={row.total}
                        onChange={e => updateBulkRow(idx, 'total', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Optional"
                        value={row.comments}
                        onChange={e => updateBulkRow(idx, 'comments', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <button
                        type="button"
                        onClick={() => removeBulkRow(idx)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        disabled={bulkRows.length <= 1}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <Button type="button" variant="ghost" size="sm" className="rounded-lg text-xs font-bold text-slate-500" onClick={addBulkRow}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add row
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                {bulkRows.filter(r => r.rollNo.trim() && r.marks.trim()).length} valid row(s)
              </span>
              <Button
                type="button"
                className="rounded-xl bg-violet-600 hover:bg-violet-700 font-bold text-xs px-6"
                disabled={busy}
                onClick={handleBulkTable}
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Submit all rows
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Excel upload ────────────────────────────────────────────────── */}
      {mode === 'excel' && (
        <div className="rounded-2xl border border-dashed border-emerald-200/80 bg-emerald-50/20 p-8 max-w-lg">
          <div className="text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
              <Upload className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">Upload Excel file</p>
              <p className="text-xs text-emerald-800/70 mt-1 leading-relaxed">
                Columns: Roll (A), Name (B), Marks (C), Total (D), Comments (E)
              </p>
            </div>
            <label>
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcel} disabled={busy} />
              <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700">
                <FileSpreadsheet className="h-4 w-4" />
                {busy ? 'Uploading...' : 'Choose file'}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* ── Result batches ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Result batches ({batches.length})</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              className="h-8 w-48 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Search batches..."
              value={batchSearch}
              onChange={e => setBatchSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          {filteredBatches.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              {batches.length === 0 ? 'No batches yet. Submit results above.' : 'No batches match your search.'}
            </p>
          ) : (
            filteredBatches.map((b) => {
              const open = expanded === b.id;
              const d = detail[b.id];
              return (
                <div
                  key={b.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
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
                    <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                      <div className="mb-4 flex flex-wrap gap-2">
                        {b.approvalStatus === 'PENDING' && (
                          <>
                            <Button type="button" size="sm" className="rounded-lg bg-sky-600 font-bold text-xs hover:bg-sky-700" disabled={busy}
                              onClick={() => act('Branch approved', () => approveResultBatchBranch(examId, b.id) as Promise<any>)}>
                              <Building2 className="mr-1.5 h-3.5 w-3.5" /> Branch approve
                            </Button>
                            <Button type="button" size="sm" variant="outline" className="rounded-lg border-rose-200 text-rose-700" disabled={busy}
                              onClick={() => act('Rejected', () => rejectResultBatch(examId, b.id) as Promise<any>)}>
                              <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                            </Button>
                            <Button type="button" size="sm" variant="ghost" className="rounded-lg text-slate-600" disabled={busy}
                              onClick={() => { if (confirm('Delete this pending batch?')) act('Deleted', () => deleteResultBatch(examId, b.id) as Promise<any>); }}>
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                            </Button>
                          </>
                        )}
                        {b.approvalStatus === 'APPROVED_BY_BRANCH' && (
                          <Button type="button" size="sm" className="rounded-lg bg-emerald-600 font-bold text-xs hover:bg-emerald-700" disabled={busy}
                            onClick={() => act('Central approved', () => approveResultBatchCentral(examId, b.id) as Promise<any>)}>
                            <Shield className="mr-1.5 h-3.5 w-3.5" /> Central approve
                          </Button>
                        )}
                        {b.approvalStatus === 'APPROVED_BY_CENTRAL' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" /> Published to students
                          </span>
                        )}
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
                          {d.results.length > 50 && (
                            <p className="border-t border-slate-100 px-3 py-2 text-center text-[10px] text-slate-400">
                              +{d.results.length - 50} more
                            </p>
                          )}
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
