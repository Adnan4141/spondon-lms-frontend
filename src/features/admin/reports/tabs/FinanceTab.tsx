'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { FinancePaymentDetailModal } from '../components/FinancePaymentDetailModal';
import {
  fmtNum,
  fmtCur,
  exportFilename,
  exportRows,
  FINANCE_PAGE_SIZES,
  type NamedEntity,
  type BranchOption,
  type FinancePeriod,
  type FinanceView,
} from '../shared';
import { buildFinanceApiParams, useFinanceQuery } from '../useFinanceQuery';

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
  const { query, updateQuery, applyDatePreset, openPaymentDetail, closePaymentDetail } = useFinanceQuery();

  const [searchDraft, setSearchDraft] = useState(query.search);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [data, setData] = useState<RevenueSummaryData[]>([]);
  const [totals, setTotals] = useState<{ totalAmount: number; totalTransactions: number } | null>(null);
  const [transactions, setTransactions] = useState<RevenuePaymentRow[]>([]);
  const [admissionFeeSummary, setAdmissionFeeSummary] = useState<AdmissionFeeSummary | null>(null);
  const [typeBreakdown, setTypeBreakdown] = useState<PaymentTypeBreakdown[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });

  useEffect(() => {
    setSearchDraft(query.search);
  }, [query.search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchDraft !== query.search) {
        updateQuery({ search: searchDraft });
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [query.search, searchDraft, updateQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRevenueSummary(buildFinanceApiParams(query));
      if (res.success) {
        setData(res.data);
        setTotals(res.totals);
        setTransactions(res.transactions ?? []);
        setAdmissionFeeSummary(res.admissionFeeSummary ?? null);
        setTypeBreakdown(res.typeBreakdown ?? []);
        setPagination(
          res.pagination ?? {
            page: query.page,
            limit: query.limit,
            total: res.transactions?.length ?? 0,
            pages: 1,
          },
        );
        setHasLoaded(true);
      }
    } catch {
      toast({ title: 'Failed to load revenue', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [query, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const barColors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];
  const pageStart = transactions.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const pageEnd = (pagination.page - 1) * pagination.limit + transactions.length;
  const showPaymentTotalHint = query.view === 'grouped' || query.view === 'allocation';

  async function handleExport(format: ExportFormat) {
    if (transactions.length === 0 && data.length === 0) {
      toast({ title: 'No finance data to export', variant: 'destructive' });
      return;
    }

    if (pagination.total > transactions.length) {
      setLoading(true);
      try {
        const res = await getRevenueSummary({
          ...buildFinanceApiParams(query),
          page: undefined,
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

  const statCells = totals
    ? [
        { label: 'Total Collected', value: fmtCur(totals.totalAmount), icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Payment Lines', value: fmtNum(totals.totalTransactions), icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Avg / Line', value: totals.totalTransactions > 0 ? fmtCur(totals.totalAmount / totals.totalTransactions) : '—', icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ...typeBreakdown.map((row) => ({
          label: row.label,
          value: fmtCur(row.amount),
          sub: `${row.lineCount} lines`,
          icon: BREAKDOWN_ICONS[row.type] || Package,
          color: row.type === 'ADMISSION_FEE' ? 'text-emerald-600' : row.type === 'BOOK' ? 'text-amber-600' : 'text-indigo-600',
          bg: row.type === 'ADMISSION_FEE' ? 'bg-emerald-50' : row.type === 'BOOK' ? 'bg-amber-50' : 'bg-indigo-50',
        })),
      ]
    : [];

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Search</p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Name, reg #, mobile, invoice, TRX"
                className="h-8 rounded-lg pl-8 text-xs"
              />
            </div>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Period</p>
            <Select
              value={query.period}
              onValueChange={(value) => updateQuery({ period: value as FinancePeriod })}
            >
              <SelectTrigger className="h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">List View</p>
            <Select
              value={query.view}
              onValueChange={(value) => updateQuery({ view: value as FinanceView })}
            >
              <SelectTrigger className="h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="grouped">By Category</SelectItem>
                <SelectItem value="allocation">By Line Item</SelectItem>
                <SelectItem value="payment">By Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Collected Branch</p>
            <SearchableSelect
              value={query.branchId}
              onValueChange={(value) => updateQuery({ branchId: value })}
              placeholder="All Branches"
              options={[
                { value: '', label: 'All Collection Branches' },
                ...branches.map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Program</p>
            <SearchableSelect
              value={query.programId}
              onValueChange={(value) => updateQuery({ programId: value })}
              placeholder="All Programs"
              options={[
                { value: '', label: 'All Programs' },
                ...programs.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Course</p>
            <SearchableSelect
              value={query.courseId}
              onValueChange={(value) => updateQuery({ courseId: value })}
              placeholder="All Courses"
              options={[
                { value: '', label: 'All Courses' },
                ...courses.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Payment Type</p>
            <Select
              value={query.itemType || 'ALL'}
              onValueChange={(value) => updateQuery({ itemType: value === 'ALL' ? '' : (value as typeof query.itemType) })}
            >
              <SelectTrigger className="h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payment Types</SelectItem>
                {ITEM_TYPE_OPTIONS.filter((option) => option.value).map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-end gap-2">
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Month</p>
            <AdminMonthPicker
              className="w-36"
              value={query.month}
              onChange={(value) => updateQuery({ month: value, from: '', to: '' })}
              placeholder="YYYY-MM"
            />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">From</p>
            <AdminDatePicker
              className="w-36"
              value={query.from}
              onChange={(value) => updateQuery({ from: value, month: '' })}
              placeholder="From"
            />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">To</p>
            <AdminDatePicker
              className="w-36"
              value={query.to}
              onChange={(value) => updateQuery({ to: value, month: '' })}
              placeholder="To"
            />
          </div>
          <FinanceDatePresetButtons from={query.from} to={query.to} onSelect={applyDatePreset} compact />
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
          <ExportButtons onExport={handleExport} disabled={loading || (transactions.length === 0 && data.length === 0)} />
        </div>
      </div>

      {statCells.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          {statCells.map((cell) => (
            <div key={cell.label} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', cell.bg)}>
                  <cell.icon className={cn('h-3.5 w-3.5', cell.color)} />
                </div>
                {'sub' in cell && cell.sub ? (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{cell.sub}</span>
                ) : null}
              </div>
              <p className="mt-1.5 text-lg font-black leading-none text-slate-900">{cell.value}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{cell.label}</p>
            </div>
          ))}
        </div>
      )}

      {admissionFeeSummary && admissionFeeSummary.paymentCount > 0 && admissionFeeSummary.byProgram.length > 1 && (
        <details className="group rounded-xl border border-emerald-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50/70 px-3 py-2 marker:content-none">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
                Admission Fee by Program
              </span>
            </div>
            <span className="text-xs font-black text-emerald-700">
              {fmtCur(admissionFeeSummary.totalAmount)} · {fmtNum(admissionFeeSummary.paymentCount)} lines
            </span>
          </summary>
          <div className="overflow-x-auto slim-scrollbar">
            <Table>
              <TableHeader className="bg-emerald-50/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 py-1.5 text-xs font-black uppercase tracking-widest text-emerald-600">Program</TableHead>
                  <TableHead className="h-9 py-1.5 text-right text-xs font-black uppercase tracking-widest text-emerald-600">Lines</TableHead>
                  <TableHead className="h-9 py-1.5 text-right text-xs font-black uppercase tracking-widest text-emerald-600">Collected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admissionFeeSummary.byProgram.map((row) => (
                  <TableRow key={row.programId} className="hover:bg-emerald-50/40">
                    <TableCell className="py-2.5 text-sm font-bold text-slate-900">{row.programName}</TableCell>
                    <TableCell className="py-2.5 text-right text-sm font-bold text-slate-600">{fmtNum(row.paymentCount)}</TableCell>
                    <TableCell className="py-2.5 text-right text-sm font-black text-emerald-600">{fmtCur(row.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </details>
      )}

      {data.length > 1 && (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
          <h3 className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Revenue by {query.period}</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data} margin={{ top: 0, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="bucket" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={56} />
              <Tooltip formatter={(v: number) => fmtCur(v)} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={barColors[i % barColors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-3 py-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Payment List</h3>
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">{fmtNum(pagination.total)} lines</span>
        </div>
        {loading ? (
          <div className="py-8 text-center">
            <RefreshCw className="mx-auto h-5 w-5 animate-spin text-indigo-400" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto slim-scrollbar">
              <Table>
                <TableHeader className="bg-slate-50/40">
                  <TableRow className="hover:bg-transparent">
                    {['Paid At', 'Invoice #', 'Reg #', 'Student', 'Program', 'Type', 'Item', 'Amount', 'Source', 'Branch', 'Method', 'TRX / Ref'].map((h) => (
                      <TableHead key={h} className="h-9 whitespace-nowrap py-1.5 text-xs font-black uppercase tracking-widest text-slate-400">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="py-8 text-center text-sm font-bold text-slate-400">
                        {hasLoaded ? 'No payment found for current filters.' : 'Loading payments…'}
                      </TableCell>
                    </TableRow>
                  ) : transactions.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer transition-colors hover:bg-indigo-50/50"
                      onClick={() => openPaymentDetail(row.paymentId)}
                    >
                      <TableCell className="whitespace-nowrap py-2.5 text-sm font-medium text-slate-500">
                        {new Date(row.paidAt).toLocaleString('en-GB', { hour12: false })}
                      </TableCell>
                      <TableCell className="py-2.5 font-mono text-sm text-slate-600">{row.invoiceNumber || '—'}</TableCell>
                      <TableCell className="py-2.5 text-sm font-bold text-slate-700">{row.student.registrationNumber || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap py-2.5 text-sm font-bold text-slate-900">{row.student.fullName}</TableCell>
                      <TableCell className="max-w-[140px] truncate py-2.5 text-sm text-slate-600" title={formatProgramSummary(row)}>
                        {formatProgramSummary(row)}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge className={cn('rounded-full px-2 py-0.5 text-[11px] font-black uppercase', ITEM_TYPE_BADGE[row.itemType || ''] || 'bg-slate-100 text-slate-600')}>
                          {row.itemType ? formatItemTypeLabel(row.itemType) : formatItemTypesSummary(row.itemTypes)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate py-2.5 text-sm text-slate-600" title={row.courseName || row.itemTitle || undefined}>
                        {row.courseName || row.itemTitle || '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-2.5 font-black text-emerald-600">
                        <span className="text-sm">{fmtCur(Number(row.amount || 0))}</span>
                        {showPaymentTotalHint && row.paymentTotal > row.amount && (
                          <span className="block text-[11px] font-bold text-slate-400">of {fmtCur(row.paymentTotal)}</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-2.5 text-sm text-slate-500">
                        {row.enrollmentSource ? SOURCE_LABELS[row.enrollmentSource] || row.enrollmentSource : '—'}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate py-2.5 text-sm text-slate-600" title={row.collectionBranch?.name || row.branch?.name || undefined}>
                        {row.collectionBranch?.name || row.branch?.name || '—'}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-black uppercase text-indigo-700">
                          {row.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[100px] truncate py-2.5 font-mono text-sm text-slate-500" title={row.trxId || undefined}>
                        {row.trxId || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {pagination.total > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-3 py-2">
                <p className="text-sm font-bold text-slate-500">
                  Showing {pageStart}-{pageEnd} of {fmtNum(pagination.total)} lines
                </p>
                <div className="flex items-center gap-1.5">
                  <Select
                    value={String(query.limit)}
                    onValueChange={(value) => updateQuery({ limit: Number(value), page: 1 })}
                  >
                    <SelectTrigger className="h-8 w-20 rounded-md text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FINANCE_PAGE_SIZES.map((size) => (
                        <SelectItem key={size} value={String(size)}>{size} / page</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={loading || pagination.page <= 1}
                    onClick={() => updateQuery({ page: pagination.page - 1 })}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-sm font-bold text-slate-600">
                    {pagination.page} / {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={loading || pagination.page >= pagination.pages}
                    onClick={() => updateQuery({ page: pagination.page + 1 })}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <FinancePaymentDetailModal
        paymentId={query.paymentId || null}
        open={Boolean(query.paymentId)}
        onOpenChange={(open) => {
          if (!open) closePaymentDetail();
        }}
      />
    </div>
  );
}
