'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
   ArrowUpRight,
   BookOpen,
   GraduationCap,
   Users,
   TrendingUp,
   Wallet,
   Plus,
   ArrowRight,
   MoreVertical,
   Activity,
   Target,
   Settings,
   BarChart3,
   CalendarRange,
   Presentation,
   Building2,
   MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUsers } from '@/lib/api/users';
import { getCourses } from '@/lib/api/courses';
import { getSystemStats, getRevenueSummary, getEnrollmentReport, type SystemStatsData, type RevenueSummaryResponse, type EnrollmentReportData } from '@/lib/api/reports';
import { getBatches } from '@/lib/api/batches';
import { getEnrollments, type Enrollment } from '@/lib/api/enrollments';
import { getAllTestimonials } from '@/lib/api/testimonials';

export default function AdminDashboard() {
   const router = useRouter();
   const [pendingReviews, setPendingReviews] = useState<number | null>(null);
   const [teacherTotal, setTeacherTotal] = useState<number | null>(null);
   const [monthlyCourseTotal, setMonthlyCourseTotal] = useState<number | null>(null);
   const [stats, setStats] = useState<SystemStatsData | null>(null);
   const [revenue, setRevenue] = useState<RevenueSummaryResponse | null>(null);
   const [activeBatches, setActiveBatches] = useState<number | null>(null);
   const [recentEnrollments, setRecentEnrollments] = useState<Enrollment[]>([]);
   const [popularity, setPopularity] = useState<EnrollmentReportData[]>([]);

   useEffect(() => {
      try {
         const raw = localStorage.getItem('user');
         if (raw) {
            const u = JSON.parse(raw) as { role?: string };
            if (u.role === 'BRANCH_ADMIN') {
               router.replace('/admin/branch');
            }
         }
      } catch {
         /* ignore */
      }
   }, [router]);

   useEffect(() => {
      let cancelled = false;
      (async () => {
         try {
            const [tRes, cRes, statsRes, revRes, batchRes, enrollRes, enrollReportRes, testiRes] = await Promise.all([
               getUsers({ role: 'TEACHER', status: 'ACTIVE', limit: 1 }),
               getCourses({ status: 'ACTIVE', limit: 1 }),
               getSystemStats(),
               getRevenueSummary({ period: 'monthly' }),
               getBatches({ status: 'ACTIVE', limit: 1 }),
               getEnrollments({ page: 1, limit: 6 }),
               getEnrollmentReport(),
               getAllTestimonials({ approved: false }),
            ]);
            if (cancelled) return;
            setPendingReviews(testiRes.success ? (testiRes.data?.length ?? 0) : 0);
            setTeacherTotal(tRes.pagination?.total ?? (tRes.data?.length ?? 0));
            setMonthlyCourseTotal(cRes.pagination?.total ?? (cRes.data?.length ?? 0));
            setStats(statsRes.data || null);
            setRevenue(revRes);
            setActiveBatches(batchRes.pagination?.total ?? batchRes.data?.length ?? null);
            setRecentEnrollments(enrollRes.data ?? []);
            setPopularity(enrollReportRes.data ?? []);
         } catch {
            if (!cancelled) {
               setStats(null);
               setRevenue(null);
               setActiveBatches(null);
               setRecentEnrollments([]);
               setPopularity([]);
               setPendingReviews(null);
            }
         }
      })();
      return () => {
         cancelled = true;
      };
   }, []);

   const kpis = useMemo(() => {
      const formatNumber = (val: number | null | undefined) =>
         val == null ? '—' : Number(val).toLocaleString('en-US');
      const formatCurrency = (val: number | null | undefined) =>
         val == null
            ? '—'
            : new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(Number(val));

      type KpiTrend = 'up' | 'down';

      return [
         {
            label: 'Total Students',
            value: formatNumber(stats?.students),
            change: 'live',
            trend: 'up' satisfies KpiTrend,
            icon: Users,
            gradient: 'from-indigo-600 to-violet-600',
         },
         {
            label: 'Monthly Income',
            value: formatCurrency(revenue?.totals.totalAmount),
            change: revenue ? `${revenue.totals.totalTransactions} tx` : '—',
            trend: 'up' satisfies KpiTrend,
            icon: Wallet,
            gradient: 'from-emerald-500 to-teal-600',
         },
         {
            label: 'Active Teachers',
            value: formatNumber(stats?.teachers),
            change: '',
            trend: 'up' satisfies KpiTrend,
            icon: Activity,
            gradient: 'from-rose-500 to-pink-600',
         },
         {
            label: 'Active Batches',
            value: formatNumber(activeBatches),
            change: '',
            trend: 'up' satisfies KpiTrend,
            icon: Target,
            gradient: 'from-amber-500 to-orange-600',
         },
      ];
   }, [stats, revenue, activeBatches]);

   const incomeBars = useMemo(() => {
      const series = revenue?.data ?? [];
      const max = Math.max(...series.map((s) => s.amount), 1);
      return series.map((bucket) => ({
         label: bucket.bucket,
         value: bucket.amount,
         height: `${Math.max(6, (bucket.amount / max) * 100)}%`,
      }));
   }, [revenue]);

   const popularCourses = useMemo(() => {
      const list = [...(popularity || [])].sort((a, b) => b.enrollmentCount - a.enrollmentCount).slice(0, 4);
      const max = Math.max(...list.map((c) => c.enrollmentCount), 1);
      return { list, max };
   }, [popularity]);

   const formatTimeAgo = (dateStr: string) => {
      const d = new Date(dateStr);
      const diff = Date.now() - d.getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return 'just now';
      if (minutes < 60) return `${minutes} min ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} h ago`;
      const days = Math.floor(hours / 24);
      return `${days} d ago`;
   };

   return (
      <div className="space-y-10 pb-10 text-slate-900">

    
         {/* KPI Section */}
         <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => {
               const Icon = kpi.icon;
               return (
                  <div
                     key={kpi.label}
                     className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] border border-slate-100 bg-white p-7 shadow-xl shadow-slate-200/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-indigo-100"
                  >
                     <div className="flex items-center justify-between">
                        <div className={cn(
                           "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform group-hover:scale-110",
                           kpi.gradient
                        )}>
                           <Icon className="h-6 w-6" />
                        </div>
                        <div className={cn(
                           "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest",
                           kpi.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        )}>
                           {kpi.change}
                           <TrendingUp className={cn("h-3 w-3", kpi.trend === 'down' && 'rotate-180')} />
                        </div>
                     </div>

                     <div className="mt-8">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{kpi.label}</p>
                        <h3 className="mt-1 text-3xl font-black text-slate-900">{kpi.value}</h3>
                     </div>

                     <div className="mt-6 flex items-end gap-1 h-8 opacity-20 group-hover:opacity-40 transition-opacity">
                        {[40, 70, 45, 90, 65, 80, 50, 100].map((h, i) => (
                           <div key={i} className={cn("flex-1 rounded-t-sm", kpi.trend === 'up' ? 'bg-indigo-500' : 'bg-rose-500')} style={{ height: `${h}%` }} />
                        ))}
                     </div>
                  </div>
               );
            })}
         </section>

         {/* Main Insights Grid */}
         <section className="grid gap-8 xl:grid-cols-3">
            {/* Performance Chart Card */}
            <div className="xl:col-span-2 rounded-[40px] border border-slate-100 bg-white p-8 lg:p-10 shadow-xl shadow-slate-200/40 overflow-hidden">
               <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                  <div>
                     <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">
                        <TrendingUp className="h-3 w-3" />
                        Income Performance
                     </div>
                     <h2 className="text-2xl font-black tracking-tight text-slate-900">Institutional Income</h2>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-1.5 border border-slate-100">
                     <button className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-white">Financial Year</button>
                     <button className="rounded-xl px-4 py-2 text-sm font-bold text-slate-400 transition hover:text-slate-600">Quarterly</button>
                  </div>
               </div>

               {/* Dynamic mini bar chart */}
               <div className="relative h-72 w-full mt-8">
                  <div className="absolute inset-0 flex items-end gap-3 px-2">
                     {incomeBars.length === 0 ? (
                        <div className="text-sm font-medium text-slate-400">No revenue data yet</div>
                     ) : (
                        incomeBars.map((bar) => (
                           <div key={bar.label} className="flex-1 flex flex-col items-center gap-2">
                              <div
                                 className="w-full rounded-xl bg-gradient-to-t from-indigo-200 to-indigo-500 shadow-sm"
                                 style={{ height: bar.height }}
                                 title={`${bar.label}: ${bar.value.toLocaleString('en-US')}`}
                              />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                 {bar.label}
                              </span>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>

            {/* Real-time Activity Log */}
            <div className="rounded-[40px] border border-slate-100 bg-white p-8 lg:p-10 shadow-xl shadow-slate-200/40">
               <div className="flex items-center justify-between mb-10">
                  <div className="space-y-1">
                     <h2 className="text-xl font-black tracking-tight text-slate-900">Activity List</h2>
                     <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live System Feed
                     </p>
                  </div>
                  <button className="p-2 rounded-xl hover:bg-slate-50 transition-colors">
                     <MoreVertical className="h-5 w-5 text-slate-400" />
                  </button>
               </div>

               <div className="space-y-8">
                  {recentEnrollments.length === 0 ? (
                     <p className="text-sm font-medium text-slate-400">No recent enrollments yet.</p>
                  ) : (
                     recentEnrollments.map((enroll) => (
                        <div key={enroll.id} className="group flex items-start gap-4 cursor-pointer">
                           <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black shadow-sm bg-indigo-50 text-indigo-600 transition-all group-hover:scale-110 group-hover:rotate-3">
                              {enroll.student?.fullName?.slice(0, 2).toUpperCase() || 'ST'}
                           </div>
                           <div className="flex-1 min-w-0 border-b border-slate-50 pb-5 group-last:border-0">
                              <p className="text-base font-bold text-slate-800 leading-tight">
                                 {enroll.student?.fullName || 'Student'} <span className="font-medium text-slate-400">enrolled</span>
                              </p>
                              <p className="text-base font-black text-indigo-600 truncate mt-0.5">{enroll.program?.name || 'Program'}</p>
                              <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                 {formatTimeAgo(enroll.createdAt)}
                              </p>
                           </div>
                           <ArrowRight className="h-4 w-4 text-slate-300 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                        </div>
                     ))
                  )}
               </div>

               <button className="mt-6 w-full h-14 rounded-2xl bg-slate-50 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 transition-all hover:bg-slate-900 hover:text-white shadow-inner">
                  Audit Information
               </button>
            </div>
         </section>

         {/* Second Analytics Row */}
         <section className="grid gap-8 xl:grid-cols-3">
            {/* Distribution Chart */}
            <div className="rounded-[40px] border border-slate-100 bg-white p-8 lg:p-10 shadow-xl shadow-slate-200/40">
               <h2 className="text-xl font-black tracking-tight text-slate-900 mb-8">Enrollment Rate</h2>
               <div className="relative flex flex-col items-center justify-center pt-4">
                  <svg className="h-48 w-48 -rotate-90">
                     <circle cx="96" cy="96" r="80" stroke="#f1f5f9" strokeWidth="24" fill="none" />
                     <circle
                        cx="96" cy="96" r="80" stroke="#6366f1" strokeWidth="24" fill="none"
                        strokeDasharray="502.4" strokeDashoffset="150" strokeLinecap="round"
                     />
                     <circle
                        cx="96" cy="96" r="80" stroke="#10b981" strokeWidth="24" fill="none"
                        strokeDasharray="502.4" strokeDashoffset="400" strokeLinecap="round"
                     />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                     <p className="text-3xl font-black">84%</p>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage</p>
                  </div>
               </div>

               <div className="mt-10 space-y-4">
                  {[
                     { label: 'Academic Programs', value: '62%', color: 'bg-indigo-500' },
                     { label: 'Technical Tracks', value: '28%', color: 'bg-emerald-500' },
                     { label: 'Vocational', value: '10%', color: 'bg-slate-200' },
                  ].map((item, i) => (
                     <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className={cn("h-2.5 w-2.5 rounded-full", item.color)} />
                           <span className="text-sm font-bold text-slate-600">{item.label}</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">{item.value}</span>
                     </div>
                  ))}
               </div>
            </div>

            {/* Course Popularity List */}
            <div className="xl:col-span-2 rounded-[40px] border border-slate-100 bg-white p-8 lg:p-10 shadow-xl shadow-slate-200/40">
               <div className="flex items-center justify-between mb-10">
                  <h2 className="text-xl font-black tracking-tight text-slate-900">Course Popularity</h2>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                     <BarChart3 className="h-4 w-4" />
                     Popularity Index
                  </div>
               </div>

               <div className="grid gap-6 sm:grid-cols-2">
                  {(popularCourses.list.length ? popularCourses.list : []).map((course, i) => (
                     <div key={i} className="group p-6 rounded-3xl border border-slate-50 bg-slate-50/30 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-100">
                        <div className="flex items-center justify-between mb-4">
                           <div>
                              <h4 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{course.courseName}</h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{course.courseId}</p>
                           </div>
                           <span className="text-[10px] font-black text-emerald-500">
                              {course.enrollmentCount} students
                           </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                           <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${Math.min(100, (course.enrollmentCount / popularCourses.max) * 100)}%` }} />
                        </div>
                     </div>
                  ))}
                  {popularCourses.list.length === 0 && (
                     <p className="text-sm font-medium text-slate-400">No enrollment data yet.</p>
                  )}
               </div>
            </div>
         </section>

         {/* Quick Action Tiles */}
         <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
               { label: 'New Course', icon: BookOpen, bg: 'bg-indigo-50', text: 'text-indigo-600' },
               { label: 'Student Registration', icon: Users, bg: 'bg-emerald-50', text: 'text-emerald-600' },
               { label: 'New Exam', icon: GraduationCap, bg: 'bg-amber-50', text: 'text-amber-600' },
               { label: 'System Settings', icon: Settings, bg: 'bg-slate-50', text: 'text-slate-600' },
            ].map((action, i) => (
               <button key={i} className="group flex items-center gap-4 rounded-[32px] bg-white border border-slate-100 p-5 transition-all hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/30 hover:-translate-y-1">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 group-hover:rotate-6 shadow-sm", action.bg, action.text)}>
                     <action.icon className="h-6 w-6" />
                  </div>
                  <span className="text-base font-black tracking-tight text-slate-700">{action.label}</span>
                  <Plus className="ml-auto h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
               </button>
            ))}
         </section>
      </div>
   );
}
