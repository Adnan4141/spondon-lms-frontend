'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { getBatches, type Batch } from '@/lib/api/batches';
import { useAdminFilterOptions } from '@/lib/query/hooks/useAdminFilterOptions';
import { publishRoutineSessions } from '@/lib/api/routine';
import {
  getAttendanceSheet,
  getAttendanceSummary,
  bulkRecordAttendance,
  downloadAttendanceExport,
  previewOfflineSheet,
  downloadOfflineSheet,
  importAttendanceFile,
  type AttendanceStatus,
  type AttendanceSummaryRow,
  type OfflineSheetPreview,
  type ClassSession,
} from '@/lib/api/attendance';
import type { Program, Course } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Calendar,
  Check,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Upload,
  Users,
  AlertTriangle,
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE'];

function cellKey(sessionId: string, studentId: string) {
  return `${sessionId}\t${studentId}`;
}

function statusColor(s: AttendanceStatus | '') {
  if (s === 'PRESENT') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (s === 'ABSENT') return 'bg-rose-50 text-rose-800 border-rose-200';
  if (s === 'LATE') return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-muted/40 text-muted-foreground border-border';
}

function statusLabel(s: AttendanceStatus | '') {
  if (s === 'PRESENT') return 'P';
  if (s === 'ABSENT') return 'A';
  if (s === 'LATE') return 'L';
  return '–';
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthPreset(offset: 0 | 1): { start: string; end: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start: toYmd(d), end: toYmd(last) };
}

// ── main inner component ──────────────────────────────────────────────────────

export function AttendanceSheetPageContent() {
  const { toast } = useToast();
  const {
    programs: filterPrograms,
    branches: filterBranches,
    coursesByProgram,
    courses: allProgramCourses,
    isMetaLoading: loadingPrograms,
  } = useAdminFilterOptions();

  const programs = filterPrograms as Program[];
  const branches = filterBranches as { id: string; name: string }[];

  // ── step 1: cascading filters ─────────────────────────────────────────────
  const [batches, setBatches] = useState<Batch[]>([]);

  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [sessionEligibility, setSessionEligibility] = useState<Record<string, Record<string, boolean>>>({});

  const filterMonth = useMemo(() => {
    if (startDate) return startDate.slice(0, 7);
    if (endDate) return endDate.slice(0, 7);
    return '';
  }, [startDate, endDate]);

  const courses = useMemo(() => {
    const base = (selectedProgramId ? coursesByProgram(selectedProgramId) : []) as Course[];
    if (!filterMonth) return base;
    return base.filter((course) => {
      const c = allProgramCourses.find((row) => row.id === course.id);
      if (!c?.startMonth && !c?.endMonth) return true;
      if (c.startMonth && c.startMonth > filterMonth) return false;
      if (c.endMonth && c.endMonth < filterMonth) return false;
      return true;
    });
  }, [selectedProgramId, coursesByProgram, allProgramCourses, filterMonth]);

  const loadingCourses = false;
  const loadingBranches = false;
  const [loadingBatches, setLoadingBatches] = useState(false);

  // ── step 2: date range (state declared above for course month filter) ─────

  // ── step 3: sheet data ────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [students, setStudents] = useState<{ id: string; fullName: string }[]>([]);
  const [cells, setCells] = useState<Record<string, AttendanceStatus>>({});
  const [summaryMap, setSummaryMap] = useState<Record<string, AttendanceSummaryRow>>({});
  const [dirty, setDirty] = useState(false);
  const [focusSessionId, setFocusSessionId] = useState<string | null>(null);

  // loading states
  const [sheetLoading, setSheetLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // ── export / offline ──────────────────────────────────────────────────────
  const [exporting, setExporting] = useState<'xlsx' | 'csv' | null>(null);
  const [offlineSource, setOfflineSource] = useState<'published' | 'routine'>('published');
  const [offlineStart, setOfflineStart] = useState('');
  const [offlineEnd, setOfflineEnd] = useState('');
  const [offlineInstitution, setOfflineInstitution] = useState('');
  const [offlinePreview, setOfflinePreview] = useState<OfflineSheetPreview | null>(null);
  const [offlinePreviewing, setOfflinePreviewing] = useState(false);
  const [offlineDownloading, setOfflineDownloading] = useState<'xlsx' | 'csv' | null>(null);

  // ── import ────────────────────────────────────────────────────────────────
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── derived ───────────────────────────────────────────────────────────────
  const batchLoaded = !!selectedBatchId;
  const rangeSet = batchLoaded && !!startDate && !!endDate;

  const currentStep = useMemo(() => {
    if (!selectedProgramId) return 1;
    if (!selectedCourseId) return 2;
    if (!selectedBranchId) return 3;
    if (!selectedBatchId) return 4;
    return 5;
  }, [selectedProgramId, selectedCourseId, selectedBranchId, selectedBatchId]);

  useEffect(() => {
    if (!selectedProgramId) setSelectedCourseId('');
  }, [selectedProgramId]);

  useEffect(() => {
    if (!selectedCourseId) setSelectedBranchId('');
  }, [selectedCourseId]);

  // ── load batches on course+branch change ──────────────────────────────────
  useEffect(() => {
    if (!selectedCourseId) { setBatches([]); setSelectedBatchId(''); return; }
    setLoadingBatches(true);
    getBatches({ courseId: selectedCourseId, branchId: selectedBranchId || undefined })
      .then((r) => setBatches(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingBatches(false));
  }, [selectedCourseId, selectedBranchId]);

  // ── load sheet ────────────────────────────────────────────────────────────
  const loadSheet = useCallback(async () => {
    if (!selectedCourseId || !selectedBatchId) return;
    setSheetLoading(true);
    try {
      const [sheetRes, summaryRes] = await Promise.all([
        getAttendanceSheet({
          courseId: selectedCourseId,
          batchId: selectedBatchId,
          branchId: selectedBranchId || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        getAttendanceSummary({
          courseId: selectedCourseId,
          batchId: selectedBatchId,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      ]);

      const sheet = sheetRes.data;
      if (!sheet) { setSessions([]); setStudents([]); setCells({}); return; }

      // deduplicate students
      const seenIds = new Set<string>();
      const uniqueStudents = sheet.enrollments
        .map((e) => e.student)
        .filter((s) => { if (seenIds.has(s.id)) return false; seenIds.add(s.id); return true; });

      setSessions(sheet.sessions);
      setStudents(uniqueStudents);
      setSessionEligibility(sheet.sessionEligibility ?? {});

      // build cell map from existing records
      const newCells: Record<string, AttendanceStatus> = {};
      for (const sess of sheet.sessions) {
        for (const rec of sess.attendanceRecords) {
          newCells[cellKey(sess.id, rec.studentUserId)] = rec.status as AttendanceStatus;
        }
      }
      setCells(newCells);
      setDirty(false);

      if (!focusSessionId && sheet.sessions.length > 0) {
        setFocusSessionId(sheet.sessions[sheet.sessions.length - 1].id);
      }

      // summary
      const sm: Record<string, AttendanceSummaryRow> = {};
      for (const row of summaryRes.data ?? []) sm[row.studentUserId] = row;
      setSummaryMap(sm);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to load sheet', variant: 'destructive' });
    } finally {
      setSheetLoading(false);
    }
  }, [selectedCourseId, selectedBatchId, selectedBranchId, startDate, endDate, focusSessionId, toast]);

  useEffect(() => {
    if (rangeSet) void loadSheet();
    else if (selectedBatchId && selectedCourseId && !startDate && !endDate) void loadSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId, selectedBatchId, selectedBranchId, startDate, endDate]);

  function isCellEligible(sessionId: string, studentId: string): boolean {
    if (Object.keys(sessionEligibility).length === 0) return true;
    return sessionEligibility[studentId]?.[sessionId] === true;
  }

  // ── cell update ───────────────────────────────────────────────────────────
  function cycleCell(sessionId: string, studentId: string) {
    if (!isCellEligible(sessionId, studentId)) return;
    const k = cellKey(sessionId, studentId);
    const cur = cells[k];
    const idx = cur ? STATUS_OPTIONS.indexOf(cur) : -1;
    const next = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
    setCells((prev) => ({ ...prev, [k]: next }));
    setDirty(true);
  }

  function setCellStatus(sessionId: string, studentId: string, status: AttendanceStatus | 'UNSET') {
    const k = cellKey(sessionId, studentId);
    if (status === 'UNSET') {
      setCells((prev) => { const n = { ...prev }; delete n[k]; return n; });
    } else {
      setCells((prev) => ({ ...prev, [k]: status }));
    }
    setDirty(true);
  }

  // ── mark all present for focused session ──────────────────────────────────
  function markAllPresent() {
    if (!focusSessionId) return;
    setCells((prev) => {
      const n = { ...prev };
      for (const st of students) {
        if (!isCellEligible(focusSessionId, st.id)) continue;
        n[cellKey(focusSessionId, st.id)] = 'PRESENT';
      }
      return n;
    });
    setDirty(true);
  }

  // ── save ──────────────────────────────────────────────────────────────────
  async function save() {
    if (!dirty) return;
    setSaving(true);
    try {
      // group changed cells by sessionId
      const bySession: Record<string, { studentUserId: string; status: AttendanceStatus }[]> = {};
      for (const [k, status] of Object.entries(cells)) {
        const tab = k.indexOf('\t');
        const sessionId = k.slice(0, tab);
        const studentUserId = k.slice(tab + 1);
        if (!bySession[sessionId]) bySession[sessionId] = [];
        bySession[sessionId].push({ studentUserId, status });
      }
      await Promise.all(
        Object.entries(bySession).map(([sessionId, records]) =>
          bulkRecordAttendance({ sessionId, records })
        )
      );
      toast({ title: 'Saved', description: 'Attendance saved successfully', variant: 'success' });
      setDirty(false);
      await loadSheet();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  // ── publish sessions from routine ─────────────────────────────────────────
  async function publishFromRoutine() {
    if (!startDate || !endDate || !selectedCourseId || !selectedBatchId) return;
    setPublishing(true);
    try {
      const res = await publishRoutineSessions({
        courseId: selectedCourseId,
        batchId: selectedBatchId,
        branchId: selectedBranchId || undefined,
        startDate,
        endDate,
      });
      toast({
        title: 'Sessions created',
        description: `${res.data?.created ?? 0} session(s) created, ${res.data?.skipped ?? 0} skipped`,
        variant: 'success',
      });
      await loadSheet();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to publish sessions', variant: 'destructive' });
    } finally {
      setPublishing(false);
    }
  }

  // ── export (filled) ───────────────────────────────────────────────────────
  async function runExport(fmt: 'xlsx' | 'csv') {
    if (!selectedCourseId || !selectedBatchId) return;
    setExporting(fmt);
    try {
      const blob = await downloadAttendanceExport({
        courseId: selectedCourseId,
        batchId: selectedBatchId,
        branchId: selectedBranchId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        format: fmt,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-filled${startDate ? `-${startDate}` : ''}.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Downloaded', description: 'Filled attendance file ready', variant: 'success' });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Export failed', variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  }

  // ── offline sheet preview ─────────────────────────────────────────────────
  async function runOfflinePreview() {
    if (!selectedCourseId || !selectedBatchId || !offlineStart || !offlineEnd) return;
    setOfflinePreviewing(true);
    setOfflinePreview(null);
    try {
      const res = await previewOfflineSheet({
        courseId: selectedCourseId,
        batchId: selectedBatchId,
        branchId: selectedBranchId || undefined,
        startDate: offlineStart,
        endDate: offlineEnd,
        source: offlineSource,
      });
      if (res.success && res.data) setOfflinePreview(res.data);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Preview failed', variant: 'destructive' });
    } finally {
      setOfflinePreviewing(false);
    }
  }

  // ── offline sheet download ────────────────────────────────────────────────
  async function runOfflineDownload(fmt: 'xlsx' | 'csv') {
    if (!selectedCourseId || !selectedBatchId || !offlineStart || !offlineEnd) return;
    setOfflineDownloading(fmt);
    try {
      const blob = await downloadOfflineSheet({
        courseId: selectedCourseId,
        batchId: selectedBatchId,
        branchId: selectedBranchId || undefined,
        startDate: offlineStart,
        endDate: offlineEnd,
        source: offlineSource,
        format: fmt,
        institution: offlineInstitution.trim() || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-sheet-${offlineStart}.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Downloaded', description: 'Blank attendance sheet ready', variant: 'success' });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Download failed', variant: 'destructive' });
    } finally {
      setOfflineDownloading(null);
    }
  }

  // ── import ────────────────────────────────────────────────────────────────
  async function runImport() {
    if (!importFile || !selectedCourseId || !selectedBatchId) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await importAttendanceFile(importFile, { courseId: selectedCourseId, batchId: selectedBatchId });
      if (res.success) {
        setImportResult(res.data ?? null);
        toast({ title: 'Imported', description: res.message ?? 'Done', variant: 'success' });
        await loadSheet();
      } else {
        toast({ title: 'Import failed', description: res.message ?? 'Unknown error', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Import failed', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  }

  // ── focus session counts ──────────────────────────────────────────────────
  const focusCounts = useMemo(() => {
    if (!focusSessionId) return { p: 0, a: 0, l: 0, unset: 0 };
    let p = 0, a = 0, l = 0, unset = 0;
    for (const st of students) {
      const v = cells[cellKey(focusSessionId, st.id)];
      if (!v) unset++;
      else if (v === 'PRESENT') p++;
      else if (v === 'ABSENT') a++;
      else if (v === 'LATE') l++;
    }
    return { p, a, l, unset };
  }, [focusSessionId, students, cells]);

  // ── step indicator ────────────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="mb-5 flex flex-wrap items-center gap-0">
      {[
        { num: 1, label: 'Program' },
        { num: 2, label: 'Course' },
        { num: 3, label: 'Branch' },
        { num: 4, label: 'Batch' },
        { num: 5, label: 'Mark & Export' },
      ].map((step, idx) => (
        <React.Fragment key={step.num}>
          {idx > 0 && (
            <div className={cn('mx-2 h-px min-w-3 flex-1', step.num <= currentStep ? 'bg-emerald-400' : 'bg-border')} />
          )}
          <div className={cn('flex items-center gap-1.5 text-xs', step.num === currentStep && 'font-medium text-emerald-800', step.num > currentStep && 'text-muted-foreground/50', step.num < currentStep && 'text-muted-foreground')}>
            <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium', step.num < currentStep && 'border-emerald-400 bg-emerald-50 text-emerald-800', step.num === currentStep && 'border-emerald-600 bg-emerald-600 text-white', step.num > currentStep && 'border-border bg-muted text-muted-foreground')}>
              {step.num < currentStep ? <Check className="h-3 w-3" /> : step.num}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 p-4 md:p-6">
      <Toaster />

      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Attendance Sheet</h1>
          <p className="text-sm text-muted-foreground">Mark, export, and import attendance by date range</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/attendance-sheet/import">
            <Button variant="outline" size="sm"><Upload className="mr-1.5 h-4 w-4" /> Import</Button>
          </Link>
          <Link href="/admin/attendance-sheet/summary">
            <Button variant="outline" size="sm"><BarChart3 className="mr-1.5 h-4 w-4" /> Summary</Button>
          </Link>
        </div>
      </div>

      <StepIndicator />

      {/* ── Card 1: Filters ─────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-base">Step 1 — Select Program, Course & Batch</CardTitle>
          </div>
          <CardDescription>Choose the batch you want to manage attendance for.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Program */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Program</Label>
              <Select
                value={selectedProgramId}
                onValueChange={(v) => {
                  setSelectedProgramId(v);
                  setSelectedCourseId('');
                  setSelectedBranchId('');
                  setSelectedBatchId('');
                  setSessions([]);
                  setStudents([]);
                  setCells({});
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={loadingPrograms ? 'Loading…' : 'Select program'} />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Course</Label>
              <Select
                value={selectedCourseId}
                disabled={!selectedProgramId}
                onValueChange={(v) => {
                  setSelectedCourseId(v);
                  setSelectedBranchId('');
                  setSelectedBatchId('');
                  setSessions([]);
                  setStudents([]);
                  setCells({});
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={loadingCourses ? 'Loading…' : 'Select course'} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Branch (optional)</Label>
              <Select
                value={selectedBranchId}
                disabled={!selectedCourseId}
                onValueChange={(v) => {
                  setSelectedBranchId(v === '__all__' ? '' : v);
                  setSelectedBatchId('');
                  setSessions([]);
                  setStudents([]);
                  setCells({});
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={loadingBranches ? 'Loading…' : 'All branches'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Batch */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Batch</Label>
              <Select
                value={selectedBatchId}
                disabled={!selectedCourseId}
                onValueChange={(v) => {
                  setSelectedBatchId(v);
                  setSessions([]);
                  setStudents([]);
                  setCells({});
                  setFocusSessionId(null);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={loadingBatches ? 'Loading…' : 'Select batch'} />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Card 2: Date Range ──────────────────────────────────────────────── */}
      {batchLoaded && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-base">Step 2 — Select Date Range</CardTitle>
            </div>
            <CardDescription>
              Filter attendance columns by date range. Sessions matching routine days will be shown.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              {/* Presets */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => { const p = monthPreset(0); setStartDate(p.start); setEndDate(p.end); }}
                >
                  This month
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => { const p = monthPreset(1); setStartDate(p.start); setEndDate(p.end); }}
                >
                  Next month
                </Button>
                {(startDate || endDate) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-muted-foreground"
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Custom range */}
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground">Start date</span>
                  <Input
                    type="date"
                    className="h-8 w-36 text-xs"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground">End date</span>
                  <Input
                    type="date"
                    className="h-8 w-36 text-xs"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700" onClick={() => void loadSheet()} disabled={sheetLoading}>
                  {sheetLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            {/* Session status indicator */}
            {!sheetLoading && selectedCourseId && selectedBatchId && (
              <div className="flex items-center gap-3">
                {sessions.length > 0 ? (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
                    {sessions.length} session{sessions.length !== 1 ? 's' : ''} · {students.length} student{students.length !== 1 ? 's' : ''}
                  </Badge>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>No sessions found{startDate ? ' in this range' : ''}.</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 border-amber-300 text-amber-800 hover:bg-amber-100 text-xs"
                      disabled={publishing || !startDate || !endDate}
                      onClick={() => void publishFromRoutine()}
                    >
                      {publishing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
                      Generate from routine
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Card 3: Attendance Matrix ───────────────────────────────────────── */}
      {batchLoaded && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-base">Attendance Matrix</CardTitle>
                {dirty && (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-xs">
                    Unsaved changes
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {focusSessionId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={markAllPresent}
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    Mark all present
                  </Button>
                )}
                <Button
                  size="sm"
                  className="h-8 bg-emerald-600 hover:bg-emerald-700"
                  disabled={!dirty || saving}
                  onClick={() => void save()}
                >
                  {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                  Save
                </Button>
              </div>
            </div>
            <CardDescription className="text-xs">
              Click a date header to focus that session. Click a cell to cycle status (P → A → L → …).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sheetLoading ? (
              <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
                Loading attendance…
              </div>
            ) : sessions.length === 0 ? (
              <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                No class sessions. Generate sessions from the routine to start marking attendance.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/80 hover:bg-muted/80">
                        <TableHead className="sticky left-0 z-10 min-w-[200px] bg-muted/95 font-semibold">
                          Student
                        </TableHead>
                        <TableHead className="min-w-[56px] text-center font-semibold text-xs">%</TableHead>
                        {sessions.map((s) => (
                          <TableHead
                            key={s.id}
                            className={cn(
                              'min-w-[80px] cursor-pointer select-none text-center text-xs font-semibold transition-colors',
                              s.id === focusSessionId
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'hover:bg-muted',
                            )}
                            onClick={() => setFocusSessionId(s.id === focusSessionId ? null : s.id)}
                          >
                            <div className="whitespace-nowrap">
                              {new Date(s.sessionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </div>
                            {s.topic && (
                              <div className="mt-0.5 line-clamp-1 text-[10px] font-normal text-muted-foreground">
                                {s.topic}
                              </div>
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((st) => {
                        const summary = summaryMap[st.id];
                        const pct = summary?.attendancePercent;
                        return (
                          <TableRow key={st.id} className="hover:bg-muted/30">
                            <TableCell className="sticky left-0 z-10 bg-background font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                              {st.fullName}
                            </TableCell>
                            <TableCell className={cn(
                              'text-center font-mono text-xs font-semibold',
                              pct == null ? 'text-muted-foreground' : pct >= 75 ? 'text-emerald-700' : pct >= 50 ? 'text-amber-700' : 'text-rose-700',
                            )}>
                              {pct != null ? `${pct}%` : '—'}
                            </TableCell>
                            {sessions.map((s) => {
                              const k = cellKey(s.id, st.id);
                              const val = cells[k] ?? '';
                              const eligible = isCellEligible(s.id, st.id);
                              return (
                                <TableCell
                                  key={k}
                                  className={cn(
                                    'p-1 text-center transition-colors',
                                    eligible ? 'cursor-pointer' : 'cursor-not-allowed opacity-40',
                                    s.id === focusSessionId && eligible && 'bg-emerald-50/60',
                                  )}
                                  onClick={() => eligible && cycleCell(s.id, st.id)}
                                >
                                  <span className={cn(
                                    'inline-flex h-7 w-7 items-center justify-center rounded-md border text-xs font-bold transition-all',
                                    eligible
                                      ? statusColor(val as AttendanceStatus | '')
                                      : 'bg-muted/30 text-muted-foreground/50 border-border/50',
                                  )}>
                                    {eligible ? statusLabel(val as AttendanceStatus | '') : '·'}
                                  </span>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Focus session counts */}
                {focusSessionId && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">Focused session:</span>
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-emerald-800">P {focusCounts.p}</span>
                    <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 font-mono text-rose-800">A {focusCounts.a}</span>
                    <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-amber-800">L {focusCounts.l}</span>
                    <span className="text-muted-foreground">Unmarked {focusCounts.unset}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Card 4: Export / Offline / Import ──────────────────────────────── */}
      {batchLoaded && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-base">Export / Offline Sheet / Import</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Export filled */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Export filled attendance</p>
              <p className="text-xs text-muted-foreground">
                Downloads all recorded attendance records (uses the date range set above if selected).
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={!!exporting} onClick={() => void runExport('xlsx')}>
                  {exporting === 'xlsx' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
                  Excel
                </Button>
                <Button size="sm" variant="outline" disabled={!!exporting} onClick={() => void runExport('csv')}>
                  {exporting === 'csv' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
                  CSV
                </Button>
              </div>
            </div>

            <div className="border-t" />

            {/* Offline blank sheet */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Generate offline (blank) sheet</p>
              <p className="text-xs text-muted-foreground">
                Blank sheet for teachers to mark manually and upload back. Compatible with the import format.
              </p>

              {/* Source toggle */}
              <div className="flex flex-wrap gap-2">
                {(['published', 'routine'] as const).map((src) => (
                  <Button
                    key={src}
                    size="sm"
                    variant={offlineSource === src ? 'default' : 'outline'}
                    className={cn('h-8 text-xs capitalize', offlineSource === src && 'bg-emerald-600 hover:bg-emerald-700')}
                    onClick={() => { setOfflineSource(src); setOfflinePreview(null); }}
                  >
                    {src === 'published' ? 'Published sessions' : 'Generate from routine'}
                  </Button>
                ))}
              </div>

              {/* Date range for offline */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { const p = monthPreset(0); setOfflineStart(p.start); setOfflineEnd(p.end); setOfflinePreview(null); }}>
                    This month
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { const p = monthPreset(1); setOfflineStart(p.start); setOfflineEnd(p.end); setOfflinePreview(null); }}>
                    Next month
                  </Button>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-muted-foreground">Start</span>
                    <Input type="date" className="h-8 w-36 text-xs" value={offlineStart} onChange={(e) => { setOfflineStart(e.target.value); setOfflinePreview(null); }} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-muted-foreground">End</span>
                    <Input type="date" className="h-8 w-36 text-xs" value={offlineEnd} onChange={(e) => { setOfflineEnd(e.target.value); setOfflinePreview(null); }} />
                  </div>
                  <Button size="sm" variant="outline" className="h-8" disabled={!offlineStart || !offlineEnd || offlinePreviewing} onClick={() => void runOfflinePreview()}>
                    {offlinePreviewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              {/* Institution name */}
              <div className="flex flex-col gap-1 max-w-xs">
                <span className="text-[11px] text-muted-foreground">Institution name (optional)</span>
                <Input className="h-8 text-xs" placeholder="e.g. Spondon Academy" value={offlineInstitution} onChange={(e) => setOfflineInstitution(e.target.value)} />
              </div>

              {/* Preview result */}
              {offlinePreview && (
                <div className={cn('rounded-lg border px-4 py-3 text-sm', offlinePreview.sessionCount === 0 ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800')}>
                  {offlinePreview.sessionCount === 0 ? (
                    <p>{offlineSource === 'published' ? 'No published sessions in this range. Try "Generate from routine".' : 'No routine slots match this date range.'}</p>
                  ) : (
                    <>
                      <p className="font-medium">{offlinePreview.sessionCount} session{offlinePreview.sessionCount !== 1 ? 's' : ''} × {offlinePreview.studentCount} student{offlinePreview.studentCount !== 1 ? 's' : ''}</p>
                      <p className="mt-1 text-xs opacity-80">
                        {offlinePreview.sessions.slice(0, 8).map((s) => new Date(s.date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })).join(' · ')}
                        {offlinePreview.sessions.length > 8 && ` · +${offlinePreview.sessions.length - 8} more`}
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Download buttons */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={!offlineStart || !offlineEnd || !!offlineDownloading} onClick={() => void runOfflineDownload('xlsx')}>
                  {offlineDownloading === 'xlsx' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
                  Download Excel
                </Button>
                <Button size="sm" variant="outline" disabled={!offlineStart || !offlineEnd || !!offlineDownloading} onClick={() => void runOfflineDownload('csv')}>
                  {offlineDownloading === 'csv' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
                  Download CSV
                </Button>
              </div>
            </div>

            <div className="border-t" />

            {/* Import */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Import attendance from file</p>
              <p className="text-xs text-muted-foreground">
                Upload a filled Excel/CSV file. Accepts both the blank sheet format and flat row-per-record format.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => { setImportFile(e.target.files?.[0] ?? null); setImportResult(null); }}
                />
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="mr-1.5 h-4 w-4" />
                  {importFile ? importFile.name : 'Choose file'}
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={!importFile || importing}
                  onClick={() => void runImport()}
                >
                  {importing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
                  Upload & Import
                </Button>
              </div>

              {/* Import result */}
              {importResult && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
                  <p className="font-medium text-emerald-800">
                    Imported {importResult.imported} record{importResult.imported !== 1 ? 's' : ''}
                    {importResult.skipped > 0 && `, ${importResult.skipped} skipped`}
                  </p>
                  {importResult.errors.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-xs text-rose-700">
                      {importResult.errors.slice(0, 10).map((e, i) => <li key={i}>• {e}</li>)}
                      {importResult.errors.length > 10 && <li>…and {importResult.errors.length - 10} more</li>}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
