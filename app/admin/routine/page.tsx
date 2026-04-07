'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
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
import { getBranches } from '@/lib/api/branches';
import { getBatches } from '@/lib/api/batches';
import { getUsers, type User } from '@/lib/api/users';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  LayoutGrid,
  List,
  FileSpreadsheet,
  RefreshCw,
  Calendar,
  FileText,
  User,
} from 'lucide-react';
import { TeacherCombobox } from '@/components/admin/routine/TeacherCombobox';
import { RoutineGrid, type GridSlot } from '@/components/admin/routine/RoutineGrid';
import { SlotWizard, type SlotFormData } from '@/components/admin/routine/SlotWizard';
import { GridSettings, loadGridSettings, type GridSettingsState } from '@/components/admin/routine/GridSettings';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type BranchRow = { id: string; name: string };
type BatchRow = {
  id: string;
  name: string;
  courseId?: string;
  branchId?: string;
  course?: { id: string; name: string } | null;
};

function toGridSlot(s: RoutineSlot): GridSlot {
  return {
    id: s.id,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    topic: s.topic,
    mode: s.mode,
    isActive: s.isActive,
    course: s.course ? { id: s.course.id, name: s.course.name } : undefined,
    batch: s.batch ? { id: s.batch.id, name: s.batch.name } : undefined,
    teacher: s.teacher ? { id: s.teacher.id, fullName: s.teacher.fullName } : undefined,
  };
}

function downloadCsv(calendar: CalendarDay[]) {
  const headers = ['Date', 'Day', 'Start Time', 'End Time', 'Course', 'Batch', 'Teacher', 'Topic', 'Mode'];
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
          slot.mode,
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

function toYmd(d?: Date): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Monday–Sunday (ISO-style week starting Monday). */
function getThisWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday, end: sunday };
}

function getThisMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

const generateFormSchema = z
  .object({
    courseId: z.string().optional(),
    batchId: z.string().optional(),
    branchId: z.string().optional(),
    mode: z.enum(['all', 'ONLINE', 'OFFLINE']).default('all'),
    startDate: z.date({ required_error: 'Start date is required' }),
    endDate: z.date({ required_error: 'End date is required' }),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

type GenerateFormErrors = Partial<Record<'startDate' | 'endDate' | 'mode' | '_root', string>>;

export default function AdminRoutinePage() {
  const { toast } = useToast();

  // Shared data
  const [slots, setSlots] = useState<RoutineSlot[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Main tab
  const [mainTab, setMainTab] = useState('template');

  // ── Template tab state ──────────────────────────────────────────
  const [filterBranchId, setFilterBranchId] = useState('');
  const [filterBatchId, setFilterBatchId] = useState('');
  const [filterTeacherUserId, setFilterTeacherUserId] = useState('');
  const [filterDayOfWeek, setFilterDayOfWeek] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [gridSettings, setGridSettings] = useState<GridSettingsState>(() => loadGridSettings());
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardVariant, setWizardVariant] = useState<'default' | 'teacherOnly'>('default');
  const [editingSlot, setEditingSlot] = useState<GridSlot | null>(null);
  const [wizardDay, setWizardDay] = useState<number | undefined>();
  const [wizardTime, setWizardTime] = useState<string | undefined>();
  const [exportOpen, setExportOpen] = useState(false);
  const [exportWeekStart, setExportWeekStart] = useState<Date | undefined>(undefined);
  const [exportWeekEnd, setExportWeekEnd] = useState<Date | undefined>(undefined);
  const [deleting, setDeleting] = useState<string | null>(null);

  // ── Generated Routine tab state ─────────────────────────────────
  const [genCourseId, setGenCourseId] = useState('');
  const [genBatchId, setGenBatchId] = useState('');
  const [genBranchId, setGenBranchId] = useState('');
  const [genMode, setGenMode] = useState<'all' | 'ONLINE' | 'OFFLINE'>('all');
  const [genTeacherUserId, setGenTeacherUserId] = useState('');
  const [genRangeStart, setGenRangeStart] = useState<Date | undefined>(undefined);
  const [genRangeEnd, setGenRangeEnd] = useState<Date | undefined>(undefined);
  const [genCalendar, setGenCalendar] = useState<CalendarDay[]>([]);
  const [genTotalClasses, setGenTotalClasses] = useState(0);
  const [genLoading, setGenLoading] = useState(false);
  const [genHasResult, setGenHasResult] = useState(false);
  const [genErrors, setGenErrors] = useState<GenerateFormErrors>({});
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // ── Load shared data ────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsRes, branchesRes, batchesRes, teachersRes] = await Promise.all([
        getRoutineSlots({
          branchId: filterBranchId || undefined,
          batchId: filterBatchId || undefined,
          teacherUserId: filterTeacherUserId || undefined,
          dayOfWeek: filterDayOfWeek ? Number(filterDayOfWeek) : undefined,
          mode: filterMode || undefined,
        }),
        getBranches(),
        getBatches(),
        getUsers({ role: 'TEACHER', status: 'ACTIVE', limit: 200 }),
      ]);
      if (slotsRes.success && slotsRes.data) setSlots(slotsRes.data);
      const branchList = (branchesRes as unknown as { success: boolean; data?: BranchRow[] }).data;
      const batchList = (batchesRes as unknown as { success: boolean; data?: BatchRow[] }).data;
      if (branchesRes.success && branchList) setBranches(branchList);
      if (batchesRes.success && batchList) setBatches(batchList);
      if (teachersRes.success && teachersRes.data) setTeachers(teachersRes.data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load routine data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [filterBranchId, filterBatchId, filterTeacherUserId, filterDayOfWeek, filterMode, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    setGridSettings(loadGridSettings(filterBranchId || undefined));
  }, [filterBranchId]);

  // ── Derived / memos ─────────────────────────────────────────────
  const slotCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const s of slots) {
      if (s.teacherUserId) counts[s.teacherUserId] = (counts[s.teacherUserId] ?? 0) + 1;
    }
    return counts;
  }, [slots]);

  const gridSlots = useMemo(() => slots.map(toGridSlot), [slots]);

  const courseOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    for (const b of batches) {
      if (b.courseId && b.course && !seen.has(b.courseId)) {
        seen.add(b.courseId);
        list.push({ id: b.courseId, name: b.course.name });
      }
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [batches]);

  const genBatchOptions = useMemo(
    () => (genCourseId ? batches.filter((b) => b.courseId === genCourseId) : batches),
    [batches, genCourseId],
  );

  const genExportFilters = useMemo(
    () => ({
      courseId: genCourseId || undefined,
      batchId: genBatchId || undefined,
      branchId: genBranchId || undefined,
      teacherUserId: genTeacherUserId || undefined,
      mode: genMode !== 'all' ? genMode : undefined,
    }),
    [genCourseId, genBatchId, genBranchId, genTeacherUserId, genMode],
  );

  const teacherOptions = teachers.map((t) => ({
    id: t.id,
    fullName: t.fullName,
    email: t.email,
    mobile: t.mobile,
    status: t.status,
  }));

  // ── Template tab handlers ────────────────────────────────────────
  const openCreate = (day?: number, time?: string) => {
    setEditingSlot(null);
    setWizardVariant('default');
    setWizardDay(day);
    setWizardTime(time);
    setWizardOpen(true);
  };

  const openTeacherOnlyCreate = (day?: number, time?: string) => {
    setEditingSlot(null);
    setWizardVariant('teacherOnly');
    setWizardDay(day);
    setWizardTime(time);
    setWizardOpen(true);
  };

  const openEdit = (slot: GridSlot) => {
    setEditingSlot(slot);
    setWizardVariant('default');
    setWizardDay(undefined);
    setWizardTime(undefined);
    setWizardOpen(true);
  };

  const handleSave = async (data: SlotFormData) => {
    const selectedBatch = batches.find((b) => b.id === data.batchId);
    const payload = {
      branchId: data.branchId || selectedBatch?.branchId || undefined,
      courseId: selectedBatch?.courseId || data.courseId || undefined,
      batchId: data.batchId || undefined,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      topic: data.topic || undefined,
      teacherUserId: data.teacherUserId || undefined,
      mode: data.mode,
      isActive: data.isActive,
    };
    const res = editingSlot
      ? await updateRoutineSlot(editingSlot.id, payload)
      : await createRoutineSlot(payload);
    if (!res.success) throw new Error(res.message ?? 'Failed to save');
    toast({ title: 'Success', description: editingSlot ? 'Slot updated' : 'Slot created' });
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this routine slot?')) return;
    setDeleting(id);
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
      setDeleting(null);
    }
  };

  const handleExportList = () => {
    const url = getRoutineExportPdfUrl({
      branchId: filterBranchId || undefined,
      batchId: filterBatchId || undefined,
      teacherUserId: filterTeacherUserId || undefined,
      dayOfWeek: filterDayOfWeek ? Number(filterDayOfWeek) : undefined,
      mode: filterMode || undefined,
      format: 'list',
    });
    window.open(url, '_blank');
  };

  const handleExportWeeklyRange = () => {
    const s = toYmd(exportWeekStart);
    const e = toYmd(exportWeekEnd);
    if (!s || !e) {
      toast({ title: 'Validation', description: 'Please select start and end dates', variant: 'destructive' });
      return;
    }
    const url = getRoutineExportPdfUrl({
      branchId: filterBranchId || undefined,
      batchId: filterBatchId || undefined,
      teacherUserId: filterTeacherUserId || undefined,
      format: 'weekly-range',
      startDate: s,
      endDate: e,
    });
    window.open(url, '_blank');
  };

  const handleExportTemplateExcel = () => {
    const url = getRoutineExportExcelUrl({
      branchId: filterBranchId || undefined,
      batchId: filterBatchId || undefined,
      teacherUserId: filterTeacherUserId || undefined,
      format: 'template',
    });
    window.open(url, '_blank');
  };

  const genYmdStart = toYmd(genRangeStart);
  const genYmdEnd = toYmd(genRangeEnd);
  const genDatesOk = Boolean(genYmdStart && genYmdEnd);

  // ── Generated Routine handlers ───────────────────────────────────
  const handleGenerate = async () => {
    setGenErrors({});
    const parsed = generateFormSchema.safeParse({
      courseId: genCourseId || undefined,
      batchId: genBatchId || undefined,
      branchId: genBranchId || undefined,
      mode: genMode,
      startDate: genRangeStart,
      endDate: genRangeEnd,
    });
    if (!parsed.success) {
      const errs: GenerateFormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof GenerateFormErrors;
        if (!errs[key]) errs[key] = issue.message;
      }
      setGenErrors(errs);
      return;
    }
    setGenLoading(true);
    setGenHasResult(false);
    try {
      const res = await generateRoutineCalendar({
        courseId: genExportFilters.courseId,
        batchId: genExportFilters.batchId,
        branchId: genExportFilters.branchId,
        teacherUserId: genExportFilters.teacherUserId,
        mode: genExportFilters.mode,
        startDate: genYmdStart,
        endDate: genYmdEnd,
      });
      if (res.success && res.data) {
        setGenCalendar(res.data);
        setGenTotalClasses(res.totalClasses ?? 0);
        setGenHasResult(true);
        if (res.data.length === 0) {
          toast({ title: 'No results', description: 'No routine slots match the selected filters and date range.' });
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

  const handleExportGenCsv = () => {
    if (!genCalendar.length) return;
    downloadCsv(genCalendar);
  };

  const handleExportGenExcel = () => {
    if (!genDatesOk) {
      toast({ title: 'Validation', description: 'Select start and end dates first', variant: 'destructive' });
      return;
    }
    const url = getRoutineExportExcelUrl({
      ...genExportFilters,
      startDate: genYmdStart,
      endDate: genYmdEnd,
      format: 'calendar',
    });
    window.open(url, '_blank');
  };

  const handleExportGenPdfList = () => {
    const url = getRoutineExportPdfUrl({
      ...genExportFilters,
      format: 'list',
    });
    window.open(url, '_blank');
  };

  const handleExportGenPdfWeekly = () => {
    if (!genDatesOk) {
      toast({ title: 'Validation', description: 'Select start and end dates for the PDF', variant: 'destructive' });
      return;
    }
    const url = getRoutineExportPdfUrl({
      ...genExportFilters,
      format: 'weekly-range',
      startDate: genYmdStart,
      endDate: genYmdEnd,
    });
    window.open(url, '_blank');
  };

  const handleExportGenPdfThisWeek = () => {
    const { start, end } = getThisWeekRange();
    const url = getRoutineExportPdfUrl({
      ...genExportFilters,
      format: 'weekly-range',
      startDate: toYmd(start),
      endDate: toYmd(end),
    });
    window.open(url, '_blank');
  };

  const handleExportGenPdfThisMonth = () => {
    const { start, end } = getThisMonthRange();
    const url = getRoutineExportPdfUrl({
      ...genExportFilters,
      format: 'weekly-range',
      startDate: toYmd(start),
      endDate: toYmd(end),
    });
    window.open(url, '_blank');
  };

  // Quick month helpers
  const setCurrentMonth = () => {
    const now = new Date();
    setGenRangeStart(new Date(now.getFullYear(), now.getMonth(), 1));
    setGenRangeEnd(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  };

  const setNextMonth = () => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    setGenRangeStart(new Date(next.getFullYear(), next.getMonth(), 1));
    setGenRangeEnd(new Date(next.getFullYear(), next.getMonth() + 1, 0));
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await publishRoutineSessions({
        courseId: genExportFilters.courseId,
        batchId: genExportFilters.batchId,
        branchId: genExportFilters.branchId,
        mode: genExportFilters.mode,
        teacherUserId: genExportFilters.teacherUserId,
        startDate: genYmdStart,
        endDate: genYmdEnd,
      });
      if (res.success && res.data) {
        toast({
          title: 'Sessions published',
          description: `${res.data.created} session${res.data.created !== 1 ? 's' : ''} created, ${res.data.skipped} skipped.`,
          variant: 'success',
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

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-6">
      <Card className="border-teal-100 bg-teal-50/20 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md">
                <CalendarRange className="h-5 w-5" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">Class routine</CardTitle>
            </div>
            <CardDescription>
              Weekly template defines the repeating pattern; Generated Routine expands it to real dates for any range.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="shrink-0 px-3 py-1 text-sm">
            {slots.length} template slot{slots.length !== 1 ? 's' : ''}
          </Badge>
        </CardHeader>
      </Card>

      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-4">
        <TabsList className="h-11 w-full max-w-md grid grid-cols-2 bg-muted/70 p-1">
          <TabsTrigger value="template" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <LayoutGrid className="h-4 w-4" />
            Weekly template
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Calendar className="h-4 w-4" />
            Generated routine
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════ TEMPLATE TAB ═══════════════════════════ */}
        <TabsContent value="template" className="mt-0 space-y-4">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b pb-4">
              <div>
                <CardTitle className="text-lg">Template & filters</CardTitle>
                <CardDescription>Edit slots from the grid or list; filters apply to both views.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <GridSettings
                  branchId={filterBranchId || undefined}
                  settings={gridSettings}
                  onSettingsChange={setGridSettings}
                />
                <Button variant="outline" size="sm" onClick={handleExportTemplateExcel} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => setExportOpen(true)} className="gap-2">
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
                <Button size="sm" onClick={() => openCreate()} className="gap-2 bg-teal-600 text-white hover:bg-teal-700 hover:text-white focus-visible:text-white">
                  <Plus className="h-4 w-4" />
                  New slot
                </Button>
                <Button size="sm" variant="outline" onClick={() => openTeacherOnlyCreate()} className="gap-2">
                  <User className="h-4 w-4" />
                  New teacher slot
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Branch</Label>
              <Select value={filterBranchId || 'all'} onValueChange={(v) => setFilterBranchId(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Branches" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Batch</Label>
              <Select value={filterBatchId || 'all'} onValueChange={(v) => setFilterBatchId(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Batches" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {batches
                    .filter((b) => !filterBranchId || !b.branchId || b.branchId === filterBranchId)
                    .map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Teacher</Label>
              <TeacherCombobox
                teachers={teacherOptions}
                value={filterTeacherUserId}
                onSelect={setFilterTeacherUserId}
                placeholder="All Teachers"
                slotCounts={slotCounts}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Day</Label>
              <Select value={filterDayOfWeek || 'all'} onValueChange={(v) => setFilterDayOfWeek(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Days" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {DAY_NAMES.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Mode</Label>
              <Select value={filterMode || 'all'} onValueChange={(v) => setFilterMode(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Modes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="OFFLINE">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
                <Button
                  type="button"
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn('h-8 gap-1 px-3 text-xs font-semibold', viewMode === 'grid' && 'shadow-sm')}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-3.5 w-3.5" /> Grid
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn('h-8 gap-1 px-3 text-xs font-semibold', viewMode === 'list' && 'shadow-sm')}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-3.5 w-3.5" /> List
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Schedule</Label>
            {loading ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-muted-foreground">
                <RefreshCw className="h-8 w-8 animate-spin text-teal-500" />
                Loading routine…
              </div>
            ) : viewMode === 'grid' ? (
              <RoutineGrid
                slots={gridSlots}
                filterTeacherId={filterTeacherUserId || undefined}
                gridStartHour={gridSettings.startHour}
                gridEndHour={gridSettings.endHour}
                onCellClick={(day, time) => openCreate(day, time)}
                onSlotClick={(slot) => openEdit(slot)}
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                {slots.length === 0 ? (
                  <div className="p-10 text-center text-muted-foreground">No routine slots match these filters.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-bold">Day</TableHead>
                        <TableHead className="font-bold">Time</TableHead>
                        <TableHead className="font-bold">Course</TableHead>
                        <TableHead className="font-bold">Batch</TableHead>
                        <TableHead className="font-bold">Topic</TableHead>
                        <TableHead className="font-bold">Mode</TableHead>
                        <TableHead className="font-bold">Teacher</TableHead>
                        <TableHead className="font-bold">Status</TableHead>
                        <TableHead className="text-right font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slots.map((slot) => (
                        <TableRow key={slot.id}>
                          <TableCell className="font-medium">{DAY_NAMES[slot.dayOfWeek] ?? slot.dayOfWeek}</TableCell>
                          <TableCell className="whitespace-nowrap font-mono text-xs">
                            {slot.startTime}–{slot.endTime}
                          </TableCell>
                          <TableCell>{slot.course?.name ?? '—'}</TableCell>
                          <TableCell>{slot.batch?.name ?? '—'}</TableCell>
                          <TableCell className="max-w-[180px] truncate text-muted-foreground">{slot.topic ?? '—'}</TableCell>
                          <TableCell>
                            <Badge variant={slot.mode === 'ONLINE' ? 'secondary' : 'outline'}>{slot.mode}</Badge>
                          </TableCell>
                          <TableCell>{slot.teacher?.fullName ?? '—'}</TableCell>
                          <TableCell>
                            <Badge variant={slot.isActive ? 'default' : 'destructive'}>
                              {slot.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="outline" onClick={() => openEdit(toGridSlot(slot))}>
                                Edit
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive"
                                disabled={deleting === slot.id}
                                onClick={() => handleDelete(slot.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═════════════════════════ GENERATED ROUTINE TAB ════════════════════ */}
        <TabsContent value="generate" className="mt-0 space-y-4">
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">Generate from template</CardTitle>
              <CardDescription>
                Filter by course, batch, branch, teacher, and mode; pick a date range for preview. PDF weekly grid uses Monday–Sunday for “this week”.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Course</Label>
                <Select
                  value={genCourseId || 'all'}
                  onValueChange={(v) => {
                    setGenCourseId(v === 'all' ? '' : v);
                    setGenBatchId('');
                  }}
                >
                  <SelectTrigger className="h-10"><SelectValue placeholder="All courses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All courses</SelectItem>
                    {courseOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Batch</Label>
                <Select value={genBatchId || 'all'} onValueChange={(v) => setGenBatchId(v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="All batches" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All batches</SelectItem>
                    {genBatchOptions.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Branch</Label>
                <Select value={genBranchId || 'all'} onValueChange={(v) => setGenBranchId(v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="All branches" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All branches</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Teacher</Label>
                <TeacherCombobox
                  teachers={teacherOptions}
                  value={genTeacherUserId}
                  onSelect={setGenTeacherUserId}
                  placeholder="All teachers"
                  slotCounts={slotCounts}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Mode</Label>
                <Select value={genMode} onValueChange={(v) => setGenMode(v as 'all' | 'ONLINE' | 'OFFLINE')}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="All modes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All modes</SelectItem>
                    <SelectItem value="ONLINE">Online only</SelectItem>
                    <SelectItem value="OFFLINE">Offline only</SelectItem>
                  </SelectContent>
                </Select>
                {genErrors.mode && <p className="text-xs text-destructive">{genErrors.mode}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Start date *</Label>
                <DatePicker date={genRangeStart} setDate={(d) => { setGenRangeStart(d); setGenErrors((e) => ({ ...e, startDate: undefined })); }} placeholder="Pick start" className="h-10" />
                {genErrors.startDate && <p className="text-xs text-destructive">{genErrors.startDate}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">End date *</Label>
                <DatePicker date={genRangeEnd} setDate={(d) => { setGenRangeEnd(d); setGenErrors((e) => ({ ...e, endDate: undefined })); }} placeholder="Pick end" className="h-10" />
                {genErrors.endDate && <p className="text-xs text-destructive">{genErrors.endDate}</p>}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Quick range:</span>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={setCurrentMonth}>
                This month
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={setNextMonth}>
                Next month
              </Button>
            </div>

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:flex-wrap sm:items-center">
              <Button onClick={handleGenerate} disabled={genLoading} className="gap-2 bg-teal-600 text-white hover:bg-teal-700 hover:text-white focus-visible:text-white">
                {genLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4" />
                )}
                {genLoading ? 'Generating…' : 'Generate preview'}
              </Button>

              {genHasResult && genCalendar.length > 0 && (
                <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="default" size="sm" className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white focus-visible:text-white">
                      <Calendar className="h-4 w-4" />
                      Publish sessions
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Publish class sessions?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will create <strong>{genTotalClasses}</strong> class session{genTotalClasses !== 1 ? 's' : ''} from{' '}
                        <strong>{genYmdStart}</strong> to <strong>{genYmdEnd}</strong>
                        {genMode !== 'all' ? ` (${genMode} only)` : ''}
                        {genTeacherUserId
                          ? ` for teacher ${teacherOptions.find((t) => t.id === genTeacherUserId)?.fullName ?? genTeacherUserId}`
                          : ''}
                        . Existing sessions for the same date/batch/course will be skipped (not overwritten).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => { e.preventDefault(); void handlePublish(); }}
                        disabled={publishing}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white focus-visible:text-white"
                      >
                        {publishing ? 'Publishing…' : 'Publish'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleExportGenPdfList}>
                  <FileText className="h-4 w-4" />
                  PDF (template list)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={!genDatesOk}
                  onClick={handleExportGenPdfWeekly}
                  title="Uses start and end dates above"
                >
                  <FileText className="h-4 w-4" />
                  PDF (selected range)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleExportGenPdfThisWeek}
                  title="Monday through Sunday of the current week"
                >
                  <FileText className="h-4 w-4" />
                  PDF (this week)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleExportGenPdfThisMonth}
                  title="First to last day of the current calendar month"
                >
                  <FileText className="h-4 w-4" />
                  PDF (this month)
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={!genDatesOk} onClick={handleExportGenExcel}>
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
              </div>

              {genHasResult && genCalendar.length > 0 && (
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleExportGenCsv}>
                  <Download className="h-4 w-4" />
                  CSV (preview)
                </Button>
              )}

              {genHasResult && (
                <Badge variant="secondary" className="sm:ml-auto">
                  {genTotalClasses} class{genTotalClasses !== 1 ? 'es' : ''} · {genCalendar.length} day{genCalendar.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            </CardContent>
          </Card>

          {/* Results table */}
          {genLoading && (
            <div className="p-16 text-center text-muted-foreground flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-teal-500" />
              Generating routine…
            </div>
          )}

          {!genLoading && genHasResult && genCalendar.length === 0 && (
            <div className="p-12 text-center text-muted-foreground bg-white rounded-xl border">
              No routine slots found for the selected filters and date range.
              <br />
              <span className="text-xs mt-1 block">Make sure the Weekly Template has active slots for the selected course/batch.</span>
            </div>
          )}

          {!genLoading && genHasResult && genCalendar.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="border-b py-4">
                <CardTitle className="text-base">Preview</CardTitle>
                <CardDescription>Generated dates from your weekly template for the selected range.</CardDescription>
              </CardHeader>
              <CardContent className="max-h-[min(70vh,560px)] overflow-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-muted/90 hover:bg-muted/90">
                      <TableHead className="w-28 font-bold">Date</TableHead>
                      <TableHead className="w-24 font-bold">Day</TableHead>
                      <TableHead className="w-28 font-bold">Time</TableHead>
                      <TableHead className="font-bold">Course</TableHead>
                      <TableHead className="font-bold">Batch</TableHead>
                      <TableHead className="font-bold">Teacher</TableHead>
                      <TableHead className="font-bold">Topic</TableHead>
                      <TableHead className="w-24 font-bold">Mode</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {genCalendar.map((day) => (
                      <React.Fragment key={day.date}>
                        <TableRow className="border-teal-100 bg-teal-50/80 hover:bg-teal-50/80">
                          <TableCell colSpan={8} className="py-2 text-xs font-semibold tracking-wide text-teal-900">
                            {new Date(day.date + 'T00:00:00').toLocaleDateString('en-GB', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                            <span className="ml-2 font-normal text-teal-600">
                              ({day.slots.length} class{day.slots.length !== 1 ? 'es' : ''})
                            </span>
                          </TableCell>
                        </TableRow>
                        {day.slots.map((slot, idx) => (
                          <TableRow key={`${day.date}-${idx}`}>
                            <TableCell className="text-muted-foreground">{day.date}</TableCell>
                            <TableCell>{day.dayName}</TableCell>
                            <TableCell className="whitespace-nowrap font-mono text-xs">
                              {slot.startTime}–{slot.endTime}
                            </TableCell>
                            <TableCell>{slot.course?.name ?? '—'}</TableCell>
                            <TableCell>{slot.batch?.name ?? '—'}</TableCell>
                            <TableCell>{slot.teacher?.fullName ?? '—'}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-muted-foreground">{slot.topic ?? '—'}</TableCell>
                            <TableCell>
                              <Badge variant={slot.mode === 'ONLINE' ? 'secondary' : 'outline'} className="text-xs">
                                {slot.mode}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Slot Wizard (template tab) */}
      <SlotWizard
        open={wizardOpen}
        onClose={() => { setWizardOpen(false); setWizardVariant('default'); }}
        onSave={handleSave}
        editingSlot={editingSlot}
        variant={editingSlot ? 'default' : wizardVariant}
        batches={batches}
        teachers={teacherOptions}
        slotCounts={slotCounts}
        existingSlots={gridSlots}
        initialDay={wizardDay}
        initialTime={wizardTime}
      />

      {/* Export PDF Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Export template as PDF</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="list">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Filtered list</TabsTrigger>
              <TabsTrigger value="weekly">Weekly grid</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-3 pt-4">
              <p className="text-sm text-muted-foreground">
                Flat table of template slots matching your current template-tab filters.
              </p>
              <Button
                className="w-full gap-2"
                onClick={() => {
                  handleExportList();
                  setExportOpen(false);
                }}
              >
                <FileText className="h-4 w-4" /> Download PDF list
              </Button>
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Timetable-style PDF for each week between the dates you pick. Week PDF uses Monday–Sunday for the quick presets below.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    const { start, end } = getThisWeekRange();
                    setExportWeekStart(start);
                    setExportWeekEnd(end);
                  }}
                >
                  This week
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    const { start, end } = getThisMonthRange();
                    setExportWeekStart(start);
                    setExportWeekEnd(end);
                  }}
                >
                  This month
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Start date *</Label>
                  <DatePicker date={exportWeekStart} setDate={setExportWeekStart} placeholder="Pick start" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">End date *</Label>
                  <DatePicker date={exportWeekEnd} setDate={setExportWeekEnd} placeholder="Pick end" />
                </div>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => {
                  handleExportWeeklyRange();
                  if (toYmd(exportWeekStart) && toYmd(exportWeekEnd)) setExportOpen(false);
                }}
              >
                <FileText className="h-4 w-4" /> Download weekly grid PDF
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
