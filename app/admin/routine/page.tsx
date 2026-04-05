'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  getRoutineSlots,
  createRoutineSlot,
  updateRoutineSlot,
  deleteRoutineSlot,
  type RoutineSlot,
  type CreateRoutineSlotData,
} from '@/lib/api/routine';
import { getBranches } from '@/lib/api/branches';
import { getBatches } from '@/lib/api/batches';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CalendarRange, Plus, Pencil, Trash2, Search } from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type BranchRow = { id: string; name: string };
type BatchRow = { id: string; name: string; courseId?: string; course?: { id: string; name: string } };

const emptyForm = (): Omit<CreateRoutineSlotData, 'dayOfWeek' | 'isActive'> & { dayOfWeek: string; isActive: boolean } => ({
  branchId: '',
  programId: '',
  courseId: '',
  batchId: '',
  dayOfWeek: '1',
  startTime: '',
  endTime: '',
  topic: '',
  teacherUserId: '',
  room: '',
  mode: 'OFFLINE',
  isActive: true,
});

export default function AdminRoutinePage() {
  const { toast } = useToast();
  const [slots, setSlots] = useState<RoutineSlot[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterBranchId, setFilterBranchId] = useState('');
  const [filterDayOfWeek, setFilterDayOfWeek] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<RoutineSlot | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsRes, branchesRes, batchesRes] = await Promise.all([
        getRoutineSlots({
          branchId: filterBranchId || undefined,
          dayOfWeek: filterDayOfWeek ? Number(filterDayOfWeek) : undefined,
          mode: filterMode || undefined,
        }),
        getBranches(),
        getBatches(),
      ]);
      if (slotsRes.success && slotsRes.data) setSlots(slotsRes.data);
      if (branchesRes.success && (branchesRes as any).data) setBranches((branchesRes as any).data);
      if (batchesRes.success && (batchesRes as any).data) setBatches((batchesRes as any).data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load routine data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [filterBranchId, filterDayOfWeek, filterMode, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditingSlot(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (slot: RoutineSlot) => {
    setEditingSlot(slot);
    setForm({
      branchId: slot.branchId ?? '',
      programId: slot.programId ?? '',
      courseId: slot.courseId ?? '',
      batchId: slot.batchId ?? '',
      dayOfWeek: String(slot.dayOfWeek),
      startTime: slot.startTime,
      endTime: slot.endTime,
      topic: slot.topic ?? '',
      teacherUserId: slot.teacherUserId ?? '',
      room: slot.room ?? '',
      mode: slot.mode,
      isActive: slot.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.startTime || !form.endTime) {
      toast({ title: 'Validation', description: 'Start time and end time are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: CreateRoutineSlotData = {
        branchId: form.branchId || undefined,
        programId: form.programId || undefined,
        courseId: form.courseId || undefined,
        batchId: form.batchId || undefined,
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        topic: form.topic || undefined,
        teacherUserId: form.teacherUserId || undefined,
        room: form.room || undefined,
        mode: form.mode,
        isActive: form.isActive,
      };

      const res = editingSlot
        ? await updateRoutineSlot(editingSlot.id, payload)
        : await createRoutineSlot(payload);

      if (res.success) {
        toast({ title: 'Success', description: editingSlot ? 'Routine slot updated' : 'Routine slot created' });
        setShowModal(false);
        loadData();
      } else {
        toast({ title: 'Error', description: res.message ?? 'Failed to save', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save routine slot', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
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
      toast({ title: 'Error', description: 'Failed to delete routine slot', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const filtered = slots.filter((s) => {
    if (!filterSearch) return true;
    const q = filterSearch.toLowerCase();
    return (
      s.course?.name?.toLowerCase().includes(q) ||
      s.batch?.name?.toLowerCase().includes(q) ||
      s.topic?.toLowerCase().includes(q) ||
      s.room?.toLowerCase().includes(q) ||
      s.teacher?.fullName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-6 w-6 text-teal-600" />
          <h1 className="text-2xl font-bold">Routine Management</h1>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Slot
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-lg border">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Branch</Label>
          <Select value={filterBranchId || 'all'} onValueChange={(v) => setFilterBranchId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Day</Label>
          <Select value={filterDayOfWeek || 'all'} onValueChange={(v) => setFilterDayOfWeek(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              {DAY_NAMES.map((d, i) => (
                <SelectItem key={i} value={String(i)}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Mode</Label>
          <Select value={filterMode || 'all'} onValueChange={(v) => setFilterMode(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Modes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="ONLINE">Online</SelectItem>
              <SelectItem value="OFFLINE">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              className="h-9 pl-8"
              placeholder="Course, batch, topic..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No routine slots found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Day</th>
                <th className="text-left px-4 py-3 font-medium">Time</th>
                <th className="text-left px-4 py-3 font-medium">Course</th>
                <th className="text-left px-4 py-3 font-medium">Batch</th>
                <th className="text-left px-4 py-3 font-medium">Topic</th>
                <th className="text-left px-4 py-3 font-medium">Room</th>
                <th className="text-left px-4 py-3 font-medium">Mode</th>
                <th className="text-left px-4 py-3 font-medium">Teacher</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((slot) => (
                <tr key={slot.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{DAY_NAMES[slot.dayOfWeek] ?? slot.dayOfWeek}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{slot.startTime} – {slot.endTime}</td>
                  <td className="px-4 py-3">{slot.course?.name ?? '—'}</td>
                  <td className="px-4 py-3">{slot.batch?.name ?? '—'}</td>
                  <td className="px-4 py-3">{slot.topic ?? '—'}</td>
                  <td className="px-4 py-3">{slot.room ?? '—'}</td>
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
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(slot)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
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

      {/* Create / Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSlot ? 'Edit Routine Slot' : 'New Routine Slot'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Branch</Label>
                <Select value={form.branchId || 'none'} onValueChange={(v) => setForm((f) => ({ ...f, branchId: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Batch</Label>
                <Select value={form.batchId || 'none'} onValueChange={(v) => setForm((f) => ({ ...f, batchId: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}{b.course ? ` (${b.course.name})` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Day of Week *</Label>
                <Select value={form.dayOfWeek} onValueChange={(v) => setForm((f) => ({ ...f, dayOfWeek: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mode</Label>
                <Select value={form.mode} onValueChange={(v) => setForm((f) => ({ ...f, mode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFFLINE">Offline</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label>End Time *</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Room</Label>
                <Input
                  placeholder="e.g. Room 101"
                  value={form.room}
                  onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                />
              </div>
              <div>
                <Label>Topic</Label>
                <Input
                  placeholder="Optional topic"
                  value={form.topic}
                  onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Teacher User ID</Label>
              <Input
                placeholder="Teacher's user ID"
                value={form.teacherUserId}
                onChange={(e) => setForm((f) => ({ ...f, teacherUserId: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingSlot ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
