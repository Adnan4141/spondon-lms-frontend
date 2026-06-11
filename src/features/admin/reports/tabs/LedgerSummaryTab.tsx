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

export function LedgerSummaryTab({ branches }: { branches: BranchOption[] }) {
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

