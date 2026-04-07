'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TimeHmSelect } from '@/components/admin/routine/TimeHmSelect';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, GraduationCap, User2, Clock, Eye, BookOpen } from 'lucide-react';
import { TeacherCombobox } from './TeacherCombobox';
import type { GridSlot } from './RoutineGrid';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DRAFT_KEY = 'routine_draft';

export type SlotFormData = {
  batchId: string;
  courseId: string;
  branchId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  teacherUserId: string;
  topic: string;
  mode: 'ONLINE' | 'OFFLINE';
  isActive: boolean;
};

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

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: SlotFormData) => Promise<void>;
  editingSlot?: GridSlot | null;
  /** Teacher-only: no batch/course; teacher required; opens on Teacher step. */
  variant?: 'default' | 'teacherOnly';
  batches: BatchOption[];
  teachers: TeacherOption[];
  slotCounts?: Record<string, number>;
  existingSlots: GridSlot[];
  initialDay?: number;
  initialTime?: string;
};

const EMPTY_FORM = (): SlotFormData => ({
  batchId: '',
  courseId: '',
  branchId: '',
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '10:00',
  teacherUserId: '',
  topic: '',
  mode: 'OFFLINE',
  isActive: true,
});

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function detectConflict(
  form: SlotFormData,
  existingSlots: GridSlot[],
  excludeId?: string,
): string | null {
  if (!form.teacherUserId) return null;
  const conflict = existingSlots.find(
    (s) =>
      s.id !== excludeId &&
      s.dayOfWeek === form.dayOfWeek &&
      s.teacher?.id === form.teacherUserId &&
      timeToMin(s.startTime) < timeToMin(form.endTime) &&
      timeToMin(s.endTime) > timeToMin(form.startTime),
  );
  if (conflict) {
    return `Teacher already has a class ${conflict.startTime}–${conflict.endTime}`;
  }
  return null;
}

const STEPS = [
  { id: 1, label: 'Class', icon: GraduationCap },
  { id: 2, label: 'Teacher', icon: User2 },
  { id: 3, label: 'Time', icon: Clock },
  { id: 4, label: 'Preview', icon: Eye },
  { id: 5, label: 'Confirm', icon: Check },
];

export function SlotWizard({
  open,
  onClose,
  onSave,
  editingSlot,
  variant = 'default',
  batches,
  teachers,
  slotCounts = {},
  existingSlots,
  initialDay,
  initialTime,
}: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SlotFormData>(EMPTY_FORM());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const conflict = detectConflict(form, existingSlots, editingSlot?.id);

  // Load draft or initialize form when dialog opens
  useEffect(() => {
    if (!open) return;
    setSaveError('');

    if (editingSlot) {
      setForm({
        batchId: editingSlot.batch?.id ?? '',
        courseId: editingSlot.course?.id ?? '',
        branchId: '',
        dayOfWeek: editingSlot.dayOfWeek,
        startTime: editingSlot.startTime,
        endTime: editingSlot.endTime,
        teacherUserId: editingSlot.teacher?.id ?? '',
        topic: editingSlot.topic ?? '',
        mode: (editingSlot.mode as 'ONLINE' | 'OFFLINE') ?? 'OFFLINE',
        isActive: true,
      });
      setStep(1);
      return;
    }

    if (variant === 'teacherOnly') {
      const base = EMPTY_FORM();
      base.batchId = '';
      base.courseId = '';
      base.branchId = '';
      if (initialDay !== undefined) base.dayOfWeek = initialDay;
      if (initialTime) {
        base.startTime = initialTime;
        const [h, m] = initialTime.split(':').map(Number);
        const endMin = h * 60 + m + 60;
        base.endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
      }
      setForm(base);
      setStep(2);
      return;
    }

    // Check for saved draft (default flow only)
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as SlotFormData;
        setForm(draft);
        setStep(1);
        return;
      }
    } catch { /* ignore */ }

    const base = EMPTY_FORM();
    if (initialDay !== undefined) base.dayOfWeek = initialDay;
    if (initialTime) {
      base.startTime = initialTime;
      const [h, m] = initialTime.split(':').map(Number);
      const endMin = h * 60 + m + 60;
      base.endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
    }
    setForm(base);
    setStep(1);
  }, [open, editingSlot, initialDay, initialTime, variant]);

  // Auto-save draft on every form change
  useEffect(() => {
    if (!open || editingSlot || variant === 'teacherOnly') return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch { /* ignore */ }
  }, [form, open, editingSlot, variant]);

  const handleClose = () => {
    onClose();
  };

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  };

  const handleSave = async () => {
    if (variant === 'teacherOnly' && !form.teacherUserId) {
      setSaveError('Select a teacher for a teacher-only slot.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await onSave(form);
      clearDraft();
      onClose();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const selectedBatch = batches.find((b) => b.id === form.batchId);
  const selectedTeacher = teachers.find((t) => t.id === form.teacherUserId);

  const canAdvance = (currentStep: number) => {
    if (currentStep === 1) return true; // batch optional
    if (currentStep === 2 && variant === 'teacherOnly') {
      return !!form.teacherUserId;
    }
    if (currentStep === 3) {
      return (
        !!form.startTime &&
        !!form.endTime &&
        form.endTime > form.startTime
      );
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {editingSlot ? 'Update routine slot' : variant === 'teacherOnly' ? 'New teacher-only slot' : 'New routine slot'}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.id}>
              <button
                className={cn(
                  'flex flex-col items-center gap-0.5 cursor-pointer',
                  step === s.id ? 'text-indigo-600' : step > s.id ? 'text-teal-600' : 'text-slate-400',
                )}
                onClick={() => step > s.id && setStep(s.id)}
              >
                <div
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all',
                    step === s.id
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : step > s.id
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'bg-white border-slate-200 text-slate-400',
                  )}
                >
                  {step > s.id ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider hidden sm:block">{s.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className={cn('h-0.5 flex-1 mx-1', step > s.id ? 'bg-teal-400' : 'bg-slate-200')} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[200px] py-2">

          {/* Step 1: Class */}
          {step === 1 && (
            <div className="space-y-4">
              {variant === 'teacherOnly' && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Teacher-only slot: no class or batch. Use the next step to pick the teacher, then set day and time.
                </div>
              )}
              <div>
                <Label className="text-xs font-bold text-slate-600">Select Batch</Label>
                <Select
                  value={form.batchId || 'none'}
                  onValueChange={(v) => {
                    if (v === 'none') {
                      setForm((f) => ({ ...f, batchId: '', courseId: '', branchId: '' }));
                      return;
                    }
                    const b = batches.find((x) => x.id === v);
                    setForm((f) => ({
                      ...f,
                      batchId: v,
                      courseId: b?.courseId ?? '',
                      branchId: b?.branchId ?? f.branchId,
                    }));
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select batch (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / Unassigned</SelectItem>
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}{b.course ? ` — ${b.course.name}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBatch?.course && (
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-indigo-500 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Course (auto)</p>
                    <p className="text-sm font-bold text-slate-900">{selectedBatch.course.name}</p>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs font-bold text-slate-600">Mode</Label>
                <Select
                  value={form.mode}
                  onValueChange={(v) => setForm((f) => ({ ...f, mode: v as 'ONLINE' | 'OFFLINE' }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFFLINE">Offline</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-600">Topic (optional)</Label>
                <Textarea
                  className="mt-1 min-h-[80px] resize-y"
                  placeholder="e.g. Chapter 3 — Algebra"
                  value={form.topic}
                  onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Step 2: Teacher */}
          {step === 2 && (
            <div className="space-y-4">
              {variant === 'teacherOnly' && (
                <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-900">
                  No batch is assigned. Choose the teacher for this slot (required).
                </div>
              )}
              <div>
                <Label className="text-xs font-bold text-slate-600">
                  {variant === 'teacherOnly' ? 'Teacher *' : 'Teacher (optional — can leave unassigned)'}
                </Label>
                <div className="mt-1">
                  <TeacherCombobox
                    teachers={teachers}
                    value={form.teacherUserId}
                    onSelect={(id) => setForm((f) => ({ ...f, teacherUserId: id }))}
                    placeholder={variant === 'teacherOnly' ? 'Select teacher' : 'None (unassigned)'}
                    allowClear={variant !== 'teacherOnly'}
                    slotCounts={slotCounts}
                  />
                </div>
              </div>

              {selectedTeacher && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-start gap-3">
                  <div className="mt-0.5 h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-black text-sm shrink-0">
                    {selectedTeacher.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{selectedTeacher.fullName}</p>
                    <p className="text-[10px] text-slate-400">{selectedTeacher.email || selectedTeacher.mobile || ''}</p>
                    {slotCounts[selectedTeacher.id] > 0 && (
                      <Badge variant="outline" className="text-[9px] mt-1">
                        {slotCounts[selectedTeacher.id]} active classes
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Time */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold text-slate-600">Day of Week *</Label>
                <Select
                  value={String(form.dayOfWeek)}
                  onValueChange={(v) => setForm((f) => ({ ...f, dayOfWeek: Number(v) }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((d, i) => (
                      <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TimeHmSelect
                  label="Start Time *"
                  value={form.startTime}
                  onChange={(v) => setForm((f) => ({ ...f, startTime: v }))}
                />
                <TimeHmSelect
                  label="End Time *"
                  value={form.endTime}
                  onChange={(v) => setForm((f) => ({ ...f, endTime: v }))}
                />
              </div>

              {form.endTime && form.startTime && form.endTime <= form.startTime && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> End time must be after start time
                </div>
              )}

              {conflict && (
                <div className="flex items-center gap-2 rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {conflict}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Slot Preview</p>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                {[
                  ['Day', DAY_NAMES[form.dayOfWeek]],
                  ['Time', `${form.startTime} – ${form.endTime}`],
                  ['Batch', variant === 'teacherOnly' && !selectedBatch ? 'Teacher-only' : selectedBatch?.name || '—'],
                  ['Course', selectedBatch?.course?.name || '—'],
                  ['Teacher', selectedTeacher?.fullName || (variant === 'teacherOnly' ? '(required)' : 'Unassigned')],
                  ['Mode', form.mode],
                  ['Topic', form.topic || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 w-16 shrink-0">{label}</span>
                    <span className="text-sm font-bold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>

              {conflict && (
                <div className="flex items-center gap-2 rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> <strong>Warning:</strong>&nbsp;{conflict}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Confirm */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-teal-50 border border-teal-200 px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-500 mb-2">Ready to save</p>
                <p className="text-sm font-bold text-slate-900">
                  {DAY_NAMES[form.dayOfWeek]}, {form.startTime}–{form.endTime}
                </p>
                <p className="text-sm text-slate-600">
                  {variant === 'teacherOnly' && !selectedBatch
                    ? 'Teacher-only (no batch)'
                    : selectedBatch?.course?.name || selectedBatch?.name || 'No batch'}
                </p>
                {selectedTeacher && <p className="text-sm text-slate-500">{selectedTeacher.fullName}</p>}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v === true }))}
                />
                <Label htmlFor="isActive" className="text-sm">Mark as Active</Label>
              </div>

              {saveError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {saveError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => (step === 1 ? handleClose() : setStep((s) => s - 1))}
            disabled={saving}
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step < 5 ? (
            <Button
              className="gap-2 text-white hover:text-white focus-visible:text-white"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance(step)}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="gap-2 bg-teal-600 text-white hover:bg-teal-700 hover:text-white focus-visible:text-white"
              onClick={handleSave}
              disabled={saving || (variant === 'teacherOnly' && !form.teacherUserId)}
            >
              {saving ? 'Saving...' : editingSlot ? 'Update Slot' : 'Create Slot'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
