'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarClock,
  CreditCard,
  GraduationCap,
  MessageSquareText,
  ReceiptText,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getDueSummary,
  getEnrollmentReport,
  getRevenueSummary,
  getSystemStats,
  type DueSummaryResponse,
  type EnrollmentReportData,
  type RevenueSummaryResponse,
  type SystemStatsData,
} from '@/lib/api/reports';
import { getBatches } from '@/lib/api/batches';
import { getEnrollments, type Enrollment } from '@/lib/api/enrollments';
import { getAllTestimonials } from '@/lib/api/testimonials';

type EnrollmentWithRegistration = Enrollment & {
  student?: Enrollment['student'] & {
    studentProfile?: { registrationNumber?: string | null };
    registrationNumber?: string | null;
  };
};

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const money = (val: number | null | undefined) =>
  val == null
    ? '—'
    : new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        maximumFractionDigits: 0,
      }).format(Number(val));

const number = (val: number | null | undefined) =>
  val == null ? '—' : Number(val).toLocaleString('en-US');

function formatTimeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (Number.isNaN(minutes)) return '—';
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<SystemStatsData | null>(null);
  const [revenue, setRevenue] = useState<RevenueSummaryResponse | null>(null);
  const [dues, setDues] = useState<DueSummaryResponse | null>(null);
  const [activeBatches, setActiveBatches] = useState<number | null>(null);
  const [pendingReviews, setPendingReviews] = useState<number | null>(null);
  const [recentEnrollments, setRecentEnrollments] = useState<EnrollmentWithRegistration[]>([]);
  const [popularity, setPopularity] = useState<EnrollmentReportData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw) as { role?: string };
        if (u.role === 'BRANCH_ADMIN') router.replace('/admin/branch');
      }
    } catch {
      /* ignore */
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const month = currentMonth();
        const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('auth_token'));
        const [statsRes, revRes, dueRes, batchRes, enrollRes, enrollReportRes, testiRes] = await Promise.all([
          getSystemStats(),
          getRevenueSummary({ period: 'monthly' }),
          getDueSummary({ month }),
          hasToken ? getBatches({ status: 'ACTIVE', limit: 1 }) : Promise.resolve({ data: [], pagination: undefined }),
          getEnrollments({ page: 1, limit: 6 }),
          getEnrollmentReport(),
          getAllTestimonials({ approved: false }),
        ]);
        if (cancelled) return;

        setStats(statsRes.data || null);
        setRevenue(revRes.success ? revRes : null);
        setDues(dueRes.success ? dueRes : null);
        setActiveBatches(batchRes.pagination?.total ?? batchRes.data?.length ?? null);
        setRecentEnrollments((enrollRes.data ?? []) as EnrollmentWithRegistration[]);
        setPopularity(enrollReportRes.data ?? []);
        setPendingReviews(testiRes.success ? (testiRes.data?.length ?? 0) : 0);
      } catch {
        if (!cancelled) {
          setStats(null);
          setRevenue(null);
          setDues(null);
          setActiveBatches(null);
          setRecentEnrollments([]);
          setPopularity([]);
          setPendingReviews(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = useMemo(() => [
    {
      label: 'Total Students',
      value: number(stats?.students),
      meta: 'All registered students',
      href: '/admin/students',
      icon: Users,
      tone: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Monthly Income',
      value: money(revenue?.totals.totalAmount),
      meta: revenue ? `${number(revenue.totals.totalTransactions)} transaction(s)` : 'Current collection',
      href: '/admin/reports',
      icon: Wallet,
      tone: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Outstanding Due',
      value: money(dues?.totals.totalDue),
      meta: `${currentMonth()} invoice dues`,
      href: '/admin/monthly-billing',
      icon: ReceiptText,
      tone: 'bg-rose-50 text-rose-600',
    },
    {
      label: 'Active Batches',
      value: number(activeBatches),
      meta: 'Running batches',
      href: '/admin/batches',
      icon: CalendarClock,
      tone: 'bg-amber-50 text-amber-600',
    },
  ], [activeBatches, dues, revenue, stats]);

  const secondaryMetrics = [
    { label: 'Active Teachers', value: number(stats?.teachers), href: '/admin/teachers' },
    { label: 'Active Courses', value: number(stats?.courses), href: '/admin/courses' },
    { label: 'Pending Reviews', value: number(pendingReviews), href: '/admin/testimonials' },
    { label: 'Recent Enrollments', value: number(recentEnrollments.length), href: '/admin/students' },
  ];

  const incomeBars = useMemo(() => {
    const series = revenue?.data ?? [];
    const max = Math.max(...series.map((s) => s.amount), 1);
    return series.slice(-12).map((bucket) => ({
      label: bucket.bucket,
      value: bucket.amount,
      height: `${Math.max(6, (bucket.amount / max) * 100)}%`,
    }));
  }, [revenue]);

  const popularCourses = useMemo(() => {
    const list = [...popularity].sort((a, b) => b.enrollmentCount - a.enrollmentCount).slice(0, 6);
    const max = Math.max(...list.map((c) => c.enrollmentCount), 1);
    return { list, max };
  }, [popularity]);

  const quickActions = [
    { label: 'New Course', href: '/admin/courses', icon: BookOpen, tone: 'bg-indigo-50 text-indigo-600' },
    { label: 'Student Registration', href: '/admin/students', icon: Users, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'New Exam', href: '/admin/exam/new', icon: GraduationCap, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Monthly Billing', href: '/admin/monthly-billing', icon: CreditCard, tone: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div className="space-y-6 pb-10 text-slate-900">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Overview</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Admin dashboard</h1>
        </div>
        <Link
          href="/admin/reports"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:border-indigo-200 hover:text-indigo-600"
        >
          View reports <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/60"
            >
              <div className="flex items-start justify-between gap-4">
                <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', kpi.tone)}>
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500" />
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-widest text-slate-400">{kpi.label}</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{loading ? '—' : kpi.value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{kpi.meta}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {secondaryMetrics.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
          >
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-1 text-xl font-black text-slate-900">{loading ? '—' : item.value}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
                Real collections
              </div>
              <h2 className="mt-2 text-lg font-black text-slate-950">Monthly income trend</h2>
              <p className="text-sm font-medium text-slate-500">Last available monthly payment buckets.</p>
            </div>
            <p className="text-sm font-black text-emerald-600">{money(revenue?.totals.totalAmount)}</p>
          </div>

          <div className="mt-6 h-64">
            {incomeBars.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm font-semibold text-slate-400">
                No revenue data yet.
              </div>
            ) : (
              <div className="flex h-full items-end gap-2">
                {incomeBars.map((bar) => (
                  <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-emerald-200 to-emerald-500"
                      style={{ height: bar.height }}
                      title={`${bar.label}: ${money(bar.value)}`}
                    />
                    <span className="w-full truncate text-center text-[10px] font-bold text-slate-400">{bar.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">Recent enrollments</h2>
              <p className="text-sm font-medium text-slate-500">Latest admission activity.</p>
            </div>
            <MessageSquareText className="h-5 w-5 text-slate-300" />
          </div>

          <div className="mt-5 space-y-3">
            {recentEnrollments.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-400">
                No recent enrollments yet.
              </p>
            ) : (
              recentEnrollments.map((enroll) => {
                const regNo = enroll.student?.studentProfile?.registrationNumber ?? enroll.student?.registrationNumber;
                const content = (
                  <div className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:border-indigo-100 hover:bg-indigo-50/40">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-black text-indigo-600">
                      {enroll.student?.fullName?.slice(0, 2).toUpperCase() || 'ST'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-800">{enroll.student?.fullName || 'Student'}</p>
                      <p className="truncate text-xs font-semibold text-indigo-600">{enroll.program?.name || 'Program'}</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{formatTimeAgo(enroll.createdAt)}</p>
                    </div>
                    {regNo && <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500" />}
                  </div>
                );

                return regNo ? (
                  <Link key={enroll.id} href={`/admin/students/${regNo}`}>
                    {content}
                  </Link>
                ) : (
                  <div key={enroll.id}>{content}</div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">Top courses by enrollment</h2>
              <p className="text-sm font-medium text-slate-500">Real enrollment count from the reports endpoint.</p>
            </div>
            <BarChart3 className="h-5 w-5 text-indigo-500" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {popularCourses.list.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-400 sm:col-span-2">
                No enrollment data yet.
              </p>
            ) : (
              popularCourses.list.map((course) => (
                <div key={course.courseId} className="rounded-xl border border-slate-100 bg-slate-50/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">{course.courseName}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{course.programName}</p>
                    </div>
                    <span className="shrink-0 text-xs font-black text-emerald-600">{course.enrollmentCount} students</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${Math.min(100, (course.enrollmentCount / popularCourses.max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Quick actions</h2>
          <p className="text-sm font-medium text-slate-500">Jump to common admin workflows.</p>
          <div className="mt-5 grid gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:border-indigo-100 hover:bg-white"
                >
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', action.tone)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-black text-slate-700">{action.label}</span>
                  <ArrowRight className="ml-auto h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
