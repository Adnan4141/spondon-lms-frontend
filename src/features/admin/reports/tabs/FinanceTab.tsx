'use client';

import { useState } from 'react';
import {
  getRevenueSummary,
  type RevenueSummaryData,
  type RevenuePaymentRow,
  type AdmissionFeeSummary,
  type PaymentTypeBreakdown,
} from '@/lib/api/reports';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import type { ExportFormat } from '@/lib/export';
import { AdminDatePicker, AdminMonthPicker } from '@/features/admin/shared/form/AdminField';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  TrendingUp,
  RefreshCw,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Search,
  BookOpen,
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
import { ExportButtons } from '../ExportButtons';
import { FinanceDatePresetButtons } from '../components/FinanceDatePresetButtons';
import {
  fmtNum,
  fmtCur,
  normalizeSingleDateRange,
  exportFilename,
  exportRows,
  getCurrentMonthRange,
  getLastMonthRange,
  type NamedEntity,
  type BranchOption,
  type PaymentDatePreset,
} from '../shared';

const ITEM_TYPE_OPTIONS = [
  { value: '', label: 'All Payment Types' },
  { value: 'COURSE', label: 'Course Fee' },
  { value: 'BOOK', label: 'Book Purchase' },
  { value: 'ADMISSION_FEE', label: 'Admission Fee' },
  { value: 'FEE', label: 'Other Fee' },
  { value: 'OTHER', label: 'Other' },
] as const;

const ITEM_TYPE_BADGE: Record<string, string> = {
  COURSE: 'bg-indigo-100 text-indigo-700',
  BOOK: 'bg-amber-100 text-amber-700',
  ADMISSION_FEE: 'bg-emerald-100 text-emerald-700',
  FEE: 'bg-slate-100 text-slate-700',
  OTHER: 'bg-slate-100 text-slate-600',
};

const BREAKDOWN_ICONS: Record<string, typeof TrendingUp> = {
  COURSE: BarChart3,
  ADMISSION_FEE: GraduationCap,
  BOOK: BookOpen,
  FEE: Package,
  OTHER: Package,
};

const SOURCE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  STUDENT_SELF: 'Self Enroll',
};

function formatItemTypeLabel(type: string | null | undefined) {
  if (!type) return 'Mixed';
  return ITEM_TYPE_OPTIONS.find((option) => option.value === type)?.label || type;
}

function formatItemTypesSummary(types: string[]) {
  if (types.length === 0) return '—';
  if (types.length === 1) return formatItemTypeLabel(types[0]);
  return types.map((type) => formatItemTypeLabel(type)).join(', ');
}

function formatProgramSummary(row: RevenuePaymentRow) {
  if (row.programName) return row.programName;
  if (row.programNames.length === 0) return '—';
  if (row.programNames.length === 1) return row.programNames[0];
  return row.programNames.join(', ');
}

function monthValueToRange(month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]);
  const lastDay = new Date(year, monthIndex, 0).getDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

function buildFinanceApiParams(args: {
  period: 'daily' | 'monthly' | 'yearly';
  branchId: string;
  courseId: string;
  programId: string;
  itemType: string;
  view: 'grouped' | 'allocation' | 'payment';
  month: string;
  from: string;
  to: string;
  search: string;
  page?: number;
  limit?: number | 'all';
}) {
  const useMonthOnly = Boolean(args.month) && !args.from && !args.to;
  const monthRange = args.month ? monthValueToRange(args.month) : null;
  const dateRange = normalizeSingleDateRange(
    useMonthOnly ? monthRange?.from : args.from,
    useMonthOnly ? monthRange?.to : args.to,
  );

  return {
    period: args.period,
    branchId: args.branchId || undefined,
    courseId: args.courseId || undefined,
    programId: args.programId || undefined,
    itemType: args.itemType ? (args.itemType as 'COURSE' | 'BOOK' | 'ADMISSION_FEE' | 'FEE' | 'OTHER') : undefined,
    view: args.view,
    month: useMonthOnly ? args.month : undefined,
    search: args.search.trim() || undefined,
    from: dateRange.from,
    to: dateRange.to,
    page: args.page,
    limit: args.limit,
  };
}

export function FinanceTab({
  branches,
  courses,
  programs,
}: {
  branches: BranchOption[];
  courses: NamedEntity[];
  programs: NamedEntity[];
}) {
  const { toast } = useToast();
  const defaultRange = getCurrentMonthRange();
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [branchId, setBranchId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [programId, setProgramId] = useState('');
  const [itemType, setItemType] = useState('');
  const [view, setView] = useState<'grouped' | 'allocation' | 'payment'>('grouped');
  const [month, setMonth] = useState('');
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RevenueSummaryData[]>([]);
  const [totals, setTotals] = useState<{ totalAmount: number; totalTransactions: number } | null>(null);
  const [transactions, setTransactions] = useState<RevenuePaymentRow[]>([]);
  const [admissionFeeSummary, setAdmissionFeeSummary] = useState<AdmissionFeeSummary | null>(null);
  const [typeBreakdown, setTypeBreakdown] = useState<PaymentTypeBreakdown[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });

  async function load(options?: { page?: number; limit?: number; searchValue?: string }) {
    const nextPage = options?.page ?? page;
    const nextLimit = options?.limit ?? limit;
    const nextSearch = options?.searchValue ?? search;
    setLoading(true);
    try {
      const res = await getRevenueSummary(
        buildFinanceApiParams({
          period,
          branchId,
          courseId,
          programId,
          itemType,
          view,
          month,
          from,
          to,
          search: nextSearch,
          page: nextPage,
          limit: nextLimit,
        }),
      );
      if (res.success) {
        setData(res.data);
        setTotals(res.totals);
        setTransactions(res.transactions ?? []);
        setAdmissionFeeSummary(res.admissionFeeSummary ?? null);
        setTypeBreakdown(res.typeBreakdown ?? []);
        setPagination(res.pagination ?? { page: nextPage, limit: nextLimit, total: res.transactions?.length ?? 0, pages: 1 });
        setPage(nextPage);
        setLimit(nextLimit);
        setSearch(nextSearch);
      }
    } catch {
      toast({ title: 'Failed to load revenue', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function resetAndLoad() {
    void load({ page: 1, searchValue: searchDraft.trim() });
  }

  function applyDatePreset(preset: PaymentDatePreset) {
    const range = preset === 'current' ? getCurrentMonthRange() : getLastMonthRange();
    setMonth('');
    setFrom(range.from);
    setTo(range.to);
  }

  const barColors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];
  const pageStart = transactions.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const pageEnd = (pagination.page - 1) * pagination.limit + transactions.length;
  const showPaymentTotalHint = view === 'grouped' || view === 'allocation';

  async function handleExport(format: ExportFormat) {
    if (transactions.length === 0 && data.length === 0) {
      toast({ title: 'No finance data to export', variant: 'destructive' });
      return;
    }

    if (pagination.total > transactions.length) {
      setLoading(true);
      try {
        const res = await getRevenueSummary({
          ...buildFinanceApiParams({
            period,
            branchId,
            courseId,
            programId,
            itemType,
            view,
            month,
            from,
            to,
            search,
          }),
          limit: 'all',
        });
        if (!res.success || !res.transactions?.length) {
          toast({ title: 'No payment rows to export', variant: 'destructive' });
          return;
        }
        await exportPaymentRows(format, res.transactions);
      } catch {
        toast({ title: 'Export failed', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (transactions.length > 0) {
      await exportPaymentRows(format, transactions);
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

  async function exportPaymentRows(format: ExportFormat, rows: RevenuePaymentRow[]) {
    await exportRows({
      format,
      filename: exportFilename('finance-payments'),
      sheetName: 'Finance Payments',
      rows,
      columns: [
        { header: 'Paid At', value: (row) => row.paidAt },
        { header: 'Invoice #', value: (row) => row.invoiceNumber || '' },
        { header: 'Registration', value: (row) => row.student.registrationNumber || '' },
        { header: 'Student', value: (row) => row.student.fullName },
        { header: 'Mobile', value: (row) => row.student.mobile },
        { header: 'Program', value: (row) => formatProgramSummary(row) },
        { header: 'Course / Item', value: (row) => row.courseName || row.itemTitle || '—' },
        { header: 'Payment Type', value: (row) => row.itemType || formatItemTypesSummary(row.itemTypes) },
        { header: 'Allocated Amount', value: (row) => Number(row.amount || 0) },
        { header: 'Payment Total', value: (row) => Number(row.paymentTotal || 0) },
        { header: 'Source', value: (row) => (row.enrollmentSource ? SOURCE_LABELS[row.enrollmentSource] || row.enrollmentSource : '') },
        { header: 'Collected Branch', value: (row) => row.collectionBranch?.name || row.branch?.name || '' },
        { header: 'Billing Branch', value: (row) => row.billingBranch?.name || '' },
        { header: 'Method', value: (row) => row.method },
        { header: 'TRX / Ref', value: (row) => row.trxId || '' },
      ],
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
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
          <div className="w-full sm:w-56">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Search</p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') resetAndLoad();
                }}
                placeholder="Name, reg #, mobile, invoice, TRX"
                className="h-9 rounded-xl pl-9 text-sm"
              />
            </div>
          </div>
          <div className="w-full sm:w-56">
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
          <div className="w-full sm:w-56">
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
          <div className="w-full sm:w-56">
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
          <div className="w-full sm:w-48">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Payment Type</p>
            <Select value={itemType || 'ALL'} onValueChange={(v) => setItemType(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payment Types</SelectItem>
                {ITEM_TYPE_OPTIONS.filter((option) => option.value).map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">List View</p>
            <Select value={view} onValueChange={(v) => setView(v as typeof view)}>
              <SelectTrigger className="h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="grouped">By Category</SelectItem>
                <SelectItem value="allocation">By Line Item</SelectItem>
                <SelectItem value="payment">By Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Month</p>
            <AdminMonthPicker
              className="w-full sm:w-44"
              value={month}
              onChange={(value) => {
                setMonth(value);
                setFrom('');
                setTo('');
              }}
              placeholder="Select month"
            />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">From</p>
            <AdminDatePicker
              className="w-full sm:w-44"
              value={from}
              onChange={(value) => {
                setFrom(value);
                setMonth('');
              }}
              placeholder="From date"
            />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">To</p>
            <AdminDatePicker
              className="w-full sm:w-44"
              value={to}
              onChange={(value) => {
                setTo(value);
                setMonth('');
              }}
              placeholder="To date"
            />
          </div>
          <Button onClick={resetAndLoad} disabled={loading} className="h-9 bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white gap-2">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
            Load
          </Button>
          <ExportButtons onExport={handleExport} disabled={loading || (transactions.length === 0 && data.length === 0)} />
        </div>

        <FinanceDatePresetButtons
          from={from}
          to={to}
          onSelect={applyDatePreset}
        />
      </div>

      {totals && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Collected', value: fmtCur(totals.totalAmount), icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Payment Lines', value: fmtNum(totals.totalTransactions), icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Avg / Line', value: totals.totalTransactions > 0 ? fmtCur(totals.totalAmount / totals.totalTransactions) : '—', icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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

      {typeBreakdown.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {typeBreakdown.map((row) => {
            const Icon = BREAKDOWN_ICONS[row.type] || Package;
            return (
              <div key={row.type} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
                    <Icon className="h-4 w-4 text-slate-600" />
                  </div>
                  <Badge className={cn('rounded-full text-[10px] font-black uppercase', ITEM_TYPE_BADGE[row.type] || 'bg-slate-100 text-slate-600')}>
                    {row.lineCount} lines
                  </Badge>
                </div>
                <p className="text-xl font-black text-slate-900">{fmtCur(row.amount)}</p>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">{row.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {admissionFeeSummary && admissionFeeSummary.paymentCount > 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-600" />
              <h3 className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
                Admission Fee Collection
              </h3>
            </div>
            <span className="text-sm font-black text-emerald-700">
              {fmtCur(admissionFeeSummary.totalAmount)} · {fmtNum(admissionFeeSummary.paymentCount)} lines
            </span>
          </div>
          <div className="overflow-x-auto slim-scrollbar">
            <Table>
              <TableHeader className="bg-emerald-50/30">
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Program</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-emerald-600">Lines</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-emerald-600">Collected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admissionFeeSummary.byProgram.map((row) => (
                  <TableRow key={row.programId} className="hover:bg-emerald-50/40">
                    <TableCell className="font-bold text-slate-900">{row.programName}</TableCell>
                    <TableCell className="text-right text-sm font-bold text-slate-600">{fmtNum(row.paymentCount)}</TableCell>
                    <TableCell className="text-right font-black text-emerald-600">{fmtCur(row.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

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

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Payment List (Filtered Result)
          </h3>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            {fmtNum(pagination.total)} lines
          </span>
        </div>
        {loading ? (
          <div className="py-14 text-center">
            <RefreshCw className="mx-auto h-5 w-5 animate-spin text-indigo-400" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto slim-scrollbar">
              <Table>
                <TableHeader className="bg-slate-50/40">
                  <TableRow>
                    {['Paid At', 'Invoice #', 'Reg #', 'Student', 'Program', 'Type', 'Item', 'Amount', 'Source', 'Branch', 'Method', 'TRX / Ref'].map((h) => (
                      <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="py-12 text-center text-sm font-bold text-slate-400">
                        No payment found for current filters.
                      </TableCell>
                    </TableRow>
                  ) : transactions.map((row) => (
                    <TableRow key={row.id} className="hover:bg-slate-50/60">
                      <TableCell className="text-xs font-medium text-slate-500 whitespace-nowrap">
                        {new Date(row.paidAt).toLocaleString('en-GB', { hour12: false })}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">{row.invoiceNumber || '—'}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-700">{row.student.registrationNumber || '—'}</TableCell>
                      <TableCell className="font-bold text-slate-900 whitespace-nowrap">{row.student.fullName}</TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-[160px] truncate" title={formatProgramSummary(row)}>
                        {formatProgramSummary(row)}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('rounded-full text-[10px] font-black uppercase', ITEM_TYPE_BADGE[row.itemType || ''] || 'bg-slate-100 text-slate-600')}>
                          {row.itemType ? formatItemTypeLabel(row.itemType) : formatItemTypesSummary(row.itemTypes)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-[180px] truncate" title={row.courseName || row.itemTitle || undefined}>
                        {row.courseName || row.itemTitle || '—'}
                      </TableCell>
                      <TableCell className="font-black text-emerald-600 whitespace-nowrap">
                        {fmtCur(Number(row.amount || 0))}
                        {showPaymentTotalHint && row.paymentTotal > row.amount && (
                          <span className="block text-[10px] font-bold text-slate-400">of {fmtCur(row.paymentTotal)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {row.enrollmentSource ? SOURCE_LABELS[row.enrollmentSource] || row.enrollmentSource : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                        {row.collectionBranch?.name || row.branch?.name || '—'}
                      </TableCell>
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

            {pagination.total > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
                <p className="text-xs font-bold text-slate-500">
                  Showing {pageStart}-{pageEnd} of {fmtNum(pagination.total)} lines
                </p>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(limit)}
                    onValueChange={(value) => void load({ page: 1, limit: Number(value) })}
                  >
                    <SelectTrigger className="h-8 w-24 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[25, 50, 100, 200].map((size) => (
                        <SelectItem key={size} value={String(size)}>{size} / page</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={loading || pagination.page <= 1}
                    onClick={() => void load({ page: pagination.page - 1 })}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-bold text-slate-600">
                    Page {pagination.page} / {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={loading || pagination.page >= pagination.pages}
                    onClick={() => void load({ page: pagination.page + 1 })}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {data.length === 0 && !loading && (
        <div className="py-20 text-center text-slate-400 text-sm font-bold">Set filters and click Load to view revenue data.</div>
      )}
    </div>
  );
}
