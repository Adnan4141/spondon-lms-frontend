'use client';

import { useState, useEffect, useMemo } from 'react';
import { createBatch, updateBatch, type Batch, type BatchStatusType, type CreateBatchDto, type UpdateBatchDto } from '@/lib/api/batches';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DatePicker } from '@/components/ui/date-picker';

const statusOptions: BatchStatusType[] = ['ACTIVE', 'INACTIVE', 'COMPLETED', 'ARCHIVED'];

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2 block';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

interface BatchFormProps {
  courses: Course[];
  branches: Branch[];
  batch?: Batch | null;
  onSuccess: () => Promise<void>;
}

export function BatchForm({ courses, branches, batch, onSuccess }: BatchFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  const [form, setForm] = useState<CreateBatchDto>({
    courseId: '',
    branchId: '',
    name: '',
    startDate: '',
    endDate: '',
    capacity: undefined,
    status: 'ACTIVE',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!batch;

  useEffect(() => {
    if (batch) {
      setForm({
        courseId: batch.courseId,
        branchId: batch.branchId,
        name: batch.name,
        startDate: batch.startDate ? batch.startDate.slice(0, 10) : '',
        endDate: batch.endDate ? batch.endDate.slice(0, 10) : '',
        capacity: batch.capacity ?? undefined,
        status: (batch.status as BatchStatusType) || 'ACTIVE',
      });
    }
  }, [batch]);

  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: c.id, label: c.name })),
    [courses]
  );
  const branchOptions = useMemo(
    () => branches.map((b) => ({ value: b.id, label: b.name + (b.code ? ` (${b.code})` : '') })),
    [branches]
  );

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.courseId || !form.branchId) {
      setError('Name, course, and branch are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      if (isEdit && batch) {
        const payload: UpdateBatchDto = {
          name: form.name.trim(),
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          capacity: form.capacity,
          status: form.status,
        };
        await updateBatch(batch.id, payload);
      } else {
        await createBatch(form);
      }
      
      toast({
        title: 'Success',
        description: `Batch ${isEdit ? 'updated' : 'created'} successfully`,
        variant: 'success',
      });
      
      closeModal();
      await onSuccess();
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err) || `Failed to ${isEdit ? 'update' : 'create'} batch`;
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white text-slate-900">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 [scrollbar-color:rgb(203_213_225)_transparent] [scrollbar-width:thin] sm:px-8 sm:py-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400">
        <div className="grid gap-5 py-1 sm:grid-cols-2 sm:gap-8 sm:py-2">
          <div className="space-y-2 sm:col-span-2">
            <label className={sectionLabel}>Batch Name</label>
            <Input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Example: Morning Shift A-1"
            />
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Course</label>
            <SearchableSelect
              disabled={isEdit}
              options={courseOptions}
              value={form.courseId}
              onValueChange={(v) => setForm((prev) => ({ ...prev, courseId: v }))}
              placeholder="Select course"
              searchPlaceholder="Search courses…"
              emptyMessage="No course matches."
            />
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Branch</label>
            <SearchableSelect
              disabled={isEdit}
              options={branchOptions}
              value={form.branchId}
              onValueChange={(v) => setForm((prev) => ({ ...prev, branchId: v }))}
              placeholder="Select branch"
              searchPlaceholder="Search branches…"
              emptyMessage="No branch matches."
            />
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Start Date</label>
            <DatePicker
              date={form.startDate ? new Date(form.startDate) : undefined}
              setDate={(date) => {
                if (!date) {
                  setForm(p => ({ ...p, startDate: '' }));
                  return;
                }
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                setForm(p => ({ ...p, startDate: `${y}-${m}-${d}` }));
              }}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold text-slate-700 shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>End Date</label>
            <DatePicker
              date={form.endDate ? new Date(form.endDate) : undefined}
              setDate={(date) => {
                if (!date) {
                  setForm(p => ({ ...p, endDate: '' }));
                  return;
                }
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                setForm(p => ({ ...p, endDate: `${y}-${m}-${d}` }));
              }}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold text-slate-700 shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Capacity</label>
            <Input
              type="number"
              min="0"
              className={inputClass}
              value={form.capacity ?? ''}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  capacity: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              placeholder="Maximum students"
            />
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Status</label>
            <Select
              value={form.status || 'ACTIVE'}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, status: v as BatchStatusType }))
              }
            >
              <SelectTrigger className="h-12 w-full min-w-0 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-900 shadow-inner data-placeholder:text-slate-400 [&_svg]:text-slate-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white text-slate-900 shadow-xl">
                {statusOptions.map((opt) => (
                  <SelectItem
                    key={opt}
                    value={opt}
                    className="text-sm font-medium text-slate-900 focus:bg-slate-100 focus:text-slate-900 data-highlighted:bg-slate-100 data-highlighted:text-slate-900"
                  >
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-600 sm:mt-8 sm:text-base">
             <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
             {error}
          </div>
        )}
      </div>

      <div className="mt-auto shrink-0 border-t border-slate-100 bg-slate-50/80 px-4 pb-5 pt-4 sm:px-8 sm:pb-8 sm:pt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="h-12 flex-1 rounded-2xl border-slate-200 bg-white font-black uppercase tracking-[0.18em] text-[11px] text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
            onClick={closeModal}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="h-12 flex-[2] rounded-2xl bg-slate-900 font-black uppercase tracking-[0.18em] text-[11px] text-white shadow-xl shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
          >
            {submitting ? 'Saving...' : isEdit ? 'Update Batch' : 'Create Batch'}
          </Button>
        </div>
      </div>
    </div>
  );
}
