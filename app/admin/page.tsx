'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
import {
  getBookSalesReport,
  getDueSummary,
  getEnrollmentReport,
  getRevenueSummary,
  getSystemStats,
  type BookSalesRow,
  type DueSummaryRow,
  type EnrollmentReportData,
  type RevenueSummaryData,
  type SystemStatsData,
} from '@/lib/api/reports';
import { cn } from '@/lib/utils';

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

const chartColors = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

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

export default function AdminHomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SystemStatsData | null>(null);
  const [revenue, setRevenue] = useState<RevenueSummaryData[]>([]);
  const [revenueTotal, setRevenueTotal] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [dueRows, setDueRows] = useState<DueSummaryRow[]>([]);
  const [dueTotals, setDueTotals] = useState({ totalPayable: 0, totalPaid: 0, totalDue: 0 });
  const [enrollments, setEnrollments] = useState<EnrollmentReportData[]>([]);
  const [bookSales, setBookSales] = useState<BookSalesRow[]>([]);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, revenueRes, dueRes, enrollmentRes, bookRes] = await Promise.all([
        getSystemStats(),
        getRevenueSummary({ period: 'monthly', from: monthStart(-5), to: today() }),
        getDueSummary(),
        getEnrollmentReport(),
        getBookSalesReport({ from: monthStart(0), to: today() }),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (revenueRes.success) {
        setRevenue(revenueRes.data ?? []);
        setRevenueTotal(Number(revenueRes.totals?.totalAmount ?? 0));
        setTransactionCount(Number(revenueRes.totals?.totalTransactions ?? 0));
      }
      if (dueRes.success) {
        setDueRows(dueRes.data ?? []);
        setDueTotals(dueRes.totals ?? { totalPayable: 0, totalPaid: 0, totalDue: 0 });
      }
      if (enrollmentRes.success) setEnrollments(enrollmentRes.data ?? []);
      if (bookRes.success) setBookSales(bookRes.data ?? []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const topCourses = useMemo(
    () => [...enrollments].sort((a, b) => b.enrollmentCount - a.enrollmentCount).slice(0, 6),
    [enrollments],
  );

  const topDueBranches = useMemo(
    () => [...dueRows].sort((a, b) => b.totalDue - a.totalDue).slice(0, 5),
    [dueRows],
  );

  const topBooks = useMemo(
    () => [...bookSales].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5),
    [bookSales],
  );

  const collectionData = [
    { name: 'Collected', value: dueTotals.totalPaid },
    { name: 'Due', value: dueTotals.totalDue },
  ].filter((row) => row.value > 0);

  const activeEnrollments = enrollments.reduce((sum, row) => sum + row.enrollmentCount, 0);
  const bookRevenue = bookSales.reduce((sum, row) => sum + row.totalRevenue, 0);
  const collectionRate = dueTotals.totalPayable > 0
    ? Math.round((dueTotals.totalPaid / dueTotals.totalPayable) * 100)
    : 0;

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
          onClick={loadDashboard}
          disabled={loading}
          className="w-full gap-2 sm:w-auto"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
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
          value={loading && revenue.length === 0 ? '...' : money(revenueTotal)}
          icon={TrendingUp}
          color="text-emerald-600"
          bg="bg-emerald-50"
          helper={`${count(transactionCount)} transactions, last 6 months`}
        />
        <StatCard
          label="Outstanding Due"
          value={money(dueTotals.totalDue)}
          icon={CreditCard}
          color="text-rose-600"
          bg="bg-rose-50"
          helper={`${collectionRate}% collected from invoices`}
        />
        <StatCard
          label="Courses & Content"
          value={`${count(stats?.courses ?? 0)} / ${count(stats?.contents ?? 0)}`}
          icon={BookOpen}
          color="text-amber-600"
          bg="bg-amber-50"
          helper={`${count(stats?.teachers ?? 0)} teachers`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue Trend</CardTitle>
            <CardDescription>Actual collected payments by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {revenue.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenue} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value: number) => money(value)} />
                    <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} fill="url(#revenueFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg bg-slate-50 text-sm font-semibold text-slate-400">
                  {loading ? 'Loading revenue...' : 'No revenue data yet'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Collection Health</CardTitle>
            <CardDescription>Collected vs outstanding invoice amount</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-[180px_1fr] xl:grid-cols-1 2xl:grid-cols-[180px_1fr]">
              <div className="h-48">
                {collectionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={collectionData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3}>
                        {collectionData.map((_, index) => (
                          <Cell key={index} fill={index === 0 ? '#059669' : '#dc2626'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => money(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-lg bg-slate-50 text-sm font-semibold text-slate-400">
                    No invoice totals
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Payable', value: dueTotals.totalPayable, color: 'text-slate-900' },
                  { label: 'Collected', value: dueTotals.totalPaid, color: 'text-emerald-700' },
                  { label: 'Due', value: dueTotals.totalDue, color: 'text-rose-700' },
                ].map((row) => (
                  <div key={row.label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{row.label}</p>
                    <p className={cn('text-lg font-black', row.color)}>{money(row.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-xl border-slate-200 shadow-sm xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Enrolled Courses</CardTitle>
            <CardDescription>Course demand by active enrollment count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {topCourses.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCourses} layout="vertical" margin={{ top: 4, right: 18, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="courseName"
                      width={140}
                      tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip formatter={(value: number) => count(value)} />
                    <Bar dataKey="enrollmentCount" radius={[0, 8, 8, 0]}>
                      {topCourses.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg bg-slate-50 text-sm font-semibold text-slate-400">
                  {loading ? 'Loading enrollments...' : 'No enrollment data yet'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Branch Dues</CardTitle>
            <CardDescription>Branches with highest outstanding amount</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topDueBranches.length > 0 ? topDueBranches.map((row, index) => {
              const pct = dueTotals.totalDue > 0 ? Math.min(100, Math.round((row.totalDue / dueTotals.totalDue) * 100)) : 0;
              return (
                <div key={row.branchId} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-bold text-slate-800">{row.branchName}</p>
                    <p className="shrink-0 text-sm font-black text-rose-700">{money(row.totalDue)}</p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: chartColors[index % chartColors.length] }} />
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-lg bg-slate-50 p-5 text-center text-sm font-semibold text-slate-400">
                No branch due data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                No book sales this month
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
