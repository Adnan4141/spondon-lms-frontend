'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getRoutineSlots,
  getRoutineExportPdfUrl,
  getRoutineExportExcelUrl,
  generateRoutineCalendar,
  publishRoutineSessions,
  createRoutineSlot,
  updateRoutineSlot,
  deleteRoutineSlot,
  type RoutineSlot,
  type CalendarDay,
} from '@/lib/api/routine';
import { getPrograms } from '@/lib/api/programs';
import { getCourses } from '@/lib/api/courses';
import { getBatches, type Batch } from '@/lib/api/batches';
import { getBranches, type Branch } from '@/lib/api/branches';
import { getUsers, type User } from '@/lib/api/users';
import type { Program, Course } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  CalendarRange,
  Plus,
  Trash2,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Calendar,
  FileText,
  Check,
  LayoutGrid,
  LayoutList,
} from 'lucide-react';
import { RecurringScheduleDialog } from '@/components/admin/routine/RecurringScheduleDialog';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── Helpers ─────────────────────────────────────────────────────────

function toYmd(d?: Date): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYmd(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function downloadCsv(calendar: CalendarDay[]) {
  const headers = ['Date', 'Day', 'Start Time', 'End Time', 'Course', 'Batch', 'Teacher', 'Topic'];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows: string[] = [headers.map(escape).join(',')];
  for (const day of calendar) {
    for (const slot of day.slots) {
      rows.push(
        [
          day.date,
          day.dayName,
          slot.startTime,
          slot.endTime,
          slot.course?.name ?? '',
          slot.batch?.name ?? '',
          slot.teacher?.fullName ?? '',
          slot.topic ?? '',
        ]
          .map(escape)
          .join(','),
      );
    }
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'routine.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Types ───────────────────────────────────────────────────────────

interface SlotFormState {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  topic: string;
  teacherUserId: string;
  isActive: string;
}

const EMPTY_SLOT_FORM: SlotFormState = {
  dayOfWeek: '',
  startTime: '09:00',
  endTime: '10:30',
  topic: '',
  teacherUserId: '',
  isActive: 'ACTIVE',
};

// ── Component ───────────────────────────────────────────────────────

function AdminRoutinePageInner() {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // ── Step 1: Selection state ──────────────────────────────────────
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batchList, setBatchList] = useState<Batch[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Selection state ──────────────────────────────────────────────
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);

  // ── Slot management state ────────────────────────────────────────
  const [slots, setSlots] = useState<RoutineSlot[]>([]);
  const [filterDay, setFilterDay] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [slotForm, setSlotForm] = useState<SlotFormState>(EMPTY_SLOT_FORM);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [savingSlot, setSavingSlot] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);

  // ── Generate & export state ──────────────────────────────────────
  const [genCalendar, setGenCalendar] = useState<CalendarDay[]>([]);
  const [genTotalClasses, setGenTotalClasses] = useState(0);
  const [genLoading, setGenLoading] = useState(false);
  const [genHasResult, setGenHasResult] = useState(false);
  const [genStartDate, setGenStartDate] = useState<Date | undefined>(undefined);
  const [genEndDate, setGenEndDate] = useState<Date | undefined>(undefined);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // ── Derived state ────────────────────────────────────────────────
  const selectedBatch = useMemo(
    () => batchList.find((b) => b.id === selectedBatchId),
    [batchList, selectedBatchId],
  );

  const currentStep = useMemo(() => {
    if (selectedBatchId) return 5;
    if (selectedBranchId) return 4;
    if (selectedCourseId) return 3;
    if (selectedProgramId) return 2;
    return 1;
  }, [selectedProgramId, selectedCourseId, selectedBranchId, selectedBatchId]);

  const selectionSummary = useMemo(() => {
    if (!selectedBatchId) return '';
    const prog = programs.find((p) => p.id === selectedProgramId);
    const course = courses.find((c) => c.id === selectedCourseId);
    const branch = branches.find((b) => b.id === selectedBranchId);
    const batch = selectedBatch;
    return `${prog?.name ?? ''}  →  ${course?.name ?? ''}  →  ${branch?.name ?? ''}  →  ${batch?.name ?? ''}`;
  }, [selectedProgramId, selectedCourseId, selectedBranchId, selectedBatchId, programs, courses, branches, selectedBatch]);

  const configEnabled = currentStep >= 5;
  const generateEnabled = configEnabled && slots.length > 0;

  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      if (filterDay && String(s.dayOfWeek) !== filterDay) return false;
      if (filterStatus === 'ACTIVE' && !s.isActive) return false;
      if (filterStatus === 'INACTIVE' && s.isActive) return false;
      return true;
    });
  }, [slots, filterDay, filterStatus]);

  // ── Load programs & teachers on mount ────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingPrograms(true);
      try {
        const [progRes, teacherRes] = await Promise.all([
          getPrograms(),
          getUsers({ role: 'TEACHER', status: 'ACTIVE', limit: 200 }),
        ]);
        if (progRes.success && progRes.data) setPrograms(progRes.data);
        if (teacherRes.success && teacherRes.data) setTeachers(teacherRes.data);
      } catch {
        toast({ title: 'Error', description: 'Failed to load programs', variant: 'destructive' });
      } finally {
        setLoadingPrograms(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load courses when program changes ────────────────────────────
  const handleProgramChange = useCallback(
    async (programId: string) => {
      const id = programId === '_none' ? '' : programId;
      setSelectedProgramId(id);
      setSelectedCourseId('');
      setSelectedBranchId('');
      setSelectedBatchId('');
      setCourses([]);
      setBranches([]);
      setBatchList([]);
      setSlots([]);
      setGenHasResult(false);
      if (!id) return;
      setLoadingCourses(true);
      try {
        const res = await getCourses({ programId: id });
        if (res.success && res.data) setCourses(res.data);
      } catch {
        toast({ title: 'Error', description: 'Failed to load courses', variant: 'destructive' });
      } finally {
        setLoadingCourses(false);
      }
    },
    [toast],
  );

  // ── Load branches when course changes ────────────────────────────
  const handleCourseChange = useCallback(
    async (courseId: string) => {
      const id = courseId === '_none' ? '' : courseId;
      setSelectedCourseId(id);
      setSelectedBranchId('');
      setSelectedBatchId('');
      setBranches([]);
      setBatchList([]);
      setSlots([]);
      setGenHasResult(false);
      if (!id) return;
      setLoadingBranches(true);
      try {
        const res = await getBranches();
        if (res.success && res.data) setBranches(res.data);
      } catch {
        toast({ title: 'Error', description: 'Failed to load branches', variant: 'destructive' });
      } finally {
        setLoadingBranches(false);
      }
    },
    [toast],
  );

  // ── Load batches when branch changes ─────────────────────────────
  const handleBranchChange = useCallback(
    async (branchId: string) => {
      const id = branchId === '_none' ? '' : branchId;
      setSelectedBranchId(id);
      setSelectedBatchId('');
      setBatchList([]);
      setSlots([]);
      setGenHasResult(false);
      if (!id) return;
      setLoadingBatches(true);
      try {
        const res = await getBatches({ courseId: selectedCourseId, branchId: id });
        if (res.success && res.data) setBatchList(res.data);
      } catch {
        toast({ title: 'Error', description: 'Failed to load batches', variant: 'destructive' });
      } finally {
        setLoadingBatches(false);
      }
    },
    [toast, selectedCourseId],
  );

  // ── Load slots when batch changes ────────────────────────────────
  const loadSlots = useCallback(
    async (batchId: string) => {
      if (!batchId) {
        setSlots([]);
        return;
      }
      setLoadingSlots(true);
      try {
        const res = await getRoutineSlots({ batchId, mode: 'OFFLINE' });
        if (res.success && res.data) setSlots(res.data);
      } catch {
        toast({ title: 'Error', description: 'Failed to load routine slots', variant: 'destructive' });
      } finally {
        setLoadingSlots(false);
      }
    },
    [toast],
  );

  const handleBatchChange = useCallback(
    (batchId: string) => {
      const id = batchId === '_none' ? '' : batchId;
      setSelectedBatchId(id);
      setGenHasResult(false);
      loadSlots(id);
    },
    [loadSlots],
  );

  // ── Slot modal helpers ───────────────────────────────────────────
  const openAddSlot = () => {
    setEditingSlotId(null);
    setSlotForm(EMPTY_SLOT_FORM);
    setConflictMessage(null);
    setSlotModalOpen(true);
  };

  const openEditSlot = (slot: RoutineSlot) => {
    setEditingSlotId(slot.id);
    setSlotForm({
      dayOfWeek: String(slot.dayOfWeek),
      startTime: slot.startTime,
      endTime: slot.endTime,
      topic: slot.topic ?? '',
      teacherUserId: slot.teacherUserId ?? '',
      isActive: slot.isActive ? 'ACTIVE' : 'INACTIVE',
    });
    setConflictMessage(null);
    setSlotModalOpen(true);
  };

  const closeSlotModal = () => {
    setSlotModalOpen(false);
    setEditingSlotId(null);
    setConflictMessage(null);
  };

  const handleSlotFormChange = (field: keyof SlotFormState, value: string) => {
    setSlotForm((prev) => ({ ...prev, [field]: value }));
  };

  // ── Live conflict detection ───────────────────────────────────────
  useEffect(() => {
    if (!slotForm.dayOfWeek || !slotForm.startTime || !slotForm.endTime) {
      setConflictMessage(null);
      return;
    }
    if (slotForm.startTime >= slotForm.endTime) {
      setConflictMessage('End time must be after start time.');
      return;
    }
    const dayNum = Number(slotForm.dayOfWeek);
    const conflict = slots.find(
      (s) =>
        s.id !== editingSlotId &&
        s.dayOfWeek === dayNum &&
        s.startTime < slotForm.endTime &&
        s.endTime > slotForm.startTime,
    );
    setConflictMessage(
      conflict
        ? `Overlaps with: ${DAY_NAMES[conflict.dayOfWeek]} ${conflict.startTime}–${conflict.endTime}`
        : null,
    );
  }, [slotForm, slots, editingSlotId]);

  const saveSlot = async () => {
    // Validation
    if (!slotForm.dayOfWeek || !slotForm.startTime || !slotForm.endTime) {
      toast({ title: 'Validation', description: 'Day, start time and end time are required.', variant: 'destructive' });
      return;
    }
    if (slotForm.startTime >= slotForm.endTime) {
      toast({ title: 'Validation', description: 'End time must be after start time.', variant: 'destructive' });
      return;
    }
    if (conflictMessage) return; // live conflict shown in UI

    setSavingSlot(true);
    try {
      const payload = {
        branchId: selectedBranchId || undefined,
        programId: selectedProgramId || undefined,
        courseId: selectedCourseId || undefined,
        batchId: selectedBatchId || undefined,
        dayOfWeek: Number(slotForm.dayOfWeek),
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        topic: slotForm.topic || undefined,
        teacherUserId: slotForm.teacherUserId || undefined,
        mode: 'OFFLINE' as const,
        isActive: slotForm.isActive === 'ACTIVE',
      };

      const res = editingSlotId
        ? await updateRoutineSlot(editingSlotId, payload)
        : await createRoutineSlot(payload);

      if (!res.success) {
        toast({ title: 'Error', description: res.message ?? 'Failed to save slot', variant: 'destructive' });
        return;
      }

      toast({ title: 'Success', description: editingSlotId ? 'Slot updated' : 'Slot created' });
      closeSlotModal();
      loadSlots(selectedBatchId);
    } catch {
      toast({ title: 'Error', description: 'Failed to save slot', variant: 'destructive' });
    } finally {
      setSavingSlot(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await deleteRoutineSlot(id);
      if (res.success) {
        toast({ title: 'Deleted', description: 'Routine slot removed' });
        setSlots((prev) => prev.filter((s) => s.id !== id));
      } else {
        toast({ title: 'Error', description: res.message ?? 'Failed to delete', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  // ── Step 3: Generate handlers ────────────────────────────────────
  const genYmdStart = toYmd(genStartDate);
  const genYmdEnd = toYmd(genEndDate);

  const handleGenerate = async () => {
    if (!genYmdStart || !genYmdEnd) {
      toast({ title: 'Validation', description: 'Select start and end dates.', variant: 'destructive' });
      return;
    }
    if (genYmdStart > genYmdEnd) {
      toast({ title: 'Validation', description: 'End date must be on or after start date.', variant: 'destructive' });
      return;
    }

    setGenLoading(true);
    setGenHasResult(false);
    try {
      const res = await generateRoutineCalendar({
        batchId: selectedBatchId || undefined,
        courseId: selectedCourseId || undefined,
        mode: 'OFFLINE',
        startDate: genYmdStart,
        endDate: genYmdEnd,
      });
      if (res.success && res.data) {
        setGenCalendar(res.data);
        setGenTotalClasses(res.totalClasses ?? 0);
        setGenHasResult(true);
        if (res.data.length === 0) {
          toast({ title: 'No results', description: 'No active slots match any days in the selected range.' });
        }
      } else {
        toast({ title: 'Error', description: res.message ?? 'Failed to generate routine', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to generate routine', variant: 'destructive' });
    } finally {
      setGenLoading(false);
    }
  };

  const setThisMonth = () => {
    const now = new Date();
    setGenStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setGenEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  };

  const setNextMonth = () => {
    const now = new Date();
    setGenStartDate(new Date(now.getFullYear(), now.getMonth() + 1, 1));
    setGenEndDate(new Date(now.getFullYear(), now.getMonth() + 2, 0));
  };

  // ── Autofill date range from query params ───────────────────────
  useEffect(() => {
    const start = parseYmd(searchParams.get('startDate') || searchParams.get('start'));
    const end = parseYmd(searchParams.get('endDate') || searchParams.get('end'));
    if (start && end) {
      setGenStartDate(start);
      setGenEndDate(end);
      return;
    }

    const presetRaw = (
      searchParams.get('month') ||
      searchParams.get('preset') ||
      searchParams.get('range') ||
      ''
    )
      .toLowerCase()
      .trim();

    const thisMonthSelected =
      presetRaw === 'this-month' ||
      presetRaw === 'this_month' ||
      presetRaw === 'current' ||
      presetRaw === 'current-month' ||
      presetRaw === 'one-month' ||
      presetRaw === 'one_month' ||
      searchParams.get('oneMonth') === 'true';

    const nextMonthSelected =
      presetRaw === 'next-month' ||
      presetRaw === 'next_month' ||
      presetRaw === 'next' ||
      searchParams.get('nextMonth') === 'true';

    if (thisMonthSelected) setThisMonth();
    if (nextMonthSelected) setNextMonth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await publishRoutineSessions({
        batchId: selectedBatchId || undefined,
        courseId: selectedCourseId || undefined,
        mode: 'OFFLINE',
        startDate: genYmdStart,
        endDate: genYmdEnd,
      });
      if (res.success && res.data) {
        toast({
          title: 'Sessions published',
          description: `${res.data.created} session${res.data.created !== 1 ? 's' : ''} created, ${res.data.skipped} skipped.`,
        });
      } else {
        toast({ title: 'Error', description: (res as { message?: string }).message ?? 'Failed to publish', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to publish sessions', variant: 'destructive' });
    } finally {
      setPublishing(false);
      setPublishOpen(false);
    }
  };

  const handleExportCsv = () => {
    if (genCalendar.length > 0) downloadCsv(genCalendar);
  };

  const handleExportPdfList = () => {
    const url = getRoutineExportPdfUrl({
      batchId: selectedBatchId || undefined,
      courseId: selectedCourseId || undefined,
      mode: 'OFFLINE',
      format: 'list',
    });
    window.open(url, '_blank');
  };

  const handleExportPdfWeekly = () => {
    if (!genYmdStart || !genYmdEnd) {
      toast({ title: 'Validation', description: 'Select start and end dates first', variant: 'destructive' });
      return;
    }
    const url = getRoutineExportPdfUrl({
      batchId: selectedBatchId || undefined,
      courseId: selectedCourseId || undefined,
      mode: 'OFFLINE',
      format: 'weekly-range',
      startDate: genYmdStart,
      endDate: genYmdEnd,
    });
    window.open(url, '_blank');
  };

  const handleExportExcel = () => {
    const url = getRoutineExportExcelUrl({
      batchId: selectedBatchId || undefined,
      courseId: selectedCourseId || undefined,
      mode: 'OFFLINE',
      startDate: genYmdStart || undefined,
      endDate: genYmdEnd || undefined,
      format: genYmdStart && genYmdEnd ? 'calendar' : 'template',
    });
    window.open(url, '_blank');
  };

  // ── Step indicator helper ────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center gap-0 mb-5">
      {[
        { num: 1, label: 'Program' },
        { num: 2, label: 'Course' },
        { num: 3, label: 'Branch' },
        { num: 4, label: 'Batch' },
        { num: 5, label: 'Configure' },
      ].map((step, idx) => (
        <React.Fragment key={step.num}>
          {idx > 0 && (
            <div
              className={cn(
                'h-px flex-1 min-w-5 mx-2',
                step.num <= currentStep ? 'bg-teal-400' : 'bg-border',
              )}
            />
          )}
          <div
            className={cn(
              'flex items-center gap-1.5 text-xs',
              step.num < currentStep && 'text-muted-foreground',
              step.num === currentStep && 'text-teal-700 font-medium',
              step.num > currentStep && 'text-muted-foreground/50',
            )}
          >
            <span
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 border',
                step.num < currentStep && 'bg-teal-50 text-teal-700 border-teal-400',
                step.num === currentStep && 'bg-teal-600 text-white border-teal-600',
                step.num > currentStep && 'bg-muted text-muted-foreground border-border',
              )}
            >
              {step.num < currentStep ? (
                <Check className="h-3 w-3" />
              ) : (
                step.num
              )}
            </span>
            {step.label}
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[90rem] space-y-5 p-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shrink-0">
          <CalendarRange className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-medium">Class routine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define weekly recurring slots for a batch — program → course → branch → batch.
          </p>
        </div>
      </div>

      {/* ═══════════════════ CARD 1: Select program, course & batch ═══════════════════ */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base">Step 1 — Select program, course, branch &amp; batch</CardTitle>
          <CardDescription>Each selection filters the next. All four are required before adding slots.</CardDescription>
        </CardHeader>
      </Card>

      {/* ═══════════════════ CARD 1: Select program, course, branch & batch ═══════════════════ */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base">Step 1 — Select program, course, branch &amp; batch</CardTitle>
          <CardDescription>Each selection filters the next. All four are required before adding slots.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <StepIndicator />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Program */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Program <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedProgramId || '_none'}
                onValueChange={handleProgramChange}
                disabled={loadingPrograms}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="-- Select program --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">-- Select program --</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Course <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedCourseId || '_none'}
                onValueChange={handleCourseChange}
                disabled={!selectedProgramId || loadingCourses}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="-- Select course --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">-- Select course --</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Branch <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedBranchId || '_none'}
                onValueChange={handleBranchChange}
                disabled={!selectedCourseId || loadingBranches}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="-- Select branch --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">-- Select branch --</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Batch */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Batch <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedBatchId || '_none'}
                onValueChange={handleBatchChange}
                disabled={!selectedBranchId || loadingBatches}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="-- Select batch --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">-- Select batch --</SelectItem>
                  {batchList.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selection summary tag */}
          {selectionSummary && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-teal-300 bg-teal-50 px-4 py-3">
              <Check className="h-4 w-4 text-teal-600 shrink-0" />
              <span className="text-xs font-medium text-teal-800">{selectionSummary}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════ CARD 2: Weekly slot configuration ═══════════════════ */}
      <Card className={cn(!configEnabled && 'opacity-45 pointer-events-none')}>
        <CardHeader className="border-b pb-4 flex flex-row flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Step 2 — Weekly slot configuration</CardTitle>
            <CardDescription>Add recurring time slots for each day of the week.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {slots.length} slot{slots.length !== 1 ? 's' : ''}
            </Badge>
            <div className="flex items-center rounded-lg border border-slate-200 p-0.5">
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <LayoutList className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('grid')}
                title="Calendar grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button size="sm" onClick={openAddSlot} className="gap-1.5 bg-teal-600 text-white hover:bg-teal-700">
              <Plus className="h-4 w-4" />
              Add slot
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-5 pb-0">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4 items-end">
            <div className="space-y-1 min-w-35">
              <Label className="text-xs text-muted-foreground">Filter by day</Label>
              <Select value={filterDay || '_all'} onValueChange={(v) => setFilterDay(v === '_all' ? '' : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All days</SelectItem>
                  {DAY_NAMES.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-35">
              <Label className="text-xs text-muted-foreground">Filter by status</Label>
              <Select value={filterStatus || '_all'} onValueChange={(v) => setFilterStatus(v === '_all' ? '' : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(filterDay || filterStatus) && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                onClick={() => {
                  setFilterDay('');
                  setFilterStatus('');
                }}
              >
                <RefreshCw className="h-3 w-3" />
                Reset
              </Button>
            )}
          </div>

          {/* Slot table / calendar grid */}
          {loadingSlots ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin text-teal-500" />
              Loading slots…
            </div>
          ) : filteredSlots.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-sm">No slots yet — click &quot;Add slot&quot; to start.</span>
            </div>
          ) : viewMode === 'grid' ? (
            /* ── Weekly calendar grid ── */
            <div className="overflow-x-auto">
              <div className="grid min-w-[700px] grid-cols-7 gap-px rounded-lg border border-slate-200 bg-slate-200">
                {DAY_NAMES.map((dayName, dayIdx) => {
                  const daySlots = filteredSlots
                    .filter((s) => s.dayOfWeek === dayIdx)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime));
                  return (
                    <div key={dayIdx} className="flex flex-col bg-white">
                      <div className="sticky top-0 bg-teal-600 px-2 py-2 text-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-white">{dayName.slice(0, 3)}</span>
                        <span className="ml-1 rounded-full bg-white/20 px-1.5 text-[10px] font-bold text-white">{daySlots.length}</span>
                      </div>
                      <div className="flex flex-col gap-1.5 p-2 min-h-[120px]">
                        {daySlots.length === 0 ? (
                          <button
                            className="mt-2 flex items-center justify-center rounded-lg border border-dashed border-teal-200 py-3 text-xs text-teal-400 hover:border-teal-400 hover:bg-teal-50 transition-colors"
                            onClick={() => openAddSlot()}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add
                          </button>
                        ) : (
                          daySlots.map((slot) => (
                            <button
                              key={slot.id}
                              onClick={() => openEditSlot(slot)}
                              className={cn(
                                'w-full rounded-lg px-2 py-1.5 text-left text-xs transition-all hover:ring-2 hover:ring-teal-400',
                                slot.isActive
                                  ? 'bg-teal-50 border border-teal-200'
                                  : 'bg-slate-50 border border-slate-200 opacity-60'
                              )}
                            >
                              <div className="font-mono font-bold text-[10px] text-teal-700">{slot.startTime}–{slot.endTime}</div>
                              {slot.topic && <div className="mt-0.5 truncate text-slate-600">{slot.topic}</div>}
                              {slot.teacher && <div className="mt-0.5 truncate text-slate-400">{slot.teacher.fullName}</div>}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="overflow-auto rounded-lg border max-h-96">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-muted/90 hover:bg-muted/90">
                    <TableHead className="font-semibold">Day</TableHead>
                    <TableHead className="font-semibold">Time</TableHead>
                    <TableHead className="font-semibold">Topic / subject</TableHead>
                    <TableHead className="font-semibold">Teacher</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSlots.map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell>
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white text-xs font-medium"
                          title={DAY_NAMES[slot.dayOfWeek]}
                        >
                          {DAY_NAMES[slot.dayOfWeek]?.substring(0, 2)}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {slot.startTime}–{slot.endTime}
                      </TableCell>
                      <TableCell className="max-w-44 truncate text-muted-foreground">
                        {slot.topic || '—'}
                      </TableCell>
                      <TableCell>{slot.teacher?.fullName || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={slot.isActive ? 'default' : 'destructive'} className="text-xs">
                          {slot.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => openEditSlot(slot)}>
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive"
                                disabled={deletingId === slot.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this slot?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove the {DAY_NAMES[slot.dayOfWeek]} {slot.startTime}–{slot.endTime} slot.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={(e) => {
                                    e.preventDefault();
                                    void handleDeleteSlot(slot.id);
                                  }}
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="h-4" />
        </CardContent>
      </Card>

      {/* ═══════════════════ CARD 3: Generate & export ═══════════════════ */}
      <Card className={cn(!generateEnabled && 'opacity-45 pointer-events-none')}>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base">Step 3 — Generate &amp; export</CardTitle>
          <CardDescription>Expand weekly template to real dates; export or publish to class sessions.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          {/* Date range */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Start date <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                date={genStartDate}
                setDate={setGenStartDate}
                placeholder="Pick start"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                End date <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                date={genEndDate}
                setDate={setGenEndDate}
                placeholder="Pick end"
                className="h-9"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm" className="h-9" onClick={setThisMonth}>
                This month
              </Button>
              <Button variant="outline" size="sm" className="h-9" onClick={setNextMonth}>
                Next month
              </Button>
            </div>
          </div>

          {/* Summary bar */}
          {genHasResult && (
            <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-2.5 text-sm">
              <Calendar className="h-4 w-4 text-teal-600 shrink-0" />
              <span>
                {genTotalClasses} class{genTotalClasses !== 1 ? 'es' : ''} across{' '}
                {genCalendar.length} day{genCalendar.length !== 1 ? 's' : ''} from{' '}
                {genYmdStart} to {genYmdEnd}
              </span>
            </div>
          )}

          <div className="h-px bg-border" />

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleGenerate}
              disabled={genLoading}
              className="gap-2 bg-teal-600 text-white hover:bg-teal-700"
            >
              {genLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              {genLoading ? 'Generating…' : 'Generate preview'}
            </Button>

            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportPdfList}>
              <FileText className="h-4 w-4" />
              PDF (list)
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!genYmdStart || !genYmdEnd}
              onClick={handleExportPdfWeekly}
            >
              <FileText className="h-4 w-4" />
              PDF (weekly)
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            {genHasResult && genCalendar.length > 0 && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCsv}>
                <Download className="h-4 w-4" />
                CSV
              </Button>
            )}
          </div>

          {/* Preview table */}
          {genLoading && (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin text-teal-500" />
              Generating routine…
            </div>
          )}

          {!genLoading && genHasResult && genCalendar.length === 0 && (
            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              No active slots match any days in the selected range.
            </div>
          )}

          {!genLoading && genHasResult && genCalendar.length > 0 && (
            <>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Generated preview</span>
                <Badge variant="secondary" className="text-xs">
                  {genTotalClasses} class{genTotalClasses !== 1 ? 'es' : ''}
                </Badge>
              </div>
              <div className="overflow-x-auto rounded-lg border max-h-125 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-muted/90 hover:bg-muted/90">
                      <TableHead className="font-semibold w-28">Date</TableHead>
                      <TableHead className="font-semibold w-24">Day</TableHead>
                      <TableHead className="font-semibold w-28">Time</TableHead>
                      <TableHead className="font-semibold">Topic</TableHead>
                      <TableHead className="font-semibold">Teacher</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {genCalendar.map((day) =>
                      day.slots.map((slot, idx) => (
                        <TableRow key={`${day.date}-${idx}`}>
                          <TableCell className="font-mono text-xs">{day.date}</TableCell>
                          <TableCell>{day.dayName}</TableCell>
                          <TableCell className="whitespace-nowrap font-mono text-xs">
                            {slot.startTime}–{slot.endTime}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{slot.topic || '—'}</TableCell>
                          <TableCell>{slot.teacher?.fullName || '—'}</TableCell>
                        </TableRow>
                      )),
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Publish */}
              <div className="flex justify-end">
                <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
                  <AlertDialogTrigger asChild>
                    <Button className="gap-2 bg-teal-600 text-white hover:bg-teal-700">
                      <Check className="h-4 w-4" />
                      Publish sessions
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Publish class sessions?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will create <strong>{genTotalClasses}</strong> class session{genTotalClasses !== 1 ? 's' : ''} from{' '}
                        <strong>{genYmdStart}</strong> to <strong>{genYmdEnd}</strong>.
                        Existing sessions for the same date/batch/course will be skipped (not overwritten).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.preventDefault();
                          void handlePublish();
                        }}
                        disabled={publishing}
                        className="bg-teal-600 text-white hover:bg-teal-700"
                      >
                        {publishing ? 'Publishing…' : 'Publish'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recurring Schedule Dialog */}
      <RecurringScheduleDialog
        open={recurringOpen}
        onClose={() => setRecurringOpen(false)}
        onSuccess={() => loadSlots(selectedBatchId)}
        batches={batchList}
        teachers={teachers}
      />

      {/* Add / Edit Slot Dialog */}
      <Dialog open={slotModalOpen} onOpenChange={(open) => { if (!open) closeSlotModal(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSlotId ? 'Edit routine slot' : 'Add routine slot'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Day */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Day of week <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={slotForm.dayOfWeek || '_none'}
                  onValueChange={(v) => handleSlotFormChange('dayOfWeek', v === '_none' ? '' : v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="-- Select --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">-- Select --</SelectItem>
                    {DAY_NAMES.map((d, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <Select
                  value={slotForm.isActive}
                  onValueChange={(v) => handleSlotFormChange('isActive', v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Start time */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Start time <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="time"
                  className="h-9"
                  value={slotForm.startTime}
                  onChange={(e) => handleSlotFormChange('startTime', e.target.value)}
                />
              </div>

              {/* End time */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  End time <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="time"
                  className="h-9"
                  value={slotForm.endTime}
                  onChange={(e) => handleSlotFormChange('endTime', e.target.value)}
                />
              </div>
            </div>

            {/* Topic */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Topic / subject</Label>
              <Input
                type="text"
                className="h-9"
                placeholder="e.g. Physics — Chapter 3"
                value={slotForm.topic}
                onChange={(e) => handleSlotFormChange('topic', e.target.value)}
              />
            </div>

            {/* Teacher */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Teacher</Label>
              <Select
                value={slotForm.teacherUserId || '_none'}
                onValueChange={(v) => handleSlotFormChange('teacherUserId', v === '_none' ? '' : v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="-- Select teacher --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">-- Select teacher --</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conflict warning */}
            {conflictMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {conflictMessage}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeSlotModal}>
              Cancel
            </Button>
            <Button
              onClick={saveSlot}
              disabled={savingSlot}
              className="bg-teal-600 text-white hover:bg-teal-700"
            >
              {savingSlot ? 'Saving…' : 'Save slot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminRoutinePage() {
  return (
    <Suspense>
      <AdminRoutinePageInner />
    </Suspense>
  );
}
