'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getBranches, type Branch } from '@/lib/api/branches';
import { getUsers } from '@/lib/api/users';
import { getEnrollments } from '@/lib/api/enrollments';
import { getInvoices } from '@/lib/api/invoices';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import {
  Building2,
  ChevronRight,
  GraduationCap,
  Loader2,
  Presentation,
  RefreshCw,
  Users,
  FileText,
  CreditCard,
  CalendarRange,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Me = { role?: string; branchId?: string; fullName?: string };

export default function BranchDashboardPage() {
  const { toast, toasts, removeToast } = useToast();
  const [me, setMe] = useState<Me | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    enrollments: 0,
    openInvoices: 0,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      setMe(raw ? (JSON.parse(raw) as Me) : null);
    } catch {
      setMe(null);
    }
  }, []);

  const isBranchAdmin = me?.role === 'BRANCH_ADMIN';
  const canPickBranch = me?.role === 'SUPER_ADMIN' || me?.role === 'ACCOUNTS' || me?.role === 'MODERATOR';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingMeta(true);
        const res = await getBranches();
        if (!cancelled && res.success && res.data) setBranches(res.data);
      } catch {
        if (!cancelled) toast({ title: 'Error', description: 'Could not load branches', variant: 'destructive' });
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  useEffect(() => {
    if (!me) return;
    if (isBranchAdmin && me.branchId) {
      setSelectedBranchId(me.branchId);
      return;
    }
    if (canPickBranch && branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
  }, [me, isBranchAdmin, canPickBranch, branches, selectedBranchId]);

  const activeBranch = useMemo(
    () => branches.find((b) => b.id === selectedBranchId),
    [branches, selectedBranchId]
  );

  const loadStats = useCallback(async () => {
    if (!selectedBranchId) return;
    try {
      setLoadingStats(true);
      const [st, te, en, inv] = await Promise.all([
        getUsers({ branchId: selectedBranchId, role: 'STUDENT', status: 'ACTIVE', limit: 1 }),
        getUsers({ branchId: selectedBranchId, role: 'TEACHER', status: 'ACTIVE', limit: 1 }),
        getEnrollments({ branchId: selectedBranchId, status: 'ACTIVE', limit: 1 }),
        getInvoices({ branchId: selectedBranchId, status: 'ISSUED', limit: 1 }),
      ]);
      setStats({
        students: st.pagination?.total ?? st.data?.length ?? 0,
        teachers: te.pagination?.total ?? te.data?.length ?? 0,
        enrollments: en.pagination?.total ?? en.data?.length ?? 0,
        openInvoices: inv.pagination?.total ?? inv.data?.length ?? 0,
      });
    } catch {
      toast({ title: 'Error', description: 'Could not load branch stats', variant: 'destructive' });
    } finally {
      setLoadingStats(false);
    }
  }, [selectedBranchId, toast]);

  useEffect(() => {
    if (selectedBranchId) loadStats();
  }, [selectedBranchId, loadStats]);

  const q = (path: string) => `${path}?branchId=${encodeURIComponent(selectedBranchId)}`;

  if (!me) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-600">
        Sign in to view your branch dashboard.
      </div>
    );
  }

  if (isBranchAdmin && !me.branchId) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-900">
        <p className="font-bold">Your account has no branch assigned. Contact a super admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 text-slate-900">
      <Toaster toasts={toasts} removeToast={removeToast} />

      <div className="rounded-[28px] border border-slate-200 bg-linear-to-br from-sky-50/80 via-white to-indigo-50/50 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-xs font-bold text-sky-900">
              <Building2 className="h-3.5 w-3.5" />
              Branch operations
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Branch dashboard</h1>
            <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
              Snapshot for <strong className="text-slate-900">{activeBranch?.name || 'your branch'}</strong>. Open
              admin modules with this branch pre-selected using the shortcuts below.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {canPickBranch && (
              <div className="min-w-[220px]">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Branch
                </label>
                <Select
                  value={selectedBranchId || undefined}
                  onValueChange={setSelectedBranchId}
                  disabled={loadingMeta}
                >
                  <SelectTrigger className="h-11 rounded-xl font-bold">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-72">
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl"
              onClick={loadStats}
              disabled={loadingStats || !selectedBranchId}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', loadingStats && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {!selectedBranchId ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          {loadingMeta ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : 'Select a branch to continue.'}
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Active students', value: stats.students, icon: Users },
              { label: 'Teachers', value: stats.teachers, icon: Presentation },
              { label: 'Active enrollments', value: stats.enrollments, icon: GraduationCap },
              { label: 'Open invoices', value: stats.openInvoices, icon: CreditCard },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-indigo-600">
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
                <p className="mt-1 text-2xl font-black text-slate-900">
                  {loadingStats ? '—' : card.value}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">Shortcuts</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { href: q('/admin/students'), title: 'Students', desc: 'Roster for this branch', icon: Users },
                { href: q('/admin/teachers'), title: 'Teachers', desc: 'Staff linked to this branch', icon: Presentation },
                { href: q('/admin/enrollments'), title: 'Enrollments', desc: 'Course seats', icon: GraduationCap },
                { href: q('/admin/invoices'), title: 'Invoices', desc: 'Billing', icon: CreditCard },
                { href: '/admin/monthly-billing', title: 'Monthly billing', desc: 'Generate dues (pick branch there)', icon: CalendarRange },
                { href: '/admin', title: 'Full admin home', desc: 'All modules', icon: FileText },
              ].map((item) => (
                <Link
                  key={item.href + item.title}
                  href={item.href}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-indigo-200 hover:bg-white hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-900 group-hover:text-indigo-600">{item.title}</p>
                    <p className="text-xs font-medium text-slate-500">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
