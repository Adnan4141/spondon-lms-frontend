'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  getDueSummary,
  type DueSummaryRow,
  type DueSummaryStudentRow,
} from '@/lib/api/reports';
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
  Building2,
  RefreshCw,
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { DueReminderDrawer } from '../components/DueReminderDrawer';
import { MonthPresetButtons } from '../components/MonthPresetButtons';
import { ExportButtons } from '../ExportButtons';
import {
  fmtNum,
  fmtCur,
  exportFilename,
  exportRows,
  DUE_COLLECTION_PAGE_SIZES,
  type BranchOption,
  type DueCollectionQueryState,
} from '../shared';
import {
  buildDueCollectionApiParams,
  useDueCollectionQuery,
} from '../useDueCollectionQuery';

const STUDENT_EXPORT_COLUMNS = [
  { header: 'Registration', value: (row: DueSummaryStudentRow) => row.registrationNumber || '' },
  { header: 'Student Name', value: (row: DueSummaryStudentRow) => row.fullName },
  { header: 'Mobile', value: (row: DueSummaryStudentRow) => row.mobile },
  { header: 'Branch', value: (row: DueSummaryStudentRow) => row.branchName },
  { header: 'Invoice Count', value: (row: DueSummaryStudentRow) => row.invoiceCount },
  { header: 'Payable', value: (row: DueSummaryStudentRow) => row.totalPayable },
  { header: 'Paid', value: (row: DueSummaryStudentRow) => row.totalPaid },
  { header: 'Due', value: (row: DueSummaryStudentRow) => row.totalDue },
];

async function fetchAllDueStudents(query: DueCollectionQueryState) {
  const res = await getDueSummary({
    ...buildDueCollectionApiParams(query),
    page: 1,
    limit: 'all',
  });
  if (!res.success) {
    throw new Error(res.message || 'Failed to load due summary');
  }
  return res.studentSummaries ?? [];
}

export function DueCollectionTab({ branches }: { branches: BranchOption[] }) {
  const { toast } = useToast();
  const { user } = useAdminSession();
  const smsData = useSmsManagementData(user);
  const { query, updateQuery, applyMonthPreset } = useDueCollectionQuery();

  const [searchDraft, setSearchDraft] = useState(query.search);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DueSummaryRow[]>([]);
  const [studentRows, setStudentRows] = useState<DueSummaryStudentRow[]>([]);
  const [totals, setTotals] = useState<{ totalPayable: number; totalPaid: number; totalDue: number } | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [smsRows, setSmsRows] = useState<DueSummaryStudentRow[]>([]);
  const [smsDrawerOpen, setSmsDrawerOpen] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkConfirmRows, setBulkConfirmRows] = useState<DueSummaryStudentRow[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const activeBranchLabel = query.branchId
    ? branches.find((branch) => branch.id === query.branchId)?.name
    : 'All Branches';
  const sendBlockedMessage = smsData.providerBalanceValue === 'Gateway not configured'
    ? smsData.providerBalanceError
    : undefined;

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
      const res = await getDueSummary(buildDueCollectionApiParams(query));
      if (!res.success) {
        toast({ title: res.message || 'Failed to load due summary', variant: 'destructive' });
        return;
      }
      setData(res.data);
      setTotals(res.totals);
      setStudentRows(res.studentSummaries ?? []);
      setPagination(
        res.pagination ?? {
          page: query.page,
          limit: query.limit,
          total: res.studentSummaries?.length ?? 0,
          pages: 1,
        },
      );
      setSelectedStudentIds([]);
    } catch {
      toast({ title: 'Failed to load due summary', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [query, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedRows = studentRows.filter((row) => selectedStudentIds.includes(row.studentUserId));
  const allSelected = studentRows.length > 0 && selectedStudentIds.length === studentRows.length;
  const bulkConfirmTotalDue = bulkConfirmRows.reduce((sum, row) => sum + row.totalDue, 0);

  const pageStart = studentRows.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const pageEnd = (pagination.page - 1) * pagination.limit + studentRows.length;
  const pageNumbers = useMemo(() => {
    const pages = Math.max(1, pagination.pages);
    const items = new Set<number>([1, pages, pagination.page - 1, pagination.page, pagination.page + 1]);
    return Array.from(items)
      .filter((p) => p >= 1 && p <= pages)
      .sort((a, b) => a - b);
  }, [pagination.page, pagination.pages]);

  function openSmsDrawer(rows: DueSummaryStudentRow[]) {
    if (!rows.length) {
      toast({ title: 'Select at least one due student', variant: 'destructive' });
      return;
    }
    setSmsRows(rows);
    setSmsDrawerOpen(true);
  }

  async function requestBulkSmsDrawer() {
    setBulkLoading(true);
    try {
      const rows = await fetchAllDueStudents(query);
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
    setLoading(true);
    try {
      const rows = pagination.total > studentRows.length
        ? await fetchAllDueStudents(query)
        : studentRows;

      if (rows.length === 0 && data.length === 0) {
        toast({ title: 'No due rows to export', variant: 'destructive' });
        return;
      }

      if (rows.length > 0) {
        await exportRows({
          format,
          filename: exportFilename('due-collection-students'),
          sheetName: 'Due By Student',
          rows,
          columns: STUDENT_EXPORT_COLUMNS,
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
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Export failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap lg:items-end lg:gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Branch</p>
          <Select
            value={query.branchId || 'all'}
            onValueChange={(value) => updateQuery({ branchId: value === 'all' ? '' : value })}
          >
            <SelectTrigger className="h-9 w-full lg:w-56 rounded-xl text-sm">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            onChange={(value) => updateQuery({ month: value, from: '', to: '' })}
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
        <MonthPresetButtons
          month={query.month}
          from={query.from}
          to={query.to}
          onSelect={applyMonthPreset}
          className="w-full lg:w-auto"
        />
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Invoice Status</p>
          <Select
            value={query.status || 'all'}
            onValueChange={(value) => updateQuery({ status: value === 'all' ? '' : value as typeof query.status })}
          >
            <SelectTrigger className="h-9 w-full lg:w-44 rounded-xl text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="ISSUED">Issued</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="WAIVED">Waived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="h-9 w-full lg:w-auto bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white gap-2 justify-center"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
          Refresh
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={bulkLoading || pagination.total === 0}
          onClick={() => void requestBulkSmsDrawer()}
          className="h-9 w-full lg:w-auto gap-2 justify-center"
        >
          {bulkLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
          Send to All Unpaid{query.month ? ` — ${query.month}` : ''}
        </Button>
        <ExportButtons
          onExport={handleExport}
          disabled={loading || (pagination.total === 0 && data.length === 0)}
          className="w-full lg:w-auto justify-end sm:justify-start"
        />
        <p className="w-full text-[11px] text-slate-500">
          From/To applies only when Month is empty; otherwise Month controls the billing period.
        </p>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            {fmtNum(pagination.total)} students
          </span>
        </div>
        {loading ? (
          <div className="py-16 text-center"><RefreshCw className="h-6 w-6 animate-spin text-indigo-400 mx-auto" /></div>
        ) : (
          <>
            <div className="overflow-x-auto slim-scrollbar">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => setSelectedStudentIds(
                          checked ? studentRows.map((row) => row.studentUserId) : [],
                        )}
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
                  ) : studentRows.map((row) => {
                    const studentHref = row.registrationNumber
                      ? `/admin/students/${encodeURIComponent(row.registrationNumber)}`
                      : null;

                    return (
                      <TableRow key={`${row.branchId}:${row.studentUserId}`} className="hover:bg-slate-50/60">
                        <TableCell>
                          <Checkbox
                            checked={selectedStudentIds.includes(row.studentUserId)}
                            onCheckedChange={(checked) => setSelectedStudentIds((prev) => (
                              checked
                                ? [...new Set([...prev, row.studentUserId])]
                                : prev.filter((id) => id !== row.studentUserId)
                            ))}
                          />
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-700">{row.registrationNumber || '—'}</TableCell>
                        <TableCell className="font-bold text-slate-900">
                          {studentHref ? (
                            <Link href={studentHref} className="inline-flex items-center gap-1 hover:text-indigo-600">
                              {row.fullName}
                              <ExternalLink className="h-3 w-3 opacity-40" />
                            </Link>
                          ) : (
                            row.fullName
                          )}
                        </TableCell>
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {pagination.total > 0 ? (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  Showing {pageStart}-{pageEnd} of {fmtNum(pagination.total)} students
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
                      {DUE_COLLECTION_PAGE_SIZES.map((size) => (
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
                  {bulkConfirmRows.length === 1 ? '' : 's'} with a combined due of <strong>{fmtCur(bulkConfirmTotalDue)}</strong>.
                </p>
                <p>
                  Each selected student will receive a due reminder SMS. You can resend reminders later if needed.
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
