'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
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
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { downloadTableExport, type ExportFormat } from '@/lib/export';
import { cn } from '@/lib/utils';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import { getSourceBranchOptions } from '../accounting/branchSourceUtils';
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Building2,
  Wallet,
  RefreshCw,
  Download,
  ArrowUpRight,
  Package,
  MessageSquare,
} from 'lucide-react';
import { SmsSendWorkspace } from '@/features/admin/sms/components/SmsSendWorkspace';
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
type NamedEntity = { id: string; name: string };

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

function exportFilename(prefix: string) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  return `${prefix}-${stamp}`;
}

async function exportRows<Row>(args: {
  format: ExportFormat;
  filename: string;
  sheetName: string;
  rows: Row[];
  columns: Array<{ header: string; value: (row: Row) => string | number | boolean | null | undefined }>;
}) {
  await downloadTableExport(args);
}

function ExportButtons({
  onExport,
  disabled,
}: {
  onExport: (format: ExportFormat) => Promise<void> | void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" className="gap-2" disabled={disabled} onClick={() => void onExport('csv')}>
        <Download className="h-4 w-4" />
        CSV
      </Button>
      <Button type="button" variant="outline" size="sm" className="gap-2" disabled={disabled} onClick={() => void onExport('xlsx')}>
        <Download className="h-4 w-4" />
        Excel
      </Button>
    </div>
  );
}

// ─── Finance Tab ──────────────────────────────────────────────────────────────

function FinanceTab({ branches, courses }: { branches: Branch[]; courses: NamedEntity[] }) {
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

  async function handleExport(format: ExportFormat) {
    if (transactions.length === 0 && data.length === 0) {
      toast({ title: 'No finance data to export', variant: 'destructive' });
      return;
    }

    if (transactions.length > 0) {
      await exportRows({
        format,
        filename: exportFilename('finance-payments'),
        sheetName: 'Finance Payments',
        rows: transactions,
        columns: [
          { header: 'Paid At', value: (row) => row.paidAt },
          { header: 'Registration', value: (row) => row.student.registrationNumber || '' },
          { header: 'Student', value: (row) => row.student.fullName },
          { header: 'Mobile', value: (row) => row.student.mobile },
          { header: 'Collected Branch', value: (row) => row.collectionBranch?.name || row.branch?.name || '' },
          { header: 'Billing Branch', value: (row) => row.billingBranch?.name || '' },
          { header: 'Amount', value: (row) => Number(row.amount || 0) },
          { header: 'Method', value: (row) => row.method },
          { header: 'TRX / Ref', value: (row) => row.trxId || '' },
        ],
      });
      return;
    }

    await exportRows({
      format,
      filename: exportFilename('finance-summary'),
      sheetName: 'Finance Summary',
      rows: data,
      columns: [
        { header: 'Period', value: (row) => row.bucket },
        { header: 'Amount', value: (row) => row.amount },
      ],
    });
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Period</p>
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="h-9 w-44 rounded-xl text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-56">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Collected Branch</p>
          <SearchableSelect
            value={branchId}
            onValueChange={setBranchId}
            placeholder="All Collection Branches"
            options={[
              { value: '', label: 'All Collection Branches' },
              ...branches.map((b) => ({ value: b.id, label: b.name })),
            ]}
          />
        </div>
        <div className="w-56">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Course</p>
          <SearchableSelect
            value={courseId}
            onValueChange={setCourseId}
            placeholder="All Courses"
            options={[
              { value: '', label: 'All Courses' },
              ...courses.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">From</p>
          <AdminDatePicker className="w-44" value={from} onChange={setFrom} placeholder="From date" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">To</p>
          <AdminDatePicker className="w-44" value={to} onChange={setTo} placeholder="To date" />
        </div>
        <Button onClick={load} disabled={loading} className="h-9 bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
          Load
        </Button>
        <ExportButtons onExport={handleExport} disabled={loading || (transactions.length === 0 && data.length === 0)} />
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
          <div className="overflow-x-auto slim-scrollbar">
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

function EnrollmentTab({ branches, courses, programs }: { branches: Branch[]; courses: NamedEntity[]; programs: NamedEntity[] }) {
  const { toast } = useToast();
  const [branchId, setBranchId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [programId, setProgramId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EnrollmentReportData[]>([]);

  const load = useCallback(async () => {
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
  }, [branchId, courseId, from, programId, to, toast]);

  useEffect(() => { void load(); }, [load]);

  const totalEnrollments = data.reduce((s, r) => s + r.enrollmentCount, 0);
  const totalPayable = data.reduce((s, r) => s + r.estimatedPayable, 0);

  async function handleExport(format: ExportFormat) {
    if (data.length === 0) {
      toast({ title: 'No enrollment data to export', variant: 'destructive' });
      return;
    }
    await exportRows({
      format,
      filename: exportFilename('enrollment-report'),
      sheetName: 'Enrollment Report',
      rows: data,
      columns: [
        { header: 'Program', value: (row) => row.programName },
        { header: 'Course', value: (row) => row.courseName },
        { header: 'Enrollments', value: (row) => row.enrollmentCount },
        { header: 'Per Student Pay', value: (row) => row.perStudentPay },
        { header: 'Estimated Payable', value: (row) => row.estimatedPayable },
      ],
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="w-56">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Program</p>
          <SearchableSelect
            value={programId}
            onValueChange={setProgramId}
            placeholder="All Programs"
            options={[
              { value: '', label: 'All Programs' },
              ...programs.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </div>
        <div className="w-56">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Course</p>
          <SearchableSelect
            value={courseId}
            onValueChange={setCourseId}
            placeholder="All Courses"
            options={[
              { value: '', label: 'All Courses' },
              ...courses.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
        <div className="w-56">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Branch</p>
          <SearchableSelect
            value={branchId}
            onValueChange={setBranchId}
            placeholder="All Branches"
            options={[
              { value: '', label: 'All Branches' },
              ...branches.map((b) => ({ value: b.id, label: b.name })),
            ]}
          />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">From</p>
          <AdminDatePicker className="w-44" value={from} onChange={setFrom} placeholder="From date" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">To</p>
          <AdminDatePicker className="w-44" value={to} onChange={setTo} placeholder="To date" />
        </div>
        <Button onClick={load} disabled={loading} className="h-9 bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          Load
        </Button>
        <ExportButtons onExport={handleExport} disabled={loading || data.length === 0} />
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
          <div className="overflow-x-auto slim-scrollbar">
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

function CourseTransactionsTab({ courses, branches }: { courses: NamedEntity[]; branches: Branch[] }) {
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

  async function handleExport(format: ExportFormat) {
    if (data.length === 0) {
      toast({ title: 'No transaction rows to export', variant: 'destructive' });
      return;
    }
    await exportRows({
      format,
      filename: exportFilename('course-transactions'),
      sheetName: 'Course Transactions',
      rows: data,
      columns: [
        { header: 'Student', value: (row) => row.student?.fullName ?? '' },
        { header: 'Registration', value: (row) => row.student?.registrationNumber ?? '' },
        { header: 'Mobile', value: (row) => row.student?.mobile ?? '' },
        { header: 'Branch', value: (row) => row.branch?.name ?? '' },
        { header: 'Invoice / Month', value: (row) => row.invoiceNumber ?? row.invoiceId },
        { header: 'Month', value: (row) => row.month ?? '' },
        { header: 'Gross', value: (row) => row.gross },
        { header: 'Discount', value: (row) => row.discount },
        { header: 'Net', value: (row) => row.net },
        { header: 'Paid', value: (row) => row.paid },
        { header: 'Due', value: (row) => row.due },
        { header: 'Progress', value: (row) => row.progressLabel },
        { header: 'Course Status', value: (row) => row.courseStatus },
        { header: 'Invoice Status', value: (row) => row.status },
        { header: 'Due Date', value: (row) => row.nextPaymentDueDate ?? '' },
      ],
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex-1 min-w-48">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Course *</p>
          <SearchableSelect
            value={courseId}
            onValueChange={setCourseId}
            placeholder="Select a course..."
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
        <div className="w-56">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Branch</p>
          <SearchableSelect
            value={branchId}
            onValueChange={setBranchId}
            placeholder="All Branches"
            options={[
              { value: '', label: 'All Branches' },
              ...branches.map((b) => ({ value: b.id, label: b.name })),
            ]}
          />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">From</p>
          <AdminDatePicker className="w-44" value={from} onChange={setFrom} placeholder="From date" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">To</p>
          <AdminDatePicker className="w-44" value={to} onChange={setTo} placeholder="To date" />
        </div>
        <Button
          onClick={() => void load()}
          disabled={loading}
          className="h-9 bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white gap-2"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
          Load
        </Button>
        <ExportButtons onExport={handleExport} disabled={loading || data.length === 0} />
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
          <div className="overflow-x-auto slim-scrollbar">
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
                      <TableCell className="text-xs text-slate-600">{row.progressLabel}</TableCell>
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const dateRange = normalizeSingleDateRange(from, to);
      const res = await getBookSalesReport({ branchId: branchId || undefined, from: dateRange.from, to: dateRange.to });
      if (res.success) { setData(res.data); setTotals(res.totals); }
    } catch { toast({ title: 'Failed to load book sales', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [branchId, from, to, toast]);

  useEffect(() => { void load(); }, [load]);

  async function handleExport(format: ExportFormat) {
    if (data.length === 0) {
      toast({ title: 'No book sales rows to export', variant: 'destructive' });
      return;
    }
    await exportRows({
      format,
      filename: exportFilename('book-sales'),
      sheetName: 'Book Sales',
      rows: data,
      columns: [
        { header: 'Book', value: (row) => row.bookName },
        { header: 'SKU', value: (row) => row.sku || '' },
        { header: 'Unit Price', value: (row) => row.unitPrice },
        { header: 'Qty Sold', value: (row) => row.totalQty },
        { header: 'Revenue', value: (row) => row.totalRevenue },
        { header: 'Stock Snapshot', value: (row) => row.stocks.map((stock) => `${stock.branchName}:${stock.qty}`).join(' | ') },
      ],
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Branch</p>
          <Select value={branchId || 'all'} onValueChange={(v) => setBranchId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-56 rounded-xl text-sm"><SelectValue placeholder="All Branches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">From</p>
          <AdminDatePicker className="w-44" value={from} onChange={setFrom} placeholder="From date" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">To</p>
          <AdminDatePicker className="w-44" value={to} onChange={setTo} placeholder="To date" />
        </div>
        <Button onClick={load} disabled={loading} className="h-9 bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
          Load
        </Button>
        <ExportButtons onExport={handleExport} disabled={loading || data.length === 0} />
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
          <div className="overflow-x-auto slim-scrollbar">
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
  const { user } = useAdminSession();
  const [branchId, setBranchId] = useState('');
  const [month, setMonth] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DueSummaryRow[]>([]);
  const [studentRows, setStudentRows] = useState<DueSummaryStudentRow[]>([]);
  const [totals, setTotals] = useState<{ totalPayable: number; totalPaid: number; totalDue: number } | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [smsRows, setSmsRows] = useState<DueSummaryStudentRow[]>([]);
  const [smsDrawerOpen, setSmsDrawerOpen] = useState(false);

  const load = useCallback(async () => {
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
        setSelectedStudentIds([]);
      }
    } catch { toast({ title: 'Failed to load due summary', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [branchId, from, month, status, to, toast]);

  useEffect(() => { void load(); }, [load]);

  async function handleExport(format: ExportFormat) {
    if (studentRows.length === 0 && data.length === 0) {
      toast({ title: 'No due rows to export', variant: 'destructive' });
      return;
    }
    if (studentRows.length > 0) {
      await exportRows({
        format,
        filename: exportFilename('due-collection-students'),
        sheetName: 'Due By Student',
        rows: studentRows,
        columns: [
          { header: 'Registration', value: (row) => row.registrationNumber || '' },
          { header: 'Student Name', value: (row) => row.fullName },
          { header: 'Mobile', value: (row) => row.mobile },
          { header: 'Branch', value: (row) => row.branchName },
          { header: 'Invoice Count', value: (row) => row.invoiceCount },
          { header: 'Payable', value: (row) => row.totalPayable },
          { header: 'Paid', value: (row) => row.totalPaid },
          { header: 'Due', value: (row) => row.totalDue },
        ],
      });
      return;
    }
    await exportRows({
      format,
      filename: exportFilename('due-collection-branches'),
      sheetName: 'Due By Branch',
      rows: data,
      columns: [
        { header: 'Branch', value: (row) => row.branchName },
        { header: 'Invoice Count', value: (row) => row.invoiceCount },
        { header: 'Total Payable', value: (row) => row.totalPayable },
        { header: 'Total Paid', value: (row) => row.totalPaid },
        { header: 'Total Due', value: (row) => row.totalDue },
      ],
    });
  }

  function openSmsDrawer(rows: DueSummaryStudentRow[]) {
    if (!rows.length) {
      toast({ title: 'Select at least one due student', variant: 'destructive' });
      return;
    }
    setSmsRows(rows);
    setSmsDrawerOpen(true);
  }

  const selectedRows = studentRows.filter((row) => selectedStudentIds.includes(row.studentUserId));
  const allSelected = studentRows.length > 0 && selectedStudentIds.length === studentRows.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Branch</p>
          <Select value={branchId || 'all'} onValueChange={(v) => setBranchId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-56 rounded-xl text-sm"><SelectValue placeholder="All Branches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Month (YYYY-MM)</p>
          <AdminMonthPicker className="w-48" value={month} onChange={setMonth} placeholder="Select month" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">From</p>
          <AdminDatePicker className="w-44" value={from} onChange={setFrom} placeholder="From date" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">To</p>
          <AdminDatePicker className="w-44" value={to} onChange={setTo} placeholder="To date" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Invoice Status</p>
          <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-44 rounded-xl text-sm"><SelectValue placeholder="All" /></SelectTrigger>
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
        <Button
          type="button"
          variant="outline"
          disabled={studentRows.length === 0}
          onClick={() => openSmsDrawer(studentRows.filter((row) => row.totalDue > 0))}
          className="h-9 gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Send to All Unpaid{month ? ` — ${month}` : ''}
        </Button>
        <ExportButtons onExport={handleExport} disabled={loading || (studentRows.length === 0 && data.length === 0)} />
      </div>

      {selectedRows.length > 0 ? (
        <div className="sticky top-16 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-blue-900">{selectedRows.length} students selected with dues</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setSelectedStudentIds([])}>Clear</Button>
            <Button type="button" size="sm" onClick={() => openSmsDrawer(selectedRows)} className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Send Due Reminder
            </Button>
          </div>
        </div>
      ) : null}

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
          <div className="overflow-x-auto slim-scrollbar">
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
          <div className="overflow-x-auto slim-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => setSelectedStudentIds(checked ? studentRows.map((row) => row.studentUserId) : [])}
                    />
                  </TableHead>
                  {['Reg #', 'Student Name', 'Mobile', 'Branch', 'Invoices', 'Payable', 'Paid', 'Due'].map((h) => (
                    <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</TableHead>
                  ))}
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">SMS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentRows.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="py-12 text-center text-slate-400 text-sm font-bold">No student due found for current filters.</TableCell></TableRow>
                ) : studentRows.map((row) => (
                  <TableRow key={`${row.branchId}:${row.studentUserId}`} className="hover:bg-slate-50/60">
                    <TableCell>
                      <Checkbox
                        checked={selectedStudentIds.includes(row.studentUserId)}
                        onCheckedChange={(checked) => setSelectedStudentIds((prev) => checked ? [...new Set([...prev, row.studentUserId])] : prev.filter((id) => id !== row.studentUserId))}
                      />
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-700">{row.registrationNumber || '—'}</TableCell>
                    <TableCell className="font-bold text-slate-900">{row.fullName}</TableCell>
                    <TableCell className="text-xs text-slate-600">{row.mobile}</TableCell>
                    <TableCell className="text-xs text-slate-600">{row.branchName}</TableCell>
                    <TableCell><Badge className="bg-slate-100 text-slate-700 rounded-full font-black text-[10px]">{row.invoiceCount}</Badge></TableCell>
                    <TableCell className="font-bold text-slate-700">{fmtCur(row.totalPayable)}</TableCell>
                    <TableCell className="font-black text-emerald-600">{fmtCur(row.totalPaid)}</TableCell>
                    <TableCell className="font-black text-rose-500">{fmtCur(row.totalDue)}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" size="sm" variant="ghost" onClick={() => openSmsDrawer([row])} aria-label={`Send due SMS to ${row.fullName}`}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {smsDrawerOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
            aria-label="Close SMS workspace"
            onClick={() => setSmsDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-6xl overflow-y-auto bg-slate-50 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-blue-600">Focused SMS Workspace</p>
                <h2 className="text-lg font-bold text-slate-950">Due Reminder</h2>
              </div>
              <Button type="button" variant="outline" onClick={() => setSmsDrawerOpen(false)}>Close</Button>
            </div>
            <div className="p-4 sm:p-6">
              <SmsSendWorkspace
                branches={branches}
                actor={user}
                rates={{ maskingRate: 0.5, nonMaskingRate: 0.35 }}
                focused={{
                  method: 'students',
                  locked: true,
                  contextLabel: 'Due Reminder',
                  templateKey: 'DUE_REMINDER',
                  defaultMessage: 'Dear {name}, you have a due of ৳{amount} for {course}. Please clear by {due_date}. - {institute}',
                  context: 'due_reminder',
                  type: 'DUE_REMINDER',
                  source: 'DIRECT',
                  scope: 'BRANCH',
                  branchId: user?.role === 'BRANCH_ADMIN' ? user.branchId || undefined : smsRows[0]?.branchId || branchId || undefined,
                  allowSchedule: true,
                  dedupeScope: { dueMonth: month || new Date().toISOString().slice(0, 7) },
                  recipients: smsRows.map((row) => ({
                    id: row.studentUserId,
                    name: row.fullName,
                    phone: row.mobile,
                    branchId: row.branchId,
                    variables: {
                      name: row.fullName,
                      phone: row.mobile,
                      amount: fmtNum(row.totalDue),
                      month: month || 'current month',
                      course: row.courseSummary || 'course fees',
                      due_date: row.nextDueDate ? new Date(row.nextDueDate).toLocaleDateString('en-GB') : 'the due date',
                      institute: 'Spondon LMS',
                    },
                  })),
                }}
                onSuccess={() => {
                  setSmsDrawerOpen(false);
                  setSelectedStudentIds([]);
                  void load();
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Ledger Summary Tab ───────────────────────────────────────────────────────

function LedgerSummaryTab({ branches }: { branches: Branch[] }) {
  const { toast } = useToast();
  const sourceBranches = getSourceBranchOptions(branches);
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

  async function handleExport(format: ExportFormat) {
    if (rows.length === 0) {
      toast({ title: 'No ledger summary rows to export', variant: 'destructive' });
      return;
    }
    await exportRows({
      format,
      filename: exportFilename('ledger-summary'),
      sheetName: 'Ledger Summary',
      rows,
      columns: [
        { header: 'Account Code', value: (row) => row.accountCode },
        { header: 'Account Name', value: (row) => row.accountName },
        { header: 'Account Type', value: (row) => row.accountType },
        { header: 'Total Debit', value: (row) => row.totalDebit },
        { header: 'Total Credit', value: (row) => row.totalCredit },
        { header: 'Balance', value: (row) => row.balance },
      ],
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Source Branch</p>
          <Select value={branchId || 'all'} onValueChange={(v) => setBranchId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-56 rounded-xl text-sm"><SelectValue placeholder="All HO entries" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All HO entries</SelectItem>
              {sourceBranches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">From</p>
          <AdminDatePicker className="w-44" value={from} onChange={setFrom} placeholder="From date" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">To</p>
          <AdminDatePicker className="w-44" value={to} onChange={setTo} placeholder="To date" />
        </div>
        <Button onClick={load} disabled={loading} className="h-9 bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
          Load
        </Button>
        <ExportButtons onExport={handleExport} disabled={loading || rows.length === 0} />
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
                  <span className="text-slate-400 font-bold">Debit</span>
                  <span className="font-black text-rose-500">{fmtCur(s.totalDebit)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Credit</span>
                  <span className="font-black text-emerald-600">{fmtCur(s.totalCredit)}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-slate-100 pt-1 mt-1">
                  <span className="text-slate-600 font-black">Balance</span>
                  <span className={cn('font-black', s.balance >= 0 ? 'text-indigo-600' : 'text-rose-600')}>{fmtCur(s.balance)}</span>
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
          <div className="overflow-x-auto slim-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  {['Code', 'Account', 'Type', 'Debit', 'Credit', 'Balance'].map((h) => (
                    <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-12 text-center text-slate-400 text-sm font-bold">No HO ledger entries found. Load to view data or filter by related source branch.</TableCell></TableRow>
                ) : rows.map((row, i) => (
                  <TableRow key={i} className="hover:bg-slate-50/60">
                    <TableCell className="font-mono text-xs text-slate-500">{row.accountCode}</TableCell>
                    <TableCell className="font-bold text-slate-900">{row.accountName}</TableCell>
                    <TableCell>
                      <Badge className={cn('rounded-full text-[10px] font-black uppercase px-2', TYPE_COLORS[row.accountType] ?? 'bg-slate-100 text-slate-700')}>
                        {row.accountType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-black text-rose-500">
                      {fmtCur(row.totalDebit)}
                    </TableCell>
                    <TableCell className="font-black text-emerald-600">
                      {fmtCur(row.totalCredit)}
                    </TableCell>
                    <TableCell className={cn('font-black', row.balance >= 0 ? 'text-indigo-600' : 'text-rose-600')}>
                      {fmtCur(row.balance)}
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
  const [courses, setCourses] = useState<NamedEntity[]>([]);
  const [programs, setPrograms] = useState<NamedEntity[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  useEffect(() => {
    async function loadMeta() {
      setMetaLoading(true);
      try {
        const [bRes, cRes, pRes] = await Promise.all([
          getBranches({ all: true }),
          getCourses({ all: true }),
          getPrograms(),
        ]);
        if (bRes.success && bRes.data) setBranches(bRes.data);
        if (cRes.success && cRes.data) setCourses(cRes.data.map((course) => ({ id: course.id, name: course.name })));
        if (pRes.success && pRes.data) setPrograms(pRes.data.map((program) => ({ id: program.id, name: program.name })));
      } catch { toast({ title: 'Failed to load filters', variant: 'destructive' }); }
      finally { setMetaLoading(false); }
    }
    void loadMeta();
  }, [toast]);

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
