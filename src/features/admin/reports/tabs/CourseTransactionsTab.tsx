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

export function CourseTransactionsTab({ courses, branches }: { courses: NamedEntity[]; branches: BranchOption[] }) {
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

