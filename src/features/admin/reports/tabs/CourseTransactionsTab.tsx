'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  getCourseTransactions,
  type CourseTransactionData,
  type CourseTransactionTotals,
  type DueSummaryStudentRow,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { ExportFormat } from '@/lib/export';
import { AdminDatePicker, AdminMonthPicker } from '@/features/admin/shared/form/AdminField';
import { cn } from '@/lib/utils';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import { useSmsManagementData } from '@/features/admin/sms/hooks/useSmsManagement';
import {
  BarChart3,
  RefreshCw,
  MessageSquare,
  ExternalLink,
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
} from 'lucide-react';
import { DueReminderDrawer } from '../components/DueReminderDrawer';
import { ExportButtons } from '../ExportButtons';
import {
  fmtNum,
  fmtCur,
  exportFilename,
  exportRows,
  COURSE_TRANSACTIONS_PAGE_SIZES,
  getCurrentMonthLabel,
  type CourseTransactionsPaymentStatus,
  type CourseTransactionsQueryState,
  type NamedEntity,
  type BranchOption,
} from '../shared';
import {
  buildCourseTransactionsApiParams,
  useCourseTransactionsQuery,
} from '../useCourseTransactionsQuery';

const STATUS_CARDS: { key: CourseTransactionsPaymentStatus; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PAID', label: 'Paid' },
  { key: 'PARTIAL', label: 'Partial' },
  { key: 'UNPAID', label: 'Unpaid' },
  { key: 'WAIVED', label: 'Waived' },
];

const EXPORT_COLUMNS = [
  { header: 'Student', value: (row: CourseTransactionData) => row.student?.fullName ?? '' },
  { header: 'Registration', value: (row: CourseTransactionData) => row.student?.registrationNumber ?? '' },
  { header: 'Mobile', value: (row: CourseTransactionData) => row.student?.mobile ?? '' },
  { header: 'Branch', value: (row: CourseTransactionData) => row.branch?.name ?? '' },
  { header: 'Invoice', value: (row: CourseTransactionData) => row.invoiceNumber ?? row.invoiceId },
  { header: 'Month', value: (row: CourseTransactionData) => row.month ?? '' },
  { header: 'Gross', value: (row: CourseTransactionData) => row.gross },
  { header: 'Discount', value: (row: CourseTransactionData) => row.discount },
  { header: 'Waived', value: (row: CourseTransactionData) => row.waived ?? 0 },
  { header: 'Net', value: (row: CourseTransactionData) => row.net },
  { header: 'Paid', value: (row: CourseTransactionData) => row.paid },
  { header: 'Due', value: (row: CourseTransactionData) => row.due },
  { header: 'Progress', value: (row: CourseTransactionData) => row.progressLabel },
  { header: 'Course Status', value: (row: CourseTransactionData) => row.courseStatus },
  { header: 'Invoice Status', value: (row: CourseTransactionData) => row.status },
  { header: 'Last Payment', value: (row: CourseTransactionData) => row.lastPaymentDate ?? '' },
  { header: 'Due Date', value: (row: CourseTransactionData) => row.nextPaymentDueDate ?? '' },
];

function aggregateDueReminderRows(
  rows: CourseTransactionData[],
  courseName: string,
): DueSummaryStudentRow[] {
  const byStudent = new Map<string, DueSummaryStudentRow>();

  for (const row of rows) {
    if (row.due <= 0 || !row.student) continue;

    const existing = byStudent.get(row.studentUserId);
    if (existing) {
      existing.invoiceCount += 1;
      existing.totalPayable += row.net;
      existing.totalPaid += row.paid;
      existing.totalDue += row.due;
      if (
        row.nextPaymentDueDate
        && (!existing.nextDueDate || row.nextPaymentDueDate < existing.nextDueDate)
      ) {
        existing.nextDueDate = row.nextPaymentDueDate;
      }
      continue;
    }

    byStudent.set(row.studentUserId, {
      studentUserId: row.studentUserId,
      fullName: row.student.fullName,
      mobile: row.student.mobile ?? '',
      registrationNumber: row.student.registrationNumber,
      branchId: row.branchId,
      branchName: row.branch?.name ?? '',
      invoiceCount: 1,
      totalPayable: row.net,
      totalPaid: row.paid,
      totalDue: row.due,
      courseSummary: courseName,
      programSummary: null,
      nextDueDate: row.nextPaymentDueDate ?? null,
    });
  }

  return [...byStudent.values()];
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

export function CourseTransactionsTab({
  courses,
  branches,
}: {
  courses: NamedEntity[];
  branches: BranchOption[];
}) {
  const { toast } = useToast();
  const { user } = useAdminSession();
  const smsData = useSmsManagementData(user);
  const { query, updateQuery, applyCurrentMonth } = useCourseTransactionsQuery();

  const [searchDraft, setSearchDraft] = useState(query.search);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CourseTransactionData[]>([]);
  const [totals, setTotals] = useState<CourseTransactionTotals | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [smsRows, setSmsRows] = useState<DueSummaryStudentRow[]>([]);
  const [smsDrawerOpen, setSmsDrawerOpen] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkConfirmRows, setBulkConfirmRows] = useState<DueSummaryStudentRow[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const courseName = courses.find((c) => c.id === query.courseId)?.name ?? 'course fees';
  const activeBranchLabel = query.branchId
    ? branches.find((branch) => branch.id === query.branchId)?.name
    : 'All Branches';
  const sendBlockedMessage = smsData.providerBalanceValue === 'Gateway not configured'
    ? smsData.providerBalanceError
    : undefined;
  const currentMonthLabel = getCurrentMonthLabel();

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
      setSelectedStudentIds([]);
    } catch {
      toast({ title: 'Failed to load transactions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [query, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const dueReminderCandidates = useMemo(
    () => aggregateDueReminderRows(data, courseName),
    [courseName, data],
  );
  const selectedReminderRows = useMemo(
    () => dueReminderCandidates.filter((row) => selectedStudentIds.includes(row.studentUserId)),
    [dueReminderCandidates, selectedStudentIds],
  );
  const allDueSelected = dueReminderCandidates.length > 0
    && selectedStudentIds.length === dueReminderCandidates.length;
  const bulkConfirmTotalDue = bulkConfirmRows.reduce((sum, row) => sum + row.totalDue, 0);
  const showWaivedColumn = query.includeWaived || (totals?.waived ?? 0) > 0;

  const pageStart = data.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const pageEnd = (pagination.page - 1) * pagination.limit + data.length;
  const pageNumbers = useMemo(() => {
    const pages = Math.max(1, pagination.pages);
    const items = new Set<number>([1, pages, pagination.page - 1, pagination.page, pagination.page + 1]);
    return Array.from(items)
      .filter((p) => p >= 1 && p <= pages)
      .sort((a, b) => a - b);
  }, [pagination.page, pagination.pages]);

  function openSmsDrawer(rows: DueSummaryStudentRow[]) {
    if (!rows.length) {
      toast({ title: 'Select at least one student with due', variant: 'destructive' });
      return;
    }
    setSmsRows(rows);
    setSmsDrawerOpen(true);
  }

  async function requestBulkSmsDrawer() {
    if (!query.courseId) return;
    setBulkLoading(true);
    try {
      const allRows = await fetchAllCourseTransactionRows(query);
      const rows = aggregateDueReminderRows(allRows, courseName);
      if (!rows.length) {
        toast({ title: 'No unpaid students found for current filters', variant: 'destructive' });
        return;
      }
      setBulkConfirmRows(rows);
      setBulkConfirmOpen(true);
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Failed to load unpaid students',
        variant: 'destructive',
      });
    } finally {
      setBulkLoading(false);
    }
  }

  function confirmBulkSmsDrawer() {
    openSmsDrawer(bulkConfirmRows);
    setBulkConfirmOpen(false);
    setBulkConfirmRows([]);
  }

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
        columns: EXPORT_COLUMNS,
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

  const tableHeaders = [
    ...(dueReminderCandidates.length > 0 ? [''] : []),
    'Student',
    'Reg #',
    'Mobile',
    'Branch',
    'Invoice / Month',
    'Gross',
    'Discount',
    ...(showWaivedColumn ? ['Waived'] : []),
    'Net',
    'Paid',
    'Due',
    'Progress',
    'Course status',
    'Invoice',
    'Last payment',
    'Due date',
    ...(dueReminderCandidates.length > 0 ? ['SMS'] : []),
  ];

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
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Month (YYYY-MM)</p>
          <AdminMonthPicker
            className="w-full lg:w-48"
            value={query.month}
            onChange={(value) => updateQuery({ month: value })}
            placeholder="Select month"
          />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">From</p>
          <AdminDatePicker
            className="w-full lg:w-44"
            value={query.from}
            onChange={(value) => updateQuery({ from: value })}
            placeholder="From date"
          />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">To</p>
          <AdminDatePicker
            className="w-full lg:w-44"
            value={query.to}
            onChange={(value) => updateQuery({ to: value })}
            placeholder="To date"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={applyCurrentMonth}
          className="h-9 w-full lg:w-auto gap-2 justify-center"
        >
          <CalendarRange className="h-4 w-4" />
          This Month — {currentMonthLabel}
        </Button>
        <label className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600">
          <Checkbox
            checked={query.includeWaived}
            onCheckedChange={(checked) => updateQuery({ includeWaived: checked === true })}
          />
          Include waived invoices
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
        <Button
          type="button"
          variant="outline"
          disabled={!query.courseId || bulkLoading}
          onClick={() => void requestBulkSmsDrawer()}
          className="h-9 w-full lg:w-auto gap-2 justify-center"
        >
          {bulkLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
          Send to All Unpaid{query.month ? ` — ${query.month}` : ''}
        </Button>
        <ExportButtons
          onExport={handleExport}
          disabled={loading || !query.courseId || pagination.total === 0}
          className="w-full lg:w-auto justify-end sm:justify-start"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_CARDS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => updateQuery({ paymentStatus: c.key })}
            className={cn(
              'rounded-full border px-4 py-1.5 text-xs font-bold transition-colors',
              query.paymentStatus === c.key
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {selectedReminderRows.length > 0 ? (
        <div className="sticky top-16 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-blue-900">
            {selectedReminderRows.length} students selected with dues
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setSelectedStudentIds([])}>
              Clear
            </Button>
            <Button type="button" size="sm" onClick={() => openSmsDrawer(selectedReminderRows)} className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Send Due Reminder
            </Button>
          </div>
        </div>
      ) : null}

      {totals && pagination.total > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
          {[
            { label: 'Gross', value: fmtCur(totals.gross), color: 'text-slate-800' },
            { label: 'Discount', value: fmtCur(totals.discount), color: 'text-slate-500' },
            ...(totals.waived ? [{ label: 'Waived', value: fmtCur(totals.waived), color: 'text-purple-600' }] : []),
            { label: 'Net payable', value: fmtCur(totals.netPayable), color: 'text-slate-800' },
            { label: 'Paid', value: fmtCur(totals.paid), color: 'text-emerald-600' },
            { label: 'Due', value: fmtCur(totals.due), color: 'text-rose-600' },
            { label: 'Collection', value: `${totals.collectionPercent}%`, color: 'text-indigo-600' },
            {
              label: 'Paid / Part / Unpaid / Waived',
              value: `${totals.paidCount}/${totals.partialCount}/${totals.unpaidCount}/${totals.waivedCount ?? 0}`,
              color: 'text-slate-800',
            },
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
                    {tableHeaders.map((h, index) => (
                      <TableHead
                        key={h || `col-${index}`}
                        className={cn(
                          'text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap',
                          h === '' && 'w-10',
                          h === 'SMS' && 'text-right',
                        )}
                      >
                        {h === '' && dueReminderCandidates.length > 0 ? (
                          <Checkbox
                            checked={allDueSelected}
                            onCheckedChange={(checked) => setSelectedStudentIds(
                              checked ? dueReminderCandidates.map((row) => row.studentUserId) : [],
                            )}
                          />
                        ) : (
                          h
                        )}
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
                        No transactions found for current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => {
                      const reminderRow = dueReminderCandidates.find(
                        (candidate) => candidate.studentUserId === row.studentUserId,
                      );
                      const canSelect = Boolean(reminderRow);
                      const studentHref = row.student?.registrationNumber
                        ? `/admin/students/${encodeURIComponent(row.student.registrationNumber)}`
                        : null;

                      return (
                        <TableRow key={row.id} className="hover:bg-slate-50/60">
                          {dueReminderCandidates.length > 0 ? (
                            <TableCell>
                              {canSelect ? (
                                <Checkbox
                                  checked={selectedStudentIds.includes(row.studentUserId)}
                                  onCheckedChange={(checked) => setSelectedStudentIds((prev) => (
                                    checked
                                      ? [...new Set([...prev, row.studentUserId])]
                                      : prev.filter((id) => id !== row.studentUserId)
                                  ))}
                                />
                              ) : null}
                            </TableCell>
                          ) : null}
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
                          <TableCell className="text-xs text-slate-600">
                            <span className="font-mono">{row.invoiceNumber ?? `${row.invoiceId.slice(0, 8)}…`}</span>
                            {row.month ? <span className="block text-slate-400">{row.month}</span> : null}
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold text-slate-700">{fmtCur(row.gross)}</TableCell>
                          <TableCell className="text-right text-sm text-slate-500">−{fmtCur(row.discount)}</TableCell>
                          {showWaivedColumn ? (
                            <TableCell className="text-right text-sm text-purple-600">
                              {(row.waived ?? 0) > 0 ? fmtCur(row.waived ?? 0) : '—'}
                            </TableCell>
                          ) : null}
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
                                row.courseStatus === 'WAIVED' && 'bg-purple-100 text-purple-700',
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
                            {row.lastPaymentDate
                              ? new Date(row.lastPaymentDate).toLocaleDateString('en-GB')
                              : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                            {row.nextPaymentDueDate
                              ? new Date(row.nextPaymentDueDate).toLocaleDateString('en-GB')
                              : '—'}
                          </TableCell>
                          {dueReminderCandidates.length > 0 ? (
                            <TableCell className="text-right">
                              {reminderRow ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openSmsDrawer([reminderRow])}
                                  aria-label={`Send due SMS to ${row.student?.fullName ?? 'student'}`}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              ) : null}
                            </TableCell>
                          ) : null}
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

      <DueReminderDrawer
        open={smsDrawerOpen}
        onOpenChange={setSmsDrawerOpen}
        rows={smsRows}
        branches={branches}
        actor={user}
        month={query.month}
        branchLabel={activeBranchLabel}
        filterBranchId={query.branchId || undefined}
        config={smsData.config}
        templates={smsData.templates}
        orgBalance={smsData.orgBalance}
        branchBalances={smsData.branchBalances}
        sendBlockedMessage={sendBlockedMessage}
        onSuccess={() => {
          setSelectedStudentIds([]);
          void load();
        }}
      />

      <AlertDialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send due reminders to all unpaid students?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  You are about to review SMS for <strong>{fmtNum(bulkConfirmRows.length)}</strong> student
                  {bulkConfirmRows.length === 1 ? '' : 's'} with a combined due of <strong>{fmtCur(bulkConfirmTotalDue)}</strong>
                  {' '}for <strong>{courseName}</strong>.
                </p>
                <p>
                  Students already reminded for <strong>{query.month || new Date().toISOString().slice(0, 7)}</strong> will be skipped automatically.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkSmsDrawer}>Continue to Review</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
