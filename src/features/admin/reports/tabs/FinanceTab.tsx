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

export function FinanceTab({ branches, courses }: { branches: BranchOption[]; courses: NamedEntity[] }) {
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

