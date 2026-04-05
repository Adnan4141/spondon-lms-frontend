'use client';

import React, { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import {
  getAttendanceSheet,
  recordAttendance,
  type AttendanceSheet,
  type AttendanceStatus,
} from '@/lib/api/attendance';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import { getBatches } from '@/lib/api/batches';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Printer,
  Download,
  FileText,
  Search,
  RefreshCw,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  LayoutGrid,
  Table2,
  GraduationCap,
  Building2,
  Layers,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type CourseRow = { id: string; name: string };
type BranchRow = { id: string; name: string };
type BatchRow = { id: string; name: string };

type AttendanceEditModalState = {
  sessionId: string;
  sessionDate: string;
  studentUserId: string;
  studentName: string;
  currentStatus: string | null;
};

function StatusDot({ status }: { status: string | null }) {
  if (status === 'PRESENT') {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm">
        <CheckCircle2 className="h-4 w-4" />
      </span>
    );
  }
  if (status === 'ABSENT') {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 shadow-sm">
        <XCircle className="h-4 w-4" />
      </span>
    );
  }
  if (status === 'LATE' || status) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600 shadow-sm">
        <Clock className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/80" />
  );
}

function sessionLabel(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function sessionDateFull(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function AttendanceSheetPage() {
  const { toast } = useToast();

  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [batches, setBatches] = useState<BatchRow[]>([]);

  const [filters, setFilters] = useState({
    courseId: '',
    branchId: 'all',
    batchId: 'all',
  });

  const [sheetData, setSheetData] = useState<AttendanceSheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingFilters, setFetchingFilters] = useState(true);
  /** Mobile / tablet: 'cards' is easier to read; 'table' for wide matrix with horizontal scroll */
  const [layoutMode, setLayoutMode] = useState<'cards' | 'table'>('cards');
  const [editAttendance, setEditAttendance] = useState(true);
  const [attendanceModal, setAttendanceModal] = useState<AttendanceEditModalState | null>(null);
  const [modalStatus, setModalStatus] = useState<AttendanceStatus>('PRESENT');
  const [modalSaving, setModalSaving] = useState(false);

  const loadFilters = async () => {
    try {
      setFetchingFilters(true);
      const [coursesRes, branchesRes] = await Promise.all([
        getCourses({ status: 'ACTIVE' }),
        getBranches(),
      ]);
      if (coursesRes.success) setCourses((coursesRes.data as CourseRow[]) || []);
      if (branchesRes.success) setBranches((branchesRes.data as BranchRow[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingFilters(false);
    }
  };

  const loadBatches = async (courseId: string) => {
    if (!courseId || courseId === 'all') {
      setBatches([]);
      return;
    }
    const res = await getBatches({ courseId });
    if (res.success) setBatches((res.data as BatchRow[]) || []);
  };

  useEffect(() => {
    loadFilters();
  }, []);

  const branchName = useMemo(() => {
    if (filters.branchId === 'all') return 'All branches';
    return branches.find((b) => b.id === filters.branchId)?.name ?? '—';
  }, [filters.branchId, branches]);

  const batchName = useMemo(() => {
    if (filters.batchId === 'all') return 'All batches';
    return batches.find((b) => b.id === filters.batchId)?.name ?? '—';
  }, [filters.batchId, batches]);

  const handleGenerateSheet = async () => {
    if (!filters.courseId) {
      toast({
        title: 'Selection required',
        description: 'Choose a course to generate the sheet.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const res = await getAttendanceSheet({
        courseId: filters.courseId,
        branchId: filters.branchId === 'all' ? undefined : filters.branchId,
        batchId: filters.batchId === 'all' ? undefined : filters.batchId,
      });

      if (res.success && res.data) {
        setSheetData(res.data);
        toast({ title: 'Ready', description: 'Attendance sheet loaded.', variant: 'success' });
      } else {
        setSheetData(null);
        toast({
          title: 'No data',
          description: (res as { message?: string }).message || 'Could not build sheet.',
          variant: 'destructive',
        });
      }
    } catch (err: unknown) {
      setSheetData(null);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Request failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const applyAttendancePatch = (
    sessionId: string,
    studentUserId: string,
    row: { id: string; status: string; student: { id: string; fullName: string } }
  ) => {
    setSheetData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sessions: prev.sessions.map((s) => {
          if (s.id !== sessionId) return s;
          const others = s.attendanceRecords.filter((r) => r.studentUserId !== studentUserId);
          return {
            ...s,
            attendanceRecords: [
              ...others,
              {
                id: row.id,
                studentUserId,
                status: row.status,
                student: row.student,
              },
            ],
          };
        }),
      };
    });
  };

  const openAttendanceModal = (
    sessionId: string,
    sessionDate: string,
    studentUserId: string,
    studentName: string,
    current: string | null
  ) => {
    if (!editAttendance) return;
    setModalStatus(current === 'ABSENT' ? 'ABSENT' : 'PRESENT');
    setAttendanceModal({ sessionId, sessionDate, studentUserId, studentName, currentStatus: current });
  };

  const saveAttendanceFromModal = async () => {
    if (!attendanceModal) return;
    setModalSaving(true);
    try {
      const res = await recordAttendance({
        sessionId: attendanceModal.sessionId,
        studentUserId: attendanceModal.studentUserId,
        status: modalStatus,
      });
      if (res.success && res.data) {
        applyAttendancePatch(attendanceModal.sessionId, attendanceModal.studentUserId, {
          id: res.data.id,
          status: res.data.status,
          student:
            res.data.student || {
              id: attendanceModal.studentUserId,
              fullName: attendanceModal.studentName,
            },
        });
        toast({ title: 'Attendance saved', description: modalStatus, variant: 'success' });
        setAttendanceModal(null);
      } else {
        toast({
          title: 'Could not save',
          description: (res as { message?: string }).message || 'Request failed',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Request failed',
        variant: 'destructive',
      });
    } finally {
      setModalSaving(false);
    }
  };

  const handleExportCsv = () => {
    if (!sheetData) return;
    const sep = ',';
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const header = ['Student', 'Mobile', 'Batch', ...sheetData.sessions.map((s) => sessionLabel(s.sessionDate))];
    const lines = [header.map(esc).join(sep)];
    for (const enr of sheetData.enrollments) {
      const batch = enr.batch?.name || '';
      const cells = sheetData.sessions.map((sess) => {
        const r = sess.attendanceRecords.find((x) => x.studentUserId === enr.student.id);
        return r?.status || '';
      });
      lines.push(
        [enr.student.fullName, enr.student.mobile, batch, ...cells].map(esc).join(sep)
      );
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${sheetData.course.code}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'CSV exported', variant: 'success' });
  };

  const handleExportXlsx = async () => {
    if (!sheetData) return;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Attendance');

    // Header row
    const headers = ['Student', 'Mobile', 'Batch', ...sheetData.sessions.map((s) => sessionLabel(s.sessionDate))];
    const headerRow = ws.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      cell.alignment = { horizontal: 'center' };
    });

    // Data rows
    for (const enr of sheetData.enrollments) {
      const cells = sheetData.sessions.map((sess) => {
        const r = sess.attendanceRecords.find((x) => x.studentUserId === enr.student.id);
        return r?.status || '';
      });
      const row = ws.addRow([enr.student.fullName, enr.student.mobile, enr.batch?.name || '', ...cells]);
      cells.forEach((status, i) => {
        const cell = row.getCell(4 + i);
        if (status === 'PRESENT') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        } else if (status === 'ABSENT') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        } else if (status === 'LATE') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        }
      });
    }

    // Auto-width columns
    ws.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        const len = String(cell.value ?? '').length;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(maxLen + 2, 30);
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${sheetData.course.code}-${Date.now()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Excel exported', variant: 'success' });
  };

  if (fetchingFilters) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Loading filters…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-16 text-slate-900 sm:space-y-8 sm:pb-24">
      {/* Header */}
      <header className="print:hidden">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-5 py-8 text-white shadow-xl sm:rounded-[28px] sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge className="border-white/20 bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                Academic records
              </Badge>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">Attendance sheet</h1>
             
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {sheetData ? (
                <>
                  <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white sm:text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-white/40"
                      checked={editAttendance}
                      onChange={(e) => setEditAttendance(e.target.checked)}
                    />
                    Edit attendance
                  </label>
                  <Button
                    onClick={handleExportCsv}
                    className="h-11 rounded-2xl bg-white font-bold text-slate-900 hover:bg-slate-100 sm:h-12"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button
                    onClick={handleExportXlsx}
                    className="h-11 rounded-2xl bg-emerald-500 font-bold text-white hover:bg-emerald-600 sm:h-12"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                  <Button
                    onClick={handlePrint}
                    className="h-11 rounded-2xl bg-white font-bold text-slate-900 hover:bg-slate-100 sm:h-12"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6 print:hidden">
        <div className="mb-4 flex flex-wrap items-center gap-2 sm:mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <GraduationCap className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-[0.15em] text-slate-400">Filters</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Course</label>
            <Select
              value={filters.courseId}
              onValueChange={(v) => {
                setFilters({ ...filters, courseId: v, batchId: 'all' });
                loadBatches(v);
              }}
            >
              <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200 bg-slate-50/80 font-semibold sm:h-12">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent className="max-h-[min(60vh,320px)] rounded-2xl">
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="py-2.5 font-medium">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Branch</label>
            <Select value={filters.branchId} onValueChange={(v) => setFilters({ ...filters, branchId: v })}>
              <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200 bg-slate-50/80 font-semibold sm:h-12">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="font-medium">
                  All branches
                </SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="font-medium">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Batch</label>
            <Select
              value={filters.batchId}
              onValueChange={(v) => setFilters({ ...filters, batchId: v })}
              disabled={!filters.courseId}
            >
              <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200 bg-slate-50/80 font-semibold sm:h-12">
                <SelectValue placeholder="All batches" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="font-medium">
                  All batches
                </SelectItem>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="font-medium">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleGenerateSheet}
            disabled={loading || !filters.courseId}
            className="h-11 w-full rounded-2xl bg-slate-900 font-bold text-white hover:bg-indigo-600 sm:h-12 xl:w-auto"
          >
            {loading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Generate sheet
          </Button>
        </div>
      </section>

      {sheetData ? (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/40 print:rounded-none print:border-0 print:shadow-none">
          {/* Print header */}
          <div className="hidden print:block print:border-b-2 print:border-slate-900 print:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
                  Attendance sheet
                </h1>
                <p className="mt-2 text-base font-bold text-slate-800">
                  {sheetData.course.name}{' '}
                  <span className="font-semibold text-slate-500">({sheetData.course.code})</span>
                </p>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    {branchName}
                  </p>
                  <p className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 shrink-0" />
                    {batchName}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Generated</p>
                <p className="text-sm font-bold text-slate-900">{new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Screen summary bar */}
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6 print:hidden">
            <div className="flex min-w-0 items-start gap-3 sm:items-center">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-black text-slate-900 sm:text-xl">{sheetData.course.name}</h3>
                <p className="text-xs font-semibold text-slate-500">
                  {sheetData.enrollments.length} students · {sheetData.sessions.length} sessions · {branchName} ·{' '}
                  {batchName}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:hidden">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 sm:mr-1">View</span>
              <div className="flex rounded-2xl border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setLayoutMode('cards')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors sm:px-4',
                    layoutMode === 'cards' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('table')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors sm:px-4',
                    layoutMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <Table2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>
            {/* Scroll help removed; rely on native scrollbars/trackpad */}
          </div>

          {/* Mobile / default cards */}
          <div
            className={cn(
              'space-y-3 p-4 sm:space-y-4 sm:p-6 lg:hidden',
              layoutMode === 'table' && 'hidden'
            )}
          >
            <div className="max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-3">
                {sheetData.enrollments.map((enrollment) => (
                  <article
                    key={enrollment.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 shadow-sm ring-1 ring-slate-100/80"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-indigo-600 shadow-inner ring-1 ring-slate-100">
                        {enrollment.student.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black text-slate-900">{enrollment.student.fullName}</p>
                        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          {enrollment.batch?.name || 'No batch'} · {enrollment.student.mobile}
                        </p>
                      </div>
                    </div>
                    {sheetData.sessions.length === 0 ? (
                      <p className="text-sm text-slate-400">No sessions in range.</p>
                    ) : (
                      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {sheetData.sessions.map((session) => {
                          const record = session.attendanceRecords.find((r) => r.studentUserId === enrollment.student.id);
                          const st = record?.status ?? null;
                          return (
                            <li
                              key={session.id}
                              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2"
                            >
                              <span className="min-w-0 text-[11px] font-bold text-slate-600">
                                <Calendar className="mb-0.5 inline h-3 w-3 text-indigo-400" />{' '}
                                {sessionLabel(session.sessionDate)}
                              </span>
                              <button
                                type="button"
                                disabled={!editAttendance}
                                title={editAttendance ? 'Set attendance' : 'Enable editing in the header'}
                                onClick={() =>
                                  openAttendanceModal(
                                    session.id,
                                    session.sessionDate,
                                    enrollment.student.id,
                                    enrollment.student.fullName,
                                    st
                                  )
                                }
                                className="shrink-0 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <StatusDot status={st} />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* Tablet: optional table when user picks table */}
          <div
            className={cn(
              'border-t border-slate-100 p-2 sm:p-4 lg:hidden',
              layoutMode === 'cards' && 'hidden'
            )}
          >
            <p className="mb-2 px-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Scroll horizontally for all sessions
            </p>
            <div className="relative -mx-2 overflow-x-auto overflow-y-auto overscroll-x-contain px-2 pb-2 [scrollbar-width:thin] max-h-[70vh] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 dark:scrollbar-thumb-slate-500 dark:scrollbar-track-slate-800">
              <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-[1] w-8 bg-gradient-to-r from-white to-transparent print:hidden" />
              <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-[1] w-8 bg-gradient-to-l from-white to-transparent print:hidden" />
              <table className="w-max min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="sticky left-0 z-20 min-w-[160px] max-w-[200px] bg-slate-50 px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 shadow-[4px_0_12px_-6px_rgba(15,23,42,0.15)]">
                      Student
                    </th>
                    {sheetData.sessions.map((session) => (
                      <th
                        key={session.id}
                        className="min-w-[76px] px-2 py-3 text-center text-[9px] font-black uppercase tracking-wide text-slate-500"
                      >
                        {sessionLabel(session.sessionDate)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sheetData.enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-slate-50/80">
                      <td className="sticky left-0 z-10 min-w-[160px] max-w-[200px] bg-white px-3 py-3 shadow-[4px_0_12px_-6px_rgba(15,23,42,0.12)]">
                        <p className="truncate font-bold text-slate-800">{enrollment.student.fullName}</p>
                        <p className="truncate text-[10px] text-slate-400">{enrollment.batch?.name || '—'}</p>
                      </td>
                      {sheetData.sessions.map((session) => {
                        const record = session.attendanceRecords.find((r) => r.studentUserId === enrollment.student.id);
                        return (
                          <td key={session.id} className="px-2 py-3 text-center">
                            <button
                              type="button"
                              disabled={!editAttendance}
                              title={editAttendance ? 'Set attendance' : 'Enable editing in the header'}
                              onClick={() =>
                                openAttendanceModal(
                                  session.id,
                                  session.sessionDate,
                                  enrollment.student.id,
                                  enrollment.student.fullName,
                                  record?.status ?? null
                                )
                              }
                              className="mx-auto flex justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <StatusDot status={record?.status ?? null} />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Desktop matrix */}
          <div className="hidden overflow-x-auto overflow-y-auto max-h-[75vh] lg:block print:block scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 dark:scrollbar-thumb-slate-500 dark:scrollbar-track-slate-800">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead className="border-b border-slate-200 bg-slate-50 print:bg-white">
                <tr>
                  <th className="sticky left-0 z-20 min-w-[220px] bg-slate-50 px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 shadow-[6px_0_16px_-8px_rgba(15,23,42,0.2)] print:static print:shadow-none">
                    Student
                  </th>
                  {sheetData.sessions.map((session) => (
                    <th
                      key={session.id}
                      className="min-w-[96px] border-l border-slate-100 px-3 py-4 text-center text-[10px] font-black uppercase tracking-wide text-slate-500"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                        <span>{sessionLabel(session.sessionDate)}</span>
                      </div>
                    </th>
                  ))}
                  {sheetData.sessions.length === 0 && (
                    <th className="px-8 py-10 text-center text-xs font-bold text-slate-400">No sessions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sheetData.enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-slate-50/60 print:hover:bg-transparent">
                    <td className="sticky left-0 z-10 min-w-[220px] bg-white px-4 py-4 shadow-[6px_0_16px_-8px_rgba(15,23,42,0.15)] print:static print:bg-white print:shadow-none">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-600">
                          {enrollment.student.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-800">{enrollment.student.fullName}</p>
                          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            {enrollment.batch?.name || 'No batch'} · {enrollment.student.mobile}
                          </p>
                        </div>
                      </div>
                    </td>
                    {sheetData.sessions.map((session) => {
                      const record = session.attendanceRecords.find((r) => r.studentUserId === enrollment.student.id);
                      return (
                        <td key={session.id} className="border-l border-slate-100 px-3 py-4 text-center">
                          <button
                            type="button"
                            disabled={!editAttendance}
                            title={editAttendance ? 'Set attendance' : 'Enable editing in the header'}
                            onClick={() =>
                              openAttendanceModal(
                                session.id,
                                session.sessionDate,
                                enrollment.student.id,
                                enrollment.student.fullName,
                                record?.status ?? null
                              )
                            }
                            className="mx-auto flex justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <StatusDot status={record?.status ?? null} />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="border-t border-slate-100 bg-slate-50/40 px-4 py-6 sm:px-8 sm:py-8 print:mt-12 print:border-0 print:bg-white">
            <div className="hidden print:grid print:grid-cols-3 print:gap-12 print:pt-8">
              <div className="border-t border-slate-900 pt-2 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest">Instructor signature</p>
              </div>
              <div className="border-t border-slate-900 pt-2 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest">Branch controller</p>
              </div>
              <div className="border-t border-slate-900 pt-2 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest">Internal audit</p>
              </div>
            </div>
            <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-slate-400 print:hidden">
              End of attendance registry
            </p>
          </footer>
        </section>
      ) : (
        <section className="flex flex-col items-center justify-center gap-6 rounded-3xl border-2 border-dashed border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-6 py-16 text-center sm:rounded-[32px] sm:py-20 print:hidden">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/40">
            <Users className="h-10 w-10 text-slate-300" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-xl font-black text-slate-700">No sheet yet</h3>
            <p className="text-sm font-medium leading-relaxed text-slate-500">
              Pick a course (and optionally branch or batch), then tap <strong>Generate sheet</strong>.
            </p>
          </div>
          {courses[0]?.id ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-2xl border-slate-200 font-bold text-indigo-600 hover:bg-indigo-50"
              onClick={() => {
                const id = courses[0].id;
                setFilters((f) => ({ ...f, courseId: id, batchId: 'all' }));
                loadBatches(id);
              }}
            >
              Use first course in list
            </Button>
          ) : null}
        </section>
      )}

      <Dialog
        open={!!attendanceModal}
        onOpenChange={(open) => {
          if (!open) setAttendanceModal(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-3xl border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight">Edit attendance</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Choose present or absent for this class session.
            </DialogDescription>
          </DialogHeader>
          {attendanceModal ? (
            <div className="space-y-5 py-2">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Session date
                </Label>
                <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900">
                  {sessionDateFull(attendanceModal.sessionDate)}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Student
                </Label>
                <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900">
                  {attendanceModal.studentName}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Status
                </Label>
                <Select
                  value={modalStatus}
                  onValueChange={(v) => setModalStatus(v as AttendanceStatus)}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="PRESENT" className="font-semibold">
                      Present
                    </SelectItem>
                    <SelectItem value="ABSENT" className="font-semibold">
                      Absent
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl font-bold"
              onClick={() => setAttendanceModal(null)}
              disabled={modalSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-2xl bg-slate-900 font-bold hover:bg-indigo-600"
              onClick={() => void saveAttendanceFromModal()}
              disabled={modalSaving || !attendanceModal}
            >
              {modalSaving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
