'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  ClipboardList,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useDashboardSummary } from '@/lib/query/hooks/useDashboardSummary';
import { cn } from '@/lib/utils';

const AdminDashboardCharts = dynamic(
  () => import('@/features/admin/dashboard/AdminDashboardCharts'),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4">
        <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
      </div>
    ),
  },
);

const QUICK_LINKS: {
  href: string;
  title: string;
  description: string;
  icon: typeof LayoutDashboard;
}[] = [
  {
    href: '/admin/reports',
    title: 'Reports & analytics',
    description: 'Financial dashboards, enrollment, transactions, and ledgers.',
    icon: BarChart3,
  },
  {
    href: '/admin/students',
    title: 'Students',
    description: 'Search profiles, enrollments, and academic records.',
    icon: Users,
  },
  {
    href: '/admin/courses',
    title: 'Courses',
    description: 'Programs, batches, and course administration.',
    icon: GraduationCap,
  },
  {
    href: '/admin/exam',
    title: 'Exams',
    description: 'Exam hub, schedules, and results workflows.',
    icon: ClipboardList,
  },
  {
    href: '/admin/books',
    title: 'Books',
    description: 'Inventory, orders, and book sales.',
    icon: BookOpen,
  },
];

function money(value: number) {
  return `৳${Math.round(Number(value || 0)).toLocaleString()}`;
}

function count(value: number) {
  return Math.round(Number(value || 0)).toLocaleString();
}

function monthStart(offset = 0) {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth() + offset, 1)).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  helper,
}: {
  label: string;
  value: string;
  icon: typeof LayoutDashboard;
  color: string;
  bg: string;
  helper?: string;
}) {
  return (
    <Card className="rounded-xl border-slate-200 shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', bg)}>
          <Icon className={cn('h-5 w-5', color)} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-2xl font-black text-slate-900">{value}</p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          {helper ? <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{helper}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

const dashboardParams = {
  from: monthStart(-5),
  to: today(),
  bookFrom: monthStart(0),
  bookTo: today(),
};

export default function AdminHomePage() {
  const { data: dashboard, isLoading, isFetching, error, refetch } = useDashboardSummary(dashboardParams);

  const loading = isLoading || (isFetching && !dashboard);

  const stats = dashboard?.stats ?? null;
  const revenue = dashboard?.revenue.buckets ?? [];
  const revenueTotal = dashboard?.revenue.totalAmount ?? 0;
  const transactionCount = dashboard?.revenue.totalTransactions ?? 0;
  const dueTotals = dashboard?.due.totals ?? { totalPayable: 0, totalPaid: 0, totalDue: 0 };
  const topCourses = dashboard?.enrollments.topCourses ?? [];
  const topDueBranches = dashboard?.due.topBranches ?? [];
  const topBooks = dashboard?.bookSales.topBooks ?? [];
  const activeEnrollments = dashboard?.enrollments.activeCount ?? 0;
  const bookRevenue = dashboard?.bookSales.totals.totalRevenue ?? 0;

  const collectionData = useMemo(
    () =>
      [
        { name: 'Collected', value: dueTotals.totalPaid },
        { name: 'Due', value: dueTotals.totalDue },
      ].filter((row) => row.value > 0),
    [dueTotals.totalDue, dueTotals.totalPaid],
  );

  const collectionRate = dueTotals.totalPayable > 0
    ? Math.round((dueTotals.totalPaid / dueTotals.totalPayable) * 100)
    : 0;

  const errorMessage = error instanceof Error ? error.message : error ? 'Failed to load dashboard data' : null;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            LMS health, revenue, dues, enrollments, and learning operations at a glance.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void refetch()}
          disabled={loading}
          className="w-full gap-2 sm:w-auto"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {errorMessage ? (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students"
          value={loading && !stats ? '...' : count(stats?.students ?? 0)}
          icon={Users}
          color="text-indigo-600"
          bg="bg-indigo-50"
          helper={`${count(activeEnrollments)} course enrollments`}
        />
        <StatCard
          label="Revenue"
          value={loading && !dashboard ? '...' : money(revenueTotal)}
          icon={TrendingUp}
          color="text-emerald-600"
          bg="bg-emerald-50"
          helper={`${count(transactionCount)} transactions, last 6 months`}
        />
        <StatCard
          label="Outstanding Due"
          value={loading && !dashboard ? '...' : money(dueTotals.totalDue)}
          icon={CreditCard}
          color="text-rose-600"
          bg="bg-rose-50"
          helper={`${collectionRate}% collected from invoices`}
        />
        <StatCard
          label="Courses & Content"
          value={loading && !stats ? '...' : `${count(stats?.courses ?? 0)} / ${count(stats?.contents ?? 0)}`}
          icon={BookOpen}
          color="text-amber-600"
          bg="bg-amber-50"
          helper={`${count(stats?.teachers ?? 0)} teachers`}
        />
      </div>

      <AdminDashboardCharts
        loading={loading}
        revenue={revenue}
        dueTotals={dueTotals}
        topCourses={topCourses}
        topDueBranches={topDueBranches}
        collectionData={collectionData}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Book Sales This Month</CardTitle>
            <CardDescription>{money(bookRevenue)} from books and materials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topBooks.length > 0 ? topBooks.map((book) => (
              <div key={book.bookId} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">{book.bookName}</p>
                  <p className="text-xs font-semibold text-slate-400">{count(book.totalQty)} sold · {count(book.totalStock)} in stock</p>
                </div>
                <p className="shrink-0 text-sm font-black text-emerald-700">{money(book.totalRevenue)}</p>
              </div>
            )) : (
              <div className="rounded-lg bg-slate-50 p-5 text-center text-sm font-semibold text-slate-400">
                {loading ? 'Loading book sales…' : 'No book sales this month'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Jump to common admin workflows</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map(({ href, title, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 outline-none transition-colors hover:border-indigo-200 hover:bg-indigo-50/60 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-sm font-black text-slate-900 group-hover:text-indigo-700">
                    {title}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
