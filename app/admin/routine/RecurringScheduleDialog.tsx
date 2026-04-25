'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { CalendarRange, Loader2 } from 'lucide-react';
import { TeacherCombobox } from './TeacherCombobox';
import { createRecurringSlots } from '@/lib/api/routine';
import { useToast } from '@/hooks/use-toast';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type BatchOption = {
  id: string;
  name: string;
  courseId?: string;
  branchId?: string;
  course?: { id: string; name: string } | null;
};

type TeacherOption = {
  id: string;
  fullName: string;
  email?: string;
  mobile?: string;
  status?: string;
};

interface RecurringScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batches: BatchOption[];
  teachers: TeacherOption[];
  slotCounts?: Record<string, number>;
}

export function RecurringScheduleDialog({
  open,
  onClose,
  onSuccess,
  batches,
  teachers,
  slotCounts,
}: RecurringScheduleDialogProps) {
  const { toast } = useToast();
  const [batchId, setBatchId] = useState('');
  const [teacherUserId, setTeacherUserId] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE');
  const [submitting, setSubmitting] = useState(false);

  const selectedBatch = batches.find((b) => b.id === batchId);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = async () => {
    if (!batchId || !teacherUserId || selectedDays.length === 0) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    if (startTime >= endTime) {
      toast({ title: 'End time must be after start time', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await createRecurringSlots({
        batchId,
        courseId: selectedBatch?.courseId || selectedBatch?.course?.id || '',
        branchId: selectedBatch?.branchId || '',
        teacherUserId,
        days: selectedDays,
        startTime,
        endTime,
        topic: topic.trim() || undefined,
        mode,
      });
      if (res.success) {
        toast({
          title: 'Recurring schedule created',
          description: `${(res as any).data?.created || selectedDays.length} slots created across ${selectedDays.length} day(s)`,
          variant: 'success',
        });
        resetForm();
        onClose();
        onSuccess();
      } else {
        toast({ title: 'Failed', description: (res as any).message || 'Could not create recurring slots', variant: 'destructive' });
      }
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to create recurring slots',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setBatchId('');
    setTeacherUserId('');
    setSelectedDays([]);
    setStartTime('09:00');
    setEndTime('10:00');
    setTopic('');
    setMode('OFFLINE');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[520px] rounded-3xl border-slate-200 bg-white shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/30">
          <DialogTitle className="flex items-center gap-2 text-base font-black uppercase tracking-widest text-slate-800">
            <CalendarRange className="h-5 w-5 text-teal-600" />
            Create Recurring Schedule
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Batch / Class */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class / Batch *</Label>
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-60">
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-sm font-medium">
                    {b.name} {b.course ? `(${b.course.name})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Teacher */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teacher *</Label>
            <TeacherCombobox
              teachers={teachers}
              value={teacherUserId}
              onSelect={setTeacherUserId}
              slotCounts={slotCounts}
            />
          </div>

          {/* Days selector */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Days *</Label>
            <div className="grid grid-cols-4 gap-2">
              {DAY_NAMES.map((name, idx) => (
                <label
                  key={idx}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-all text-sm font-bold',
                    selectedDays.includes(idx)
                      ? 'border-teal-300 bg-teal-50 text-teal-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <Checkbox
                    checked={selectedDays.includes(idx)}
                    onCheckedChange={() => toggleDay(idx)}
                  />
                  {name.slice(0, 3)}
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => setSelectedDays([0, 1, 2, 3, 4, 5])}
                className="text-[10px] font-bold text-teal-600 hover:text-teal-800 uppercase tracking-wider"
              >
                Sun–Fri
              </button>
              <button
                type="button"
                onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
                className="text-[10px] font-bold text-teal-600 hover:text-teal-800 uppercase tracking-wider"
              >
                Mon–Fri
              </button>
              <button
                type="button"
                onClick={() => setSelectedDays([])}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Time *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">End Time *</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          {/* Mode */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as 'ONLINE' | 'OFFLINE')}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="OFFLINE">Offline</SelectItem>
                <SelectItem value="ONLINE">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Topic */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Topic (optional)</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Physics Class"
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="h-10 rounded-xl font-bold">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !batchId || !teacherUserId || selectedDays.length === 0}
            className="h-10 rounded-xl bg-teal-600 font-bold text-white hover:bg-teal-700"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarRange className="mr-2 h-4 w-4" />}
            Create {selectedDays.length} Slot{selectedDays.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
