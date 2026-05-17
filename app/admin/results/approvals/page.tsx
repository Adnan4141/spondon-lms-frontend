'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  listResultBatchesOverview,
  approveResultBatchBranch,
  approveResultBatchCentral,
  rejectResultBatch,
  deleteResultBatch,
  getExamResultBatchDetail,
  type ResultBatchSummary,
} from '@/lib/api/exam-result-batches';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { confirmAction } from '@/features/admin/shared/confirm-action';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Building2,
  Shield,
  XCircle,
  Trash2,
  RefreshCw,
  ClipboardList,
  Search,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED_BY_BRANCH' | 'APPROVED_BY_CENTRAL' | 'REJECTED';

function branchScopeFromStorage(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    if (u?.role === 'BRANCH_ADMIN' && typeof u.branchId === 'string' && u.branchId) {
      return u.branchId;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

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

export default function ResultApprovalsPage() {
  const { toast } = useToast();
  const [branchScope, setBranchScope] = useState<string | undefined>(undefined);
  const [scopeReady, setScopeReady] = useState(false);
  const [rows, setRows] = useState<ResultBatchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, { results?: Array<Record<string, unknown>> }>>({});
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listResultBatchesOverview({
        ...(branchScope ? { branchId: branchScope } : {}),
      });
      if (res.success && res.data) setRows(res.data);
    } catch (e: unknown) {
      toast({ title: 'Load failed', description: e instanceof Error ? e.message : 'Error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, branchScope]);

  useEffect(() => {
    setBranchScope(branchScopeFromStorage());
    setScopeReady(true);
  }, []);

  useEffect(() => {
    if (!scopeReady) return;
    load();
  }, [scopeReady, load]);

  const counts = useMemo(() => {
    const c = { PENDING: 0, APPROVED_BY_BRANCH: 0, APPROVED_BY_CENTRAL: 0, REJECTED: 0 };
    rows.forEach(r => { if (r.approvalStatus in c) c[r.approvalStatus as keyof typeof c]++; });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (statusFilter !== 'ALL') list = list.filter(r => r.approvalStatus === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        (r.exam?.title ?? '').toLowerCase().includes(q) ||
        (r.uploaderUser?.fullName ?? '').toLowerCase().includes(q) ||
        (r.branch?.name ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [rows, statusFilter, search]);

  const toggleExpand = async (b: ResultBatchSummary) => {
    if (expandedId === b.id) { setExpandedId(null); return; }
    setExpandedId(b.id);
    if (!detail[b.id]) {
      const res = await getExamResultBatchDetail(b.examId, b.id);
      if (res.success && res.data) setDetail(d => ({ ...d, [b.id]: res.data }));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const run = async (batch: ResultBatchSummary, label: string, fn: () => Promise<any>) => {
    setBusyId(batch.id);
    try {
      const res = await fn();
      if (!res?.success) { toast({ title: (res?.message as string) || 'Failed', variant: 'destructive' }); return; }
      toast({ title: label, variant: 'success' });
      await load();
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const filterTabs: { id: StatusFilter; label: string; count?: number }[] = [
    { id: 'ALL', label: 'All', count: rows.length },
    { id: 'PENDING', label: 'Pending', count: counts.PENDING },
    { id: 'APPROVED_BY_BRANCH', label: 'Branch OK', count: counts.APPROVED_BY_BRANCH },
    { id: 'APPROVED_BY_CENTRAL', label: 'Published', count: counts.APPROVED_BY_CENTRAL },
    { id: 'REJECTED', label: 'Rejected', count: counts.REJECTED },
  ];

  return (
    <div className="mx-auto max-w-full space-y-8 pb-16 pt-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Result approvals</h1>
          <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-500">
            Review and approve result batches. Students see marks only after central approval.
            {branchScope ? (
              <span className="mt-2 block font-semibold text-blue-700">
                Branch view: only your branch batches are shown.
              </span>
            ) : null}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 gap-2 rounded-xl border-slate-200 font-bold text-xs"
          onClick={() => load()}
          disabled={!scopeReady || loading}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Summary stats */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Pending</span>
            </div>
            <p className="mt-1 text-2xl font-black text-amber-900 tabular-nums">{counts.PENDING}</p>
          </div>
          <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-sky-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-700">Branch OK</span>
            </div>
            <p className="mt-1 text-2xl font-black text-sky-900 tabular-nums">{counts.APPROVED_BY_BRANCH}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Published</span>
            </div>
            <p className="mt-1 text-2xl font-black text-emerald-900 tabular-nums">{counts.APPROVED_BY_CENTRAL}</p>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-rose-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-700">Rejected</span>
            </div>
            <p className="mt-1 text-2xl font-black text-rose-900 tabular-nums">{counts.REJECTED}</p>
          </div>
        </div>
      )}

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1 w-fit">
          {filterTabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setStatusFilter(t.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                statusFilter === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {t.label}
              {(t.count ?? 0) > 0 && (
                <span className="min-w-5 rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-black tabular-nums">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            className="h-9 w-full sm:w-56 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Search exam, uploader, branch..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      {!scopeReady || loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
          <ClipboardList className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-lg font-bold text-slate-600">
            {rows.length === 0 ? 'Queue is clear' : 'No batches match your filters'}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {rows.length === 0 ? 'No batches pending branch or central action.' : 'Try adjusting the status filter or search.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((b) => {
            const busy = busyId === b.id;
            const isOpen = expandedId === b.id;
            const d = detail[b.id];
            const note = noteMap[b.id] ?? '';
            return (
              <li
                key={b.id}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] font-black uppercase tracking-wide', statusStyle(b.approvalStatus))}
                      >
                        {b.approvalStatus.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {b.inputMode.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">{b.exam?.title ?? b.examId}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                      <span>Branch: {b.branch?.name ?? b.branchId}</span>
                      <span>{b.totalRecords} records</span>
                      <span>{new Date(b.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-400">Uploaded by {b.uploaderUser?.fullName ?? '—'}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:shrink-0 sm:flex-col sm:items-stretch">
                    {b.approvalStatus === 'PENDING' && (
                      <>
                        <Button type="button" size="sm" className="rounded-xl bg-sky-600 font-bold hover:bg-sky-700 text-white" disabled={busy}
                          onClick={() => run(b, 'Branch approved', () => approveResultBatchBranch(b.examId, b.id))}>
                          <Building2 className="mr-2 h-4 w-4" /> Branch approve
                        </Button>
                        <Button type="button" size="sm" variant="outline" className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50" disabled={busy}
                          onClick={() => run(b, 'Rejected', () => rejectResultBatch(b.examId, b.id, note || undefined))}>
                          <XCircle className="mr-2 h-4 w-4" /> Reject
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="rounded-xl text-slate-600" disabled={busy}
                          onClick={async () => {
                            if (!(await confirmAction({
                              title: 'Delete result batch?',
                              description: 'Delete this batch? This action cannot be undone.',
                              confirmLabel: 'Delete batch',
                              variant: 'danger',
                            }))) {
                              return;
                            }
                            run(b, 'Deleted', () => deleteResultBatch(b.examId, b.id));
                          }}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </>
                    )}
                    {b.approvalStatus === 'APPROVED_BY_BRANCH' && (
                      <>
                        <Button type="button" size="sm" className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700 text-white" disabled={busy}
                          onClick={() => run(b, 'Central approved', () => approveResultBatchCentral(b.examId, b.id, note || undefined))}>
                          <Shield className="mr-2 h-4 w-4" /> Central approve
                        </Button>
                        <Button type="button" size="sm" variant="outline" className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50" disabled={busy}
                          onClick={() => run(b, 'Rejected', () => rejectResultBatch(b.examId, b.id, note || undefined))}>
                          <XCircle className="mr-2 h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}
                    {b.approvalStatus === 'APPROVED_BY_CENTRAL' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" /> Published
                      </span>
                    )}
                    {b.approvalStatus === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
                        <XCircle className="h-4 w-4" /> Rejected
                        {b.approvalNotes && <span className="ml-1 font-normal text-rose-500">({b.approvalNotes})</span>}
                      </span>
                    )}
                  </div>
                </div>

                {/* Notes input for pending/branch-approved */}
                {(b.approvalStatus === 'PENDING' || b.approvalStatus === 'APPROVED_BY_BRANCH') && (
                  <div className="border-t border-slate-50 px-5 py-3 bg-slate-50/30">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <input
                        className="h-8 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Approval / rejection notes (optional)..."
                        value={note}
                        onChange={e => setNoteMap(m => ({ ...m, [b.id]: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {/* Expandable detail */}
                <div className="border-t border-slate-100">
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-1 py-2 text-xs font-bold text-slate-400 hover:text-slate-600"
                    onClick={() => toggleExpand(b)}
                  >
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {isOpen ? 'Hide' : 'Show'} records
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4">
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
                              {d.results.slice(0, 50).map((r: Record<string, unknown>) => (
                                <tr key={String(r.id)}>
                                  <td className="px-3 py-2 font-medium">{String((r.student as Record<string, unknown>)?.fullName ?? '')}</td>
                                  <td className="px-3 py-2">{String(r.rollNo ?? '')}</td>
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
                        <p className="text-xs text-slate-500">Loading records…</p>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
