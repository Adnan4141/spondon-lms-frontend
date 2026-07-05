'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import {
  STATUS_OPTIONS,
  buildMonthOptions,
  cellKey,
  currentMonth,
  monthPreset,
  monthToDateRange,
} from '../attendance-utils';

function clearSheetState(setters: {
  setSessions: (v: ClassSession[]) => void;
  setStudents: (v: { id: string; fullName: string }[]) => void;
  setCells: (v: Record<string, AttendanceStatus>) => void;
}) {
  setters.setSessions([]);
  setters.setStudents([]);
  setters.setCells({});
}

export function useAttendanceSheet() {
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

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sessionEligibility, setSessionEligibility] = useState<Record<string, Record<string, boolean>>>({});
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [students, setStudents] = useState<{ id: string; fullName: string }[]>([]);
  const [cells, setCells] = useState<Record<string, AttendanceStatus>>({});
  const [summaryMap, setSummaryMap] = useState<Record<string, AttendanceSummaryRow>>({});
  const [dirty, setDirty] = useState(false);
  const [focusSessionId, setFocusSessionId] = useState<string | null>(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [exporting, setExporting] = useState<'xlsx' | 'csv' | null>(null);
  const [offlineSource, setOfflineSource] = useState<'published' | 'routine'>('published');
  const [offlineStart, setOfflineStart] = useState('');
  const [offlineEnd, setOfflineEnd] = useState('');
  const [offlineInstitution, setOfflineInstitution] = useState('');
  const [offlinePreview, setOfflinePreview] = useState<OfflineSheetPreview | null>(null);
  const [offlinePreviewing, setOfflinePreviewing] = useState(false);
  const [offlineDownloading, setOfflineDownloading] = useState<'xlsx' | 'csv' | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sheetReset = useMemo(
    () => ({ setSessions, setStudents, setCells }),
    [],
  );

  const isMonthlyProgram = useMemo(
    () => programs.find((p) => p.id === selectedProgramId)?.paymentCircle === 'MONTHLY',
    [programs, selectedProgramId],
  );

  const filterMonth = useMemo(() => {
    if (selectedMonth) return selectedMonth;
    if (startDate) return startDate.slice(0, 7);
    if (endDate) return endDate.slice(0, 7);
    return '';
  }, [selectedMonth, startDate, endDate]);

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

  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: c.id, label: c.name })),
    [courses],
  );

  const selectedCourseMeta = useMemo(
    () => allProgramCourses.find((c) => c.id === selectedCourseId),
    [allProgramCourses, selectedCourseId],
  );

  const monthOptions = useMemo(() => {
    if (selectedCourseMeta) {
      return buildMonthOptions({
        startMonth: selectedCourseMeta.startMonth,
        endMonth: selectedCourseMeta.endMonth,
      });
    }
    if (selectedProgramId) {
      const programCourses = allProgramCourses.filter((c) => c.programId === selectedProgramId);
      const withBounds = programCourses.filter((c) => c.startMonth || c.endMonth);
      if (withBounds.length > 0) {
        const startMonth = withBounds.reduce(
          (min, c) => (!min || (c.startMonth && c.startMonth < min) ? c.startMonth! : min),
          withBounds[0].startMonth as string | undefined,
        );
        const endMonth = withBounds.reduce(
          (max, c) => (!max || (c.endMonth && c.endMonth > max) ? c.endMonth! : max),
          withBounds[0].endMonth as string | undefined,
        );
        return buildMonthOptions({ startMonth, endMonth });
      }
    }
    return buildMonthOptions();
  }, [selectedCourseMeta, selectedProgramId, allProgramCourses]);

  const branchOptions = useMemo(
    () => [
      { value: '', label: 'All branches' },
      ...branches.map((b) => ({ value: b.id, label: b.name })),
    ],
    [branches],
  );

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
    if (!selectedProgramId) {
      setSelectedCourseId('');
      setSelectedMonth('');
      return;
    }
    if (isMonthlyProgram) {
      setSelectedMonth((prev) => prev || currentMonth());
    } else {
      setSelectedMonth('');
    }
  }, [selectedProgramId, isMonthlyProgram]);

  useEffect(() => {
    if (!selectedMonth) return;
    const { start, end } = monthToDateRange(selectedMonth);
    setStartDate(start);
    setEndDate(end);
  }, [selectedMonth]);

  useEffect(() => {
    if (!selectedMonth || monthOptions.some((o) => o.value === selectedMonth)) return;
    setSelectedMonth(monthOptions[0]?.value ?? currentMonth());
  }, [monthOptions, selectedMonth]);

  useEffect(() => {
    if (!selectedCourseId) setSelectedBranchId('');
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId) return;
    if (!courses.some((c) => c.id === selectedCourseId)) {
      setSelectedCourseId('');
      setSelectedBranchId('');
      setSelectedBatchId('');
      clearSheetState(sheetReset);
    }
  }, [courses, selectedCourseId, sheetReset]);

  useEffect(() => {
    if (!selectedCourseId) {
      setBatches([]);
      setSelectedBatchId('');
      return;
    }
    setLoadingBatches(true);
    getBatches({ courseId: selectedCourseId, branchId: selectedBranchId || undefined })
      .then((r) => setBatches(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingBatches(false));
  }, [selectedCourseId, selectedBranchId]);

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
      if (!sheet) {
        clearSheetState(sheetReset);
        return;
      }

      const seenIds = new Set<string>();
      const uniqueStudents = sheet.enrollments
        .map((e) => e.student)
        .filter((s) => {
          if (seenIds.has(s.id)) return false;
          seenIds.add(s.id);
          return true;
        });

      setSessions(sheet.sessions);
      setStudents(uniqueStudents);
      setSessionEligibility(sheet.sessionEligibility ?? {});

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

      const sm: Record<string, AttendanceSummaryRow> = {};
      for (const row of summaryRes.data ?? []) sm[row.studentUserId] = row;
      setSummaryMap(sm);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to load sheet', variant: 'destructive' });
    } finally {
      setSheetLoading(false);
    }
  }, [selectedCourseId, selectedBatchId, selectedBranchId, startDate, endDate, focusSessionId, toast, sheetReset]);

  useEffect(() => {
    if (rangeSet) void loadSheet();
    else if (selectedBatchId && selectedCourseId && !startDate && !endDate) void loadSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId, selectedBatchId, selectedBranchId, startDate, endDate]);

  const isCellEligible = useCallback(
    (sessionId: string, studentId: string) => {
      if (Object.keys(sessionEligibility).length === 0) return true;
      return sessionEligibility[studentId]?.[sessionId] === true;
    },
    [sessionEligibility],
  );

  const cycleCell = useCallback(
    (sessionId: string, studentId: string) => {
      if (!isCellEligible(sessionId, studentId)) return;
      const k = cellKey(sessionId, studentId);
      setCells((prev) => {
        const cur = prev[k];
        const idx = cur ? STATUS_OPTIONS.indexOf(cur) : -1;
        const next = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
        return { ...prev, [k]: next };
      });
      setDirty(true);
    },
    [isCellEligible],
  );

  const markAllPresent = useCallback(() => {
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
  }, [focusSessionId, students, isCellEligible]);

  const save = useCallback(async () => {
    if (!dirty) return;
    setSaving(true);
    try {
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
          bulkRecordAttendance({ sessionId, records }),
        ),
      );
      toast({ title: 'Saved', description: 'Attendance saved successfully', variant: 'success' });
      setDirty(false);
      await loadSheet();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [dirty, cells, toast, loadSheet]);

  const publishFromRoutine = useCallback(async () => {
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
  }, [startDate, endDate, selectedCourseId, selectedBatchId, selectedBranchId, toast, loadSheet]);

  const runExport = useCallback(
    async (fmt: 'xlsx' | 'csv') => {
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
    },
    [selectedCourseId, selectedBatchId, selectedBranchId, startDate, endDate, toast],
  );

  const runOfflinePreview = useCallback(async () => {
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
  }, [selectedCourseId, selectedBatchId, selectedBranchId, offlineStart, offlineEnd, offlineSource, toast]);

  const runOfflineDownload = useCallback(
    async (fmt: 'xlsx' | 'csv') => {
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
    },
    [selectedCourseId, selectedBatchId, selectedBranchId, offlineStart, offlineEnd, offlineSource, offlineInstitution, toast],
  );

  const runImport = useCallback(async () => {
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
  }, [importFile, selectedCourseId, selectedBatchId, toast, loadSheet]);

  const applyMonthPreset = useCallback(
    (offset: 0 | 1) => {
      const p = monthPreset(offset);
      setStartDate(p.start);
      setEndDate(p.end);
      if (isMonthlyProgram) setSelectedMonth(p.start.slice(0, 7));
    },
    [isMonthlyProgram],
  );

  const clearDateRange = useCallback(() => {
    setStartDate('');
    setEndDate('');
    if (isMonthlyProgram) setSelectedMonth('');
  }, [isMonthlyProgram]);

  const focusCounts = useMemo(() => {
    if (!focusSessionId) return { p: 0, a: 0, l: 0, unset: 0 };
    let p = 0;
    let a = 0;
    let l = 0;
    let unset = 0;
    for (const st of students) {
      const v = cells[cellKey(focusSessionId, st.id)];
      if (!v) unset++;
      else if (v === 'PRESENT') p++;
      else if (v === 'ABSENT') a++;
      else if (v === 'LATE') l++;
    }
    return { p, a, l, unset };
  }, [focusSessionId, students, cells]);

  const onProgramChange = useCallback(
    (v: string) => {
      setSelectedProgramId(v);
      setSelectedCourseId('');
      setSelectedBranchId('');
      setSelectedBatchId('');
      setSelectedMonth('');
      clearSheetState(sheetReset);
    },
    [sheetReset],
  );

  const onCourseChange = useCallback(
    (v: string) => {
      setSelectedCourseId(v);
      setSelectedBranchId('');
      setSelectedBatchId('');
      clearSheetState(sheetReset);
    },
    [sheetReset],
  );

  const onBranchChange = useCallback(
    (v: string) => {
      setSelectedBranchId(v);
      setSelectedBatchId('');
      clearSheetState(sheetReset);
    },
    [sheetReset],
  );

  const onBatchChange = useCallback(
    (v: string) => {
      setSelectedBatchId(v);
      clearSheetState(sheetReset);
      setFocusSessionId(null);
    },
    [sheetReset],
  );

  return {
    programs,
    loadingPrograms,
    batches,
    loadingBatches,
    courseOptions,
    branchOptions,
    monthOptions,
    isMonthlyProgram,
    batchLoaded,
    selectedProgramId,
    selectedCourseId,
    selectedBranchId,
    selectedBatchId,
    selectedMonth,
    setSelectedMonth,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    sessions,
    students,
    cells,
    summaryMap,
    dirty,
    focusSessionId,
    setFocusSessionId,
    sheetLoading,
    saving,
    publishing,
    exporting,
    offlineSource,
    setOfflineSource,
    offlineStart,
    setOfflineStart,
    offlineEnd,
    setOfflineEnd,
    offlineInstitution,
    setOfflineInstitution,
    offlinePreview,
    setOfflinePreview,
    offlinePreviewing,
    offlineDownloading,
    importFile,
    setImportFile,
    importing,
    importResult,
    setImportResult,
    fileRef,
    currentStep,
    focusCounts,
    loadSheet,
    cycleCell,
    isCellEligible,
    markAllPresent,
    save,
    publishFromRoutine,
    runExport,
    runOfflinePreview,
    runOfflineDownload,
    runImport,
    applyMonthPreset,
    clearDateRange,
    onProgramChange,
    onCourseChange,
    onBranchChange,
    onBatchChange,
  };
}

export type AttendanceSheetController = ReturnType<typeof useAttendanceSheet>;
