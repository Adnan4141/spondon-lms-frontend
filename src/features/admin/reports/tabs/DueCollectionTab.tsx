'use client';

import { useEffect, useState, useCallback } from 'react';
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
import type { ExportFormat } from '@/lib/export';
import { AdminDatePicker, AdminMonthPicker } from '@/features/admin/shared/form/AdminField';
import { cn } from '@/lib/utils';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import { getSourceBranchOptions } from '@/features/admin/accounting/branchSourceUtils';
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
import { ExportButtons } from '../ExportButtons';
import {
  fmtNum,
  fmtCur,
  normalizeSingleDateRange,
  exportFilename,
  exportRows,
  type NamedEntity,
  type BranchOption,
} from '../shared';

export function DueCollectionTab({ branches }: { branches: BranchOption[] }) {
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

