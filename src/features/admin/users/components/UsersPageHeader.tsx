import { Activity, Filter, Plus, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROLE_LABELS } from '../users-constants';

type UsersPageHeaderProps = {
  loading: boolean;
  summaryLoading: boolean;
  roleSummaryTotal: number;
  statusFilter: string;
  roleTab: string;
  onRefresh: () => void;
  onAddUser: () => void;
};

export function UsersPageHeader({
  loading,
  summaryLoading,
  roleSummaryTotal,
  statusFilter,
  roleTab,
  onRefresh,
  onAddUser,
}: UsersPageHeaderProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-600">Access Control</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              User Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
              Manage admin staff, teachers, branch operators, accounts access, and moderator permissions.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className="h-10 gap-2 rounded-xl border-slate-200 bg-white font-bold"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            onClick={onAddUser}
            className="h-10 gap-2 rounded-xl bg-sky-700 text-white hover:bg-sky-800 hover:text-white focus-visible:text-white"
          >
            <Plus className="h-4 w-4" />
            Add user
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-700" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Staff Users</span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {summaryLoading ? '…' : roleSummaryTotal}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-700" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Active Filter</span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-900">{statusFilter || 'ALL'}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-amber-700" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Current View</span>
          </div>
          <p className="mt-2 truncate text-2xl font-black text-amber-950">
            {roleTab === 'ALL' ? 'All Roles' : ROLE_LABELS[roleTab]}
          </p>
        </div>
      </div>
    </section>
  );
}
