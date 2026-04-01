'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  listResultBatchesOverview,
  approveResultBatchBranch,
  approveResultBatchCentral,
  rejectResultBatch,
  deleteResultBatch,
  type ResultBatchSummary,
} from '@/lib/api/exam-result-batches';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Building2,
  Shield,
  XCircle,
  Trash2,
  RefreshCw,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listResultBatchesOverview({
        queue: true,
        ...(branchScope ? { branchId: branchScope } : {}),
      });
      if (res.success && res.data) setRows(res.data);
    } catch (e: unknown) {
      toast({
        title: 'Load failed',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      });
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

  const run = async (batch: ResultBatchSummary, label: string, fn: () => Promise<any>) => {
    setBusyId(batch.id);
    try {
      const res = await fn();
      if (!res?.success) {
        toast({ title: res?.message || 'Failed', variant: 'destructive' });
        return;
      }
      toast({ title: label, variant: 'success' });
      await load();
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16 pt-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Result approvals</h1>
          <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-500">
            Batches waiting for branch or central approval. Students see marks only after central approval.
            {branchScope ? (
              <span className="mt-2 block font-semibold text-teal-700">
                Branch view: only batches for your branch are listed.
              </span>
            ) : null}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2 rounded-xl border-slate-200 font-bold"
          onClick={() => load()}
          disabled={!scopeReady || loading}
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {!scopeReady || loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
          <ClipboardList className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-lg font-bold text-slate-600">Queue is clear</p>
          <p className="mt-2 text-sm text-slate-400">No batches pending branch or central action.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map((b) => {
            const busy = busyId === b.id;
            return (
              <li
                key={b.id}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100/80"
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
                    {b.approvalStatus === 'PENDING' ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-xl bg-sky-600 font-bold hover:bg-sky-700"
                          disabled={busy}
                          onClick={() =>
                            run(b, 'Branch approved', () => approveResultBatchBranch(b.examId, b.id))
                          }
                        >
                          <Building2 className="mr-2 h-4 w-4" />
                          Branch approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50"
                          disabled={busy}
                          onClick={() => run(b, 'Rejected', () => rejectResultBatch(b.examId, b.id))}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-xl text-slate-600"
                          disabled={busy}
                          onClick={() => {
                            if (confirm('Delete this batch?')) {
                              run(b, 'Deleted', () => deleteResultBatch(b.examId, b.id));
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    ) : null}
                    {b.approvalStatus === 'APPROVED_BY_BRANCH' ? (
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700"
                        disabled={busy}
                        onClick={() =>
                          run(b, 'Central approved', () => approveResultBatchCentral(b.examId, b.id))
                        }
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Central approve
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
