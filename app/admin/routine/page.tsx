'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  getRoutineSlots,
  getRoutineExportPdfUrl,
  createRoutineSlot,
  updateRoutineSlot,
  deleteRoutineSlot,
  type RoutineSlot,
} from '@/lib/api/routine';
import { getBranches } from '@/lib/api/branches';
import { getBatches } from '@/lib/api/batches';
import { getUsers, type User } from '@/lib/api/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CalendarRange, Plus, Trash2, Download, LayoutGrid, List } from 'lucide-react';
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
  course?: { id: string; name: string };
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

export default function AdminRoutinePage() {
  const { toast } = useToast();
  const [slots, setSlots] = useState<RoutineSlot[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterBranchId, setFilterBranchId] = useState('');
  const [filterBatchId, setFilterBatchId] = useState('');
  const [filterTeacherUserId, setFilterTeacherUserId] = useState('');
  const [filterDayOfWeek, setFilterDayOfWeek] = useState('');
  const [filterMode, setFilterMode] = useState('');

  // Grid/list toggle
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Grid settings
  const [gridSettings, setGridSettings] = useState<GridSettingsState>(() => loadGridSettings());

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<GridSlot | null>(null);
  const [wizardDay, setWizardDay] = useState<number | undefined>();
  const [wizardTime, setWizardTime] = useState<string | undefined>();

  // Export PDF dialog
  const [exportOpen, setExportOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  // Deletion
  const [deleting, setDeleting] = useState<string | null>(null);

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

  // Update grid settings when branch changes
  useEffect(() => {
    setGridSettings(loadGridSettings(filterBranchId || undefined));
  }, [filterBranchId]);

  // Teacher slot counts for workload badges
  const slotCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const s of slots) {
      if (s.teacherUserId) {
        counts[s.teacherUserId] = (counts[s.teacherUserId] ?? 0) + 1;
      }
    }
    return counts;
  }, [slots]);

  const gridSlots = useMemo(() => slots.map(toGridSlot), [slots]);

  const openCreate = (day?: number, time?: string) => {
    setEditingSlot(null);
    setWizardDay(day);
    setWizardTime(time);
    setWizardOpen(true);
  };

  const openEdit = (slot: GridSlot) => {
    setEditingSlot(slot);
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
    if (!exportStartDate || !exportEndDate) {
      toast({ title: 'Validation', description: 'Please select start and end dates', variant: 'destructive' });
      return;
    }
    const url = getRoutineExportPdfUrl({
      branchId: filterBranchId || undefined,
      batchId: filterBatchId || undefined,
      teacherUserId: filterTeacherUserId || undefined,
      format: 'weekly-range',
      startDate: exportStartDate,
      endDate: exportEndDate,
    });
    window.open(url, '_blank');
  };

  const teacherOptions = teachers.map((t) => ({
    id: t.id,
    fullName: t.fullName,
    email: t.email,
    mobile: t.mobile,
    status: t.status,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-6 w-6 text-teal-600" />
          <h1 className="text-2xl font-bold">Routine</h1>
          <Badge variant="secondary" className="ml-2">{slots.length} slots</Badge>
        </div>
        <div className="flex items-center gap-2">
          <GridSettings
            branchId={filterBranchId || undefined}
            settings={gridSettings}
            onSettingsChange={setGridSettings}
          />
          <Button variant="outline" onClick={() => setExportOpen(true)} className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={() => openCreate()} className="gap-2">
            <Plus className="h-4 w-4" />
            New Slot
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 bg-white p-4 rounded-xl border">
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
          <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
            <button
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'grid' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setViewMode('list')}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      {loading ? (
        <div className="p-16 text-center text-muted-foreground">Loading routine...</div>
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
        /* List view */
        <div className="bg-white rounded-xl border overflow-x-auto">
          {slots.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No routine slots found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">Day</th>
                  <th className="px-4 py-3 text-left font-bold">Time</th>
                  <th className="px-4 py-3 text-left font-bold">Course</th>
                  <th className="px-4 py-3 text-left font-bold">Batch</th>
                  <th className="px-4 py-3 text-left font-bold">Topic</th>
                  <th className="px-4 py-3 text-left font-bold">Mode</th>
                  <th className="px-4 py-3 text-left font-bold">Teacher</th>
                  <th className="px-4 py-3 text-left font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {slots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{DAY_NAMES[slot.dayOfWeek] ?? slot.dayOfWeek}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{slot.startTime}–{slot.endTime}</td>
                    <td className="px-4 py-3">{slot.course?.name ?? '—'}</td>
                    <td className="px-4 py-3">{slot.batch?.name ?? '—'}</td>
                    <td className="px-4 py-3">{slot.topic ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={slot.mode === 'ONLINE' ? 'secondary' : 'outline'}>{slot.mode}</Badge>
                    </td>
                    <td className="px-4 py-3">{slot.teacher?.fullName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={slot.isActive ? 'default' : 'destructive'}>
                        {slot.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => openEdit(toGridSlot(slot))}>
                          Edit
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive h-8 w-8"
                          disabled={deleting === slot.id}
                          onClick={() => handleDelete(slot.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Slot Wizard */}
      <SlotWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSave={handleSave}
        editingSlot={editingSlot}
        batches={batches}
        teachers={teacherOptions}
        slotCounts={slotCounts}
        existingSlots={gridSlots}
        initialDay={wizardDay}
        initialTime={wizardTime}
      />

      {/* Export PDF Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Routine PDF</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="list">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="list">Filtered List</TabsTrigger>
              <TabsTrigger value="weekly">Weekly Grid</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="pt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Exports a flat table of all visible routine slots based on current filters.
              </p>
              <Button className="w-full" onClick={() => { handleExportList(); setExportOpen(false); }}>
                <Download className="h-4 w-4 mr-2" /> Export Filtered List
              </Button>
            </TabsContent>

            <TabsContent value="weekly" className="pt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Exports a visual weekly timetable grid for each week in the selected date range.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-slate-600">Start Date *</Label>
                  <Input type="date" className="mt-1" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-600">End Date *</Label>
                  <Input type="date" className="mt-1" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => { handleExportWeeklyRange(); if (exportStartDate && exportEndDate) setExportOpen(false); }}
              >
                <Download className="h-4 w-4 mr-2" /> Export Weekly Grid
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

