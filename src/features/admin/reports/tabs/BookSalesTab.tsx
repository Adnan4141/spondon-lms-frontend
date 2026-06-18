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

export function BookSalesTab({ branches }: { branches: BranchOption[] }) {
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

