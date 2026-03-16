'use client';

import { useState, useEffect } from 'react';
import {
  getRevenueSummary,
  getEnrollmentReport,
  getCourseTransactions,
  type RevenueSummaryParams,
  type EnrollmentReportParams,
} from '@/lib/api/reports';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import { getPrograms } from '@/lib/api/programs';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import type { Program } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  RefreshCw,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  PieChart,
  ArrowRight,
  Layers,
  Search,
  Building2,
  BookOpenCheck,
  LayoutDashboard,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';

type ReportType = 'revenue' | 'enrollment' | 'course-transactions';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block px-1';

export default function ReportsPage() {
  const { toast, toasts, removeToast } = useToast();
  const [activeReport, setActiveReport] = useState<ReportType>('revenue');
  const [loading, setLoading] = useState(false);

  // Data
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [revenueTotals, setRevenueTotals] = useState({ totalAmount: 0, totalTransactions: 0 });
  const [enrollmentData, setEnrollmentData] = useState<any[]>([]);
  const [courseTransactionData, setCourseTransactionData] = useState<any[]>([]);

  // Filters
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  // Revenue filters
  const [revenuePeriod, setRevenuePeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [revenueBranchId, setRevenueBranchId] = useState<string>('all');
  const [revenueCourseId, setRevenueCourseId] = useState<string>('all');
  const [revenueFrom, setRevenueFrom] = useState<string>('');
  const [revenueTo, setRevenueTo] = useState<string>('');

  // Enrollment filters
  const [enrollmentProgramId, setEnrollmentProgramId] = useState<string>('all');
  const [enrollmentCourseId, setEnrollmentCourseId] = useState<string>('all');
  const [enrollmentBranchId, setEnrollmentBranchId] = useState<string>('all');

  // Course transaction filters
  const [transactionCourseId, setTransactionCourseId] = useState<string>('');

  useEffect(() => {
    loadCourses();
    loadBranches();
    loadPrograms();
  }, []);

  useEffect(() => {
    if (activeReport === 'revenue') {
      loadRevenueReport();
    } else if (activeReport === 'enrollment') {
      loadEnrollmentReport();
    }
  }, [activeReport, revenuePeriod, revenueBranchId, revenueCourseId, revenueFrom, revenueTo, enrollmentProgramId, enrollmentCourseId, enrollmentBranchId]);

  const loadCourses = async () => {
    try {
      const response = await getCourses({});
      if (response.success && response.data) setCourses(response.data || []);
    } catch (err) { console.error(err); }
  };

  const loadBranches = async () => {
    try {
      const response = await getBranches();
      if (response.success && response.data) setBranches(response.data || []);
    } catch (err) { console.error(err); }
  };

  const loadPrograms = async () => {
    try {
      const response = await getPrograms();
      if (response.success && response.data) setPrograms(response.data || []);
    } catch (err) { console.error(err); }
  };

  const loadRevenueReport = async () => {
    try {
      setLoading(true);
      const params: RevenueSummaryParams = { period: revenuePeriod };
      if (revenueBranchId !== 'all') params.branchId = revenueBranchId;
      if (revenueCourseId !== 'all') params.courseId = revenueCourseId;
      if (revenueFrom) params.from = revenueFrom;
      if (revenueTo) params.to = revenueTo;

      const response = await getRevenueSummary(params);
      if (response.success) {
        setRevenueData(response.data || []);
        setRevenueTotals(response.totals || { totalAmount: 0, totalTransactions: 0 });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollmentReport = async () => {
    try {
      setLoading(true);
      const params: EnrollmentReportParams = {};
      if (enrollmentProgramId !== 'all') params.programId = enrollmentProgramId;
      if (enrollmentCourseId !== 'all') params.courseId = enrollmentCourseId;
      if (enrollmentBranchId !== 'all') params.branchId = enrollmentBranchId;

      const response = await getEnrollmentReport(params);
      if (response.success) setEnrollmentData(response.data || []);
    } catch (err: any) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadCourseTransactions = async () => {
    if (!transactionCourseId) {
      toast({ title: 'Requirement', description: 'Please select a course for analysis', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      const response = await getCourseTransactions({ courseId: transactionCourseId });
      if (response.success) setCourseTransactionData(response.data || []);
    } catch (err: any) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Tk ${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  const renderRevenueReport = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Section */}
      <section className="grid gap-6 sm:grid-cols-2">
        {[
          { label: 'Total Revenue', value: formatCurrency(revenueTotals.totalAmount), color: 'from-emerald-600 to-teal-500', icon: DollarSign },
          { label: 'Transactions', value: revenueTotals.totalTransactions, color: 'from-blue-600 to-cyan-500', icon: TrendingUp },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl">
             <div className="flex items-center justify-between">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg group-hover:scale-110 transition-transform", stat.color)}>
                   <stat.icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-200 group-hover:text-indigo-500 transition-colors" />
             </div>
             <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="mt-1 text-3xl font-black text-slate-900">{stat.value}</p>
             </div>
          </div>
        ))}
      </section>

      {/* Filter Matrix */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
           <ShieldCheck className="h-4 w-4 text-indigo-600" />
          <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Filters</h3>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <label className={sectionLabel}>Period Type</label>
            <Select value={revenuePeriod} onValueChange={(v) => setRevenuePeriod(v as any)}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-base shadow-inner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl">
                <SelectItem value="daily" className="font-bold py-2">Daily</SelectItem>
                <SelectItem value="monthly" className="font-bold py-2">Monthly</SelectItem>
                <SelectItem value="yearly" className="font-bold py-2">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className={sectionLabel}>Branch</label>
            <Select value={revenueBranchId} onValueChange={setRevenueBranchId}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-base shadow-inner">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl">
                <SelectItem value="all" className="font-bold py-2">All Branches</SelectItem>
                {branches.map((b) => <SelectItem key={b.id} value={b.id} className="font-bold py-2">{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className={sectionLabel}>Course</label>
            <Select value={revenueCourseId} onValueChange={setRevenueCourseId}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-base shadow-inner">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl">
                <SelectItem value="all" className="font-bold py-2">All Courses</SelectItem>
                {courses.map((c) => <SelectItem key={c.id} value={c.id} className="font-bold py-2">{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className={sectionLabel}>From</label>
            <DatePicker
              date={revenueFrom ? new Date(revenueFrom) : undefined}
              setDate={(date) => {
                if (!date) {
                  setRevenueFrom('');
                  return;
                }
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                setRevenueFrom(`${y}-${m}-${d}`);
              }}
              className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-base shadow-inner"
            />
          </div>
          <div className="space-y-2">
            <label className={sectionLabel}>To</label>
            <DatePicker
              date={revenueTo ? new Date(revenueTo) : undefined}
              setDate={(date) => {
                if (!date) {
                  setRevenueTo('');
                  return;
                }
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                setRevenueTo(`${y}-${m}-${d}`);
              }}
              className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-base shadow-inner"
            />
          </div>
          <div className="flex items-end">
            <Button className="h-11 w-full rounded-xl bg-slate-900 font-black uppercase tracking-widest text-[11px] text-white hover:bg-indigo-600 transition-all shadow-lg" onClick={loadRevenueReport} disabled={loading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Load
            </Button>
          </div>
        </div>
      </section>

      {/* Data Visualization Placeholder / Table */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Revenue</h2>
            <p className="mt-0.5 text-base font-bold text-indigo-500">Totals by period</p>
          </div>
        </div>
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Loading...</p>
          </div>
        ) : revenueData.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No data found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100">
                <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Period</TableHead>
                <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenueData.map((item, idx) => (
                <TableRow key={idx} className="group border-slate-100 hover:bg-slate-50/80 transition-colors">
                  <TableCell className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-slate-700">{item.bucket}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-5 text-right font-black text-slate-900 text-lg">
                    {formatCurrency(item.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );

  const renderEnrollmentReport = () => {
    const totalEnrollments = enrollmentData.reduce((sum, item) => sum + item.enrollmentCount, 0);
    const totalPayable = enrollmentData.reduce((sum, item) => sum + item.estimatedPayable, 0);

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <section className="grid gap-6 sm:grid-cols-2">
          {[
            { label: 'Total Enrollments', value: totalEnrollments, color: 'from-violet-600 to-indigo-500', icon: Users },
            { label: 'Estimated Payable', value: formatCurrency(totalPayable), color: 'from-amber-600 to-orange-500', icon: CreditCard },
          ].map((stat, i) => (
            <div key={i} className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl">
               <div className="flex items-center justify-between">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg group-hover:scale-110 transition-transform", stat.color)}>
                     <stat.icon className="h-6 w-6" />
                  </div>
               </div>
               <div className="mt-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">{stat.value}</p>
               </div>
            </div>
          ))}
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
             <BookOpenCheck className="h-4 w-4 text-emerald-600" />
             <h3 className="text-base font-black uppercase tracking-widest text-slate-800">Filters</h3>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className={sectionLabel}>Program</label>
              <Select value={enrollmentProgramId} onValueChange={setEnrollmentProgramId}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-base shadow-inner">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  <SelectItem value="all" className="font-bold py-2">All Programs</SelectItem>
                  {programs.map((p) => <SelectItem key={p.id} value={p.id} className="font-bold py-2">{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className={sectionLabel}>Course</label>
              <Select value={enrollmentCourseId} onValueChange={setEnrollmentCourseId}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-base shadow-inner">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  <SelectItem value="all" className="font-bold py-2">All Courses</SelectItem>
                  {courses.map((c) => <SelectItem key={c.id} value={c.id} className="font-bold py-2">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className={sectionLabel}>Branch</label>
              <Select value={enrollmentBranchId} onValueChange={setEnrollmentBranchId}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-base shadow-inner">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  <SelectItem value="all" className="font-bold py-2">All Branches</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id} className="font-bold py-2">{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="h-11 w-full rounded-xl bg-slate-900 font-black uppercase tracking-widest text-[11px] text-white hover:bg-emerald-600 transition-all shadow-lg" onClick={loadEnrollmentReport} disabled={loading}>
                <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                Load
              </Button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Enrollments</h2>
              <p className="mt-0.5 text-base font-bold text-emerald-500">By program and course</p>
            </div>
          </div>
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
               <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
               <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Loading...</p>
            </div>
          ) : enrollmentData.length === 0 ? (
            <div className="p-20 text-center">
               <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No enrollments found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-b border-slate-100">
                    <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Course</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Count</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Fee</TableHead>
                    <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Estimated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollmentData.map((item, idx) => (
                    <TableRow key={idx} className="group border-slate-100 hover:bg-slate-50/80 transition-colors">
                      <TableCell className="px-8 py-5">
                         <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-900">{item.courseName}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.programName}</span>
                         </div>
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        <Badge variant="outline" className="rounded-xl bg-white border-slate-200 px-4 py-1.5 text-[10px] font-black text-slate-600 shadow-sm">{item.enrollmentCount} STU</Badge>
                      </TableCell>
                      <TableCell className="py-5 text-right font-bold text-slate-500">{formatCurrency(item.perStudentPay)}</TableCell>
                      <TableCell className="px-8 py-5 text-right font-black text-slate-900 text-lg">{formatCurrency(item.estimatedPayable)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>
    );
  };

  const renderCourseTransactions = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm flex flex-wrap gap-6 items-end">
        <div className="space-y-2 flex-1 min-w-[300px]">
          <label className={sectionLabel}>Course</label>
          <Select value={transactionCourseId} onValueChange={setTransactionCourseId}>
            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-6 font-bold text-base shadow-inner transition-all focus:ring-4 focus:ring-indigo-500/10">
              <SelectValue placeholder="Select a course..." />
            </SelectTrigger>
            <SelectContent className="rounded-2xl shadow-2xl">
              {courses.map((c) => <SelectItem key={c.id} value={c.id} className="font-bold py-3">{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white hover:bg-indigo-600 transition-all shadow-xl" onClick={loadCourseTransactions} disabled={loading || !transactionCourseId}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Load
        </Button>
      </section>

      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Transactions</h2>
            <p className="mt-0.5 text-base font-bold text-indigo-500">Course payments</p>
          </div>
        </div>
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Loading...</p>
          </div>
        ) : courseTransactionData.length === 0 ? (
          <div className="p-20 text-center">
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No transactions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Student ID</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Origin</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Net Payable</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Authorized</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Authorization</TableHead>
                  <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Temporal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseTransactionData.map((t) => (
                  <TableRow key={t.id} className="group border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <TableCell className="px-8 py-5">
                       <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{t.student?.fullName || '-'}</span>
                          <span className="text-[9px] font-mono font-black text-slate-400 uppercase">TX-{t.id.slice(0, 8)}</span>
                       </div>
                    </TableCell>
                    <TableCell className="py-5 font-bold text-slate-600">{t.branch?.name || '-'}</TableCell>
                    <TableCell className="py-5 text-right font-black text-slate-900">{formatCurrency(Number(t.totalAmount))}</TableCell>
                    <TableCell className="py-5 text-right font-black text-emerald-600">{formatCurrency(Number(t.paidAmount))}</TableCell>
                    <TableCell className="py-5">
                      <Badge variant="outline" className={cn("rounded-lg text-[9px] font-black uppercase tracking-widest px-2.5 py-1", 
                        t.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                      )}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-5 text-base font-bold text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );

  return (
    <div className="space-y-8 text-slate-900">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
           <div className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm">
             <nav className="space-y-2">
               {[
                 { id: 'revenue', label: 'Financial Ledger', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                 { id: 'enrollment', label: 'Registry Analysis', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                 { id: 'course-transactions', label: 'Monetary Tracks', icon: BarChart3, color: 'text-rose-500', bg: 'bg-rose-50' },
               ].map((item) => (
                 <button
                   key={item.id}
                   onClick={() => setActiveReport(item.id as ReportType)}
                   className={cn(
                     "group w-full flex items-center gap-4 rounded-2xl px-5 py-4 text-base font-black uppercase tracking-widest transition-all",
                     activeReport === item.id
                       ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
                       : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                   )}
                 >
                   <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl transition-colors", 
                      activeReport === item.id ? "bg-white/10" : item.bg,
                      activeReport === item.id ? "text-white" : item.color
                   )}>
                      <item.icon className="h-4 w-4" />
                   </div>
                   <span>{item.label}</span>
                 </button>
               ))}
             </nav>
           </div>
           
           <div className="rounded-[32px] border border-slate-200 bg-slate-900 p-6 text-white shadow-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-emerald-400 mb-4">
                 <Layers className="h-5 w-5" />
              </div>
              <h4 className="text-base font-black uppercase tracking-widest">Data Synchronization</h4>
              <p className="mt-2 text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">Authorized analysis based on real-time institutional records.</p>
           </div>
        </aside>

        <main className="space-y-6">
          {activeReport === 'revenue' && renderRevenueReport()}
          {activeReport === 'enrollment' && renderEnrollmentReport()}
          {activeReport === 'course-transactions' && renderCourseTransactions()}
        </main>
      </div>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
