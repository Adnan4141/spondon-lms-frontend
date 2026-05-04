'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getRevenueSummary,
  getEnrollmentReport,
  getCourseTransactions,
  getBookSalesReport,
  getDueSummary,
  getLedgerSummary,
  type RevenueSummaryData,
  type RevenuePaymentRow,
  type EnrollmentReportData,
  type CourseTransactionData,
  type CourseTransactionTotals,
  type BookSalesRow,
  type DueSummaryRow,
  type DueSummaryStudentRow,
  type LedgerSummaryRow,
  type LedgerTypeSummary,
} from '@/lib/api/reports';
import { getCourses } from '@/lib/api/courses';
import { getBranches, type Branch } from '@/lib/api/branches';
import { getPrograms } from '@/lib/api/programs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { AdminDatePicker, AdminMonthPicker } from '@/features/admin/shared/form/AdminField';
import { cn } from '@/lib/utils';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Building2,
  Wallet,
  RefreshCw,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type TabKey = 'finance' | 'enrollment' | 'course-transactions' | 'book-sales' | 'due-collection' | 'ledger';

const TABS: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: 'finance', label: 'Finance Dashboard', icon: TrendingUp },
  { key: 'enrollment', label: 'Enrollment Report', icon: Users },
  { key: 'course-transactions', label: 'Course Transactions', icon: BarChart3 },
  { key: 'book-sales', label: 'Book Sales & Stock', icon: BookOpen },
  { key: 'due-collection', label: 'Due Collection', icon: Building2 },
  { key: 'ledger', label: 'Ledger Summary', icon: Wallet },
];

function fmtNum(n: number) {
  return new Intl.NumberFormat('en-BD').format(Math.round(n));
}

function fmtCur(n: number) {
  return '৳ ' + fmtNum(n);
}

function normalizeSingleDateRange(from?: string, to?: string) {
  return {
    from: from || to || undefined,
    to: to || from || undefined,
  };
}

// ─── Finance Tab ──────────────────────────────────────────────────────────────

function FinanceTab({ branches, courses }: { branches: Branch[]; courses: any[] }) {
  const { toast } = useToast();
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [branchId, setBranchId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RevenueSummaryData[]>([]);
  const [totals, setTotals] = useState<{ totalAmount: number; totalTransactions: number } | null>(null);
  const [transactions, setTransactions] = useState<RevenuePaymentRow[]>([]);

  async function load() {
    setLoading(true);
    try {
      const dateRange = normalizeSingleDateRange(from, to);
      const res = await getRevenueSummary({ period, branchId: branchId || undefined, courseId: courseId || undefined, from: dateRange.from, to: dateRange.to });
      if (res.success) {
        setData(res.data);
        setTotals(res.totals);
        setTransactions(res.transactions ?? []);
      }
    } catch { toast({ title: 'Failed to load revenue', variant: 'destructive' }); }
    finally { setLoading(false); }
  }

  const barColors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Period</p>
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="h-9 w-32 rounded-xl text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Collected Branch</p>
          <Select value={branchId || 'all'} onValueChange={(v) => setBranchId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-44 rounded-xl text-sm"><SelectValue placeholder="All Collection Branches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Collection Branches</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Course</p>
          <Select value={courseId || 'all'} onValueChange={(v) => setCourseId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-44 rounded-xl text-sm"><SelectValue placeholder="All Courses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">From</p>
          <AdminDatePicker className="w-36" value={from} onChange={setFrom} placeholder="From date" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">To</p>
          <AdminDatePicker className="w-36" value={to} onChange={setTo} placeholder="To date" />
        </div>
        <Button onClick={load} disabled={loading} className="h-9 bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
          Load
        </Button>
      </div>

      {/* KPI cards */}
      {totals && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Revenue', value: fmtCur(totals.totalAmount), icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Transactions', value: fmtNum(totals.totalTransactions), icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Avg / Transaction', value: totals.totalTransactions > 0 ? fmtCur(totals.totalAmount / totals.totalTransactions) : '—', icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center mb-3', kpi.bg)}>
                <kpi.icon className={cn('h-5 w-5', kpi.color)} />
              </div>
              <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {data.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">Revenue by {period}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="bucket" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => fmtCur(v)} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={barColors[i % barColors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      {data.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Period</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.bucket} className="hover:bg-slate-50/60">
                  <TableCell className="font-bold text-slate-900">{row.bucket}</TableCell>
                  <TableCell className="text-right font-black text-indigo-600">{fmtCur(row.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Full payment list */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Payment List (Filtered Result)
          </h3>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            {fmtNum(transactions.length)} transactions
          </span>
        </div>
        {loading ? (
          <div className="py-14 text-center">
            <RefreshCw className="mx-auto h-5 w-5 animate-spin text-indigo-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/40">
                <TableRow>
                  {['Paid At', 'Reg #', 'Student Name', 'Mobile', 'Collected Branch', 'Billing Branch', 'Amount', 'Method', 'TRX / Ref'].map((h) => (
                    <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-sm font-bold text-slate-400">
                      No payment found for current filters.
                    </TableCell>
                  </TableRow>
                ) : transactions.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/60">
                    <TableCell className="text-xs font-medium text-slate-500">
                      {new Date(row.paidAt).toLocaleString('en-GB', { hour12: false })}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-700">{row.student.registrationNumber || '—'}</TableCell>
                    <TableCell className="font-bold text-slate-900">{row.student.fullName}</TableCell>
                    <TableCell className="text-xs text-slate-600">{row.student.mobile}</TableCell>
                    <TableCell className="text-xs text-slate-600">{row.collectionBranch?.name || row.branch?.name || '—'}</TableCell>
                    <TableCell className="text-xs text-slate-500">{row.billingBranch?.name || '—'}</TableCell>
                    <TableCell className="font-black text-emerald-600">{fmtCur(Number(row.amount || 0))}</TableCell>
                    <TableCell>
                      <Badge className="rounded-full bg-indigo-100 text-[10px] font-black uppercase text-indigo-700">
                        {row.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{row.trxId || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {data.length === 0 && !loading && (
        <div className="py-20 text-center text-slate-400 text-sm font-bold">Set filters and click Load to view revenue data.</div>
      )}
    </div>
  );
}

// ─── Enrollment Tab ───────────────────────────────────────────────────────────

function EnrollmentTab({ branches, courses, programs }: { branches: Branch[]; courses: any[]; programs: any[] }) {
  const { toast } = useToast();
  const [branchId, setBranchId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [programId, setProgramId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EnrollmentReportData[]>([]);

  async function load() {
    setLoading(true);
    try {
      const dateRange = normalizeSingleDateRange(from, to);
      const res = await getEnrollmentReport({
        branchId: branchId || undefined,
        courseId: courseId || undefined,
        programId: programId || undefined,
        from: dateRange.from,
        to: dateRange.to,
      });
      if (res.success) setData(res.data);
    } catch { toast({ title: 'Failed to load enrollment report', variant: 'destructive' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const totalEnrollments = data.reduce((s, r) => s + r.enrollmentCount, 0);
  const totalPayable = data.reduce((s, r) => s + r.estimatedPayable, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Program</p>
          <Select value={programId || 'all'} onValueChange={(v) => setProgramId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-44 rounded-xl text-sm"><SelectValue placeholder="All Programs" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Course</p>
          <Select value={courseId || 'all'} onValueChange={(v) => setCourseId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-44 rounded-xl text-sm"><SelectValue placeholder="All Courses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Branch</p>
          <Select value={branchId || 'all'} onValueChange={(v) => setBranchId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-44 rounded-xl text-sm"><SelectValue placeholder="All Branches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">From</p>
          <AdminDatePicker className="w-36" value={from} onChange={setFrom} placeholder="From date" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">To</p>
          <AdminDatePicker className="w-36" value={to} onChange={setTo} placeholder="To date" />
        </div>
        <Button onClick={load} disabled={loading} className="h-9 bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          Load
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-black text-indigo-600">{fmtNum(totalEnrollments)}</p>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">Total Enrollments</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-black text-emerald-600">{fmtCur(totalPayable)}</p>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">Estimated Payable</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center"><RefreshCw className="h-6 w-6 animate-spin text-indigo-400 mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  {['Program', 'Course', 'Enrollments', 'Per Student', 'Est. Payable'].map((h) => (
                    <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-400 text-sm font-bold">No enrollment data found.</TableCell></TableRow>
                ) : data.map((row, i) => (
                  <TableRow key={i} className="hover:bg-slate-50/60">
                    <TableCell className="text-xs font-bold text-slate-500">{row.programName}</TableCell>
                    <TableCell className="font-bold text-slate-900">{row.courseName}</TableCell>
                    <TableCell>
                      <Badge className="bg-indigo-100 text-indigo-700 rounded-full font-black text-[10px]">{row.enrollmentCount}</Badge>
                    </TableCell>
                    <TableCell className="font-bold text-slate-700">{fmtCur(row.perStudentPay)}</TableCell>
                    <TableCell className="font-black text-emerald-600">{fmtCur(row.estimatedPayable)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Course Transactions Tab ──────────────────────────────────────────────────

function CourseTransactionsTab({ courses, branches }: { courses: any[]; branches: Branch[] }) {
  const { toast } = useToast();
  const [courseId, setCourseId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID'>('ALL');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CourseTransactionData[]>([]);
  const [totals, setTotals] = useState<CourseTransactionTotals | null>(null);

  async function load(payOverride?: typeof paymentStatus) {
    if (!courseId) {
      toast({ title: 'Select a course', variant: 'destructive' });
      return;
    }
    const pay = payOverride ?? paymentStatus;
    setLoading(true);
    try {
      const dateRange = normalizeSingleDateRange(from, to);
      const res = await getCourseTransactions({
        courseId,
        from: dateRange.from,
        to: dateRange.to,
        branchId: branchId || undefined,
        paymentStatus: pay === 'ALL' ? undefined : pay,
      });
      if (res.success) {
        setData(res.data);
        setTotals(res.totals ?? null);
      }
    } catch {
      toast({ title: 'Failed to load transactions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const statusCards: { key: typeof paymentStatus; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'PAID', label: 'Paid' },
    { key: 'PARTIAL', label: 'Partial' },
    { key: 'UNPAID', label: 'Unpaid' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex-1 min-w-48">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Course *</p>
          <Select value={courseId || 'none'} onValueChange={(v) => setCourseId(v === 'none' ? '' : v)}>
            <SelectTrigger className="h-9 rounded-xl text-sm"><SelectValue placeholder="Select a course…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select a course…</SelectItem>
              {courses.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Branch</p>
          <Select value={branchId || 'all'} onValueChange={(v) => setBranchId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-44 rounded-xl text-sm">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">From</p>
          <AdminDatePicker className="w-36" value={from} onChange={setFrom} placeholder="From date" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">To</p>
          <AdminDatePicker className="w-36" value={to} onChange={setTo} placeholder="To date" />
        </div>
        <Button
          onClick={() => void load()}
          disabled={loading}
          className="h-9 bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white gap-2"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
          Load
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusCards.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              setPaymentStatus(c.key);
              if (courseId) void load(c.key);
            }}
            className={cn(
              'rounded-full border px-4 py-1.5 text-xs font-bold transition-colors',
              paymentStatus === c.key
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {totals && data.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-lg font-black text-slate-800">{fmtCur(totals.netPayable)}</p>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">Net payable</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-lg font-black text-emerald-600">{fmtCur(totals.paid)}</p>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">Paid</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-lg font-black text-rose-600">{fmtCur(totals.due)}</p>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">Due</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-lg font-black text-indigo-600">{totals.collectionPercent}%</p>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">Collection</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-lg font-black text-slate-800">
              {totals.paidCount}/{totals.partialCount}/{totals.unpaidCount}
            </p>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">Paid / Part / Unpaid</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-400 mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  {[
                    'Student',
                    'Reg #',
                    'Mobile',
                    'Branch',
                    'Invoice / Month',
                    'Gross',
                    'Discount',
                    'Net',
                    'Paid',
                    'Due',
                    'Progress',
                    'Course status',
                    'Invoice',
                    'Due date',
                  ].map((h) => (
                    <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="py-12 text-center text-slate-400 text-sm font-bold">
                      Select a course and click Load.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row) => (
                    <TableRow key={row.id} className="hover:bg-slate-50/60">
                      <TableCell className="font-bold text-slate-900">{row.student?.fullName ?? '—'}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-600">
                        {row.student?.registrationNumber ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{row.student?.mobile ?? '—'}</TableCell>
                      <TableCell className="text-xs text-slate-500">{row.branch?.name ?? '—'}</TableCell>
                      <TableCell className="text-xs text-slate-600">
                        <span className="font-mono">{row.invoiceNumber ?? row.invoiceId.slice(0, 8)}…</span>
                        {row.month ? <span className="block text-slate-400">{row.month}</span> : null}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-slate-700">{fmtCur(row.gross)}</TableCell>
                      <TableCell className="text-right text-sm text-slate-500">−{fmtCur(row.discount)}</TableCell>
                      <TableCell className="text-right text-sm font-bold text-slate-800">{fmtCur(row.net)}</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-emerald-600">{fmtCur(row.paid)}</TableCell>
                      <TableCell className="text-right text-sm font-bold text-rose-600">{fmtCur(row.due)}</TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-[140px]">{row.progressLabel}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'rounded-full text-[10px] font-black uppercase px-2',
                            row.courseStatus === 'PAID' && 'bg-emerald-100 text-emerald-700',
                            row.courseStatus === 'PARTIAL' && 'bg-amber-100 text-amber-700',
                            row.courseStatus === 'UNPAID' && 'bg-rose-100 text-rose-700',
                          )}
                        >
                          {row.courseStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {row.nextPaymentDueDate
                          ? new Date(row.nextPaymentDueDate).toLocaleDateString('en-GB')
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Book Sales Tab ───────────────────────────────────────────────────────────

function BookSalesTab({ branches }: { branches: Branch[] }) {
  const { toast } = useToast();
  const [branchId, setBranchId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BookSalesRow[]>([]);
  const [totals, setTotals] = useState<{ totalRevenue: number; totalQtySold: number } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const dateRange = normalizeSingleDateRange(from, to);
      const res = await getBookSalesReport({ branchId: branchId || undefined, from: dateRange.from, to: dateRange.to });
      if (res.success) { setData(res.data); setTotals(res.totals); }
    } catch { toast({ title: 'Failed to load book sales', variant: 'destructive' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Branch</p>
          <Select value={branchId || 'all'} onValueChange={(v) => setBranchId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-44 rounded-xl text-sm"><SelectValue placeholder="All Branches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">From</p>
          <AdminDatePicker className="w-36" value={from} onChange={setFrom} placeholder="From date" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">To</p>
          <AdminDatePicker className="w-36" value={to} onChange={setTo} placeholder="To date" />
        </div>
        <Button onClick={load} disabled={loading} className="h-9 bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
          Load
        </Button>
      </div>

      {totals && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-2xl font-black text-indigo-600">{fmtCur(totals.totalRevenue)}</p>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">Total Book Revenue</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-2xl font-black text-purple-600">{fmtNum(totals.totalQtySold)}</p>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">Total Qty Sold</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center"><RefreshCw className="h-6 w-6 animate-spin text-indigo-400 mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  {['Book', 'SKU', 'Unit Price', 'Qty Sold', 'Revenue', 'Current Stock'].map((h) => (
                    <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-12 text-center text-slate-400 text-sm font-bold">No book sales data found.</TableCell></TableRow>
                ) : data.map((row) => (
                  <TableRow key={row.bookId} className="hover:bg-slate-50/60">
                    <TableCell className="font-bold text-slate-900">{row.bookName}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{row.sku || '—'}</TableCell>
                    <TableCell className="text-sm font-bold text-slate-700">{fmtCur(row.unitPrice)}</TableCell>
                    <TableCell><Badge className="bg-purple-100 text-purple-700 rounded-full font-black text-[10px]">{row.totalQty}</Badge></TableCell>
                    <TableCell className="font-black text-indigo-600">{fmtCur(row.totalRevenue)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.stocks.length === 0
                          ? <span className="text-xs text-slate-300">No stock</span>
                          : row.stocks.map((s) => (
                            <span key={s.branchId} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                              <Package className="h-3 w-3" />
                              {s.branchName}: {s.qty}
                            </span>
                          ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Due Collection Tab ───────────────────────────────────────────────────────

function DueCollectionTab({ branches }: { branches: Branch[] }) {
  const { toast } = useToast();
  const [branchId, setBranchId] = useState('');
  const [month, setMonth] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DueSummaryRow[]>([]);
  const [studentRows, setStudentRows] = useState<DueSummaryStudentRow[]>([]);
  const [totals, setTotals] = useState<{ totalPayable: number; totalPaid: number; totalDue: number } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const dateRange = normalizeSingleDateRange(from, to);
      const res = await getDueSummary({
        branchId: branchId || undefined,
        month: month || undefined,
        status: status || undefined,
        from: dateRange.from,
        to: dateRange.to,
      });
      if (res.success) {
        setData(res.data);
        setTotals(res.totals);
        setStudentRows(res.studentSummaries ?? []);
      }
    } catch { toast({ title: 'Failed to load due summary', variant: 'destructive' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Branch</p>
          <Select value={branchId || 'all'} onValueChange={(v) => setBranchId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-44 rounded-xl text-sm"><SelectValue placeholder="All Branches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Month (YYYY-MM)</p>
          <AdminMonthPicker className="w-40" value={month} onChange={setMonth} placeholder="Select month" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">From</p>
          <AdminDatePicker className="w-36" value={from} onChange={setFrom} placeholder="From date" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">To</p>
          <AdminDatePicker className="w-36" value={to} onChange={setTo} placeholder="To date" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Invoice Status</p>
          <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-36 rounded-xl text-sm"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="ISSUED">Issued</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={load} disabled={loading} className="h-9 bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
          Load
        </Button>
      </div>

      {totals && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Payable', value: fmtCur(totals.totalPayable), color: 'text-slate-900' },
            { label: 'Total Paid', value: fmtCur(totals.totalPaid), color: 'text-emerald-600' },
            { label: 'Total Due', value: fmtCur(totals.totalDue), color: 'text-rose-600' },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className={cn('text-2xl font-black', kpi.color)}>{kpi.value}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center"><RefreshCw className="h-6 w-6 animate-spin text-indigo-400 mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  {['Branch', 'Invoices', 'Payable', 'Paid', 'Due', 'Collection %'].map((h) => (
                    <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-12 text-center text-slate-400 text-sm font-bold">No due data found.</TableCell></TableRow>
                ) : data.map((row) => {
                  const pct = row.totalPayable > 0 ? Math.round((row.totalPaid / row.totalPayable) * 100) : 0;
                  return (
                    <TableRow key={row.branchId} className="hover:bg-slate-50/60">
                      <TableCell className="font-bold text-slate-900">
                        <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-slate-400" />{row.branchName}</div>
                      </TableCell>
                      <TableCell><Badge className="bg-slate-100 text-slate-700 rounded-full font-black text-[10px]">{row.invoiceCount}</Badge></TableCell>
                      <TableCell className="font-bold text-slate-700">{fmtCur(row.totalPayable)}</TableCell>
                      <TableCell className="font-black text-emerald-600">{fmtCur(row.totalPaid)}</TableCell>
                      <TableCell className="font-black text-rose-500">{fmtCur(row.totalDue)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-slate-100 min-w-16">
                            <div className={cn('h-2 rounded-full', pct >= 80 ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400')} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-black text-slate-600">{pct}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Due By Student (Full Summary)
          </h3>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            {fmtNum(studentRows.length)} students
          </span>
        </div>
        {loading ? (
          <div className="py-16 text-center"><RefreshCw className="h-6 w-6 animate-spin text-indigo-400 mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  {['Reg #', 'Student Name', 'Mobile', 'Branch', 'Invoices', 'Payable', 'Paid', 'Due'].map((h) => (
                    <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentRows.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="py-12 text-center text-slate-400 text-sm font-bold">No student due found for current filters.</TableCell></TableRow>
                ) : studentRows.map((row) => (
                  <TableRow key={`${row.branchId}:${row.studentUserId}`} className="hover:bg-slate-50/60">
                    <TableCell className="text-xs font-bold text-slate-700">{row.registrationNumber || '—'}</TableCell>
                    <TableCell className="font-bold text-slate-900">{row.fullName}</TableCell>
                    <TableCell className="text-xs text-slate-600">{row.mobile}</TableCell>
                    <TableCell className="text-xs text-slate-600">{row.branchName}</TableCell>
                    <TableCell><Badge className="bg-slate-100 text-slate-700 rounded-full font-black text-[10px]">{row.invoiceCount}</Badge></TableCell>
                    <TableCell className="font-bold text-slate-700">{fmtCur(row.totalPayable)}</TableCell>
                    <TableCell className="font-black text-emerald-600">{fmtCur(row.totalPaid)}</TableCell>
                    <TableCell className="font-black text-rose-500">{fmtCur(row.totalDue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Ledger Summary Tab ───────────────────────────────────────────────────────

function LedgerSummaryTab({ branches }: { branches: Branch[] }) {
  const { toast } = useToast();
  const [branchId, setBranchId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<LedgerSummaryRow[]>([]);
  const [summary, setSummary] = useState<LedgerTypeSummary[]>([]);

  async function load() {
    setLoading(true);
    try {
      const dateRange = normalizeSingleDateRange(from, to);
      const res = await getLedgerSummary({ branchId: branchId || undefined, from: dateRange.from, to: dateRange.to });
      if (res.success) { setRows(res.data); setSummary(res.summary); }
    } catch { toast({ title: 'Failed to load ledger summary', variant: 'destructive' }); }
    finally { setLoading(false); }
  }

  const TYPE_COLORS: Record<string, string> = {
    INCOME: 'bg-emerald-100 text-emerald-700',
    EXPENSE: 'bg-rose-100 text-rose-700',
    ASSET: 'bg-sky-100 text-sky-700',
    LIABILITY: 'bg-amber-100 text-amber-700',
    EQUITY: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Branch</p>
          <Select value={branchId || 'all'} onValueChange={(v) => setBranchId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-44 rounded-xl text-sm"><SelectValue placeholder="All Branches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">From</p>
          <AdminDatePicker className="w-36" value={from} onChange={setFrom} placeholder="From date" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">To</p>
          <AdminDatePicker className="w-36" value={to} onChange={setTo} placeholder="To date" />
        </div>
        <Button onClick={load} disabled={loading} className="h-9 bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
          Load
        </Button>
      </div>

      {summary.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {summary.map((s) => (
            <div key={s.type} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Badge className={cn('rounded-full text-[10px] font-black uppercase mb-2', TYPE_COLORS[s.type] ?? 'bg-slate-100 text-slate-700')}>
                {s.type}
              </Badge>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Income</span>
                  <span className="font-black text-emerald-600">{fmtCur(s.income)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Expense</span>
                  <span className="font-black text-rose-500">{fmtCur(s.expense)}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-slate-100 pt-1 mt-1">
                  <span className="text-slate-600 font-black">Net</span>
                  <span className={cn('font-black', s.net >= 0 ? 'text-indigo-600' : 'text-rose-600')}>{fmtCur(s.net)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center"><RefreshCw className="h-6 w-6 animate-spin text-indigo-400 mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  {['Code', 'Account', 'Type', 'Entry Type', 'Total Amount'].map((h) => (
                    <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-400 text-sm font-bold">No ledger entries found. Load to view data.</TableCell></TableRow>
                ) : rows.map((row, i) => (
                  <TableRow key={i} className="hover:bg-slate-50/60">
                    <TableCell className="font-mono text-xs text-slate-500">{row.accountCode}</TableCell>
                    <TableCell className="font-bold text-slate-900">{row.accountName}</TableCell>
                    <TableCell>
                      <Badge className={cn('rounded-full text-[10px] font-black uppercase px-2', TYPE_COLORS[row.accountType] ?? 'bg-slate-100 text-slate-700')}>
                        {row.accountType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn('text-[10px] font-black uppercase tracking-wider', row.entryType === 'INCOME' ? 'text-emerald-600' : 'text-rose-500')}>
                        {row.entryType === 'INCOME' ? '↑ ' : '↓ '}{row.entryType}
                      </span>
                    </TableCell>
                    <TableCell className={cn('font-black', row.entryType === 'INCOME' ? 'text-emerald-600' : 'text-rose-500')}>
                      {fmtCur(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function ReportsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast, toasts, removeToast } = useToast();
  const { user } = useAdminSession();

  const [activeTab, setActiveTab] = useState<TabKey>((searchParams?.get('tab') as TabKey) ?? 'finance');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  useEffect(() => {
    async function loadMeta() {
      setMetaLoading(true);
      try {
        const [bRes, cRes, pRes] = await Promise.all([getBranches(), getCourses({}), getPrograms()]);
        if (bRes.success && bRes.data) setBranches(bRes.data);
        if (cRes.success && cRes.data) setCourses(cRes.data);
        if (pRes.success && pRes.data) setPrograms(pRes.data);
      } catch { toast({ title: 'Failed to load filters', variant: 'destructive' }); }
      finally { setMetaLoading(false); }
    }
    void loadMeta();
  }, []);

  const visibleBranches = user?.role === 'BRANCH_ADMIN' && user.branchId
    ? branches.filter((branch) => branch.id === user.branchId)
    : branches;

  function switchTab(tab: TabKey) {
    setActiveTab(tab);
    router.replace(`/admin/reports?tab=${tab}`, { scroll: false });
  }

  return (
    <div className="min-h-screen space-y-6 p-6 bg-slate-50/50">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-200">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 font-medium">Finance, enrollment, inventory, and ledger data</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                activeTab === tab.key
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {metaLoading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="h-8 w-8 animate-spin text-teal-400" />
        </div>
      ) : (
        <div>
          {activeTab === 'finance' && <FinanceTab branches={visibleBranches} courses={courses} />}
          {activeTab === 'enrollment' && <EnrollmentTab branches={visibleBranches} courses={courses} programs={programs} />}
          {activeTab === 'course-transactions' && (
            <CourseTransactionsTab courses={courses} branches={visibleBranches} />
          )}
          {activeTab === 'book-sales' && <BookSalesTab branches={visibleBranches} />}
          {activeTab === 'due-collection' && <DueCollectionTab branches={visibleBranches} />}
          {activeTab === 'ledger' && <LedgerSummaryTab branches={visibleBranches} />}
        </div>
      )}

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">Loading reports…</div>}>
      <ReportsPageContent />
    </Suspense>
  );
}
