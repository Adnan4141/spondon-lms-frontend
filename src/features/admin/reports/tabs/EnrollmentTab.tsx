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

export function EnrollmentTab({ branches, courses, programs }: { branches: BranchOption[]; courses: NamedEntity[]; programs: NamedEntity[] }) {
  const { toast } = useToast();
  const [branchId, setBranchId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [programId, setProgramId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EnrollmentReportData[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const dateRange = normalizeSingleDateRange(from, to);
      const res = await getEnrollmentReport({
        branchId: branchId || undefined,
        courseId: courseId || undefined,
        programId: programId || undefined,
        from: dateRange.from,
        to: dateRange.to,
      });
      if (res.success) setData(res.data);
    } catch { toast({ title: 'Failed to load enrollment report', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [branchId, courseId, from, programId, to, toast]);

  useEffect(() => { void load(); }, [load]);

  const totalEnrollments = data.reduce((s, r) => s + r.enrollmentCount, 0);
  const totalPayable = data.reduce((s, r) => s + r.estimatedPayable, 0);

  async function handleExport(format: ExportFormat) {
    if (data.length === 0) {
      toast({ title: 'No enrollment data to export', variant: 'destructive' });
      return;
    }
    await exportRows({
      format,
      filename: exportFilename('enrollment-report'),
      sheetName: 'Enrollment Report',
      rows: data,
      columns: [
        { header: 'Program', value: (row) => row.programName },
        { header: 'Course', value: (row) => row.courseName },
        { header: 'Enrollments', value: (row) => row.enrollmentCount },
        { header: 'Per Student Pay', value: (row) => row.perStudentPay },
        { header: 'Estimated Payable', value: (row) => row.estimatedPayable },
      ],
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="w-56">
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
        <Button onClick={load} disabled={loading} className="h-9 bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          Load
        </Button>
        <ExportButtons onExport={handleExport} disabled={loading || data.length === 0} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-black text-indigo-600">{fmtNum(totalEnrollments)}</p>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">Total Enrollments</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-black text-emerald-600">{fmtCur(totalPayable)}</p>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">Estimated Payable</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center"><RefreshCw className="h-6 w-6 animate-spin text-indigo-400 mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto slim-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  {['Program', 'Course', 'Enrollments', 'Per Student', 'Est. Payable'].map((h) => (
                    <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-400 text-sm font-bold">No enrollment data found.</TableCell></TableRow>
                ) : data.map((row, i) => (
                  <TableRow key={i} className="hover:bg-slate-50/60">
                    <TableCell className="text-xs font-bold text-slate-500">{row.programName}</TableCell>
                    <TableCell className="font-bold text-slate-900">{row.courseName}</TableCell>
                    <TableCell>
                      <Badge className="bg-indigo-100 text-indigo-700 rounded-full font-black text-[10px]">{row.enrollmentCount}</Badge>
                    </TableCell>
                    <TableCell className="font-bold text-slate-700">{fmtCur(row.perStudentPay)}</TableCell>
                    <TableCell className="font-black text-emerald-600">{fmtCur(row.estimatedPayable)}</TableCell>
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

// ─── Course Transactions Tab ──────────────────────────────────────────────────

