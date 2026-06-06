import { Activity, RefreshCw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AuditHeader({
  total,
  page,
  pages,
  loading,
  onRefresh,
}: {
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-800 bg-slate-900 px-3 py-3 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Super Admin · Security Log
              </p>
              <h1 className="text-lg font-black tracking-tight text-white sm:text-xl">Audit History</h1>
              <p className="truncate text-[11px] font-medium text-slate-400">
                Course, CMS, enrollment, login &amp; admin actions
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 shrink-0 gap-1.5 rounded-lg border-slate-600 bg-slate-800 px-2.5 text-xs font-bold text-white hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-slate-100">
        <div className="px-3 py-2.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total records</p>
          <p className="mt-0.5 text-lg font-black tabular-nums text-slate-900">{total.toLocaleString()}</p>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current page</p>
          <p className="mt-0.5 text-lg font-black tabular-nums text-indigo-700">
            {page}
            <span className="text-sm font-bold text-slate-400"> / {pages}</span>
          </p>
        </div>
        <div className="px-3 py-2.5">
          <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Activity className="h-3 w-3" />
            Status
          </p>
          <p className="mt-0.5 text-sm font-black text-emerald-700">
            {loading ? 'Syncing…' : 'Live'}
          </p>
        </div>
      </div>
    </section>
  );
}
