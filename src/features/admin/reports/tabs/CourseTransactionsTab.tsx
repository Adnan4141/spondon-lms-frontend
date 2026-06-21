'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  getCourseTransactions,
  type CourseTransactionData,
  type CourseTransactionTotals,
} from '@/lib/api/reports';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { AdminDatePicker } from '@/features/admin/shared/form/AdminField';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  RefreshCw,
  ExternalLink,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import { ExportButtons } from '../ExportButtons';
import { PaymentDatePresetButtons } from '../components/PaymentDatePresetButtons';
import {
  fmtNum,
  fmtCur,
  exportFilename,
  exportRows,
  COURSE_TRANSACTIONS_PAGE_SIZES,
  type CourseTransactionsQueryState,
  type NamedEntity,
  type BranchOption,
} from '../shared';
import {
  buildCourseTransactionsApiParams,
  useCourseTransactionsQuery,
} from '../useCourseTransactionsQuery';

function buildExportColumns(showBillingDetails: boolean) {
  const columns: Array<{
    header: string;
    value: (row: CourseTransactionData) => string | number | boolean | null | undefined;
  }> = [
    { header: 'Student', value: (row: CourseTransactionData) => row.student?.fullName ?? '' },
    { header: 'Registration', value: (row: CourseTransactionData) => row.student?.registrationNumber ?? '' },
    { header: 'Mobile', value: (row: CourseTransactionData) => row.student?.mobile ?? '' },
    { header: 'Branch', value: (row: CourseTransactionData) => row.branch?.name ?? '' },
    { header: 'Invoice', value: (row: CourseTransactionData) => row.invoiceNumber ?? row.invoiceId },
    { header: 'Billing Month', value: (row: CourseTransactionData) => row.month ?? '' },
  ];

  if (showBillingDetails) {
    columns.push(
      { header: 'Gross', value: (row: CourseTransactionData) => row.gross },
      { header: 'Discount', value: (row: CourseTransactionData) => row.discount },
      { header: 'Course Status', value: (row: CourseTransactionData) => row.courseStatus },
    );
  }

  columns.push(
    { header: 'Net', value: (row: CourseTransactionData) => row.net },
    { header: 'Collected', value: (row: CourseTransactionData) => row.paid },
    { header: 'Payment Date', value: (row: CourseTransactionData) => row.lastPaymentDate ?? '' },
  );

  return columns;
}

async function fetchAllCourseTransactionRows(query: CourseTransactionsQueryState) {
  const res = await getCourseTransactions({
    ...buildCourseTransactionsApiParams(query),
    page: 1,
    limit: 'all',
  });
  if (!res.success) {
    throw new Error(res.message || 'Failed to load transactions');
  }
  return res.data;
}

function getCollectedTotal(totals: CourseTransactionTotals) {
  return totals.collected ?? totals.paid ?? 0;
}

export function CourseTransactionsTab({
  courses,
  branches,
}: {
  courses: NamedEntity[];
  branches: BranchOption[];
}) {
  const { toast } = useToast();
  const { query, updateQuery, applyPaymentDatePreset } = useCourseTransactionsQuery();

  const [searchDraft, setSearchDraft] = useState(query.search);
  const [showBillingDetails, setShowBillingDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CourseTransactionData[]>([]);
  const [totals, setTotals] = useState<CourseTransactionTotals | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });

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
    if (!query.courseId) {
      setData([]);
      setTotals(null);
      setPagination({ page: 1, limit: query.limit, total: 0, pages: 1 });
      return;
    }

    setLoading(true);
    try {
      const res = await getCourseTransactions(buildCourseTransactionsApiParams(query));
      if (!res.success) {
        toast({ title: res.message || 'Failed to load transactions', variant: 'destructive' });
        return;
      }

      setData(res.data);
      setTotals(res.totals ?? null);
      setPagination(
        res.pagination ?? {
          page: query.page,
          limit: query.limit,
          total: res.data.length,
          pages: 1,
        },
      );
    } catch {
      toast({ title: 'Failed to load transactions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [query, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const pageStart = data.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const pageEnd = (pagination.page - 1) * pagination.limit + data.length;
  const pageNumbers = useMemo(() => {
    const pages = Math.max(1, pagination.pages);
    const items = new Set<number>([1, pages, pagination.page - 1, pagination.page, pagination.page + 1]);
    return Array.from(items)
      .filter((p) => p >= 1 && p <= pages)
      .sort((a, b) => a - b);
  }, [pagination.page, pagination.pages]);

  const tableHeaders = useMemo(
    () => [
      'Student',
      'Reg #',
      'Mobile',
      'Branch',
      'Invoice',
      'Billing month',
      ...(showBillingDetails ? ['Gross', 'Discount', 'Course status'] : []),
      'Net',
      'Collected',
      'Payment date',
    ],
    [showBillingDetails],
  );

  async function handleExport(format: ExportFormat) {
    if (!query.courseId) {
      toast({ title: 'Select a course first', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const rows = pagination.total > data.length
        ? await fetchAllCourseTransactionRows(query)
        : data;

      if (rows.length === 0) {
        toast({ title: 'No transaction rows to export', variant: 'destructive' });
        return;
      }

      await exportRows({
        format,
        filename: exportFilename('course-transactions'),
        sheetName: 'Course Transactions',
        rows,
        columns: buildExportColumns(showBillingDetails),
      });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Export failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const collectedTotal = totals ? getCollectedTotal(totals) : 0;
  const transactionCount = totals?.transactionCount ?? pagination.total;
  const avgCollected = transactionCount > 0 ? collectedTotal / transactionCount : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap lg:items-end lg:gap-3">
        <div className="flex-1 min-w-48">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Course *</p>
          <SearchableSelect
            value={query.courseId}
            onValueChange={(value) => updateQuery({ courseId: value })}
            placeholder="Select a course..."
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
        <div className="w-full lg:w-56">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Branch</p>
          <SearchableSelect
            value={query.branchId}
            onValueChange={(value) => updateQuery({ branchId: value })}
            placeholder="All Branches"
            options={[
              { value: '', label: 'All Branches' },
              ...branches.map((b) => ({ value: b.id, label: b.name })),
            ]}
          />
        </div>
        <div className="w-full lg:w-56">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Search</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Name, reg #, mobile"
              className="h-9 rounded-xl pl-9 text-sm"
            />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Payment from</p>
          <AdminDatePicker
            className="w-full lg:w-44"
            value={query.from}
            onChange={(value) => updateQuery({ from: value })}
            placeholder="From date"
          />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Payment to</p>
          <AdminDatePicker
            className="w-full lg:w-44"
            value={query.to}
            onChange={(value) => updateQuery({ to: value })}
            placeholder="To date"
          />
        </div>
        <PaymentDatePresetButtons
          from={query.from}
          to={query.to}
          onSelect={applyPaymentDatePreset}
          className="w-full lg:w-auto"
        />
        <label className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600">
          <Checkbox
            checked={showBillingDetails}
            onCheckedChange={(checked) => setShowBillingDetails(checked === true)}
          />
          Show billing details
        </label>
        <Button
          type="button"
          onClick={() => void load()}
          disabled={loading || !query.courseId}
          className="h-9 w-full lg:w-auto bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white gap-2 justify-center"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
          Refresh
        </Button>
        <ExportButtons
          onExport={handleExport}
          disabled={loading || !query.courseId || pagination.total === 0}
          className="w-full lg:w-auto justify-end sm:justify-start"
        />
        <p className="w-full text-[11px] text-slate-500">
          Course payments collected between the selected dates. Billing month is shown for reference only.
        </p>
      </div>

      {totals && pagination.total > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { label: 'Collected', value: fmtCur(collectedTotal), color: 'text-emerald-600', icon: TrendingUp },
            { label: 'Transactions', value: fmtNum(transactionCount), color: 'text-indigo-600', icon: Receipt },
            {
              label: 'Avg / transaction',
              value: transactionCount > 0 ? fmtCur(avgCollected) : '—',
              color: 'text-slate-800',
              icon: BarChart3,
            },
            { label: 'Net payable', value: fmtCur(totals.netPayable), color: 'text-slate-800', icon: BarChart3 },
            ...(showBillingDetails
              ? [
                  { label: 'Gross', value: fmtCur(totals.gross), color: 'text-slate-800', icon: BarChart3 },
                  { label: 'Discount', value: fmtCur(totals.discount), color: 'text-slate-500', icon: BarChart3 },
                ]
              : []),
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className={cn('text-lg font-black', kpi.color)}>{kpi.value}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-400 mx-auto" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto slim-scrollbar">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    {tableHeaders.map((h) => (
                      <TableHead
                        key={h}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!query.courseId ? (
                    <TableRow>
                      <TableCell colSpan={tableHeaders.length} className="py-12 text-center text-slate-400 text-sm font-bold">
                        Select a course to load transactions.
                      </TableCell>
                    </TableRow>
                  ) : data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={tableHeaders.length} className="py-12 text-center text-slate-400 text-sm font-bold">
                        No payments found for the selected date range.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => {
                      const studentHref = row.student?.registrationNumber
                        ? `/admin/students/${encodeURIComponent(row.student.registrationNumber)}`
                        : null;

                      return (
                        <TableRow key={row.id} className="hover:bg-slate-50/60">
                          <TableCell className="font-bold text-slate-900">
                            {studentHref ? (
                              <Link href={studentHref} className="inline-flex items-center gap-1 hover:text-indigo-600">
                                {row.student?.fullName ?? '—'}
                                <ExternalLink className="h-3 w-3 opacity-40" />
                              </Link>
                            ) : (
                              row.student?.fullName ?? '—'
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-slate-600">
                            {row.student?.registrationNumber ?? '—'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">{row.student?.mobile ?? '—'}</TableCell>
                          <TableCell className="text-xs text-slate-500">{row.branch?.name ?? '—'}</TableCell>
                          <TableCell className="text-xs font-mono text-slate-600">
                            {row.invoiceNumber ?? `${row.invoiceId.slice(0, 8)}…`}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">{row.month ?? '—'}</TableCell>
                          {showBillingDetails ? (
                            <>
                              <TableCell className="text-right text-sm font-semibold text-slate-700">
                                {fmtCur(row.gross)}
                              </TableCell>
                              <TableCell className="text-right text-sm text-slate-500">−{fmtCur(row.discount)}</TableCell>
                              <TableCell>
                                <Badge
                                  className={cn(
                                    'rounded-full text-[10px] font-black uppercase px-2',
                                    row.courseStatus === 'PAID' && 'bg-emerald-100 text-emerald-700',
                                    row.courseStatus === 'PARTIAL' && 'bg-amber-100 text-amber-700',
                                    row.courseStatus === 'UNPAID' && 'bg-rose-100 text-rose-700',
                                    row.courseStatus === 'WAIVED' && 'bg-purple-100 text-purple-700',
                                  )}
                                >
                                  {row.courseStatus}
                                </Badge>
                              </TableCell>
                            </>
                          ) : null}
                          <TableCell className="text-right text-sm font-bold text-slate-800">{fmtCur(row.net)}</TableCell>
                          <TableCell className="text-right text-sm font-semibold text-emerald-600">{fmtCur(row.paid)}</TableCell>
                          <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                            {row.lastPaymentDate
                              ? new Date(row.lastPaymentDate).toLocaleDateString('en-GB')
                              : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {query.courseId && pagination.total > 0 ? (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  Showing {pageStart}-{pageEnd} of {fmtNum(pagination.total)} transactions
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={String(query.limit)}
                    onValueChange={(value) => updateQuery({ limit: Number(value), page: 1 }, { resetPage: false })}
                  >
                    <SelectTrigger className="h-8 w-[96px] rounded-lg text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COURSE_TRANSACTIONS_PAGE_SIZES.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size} / page
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={loading || pagination.page <= 1}
                    onClick={() => updateQuery({ page: pagination.page - 1 }, { resetPage: false })}
                    className="h-8"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </Button>
                  {pageNumbers.map((p, idx) => {
                    const prev = pageNumbers[idx - 1];
                    const gap = prev && p - prev > 1;
                    return (
                      <span key={p} className="flex items-center gap-1">
                        {gap ? <span className="px-1.5 text-xs text-slate-400">…</span> : null}
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => updateQuery({ page: p }, { resetPage: false })}
                          className={cn(
                            'h-8 min-w-8 rounded-lg border px-2 text-xs font-medium transition-colors',
                            p === pagination.page
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                          )}
                        >
                          {p}
                        </button>
                      </span>
                    );
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={loading || pagination.page >= pagination.pages}
                    onClick={() => updateQuery({ page: pagination.page + 1 }, { resetPage: false })}
                    className="h-8"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
