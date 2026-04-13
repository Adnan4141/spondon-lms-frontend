'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ExcelJS from 'exceljs';
import { getPrograms } from '@/lib/api/programs';
import { getCourses } from '@/lib/api/courses';
import { getBranches, type Branch } from '@/lib/api/branches';
import { getBatches, type Batch } from '@/lib/api/batches';
import { getRoutineSlots } from '@/lib/api/routine';
import { getEnrollments } from '@/lib/api/enrollments';
import { getStudents } from '@/lib/api/students';
import type { Program, Course } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Lock,
  Printer,
  RefreshCw,
  Search,
  Settings2,
  Upload,
  Users,
  X,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type AttendanceStatus = 'P' | 'A' | 'L';

interface StudentRow {
  id: string;
  fullName: string;
  regNo: string;
}

interface DateColumn {
  dateStr: string; // YYYY-MM-DD
  label: string;   // dd-MMM
  isFuture: boolean;
  dayOfWeek: number;
}

interface StoredData {
  meta: {
    batchId: string;
    batchName: string;
    courseId: string;
    courseName: string;
    programId: string;
    programName: string;
    branchId: string;
    branchName: string;
  };
  students: StudentRow[];
  routineDays: number[];
  lockAfterDays: number;
  lockedDates: string[];
  autoAbsentEnabled: boolean;
  attendance: Record<string, Record<string, AttendanceStatus | null>>;
  lastUpdated: string;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const STORAGE_PREFIX = 'attendance_v1_';
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STATUS_CYCLE: (AttendanceStatus | null)[] = [null, 'P', 'A', 'L'];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function dateToYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(ymd: string): string {
  const [y, m, day] = ymd.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(day).padStart(2, '0')}-${months[m - 1]}`;
}

function todayYMD(): string {
  return dateToYMD(new Date());
}

function loadStored(batchId: string): StoredData | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + batchId);
    return raw ? (JSON.parse(raw) as StoredData) : null;
  } catch {
    return null;
  }
}

function saveStored(data: StoredData) {
  localStorage.setItem(STORAGE_PREFIX + data.meta.batchId, JSON.stringify({ ...data, lastUpdated: new Date().toISOString() }));
}

function parseCsv(text: string): string[][] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(',').map((c) => c.trim().replace(/^"|"$/g, '')));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────
// Status Cell Component
// ─────────────────────────────────────────────────────────────

function StatusCell({ status, onClick, disabled }: { status: AttendanceStatus | null; onClick?: () => void; disabled: boolean }) {
  const base = 'inline-flex h-7 w-7 items-center justify-center rounded text-xs font-bold select-none transition-colors';
  if (disabled && !status) {
    return <span className={cn(base, 'bg-slate-50 border border-dashed border-slate-200 cursor-not-allowed text-slate-300')}>—</span>;
  }
  if (disabled) {
    const cls = status === 'P' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : status === 'A' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-amber-50 text-amber-600 border border-amber-200';
    return <span className={cn(base, cls, 'cursor-not-allowed opacity-60')}>{status}</span>;
  }
  if (!status) {
    return <span onClick={onClick} className={cn(base, 'border border-dashed border-slate-200 bg-slate-50/80 hover:bg-slate-100 cursor-pointer text-slate-400')}>—</span>;
  }
  const cls = status === 'P' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200' : status === 'A' ? 'bg-rose-100 text-rose-700 border border-rose-300 hover:bg-rose-200' : 'bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200';
  return <span onClick={onClick} className={cn(base, cls, 'cursor-pointer')}>{status}</span>;
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function AttendanceSheetPage() {
  const { toast } = useToast();

  // ── Cascade selection ──────────────────────────────────────
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [batchList, setBatchList] = useState<Batch[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // ── Date range ─────────────────────────────────────────────
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // ── Generated sheet data ───────────────────────────────────
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [dateColumns, setDateColumns] = useState<DateColumn[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Record<string, AttendanceStatus | null>>>({});
  const [lockedDates, setLockedDates] = useState<string[]>([]);
  const [lockAfterDays, setLockAfterDays] = useState(7);
  const [autoAbsentEnabled, setAutoAbsentEnabled] = useState(false);

  // ── UI state ───────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'LOW' | 'GOOD'>('ALL');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvMode, setCsvMode] = useState<'students' | 'attendance'>('students');
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [csvError, setCsvError] = useState('');
  const [bulkMenuDate, setBulkMenuDate] = useState<string | null>(null);
  const bulkMenuRef = useRef<HTMLDivElement>(null);

  // ── Derived: selected batch obj ────────────────────────────
  const selectedBatch = useMemo(() => batchList.find((b) => b.id === selectedBatchId), [batchList, selectedBatchId]);
  const selectedCourse = useMemo(() => courses.find((c) => c.id === selectedCourseId), [courses, selectedCourseId]);
  const selectedProgram = useMemo(() => programs.find((p) => p.id === selectedProgramId), [programs, selectedProgramId]);
  const selectedBranch = useMemo(() => branches.find((b) => b.id === selectedBranchId), [branches, selectedBranchId]);

  // ── Derived: isDateLocked ──────────────────────────────────
  const today = todayYMD();
  const isDateLocked = useCallback((dateStr: string): boolean => {
    if (lockedDates.includes(dateStr)) return true;
    const diff = (new Date(today).getTime() - new Date(dateStr).getTime()) / 86400000;
    return diff > lockAfterDays;
  }, [lockedDates, lockAfterDays, today]);

  // ── Derived: summary per student ──────────────────────────
  const summaries = useMemo(() => {
    const pastCols = dateColumns.filter((c) => !c.isFuture);
    return students.map((s) => {
      const rec = attendance[s.id] ?? {};
      let p = 0, a = 0, l = 0;
      for (const col of pastCols) {
        const v = rec[col.dateStr];
        if (v === 'P') p++;
        else if (v === 'A') a++;
        else if (v === 'L') l++;
        else if (autoAbsentEnabled) a++;
      }
      const total = pastCols.length;
      const pct = total === 0 ? 0 : Math.round(((p + l) / total) * 100);
      return { id: s.id, p, a, l, total, pct };
    });
  }, [students, attendance, dateColumns, autoAbsentEnabled]);

  const summaryMap = useMemo(() => Object.fromEntries(summaries.map((s) => [s.id, s])), [summaries]);

  // ── Derived: filtered students ─────────────────────────────
  const filteredStudents = useMemo(() => {
    let list = students;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.fullName.toLowerCase().includes(q) || s.regNo.toLowerCase().includes(q));
    }
    if (attendanceFilter === 'LOW') list = list.filter((s) => (summaryMap[s.id]?.pct ?? 0) < 75);
    if (attendanceFilter === 'GOOD') list = list.filter((s) => (summaryMap[s.id]?.pct ?? 0) >= 75);
    return list;
  }, [students, search, attendanceFilter, summaryMap]);

  // ── Load programs on mount ─────────────────────────────────
  useEffect(() => {
    setLoadingPrograms(true);
    getPrograms()
      .then((res) => { if (res.success && res.data) setPrograms(res.data); })
      .catch(() => toast({ title: 'Error', description: 'Failed to load programs', variant: 'destructive' }))
      .finally(() => setLoadingPrograms(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Close bulk menu on outside click ─────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) {
        setBulkMenuDate(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Cascade handlers ───────────────────────────────────────
  const handleProgramChange = useCallback(async (programId: string) => {
    const id = programId === '_none' ? '' : programId;
    setSelectedProgramId(id);
    setSelectedCourseId('');
    setSelectedBranchId('');
    setSelectedBatchId('');
    setCourses([]); setBranches([]); setBatchList([]);
    setGenerated(false);
    if (!id) return;
    setLoadingCourses(true);
    try {
      const res = await getCourses({ programId: id });
      if (res.success && res.data) setCourses(res.data);
    } catch { toast({ title: 'Error', description: 'Failed to load courses', variant: 'destructive' }); }
    finally { setLoadingCourses(false); }
  }, [toast]);

  const handleCourseChange = useCallback(async (courseId: string) => {
    const id = courseId === '_none' ? '' : courseId;
    setSelectedCourseId(id);
    setSelectedBranchId('');
    setSelectedBatchId('');
    setBranches([]); setBatchList([]);
    setGenerated(false);
    if (!id) return;
    setLoadingBranches(true);
    try {
      const res = await getBranches();
      if (res.success && res.data) setBranches(res.data);
    } catch { toast({ title: 'Error', description: 'Failed to load branches', variant: 'destructive' }); }
    finally { setLoadingBranches(false); }
  }, [toast]);

  const handleBranchChange = useCallback(async (branchId: string) => {
    const id = branchId === '_none' ? '' : branchId;
    setSelectedBranchId(id);
    setSelectedBatchId('');
    setBatchList([]);
    setGenerated(false);
    if (!id) return;
    setLoadingBatches(true);
    try {
      const res = await getBatches({ courseId: selectedCourseId, branchId: id });
      if (res.success && res.data) setBatchList(res.data);
    } catch { toast({ title: 'Error', description: 'Failed to load batches', variant: 'destructive' }); }
    finally { setLoadingBatches(false); }
  }, [toast, selectedCourseId]);

  const handleBatchChange = useCallback((batchId: string) => {
    setSelectedBatchId(batchId === '_none' ? '' : batchId);
    setGenerated(false);
  }, []);

  const setThisMonth = useCallback(() => {
    const now = new Date();
    setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  }, []);

  const setNextMonth = useCallback(() => {
    const now = new Date();
    setStartDate(new Date(now.getFullYear(), now.getMonth() + 1, 1));
    setEndDate(new Date(now.getFullYear(), now.getMonth() + 2, 0));
  }, []);

  // ── Generate sheet ─────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!selectedBatchId || !startDate || !endDate) {
      toast({ title: 'Validation', description: 'Select a batch and date range first.', variant: 'destructive' });
      return;
    }
    if (startDate > endDate) {
      toast({ title: 'Validation', description: 'Start date must be before end date.', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      // 1. Routine days
      const slotRes = await getRoutineSlots({ batchId: selectedBatchId });
      const routineDays: number[] = slotRes.success && slotRes.data
        ? [...new Set(slotRes.data.filter((s) => s.isActive).map((s) => s.dayOfWeek))]
        : [];

      if (routineDays.length === 0) {
        toast({ title: 'Warning', description: 'No active routine slots found for this batch. Showing all days.', variant: 'default' });
        for (let i = 0; i < 7; i++) routineDays.push(i);
      }

      // 2. Date columns
      const todayStr = todayYMD();
      const cols: DateColumn[] = [];
      const cur = new Date(startDate);
      cur.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      while (cur <= end) {
        const dow = cur.getDay();
        if (routineDays.includes(dow)) {
          const ds = dateToYMD(cur);
          cols.push({ dateStr: ds, label: formatDateLabel(ds), isFuture: ds > todayStr, dayOfWeek: dow });
        }
        cur.setDate(cur.getDate() + 1);
      }

      // 3. Enrollments → student list
      const enrollRes = await getEnrollments({ batchId: selectedBatchId, status: 'ACTIVE', limit: 500 });
      const enrollments = enrollRes.success && enrollRes.data ? enrollRes.data : [];

      // 4. Try get reg numbers from students API
      let regMap: Record<string, string> = {};
      try {
        const stuRes = await getStudents({ branchId: selectedBranchId, limit: 500 });
        if (stuRes.success && stuRes.data) {
          for (const s of stuRes.data) {
            regMap[s.id] = s.studentProfile?.registrationNumber ?? s.mobile ?? '';
          }
        }
      } catch { /* ignore */ }

      const newStudents: StudentRow[] = enrollments
        .filter((e) => e.student)
        .map((e) => ({
          id: e.student!.id,
          fullName: e.student!.fullName,
          regNo: regMap[e.student!.id] ?? e.student!.mobile ?? '',
        }));

      // 5. Merge with existing localStorage data
      const stored = loadStored(selectedBatchId);
      const existingAttendance = stored?.attendance ?? {};
      const mergedAttendance: Record<string, Record<string, AttendanceStatus | null>> = {};
      for (const st of newStudents) {
        mergedAttendance[st.id] = {};
        for (const col of cols) {
          mergedAttendance[st.id][col.dateStr] = existingAttendance[st.id]?.[col.dateStr] ?? null;
        }
      }

      const lockDays = stored?.lockAfterDays ?? 7;
      const lockDates = stored?.lockedDates ?? [];
      const autoAbsent = stored?.autoAbsentEnabled ?? false;

      const newStored: StoredData = {
        meta: {
          batchId: selectedBatchId,
          batchName: selectedBatch?.name ?? '',
          courseId: selectedCourseId,
          courseName: selectedCourse?.name ?? '',
          programId: selectedProgramId,
          programName: selectedProgram?.name ?? '',
          branchId: selectedBranchId,
          branchName: selectedBranch?.name ?? '',
        },
        students: newStudents,
        routineDays,
        lockAfterDays: lockDays,
        lockedDates: lockDates,
        autoAbsentEnabled: autoAbsent,
        attendance: mergedAttendance,
        lastUpdated: new Date().toISOString(),
      };
      saveStored(newStored);

      setStudents(newStudents);
      setDateColumns(cols);
      setAttendance(mergedAttendance);
      setLockAfterDays(lockDays);
      setLockedDates(lockDates);
      setAutoAbsentEnabled(autoAbsent);
      setGenerated(true);
      toast({ title: 'Sheet generated', description: `${newStudents.length} students × ${cols.length} class dates.` });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to generate attendance sheet.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }, [selectedBatchId, startDate, endDate, selectedBranchId, selectedCourseId, selectedProgramId, selectedBatch, selectedCourse, selectedProgram, selectedBranch, toast]);

  // ── Attendance cell toggle ─────────────────────────────────
  const toggleCell = useCallback((studentId: string, dateStr: string) => {
    setAttendance((prev) => {
      const cur = prev[studentId]?.[dateStr] ?? null;
      const idx = STATUS_CYCLE.indexOf(cur);
      const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      const updated = {
        ...prev,
        [studentId]: { ...(prev[studentId] ?? {}), [dateStr]: next },
      };
      // persist
      const stored = loadStored(selectedBatchId);
      if (stored) {
        stored.attendance = updated;
        saveStored(stored);
      }
      return updated;
    });
  }, [selectedBatchId]);

  // ── Bulk mark for a date ───────────────────────────────────
  const bulkMarkDate = useCallback((dateStr: string, status: AttendanceStatus | null) => {
    setAttendance((prev) => {
      const updated = { ...prev };
      for (const s of filteredStudents) {
        updated[s.id] = { ...(updated[s.id] ?? {}), [dateStr]: status };
      }
      const stored = loadStored(selectedBatchId);
      if (stored) { stored.attendance = updated; saveStored(stored); }
      return updated;
    });
    setBulkMenuDate(null);
  }, [filteredStudents, selectedBatchId]);

  // ── Bulk mark all ──────────────────────────────────────────
  const bulkMarkAll = useCallback((status: AttendanceStatus | null) => {
    setAttendance((prev) => {
      const updated = { ...prev };
      const pastCols = dateColumns.filter((c) => !c.isFuture && !isDateLocked(c.dateStr));
      for (const s of filteredStudents) {
        for (const col of pastCols) {
          if (!updated[s.id]) updated[s.id] = {};
          updated[s.id][col.dateStr] = status;
        }
      }
      const stored = loadStored(selectedBatchId);
      if (stored) { stored.attendance = updated; saveStored(stored); }
      return updated;
    });
  }, [filteredStudents, dateColumns, isDateLocked, selectedBatchId]);

  // ── Lock / Unlock date ────────────────────────────────────
  const toggleDateLock = useCallback((dateStr: string) => {
    setLockedDates((prev) => {
      const next = prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr];
      const stored = loadStored(selectedBatchId);
      if (stored) { stored.lockedDates = next; saveStored(stored); }
      return next;
    });
  }, [selectedBatchId]);

  // ── Save lock settings ────────────────────────────────────
  const saveLockSettings = useCallback((days: number, autoAbsent: boolean) => {
    setLockAfterDays(days);
    setAutoAbsentEnabled(autoAbsent);
    const stored = loadStored(selectedBatchId);
    if (stored) {
      stored.lockAfterDays = days;
      stored.autoAbsentEnabled = autoAbsent;
      saveStored(stored);
    }
    setSettingsOpen(false);
    toast({ title: 'Settings saved' });
  }, [selectedBatchId, toast]);

  // ── CSV Export ────────────────────────────────────────────
  const exportCsv = useCallback(() => {
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const headers = ['Name', 'Reg No', ...dateColumns.map((c) => c.label), 'Total', 'P', 'A', 'L', '%'];
    const rows: string[] = [headers.map(escape).join(',')];
    for (const s of students) {
      const sm = summaryMap[s.id];
      const cells = dateColumns.map((c) => attendance[s.id]?.[c.dateStr] ?? '—');
      rows.push([s.fullName, s.regNo, ...cells, String(sm?.total ?? 0), String(sm?.p ?? 0), String(sm?.a ?? 0), String(sm?.l ?? 0), `${sm?.pct ?? 0}%`].map(escape).join(','));
    }
    downloadBlob(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' }), `attendance_${selectedBatch?.name ?? 'sheet'}.csv`);
  }, [students, dateColumns, attendance, summaryMap, selectedBatch]);

  // ── Excel Export (ExcelJS) ────────────────────────────────
  const exportExcel = useCallback(async () => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'LMS';

    // ── Sheet 1: Attendance ──
    const ws1 = wb.addWorksheet('Attendance');
    const tealFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    const pFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
    const aFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
    const lFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };

    const headerRow = ws1.addRow(['Name', 'Reg No', ...dateColumns.map((c) => c.label), 'Total', 'P', 'A', 'L', '%']);
    headerRow.eachCell((cell) => {
      cell.fill = tealFill;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center' };
    });

    for (const s of students) {
      const sm = summaryMap[s.id];
      const cells = dateColumns.map((c) => attendance[s.id]?.[c.dateStr] ?? '');
      const row = ws1.addRow([s.fullName, s.regNo, ...cells, sm?.total ?? 0, sm?.p ?? 0, sm?.a ?? 0, sm?.l ?? 0, `${sm?.pct ?? 0}%`]);
      row.eachCell((cell, colNum) => {
        const val = String(cell.value ?? '');
        if (colNum > 2 && colNum <= 2 + dateColumns.length) {
          if (val === 'P') cell.fill = pFill;
          else if (val === 'A') cell.fill = aFill;
          else if (val === 'L') cell.fill = lFill;
          cell.alignment = { horizontal: 'center' };
        }
      });
    }
    ws1.getColumn(1).width = 28;
    ws1.getColumn(2).width = 14;
    for (let i = 3; i <= 2 + dateColumns.length + 5; i++) ws1.getColumn(i).width = 9;

    // ── Sheet 2: Summary ──
    const ws2 = wb.addWorksheet('Summary');
    const sh = ws2.addRow(['Name', 'Reg No', 'Total Classes', 'Present', 'Absent', 'Late', 'Attendance %']);
    sh.eachCell((cell) => { cell.fill = tealFill; cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.alignment = { horizontal: 'center' }; });
    for (const s of students) {
      const sm = summaryMap[s.id];
      ws2.addRow([s.fullName, s.regNo, sm?.total ?? 0, sm?.p ?? 0, sm?.a ?? 0, sm?.l ?? 0, `${sm?.pct ?? 0}%`]);
    }
    ws2.getColumn(1).width = 28;
    ws2.getColumn(2).width = 14;
    for (let i = 3; i <= 7; i++) ws2.getColumn(i).width = 14;

    const buf = await wb.xlsx.writeBuffer();
    downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `attendance_${selectedBatch?.name ?? 'sheet'}.xlsx`);
  }, [students, dateColumns, attendance, summaryMap, selectedBatch]);

  // ── CSV Import Logic ──────────────────────────────────────
  const parseCsvPreview = useCallback(() => {
    setCsvError('');
    if (!csvText.trim()) { setCsvError('Paste CSV text above.'); return; }
    const rows = parseCsv(csvText);
    if (rows.length < 2) { setCsvError('Need at least a header row and one data row.'); return; }
    setCsvPreview(rows);
  }, [csvText]);

  const confirmCsvImport = useCallback(() => {
    if (csvPreview.length < 2) return;
    const [header, ...dataRows] = csvPreview;

    if (csvMode === 'students') {
      if (!header[0]?.toLowerCase().includes('name') || !header[1]?.toLowerCase().includes('reg')) {
        setCsvError('Expected columns: Name, Reg No');
        return;
      }
      const imported: StudentRow[] = dataRows.map((r, i) => ({ id: `imported_${i}_${Date.now()}`, fullName: r[0] ?? '', regNo: r[1] ?? '' }));
      const merged = [...students, ...imported.filter((imp) => !students.some((s) => s.regNo === imp.regNo && imp.regNo))];
      setStudents(merged);
      // add new students to attendance with null for all dates
      setAttendance((prev) => {
        const updated = { ...prev };
        for (const st of imported) {
          if (!updated[st.id]) {
            updated[st.id] = {};
            for (const col of dateColumns) updated[st.id][col.dateStr] = null;
          }
        }
        const stored = loadStored(selectedBatchId);
        if (stored) { stored.students = merged; stored.attendance = updated; saveStored(stored); }
        return updated;
      });
      toast({ title: 'Imported', description: `${imported.length} student(s) added.` });
    } else {
      // attendance import: Reg No, date1, date2, ...
      const dates = header.slice(1);
      let updated = { ...attendance };
      let count = 0;
      for (const row of dataRows) {
        const regNo = row[0] ?? '';
        const student = students.find((s) => s.regNo === regNo);
        if (!student) continue;
        for (let i = 0; i < dates.length; i++) {
          const dateStr = dates[i].trim();
          const val = (row[i + 1] ?? '').trim().toUpperCase() as AttendanceStatus;
          if (!dateColumns.some((c) => c.dateStr === dateStr)) continue;
          if (!['P', 'A', 'L'].includes(val)) continue;
          if (!updated[student.id]) updated[student.id] = {};
          updated[student.id][dateStr] = val;
          count++;
        }
      }
      setAttendance(updated);
      const stored = loadStored(selectedBatchId);
      if (stored) { stored.attendance = updated; saveStored(stored); }
      toast({ title: 'Imported', description: `${count} attendance cell(s) updated.` });
    }
    setCsvModalOpen(false);
    setCsvText('');
    setCsvPreview([]);
  }, [csvMode, csvPreview, students, attendance, dateColumns, selectedBatchId, toast]);

  // ── Step indicator ────────────────────────────────────────
  const canGenerate = selectedBatchId && startDate && endDate;

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-full space-y-5 p-4 lg:p-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-medium">Attendance Sheet</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Offline batch-wise attendance — data stored locally.</p>
          </div>
        </div>
        {generated && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSettingsOpen(true)}>
              <Settings2 className="h-4 w-4" /> Settings
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setCsvText(''); setCsvPreview([]); setCsvError(''); setCsvModalOpen(true); }}>
              <Upload className="h-4 w-4" /> Import CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}>
              <FileText className="h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={exportExcel}>
              <FileSpreadsheet className="h-4 w-4" /> Export Excel
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 print:hidden" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        )}
      </div>

      {/* ── Selection Panel ── */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <p className="text-sm font-medium text-muted-foreground">Step 1 — Select batch &amp; date range</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Program */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Program <span className="text-destructive">*</span></Label>
            <Select value={selectedProgramId || '_none'} onValueChange={handleProgramChange} disabled={loadingPrograms}>
              <SelectTrigger className="h-9"><SelectValue placeholder="-- Select program --" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">-- Select program --</SelectItem>
                {programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Course */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Course <span className="text-destructive">*</span></Label>
            <Select value={selectedCourseId || '_none'} onValueChange={handleCourseChange} disabled={!selectedProgramId || loadingCourses}>
              <SelectTrigger className="h-9"><SelectValue placeholder="-- Select course --" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">-- Select course --</SelectItem>
                {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Branch */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Branch <span className="text-destructive">*</span></Label>
            <Select value={selectedBranchId || '_none'} onValueChange={handleBranchChange} disabled={!selectedCourseId || loadingBranches}>
              <SelectTrigger className="h-9"><SelectValue placeholder="-- Select branch --" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">-- Select branch --</SelectItem>
                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Batch */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Batch <span className="text-destructive">*</span></Label>
            <Select value={selectedBatchId || '_none'} onValueChange={handleBatchChange} disabled={!selectedBranchId || loadingBatches}>
              <SelectTrigger className="h-9"><SelectValue placeholder="-- Select batch --" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">-- Select batch --</SelectItem>
                {batchList.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Date range + Generate */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Start date <span className="text-destructive">*</span></Label>
            <DatePicker date={startDate} setDate={setStartDate} placeholder="Pick start date" className="h-9 w-44" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">End date <span className="text-destructive">*</span></Label>
            <DatePicker date={endDate} setDate={setEndDate} placeholder="Pick end date" className="h-9 w-44" />
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" size="sm" className="h-9" onClick={setThisMonth}>
              This month
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={setNextMonth}>
              Next month
            </Button>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className="h-9 gap-2 bg-teal-600 text-white hover:bg-teal-700"
          >
            {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
            {generating ? 'Generating…' : 'Generate Sheet'}
          </Button>
        </div>
      </div>

      {/* ── Sheet ── */}
      {generated && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name / reg no…" className="h-9 pl-8 w-56" />
              </div>
              <Select value={attendanceFilter} onValueChange={(v) => setAttendanceFilter(v as 'ALL' | 'LOW' | 'GOOD')}>
                <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All students</SelectItem>
                  <SelectItem value="LOW">Low attendance (&lt;75%)</SelectItem>
                  <SelectItem value="GOOD">Good attendance (≥75%)</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-4 w-4" />
                {filteredStudents.length} / {students.length}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Bulk mark visible:</span>
              <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => bulkMarkAll('P')}>
                <Check className="h-3 w-3" /> All P
              </Button>
              <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1 text-rose-700 border-rose-200 hover:bg-rose-50" onClick={() => bulkMarkAll('A')}>
                <X className="h-3 w-3" /> All A
              </Button>
              <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1" onClick={() => bulkMarkAll(null)}>
                Reset
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-300">P</span> Present</span>
            <span className="flex items-center gap-1"><span className="inline-flex h-5 w-5 items-center justify-center rounded bg-rose-100 text-rose-700 font-bold text-xs border border-rose-300">A</span> Absent</span>
            <span className="flex items-center gap-1"><span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-100 text-amber-700 font-bold text-xs border border-amber-300">L</span> Late</span>
            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Locked (no edit)</span>
            <span className="text-muted-foreground/60">Future dates are disabled. Lock after {lockAfterDays} days.</span>
          </div>

          {/* Attendance Table */}
          <div className="overflow-x-auto overflow-y-hidden rounded-xl border shadow-sm print:shadow-none pb-1" style={{ scrollbarGutter: 'stable both-edges' }}>
            <table className="min-w-max w-full text-sm border-collapse">
              <thead>
                <tr className="bg-teal-600 text-white">
                  <th className="sticky left-0 z-20 bg-teal-600 px-3 py-2.5 text-left font-semibold min-w-44 whitespace-nowrap">#&nbsp;&nbsp;Name</th>
                  <th className="sticky left-44 z-20 bg-teal-600 px-3 py-2.5 text-left font-semibold min-w-28 whitespace-nowrap">Reg No</th>
                  {dateColumns.map((col) => {
                    const locked = isDateLocked(col.dateStr);
                    return (
                      <th key={col.dateStr} className="relative px-1 py-2 text-center font-medium text-xs min-w-12">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={cn('text-xs', col.isFuture && 'opacity-50')}>{col.label}</span>
                          <span className="text-teal-200 text-xs opacity-60">{DAY_ABBR[col.dayOfWeek]}</span>
                          <div ref={bulkMenuDate === col.dateStr ? bulkMenuRef : undefined} className="relative">
                            <button
                              className="flex items-center gap-0.5 text-teal-200 hover:text-white text-xs"
                              onClick={() => setBulkMenuDate(bulkMenuDate === col.dateStr ? null : col.dateStr)}
                              title="Bulk mark this date"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                            {bulkMenuDate === col.dateStr && (
                              <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 bg-white border rounded-md shadow-lg p-1 flex flex-col gap-0.5 min-w-28">
                                <button className="px-2 py-1 text-xs text-left hover:bg-emerald-50 rounded text-emerald-700" onClick={() => bulkMarkDate(col.dateStr, 'P')}>Mark all P</button>
                                <button className="px-2 py-1 text-xs text-left hover:bg-rose-50 rounded text-rose-700" onClick={() => bulkMarkDate(col.dateStr, 'A')}>Mark all A</button>
                                <button className="px-2 py-1 text-xs text-left hover:bg-amber-50 rounded text-amber-700" onClick={() => bulkMarkDate(col.dateStr, 'L')}>Mark all L</button>
                                <button className="px-2 py-1 text-xs text-left hover:bg-slate-50 rounded text-slate-600" onClick={() => bulkMarkDate(col.dateStr, null)}>Reset date</button>
                                <div className="border-t my-0.5" />
                                <button className="px-2 py-1 text-xs text-left hover:bg-slate-50 rounded text-slate-500 flex items-center gap-1" onClick={() => { toggleDateLock(col.dateStr); setBulkMenuDate(null); }}>
                                  <Lock className="h-3 w-3" />{locked ? 'Unlock' : 'Lock'} date
                                </button>
                              </div>
                            )}
                          </div>
                          {locked && <Lock className="h-2.5 w-2.5 text-teal-200 opacity-70" />}
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-2 py-2.5 text-center font-semibold text-xs whitespace-nowrap">Total</th>
                  <th className="px-2 py-2.5 text-center font-semibold text-xs text-emerald-200">P</th>
                  <th className="px-2 py-2.5 text-center font-semibold text-xs text-rose-200">A</th>
                  <th className="px-2 py-2.5 text-center font-semibold text-xs text-amber-200">L</th>
                  <th className="px-2 py-2.5 text-center font-semibold text-xs whitespace-nowrap">%</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={dateColumns.length + 7} className="py-12 text-center text-muted-foreground text-sm">
                      No students match the filter.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, rowIdx) => {
                    const sm = summaryMap[s.id];
                    return (
                      <tr key={s.id} className={cn('border-b transition-colors hover:bg-muted/30', rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                        <td className={cn('sticky left-0 z-10 px-3 py-2 font-medium text-sm whitespace-nowrap max-w-44 truncate', rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                          <span className="text-muted-foreground mr-1.5 text-xs">{rowIdx + 1}.</span>{s.fullName}
                        </td>
                        <td className={cn('sticky left-44 z-10 px-3 py-2 text-xs text-muted-foreground whitespace-nowrap', rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                          {s.regNo || '—'}
                        </td>
                        {dateColumns.map((col) => {
                          const locked = isDateLocked(col.dateStr) || col.isFuture;
                          const val = attendance[s.id]?.[col.dateStr] ?? null;
                          return (
                            <td key={col.dateStr} className={cn('px-1 py-1.5 text-center', col.isFuture && 'opacity-40')}>
                              <StatusCell
                                status={val}
                                disabled={locked}
                                onClick={locked ? undefined : () => toggleCell(s.id, col.dateStr)}
                              />
                            </td>
                          );
                        })}
                        <td className="px-2 py-1.5 text-center text-xs font-medium">{sm?.total ?? 0}</td>
                        <td className="px-2 py-1.5 text-center text-xs font-semibold text-emerald-700">{sm?.p ?? 0}</td>
                        <td className="px-2 py-1.5 text-center text-xs font-semibold text-rose-700">{sm?.a ?? 0}</td>
                        <td className="px-2 py-1.5 text-center text-xs font-semibold text-amber-700">{sm?.l ?? 0}</td>
                        <td className="px-2 py-1.5 text-center text-xs font-semibold">
                          <Badge variant={(sm?.pct ?? 0) >= 75 ? 'default' : 'destructive'} className={cn('text-xs', (sm?.pct ?? 0) >= 75 ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100' : '')}>
                            {sm?.pct ?? 0}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer summary */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground rounded-lg border bg-muted/30 px-4 py-3">
            <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {dateColumns.length} class dates</span>
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {students.length} students</span>
            <span className="flex items-center gap-1 text-emerald-700">Avg attendance: {students.length > 0 ? Math.round(summaries.reduce((acc, s) => acc + s.pct, 0) / summaries.length) : 0}%</span>
            {autoAbsentEnabled && <Badge variant="outline" className="text-xs">Auto-absent ON</Badge>}
            <span className="ml-auto">Lock after {lockAfterDays} days</span>
          </div>
        </>
      )}

      {/* ── Settings Dialog ── */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        lockAfterDays={lockAfterDays}
        autoAbsent={autoAbsentEnabled}
        onSave={saveLockSettings}
      />

      {/* ── CSV Import Dialog ── */}
      <Dialog open={csvModalOpen} onOpenChange={(o) => { if (!o) { setCsvModalOpen(false); setCsvPreview([]); setCsvError(''); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import CSV</DialogTitle>
            <DialogDescription>Import a student list or attendance data from CSV.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Mode selector */}
            <div className="flex items-center gap-3">
              <Label className="text-xs font-medium">Import type:</Label>
              <div className="flex gap-2">
                <Button size="sm" variant={csvMode === 'students' ? 'default' : 'outline'} className={cn('h-8 text-xs', csvMode === 'students' && 'bg-teal-600 hover:bg-teal-700')} onClick={() => { setCsvMode('students'); setCsvPreview([]); }}>
                  Student List
                </Button>
                <Button size="sm" variant={csvMode === 'attendance' ? 'default' : 'outline'} className={cn('h-8 text-xs', csvMode === 'attendance' && 'bg-teal-600 hover:bg-teal-700')} onClick={() => { setCsvMode('attendance'); setCsvPreview([]); }}>
                  Attendance Data
                </Button>
              </div>
            </div>

            {/* Format hint */}
            <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground font-mono">
              {csvMode === 'students'
                ? 'Name,Reg No\nRahim,REG001\nKarim,REG002'
                : 'Reg No,2026-04-01,2026-04-03\nREG001,P,A\nREG002,A,P'}
            </div>

            {/* Text area */}
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono h-32 resize-none focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Paste CSV here…"
              value={csvText}
              onChange={(e) => { setCsvText(e.target.value); setCsvPreview([]); setCsvError(''); }}
            />
            {csvError && <p className="text-xs text-destructive">{csvError}</p>}
            <Button size="sm" variant="outline" onClick={parseCsvPreview}>Parse &amp; Preview</Button>

            {/* Preview */}
            {csvPreview.length > 0 && (
              <div className="overflow-x-auto rounded-md border max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted">
                      {csvPreview[0].map((h, i) => <th key={i} className="px-2 py-1.5 text-left font-semibold border-b">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.slice(1).map((row, ri) => (
                      <tr key={ri} className="border-b hover:bg-muted/30">
                        {row.map((cell, ci) => <td key={ci} className="px-2 py-1">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCsvModalOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-teal-600 text-white hover:bg-teal-700" onClick={confirmCsvImport} disabled={csvPreview.length < 2}>
              <Download className="h-4 w-4 mr-1.5" /> Import {csvPreview.length > 1 ? `(${csvPreview.length - 1} rows)` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Settings Dialog (extracted to avoid re-render loop)
// ─────────────────────────────────────────────────────────────
function SettingsDialog({
  open, onClose, lockAfterDays, autoAbsent, onSave,
}: {
  open: boolean;
  onClose: () => void;
  lockAfterDays: number;
  autoAbsent: boolean;
  onSave: (days: number, autoAbsent: boolean) => void;
}) {
  const [days, setDays] = useState(lockAfterDays);
  const [auto, setAuto] = useState(autoAbsent);
  useEffect(() => { setDays(lockAfterDays); setAuto(autoAbsent); }, [lockAfterDays, autoAbsent, open]);
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Attendance Settings</DialogTitle>
          <DialogDescription>Configure locking and absence defaults.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Lock after (days)</Label>
            <p className="text-xs text-muted-foreground">Cells older than this many days become read-only.</p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1} max={365}
                value={days}
                onChange={(e) => setDays(Math.max(1, Number(e.target.value)))}
                className="h-9 w-24"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <input type="checkbox" id="autoAbsent" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="mt-0.5 h-4 w-4 cursor-pointer accent-teal-600" />
            <div>
              <label htmlFor="autoAbsent" className="text-sm font-medium cursor-pointer">Auto-absent for empty cells</label>
              <p className="text-xs text-muted-foreground mt-0.5">Empty past cells count as Absent in the summary percentage.</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="bg-teal-600 text-white hover:bg-teal-700" onClick={() => onSave(days, auto)}>Save settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
