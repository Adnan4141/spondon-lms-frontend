'use client';

import { useState, useEffect } from 'react';
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
import { DatePicker } from '@/components/ui/date-picker';

const statusOptions: BatchStatusType[] = ['ACTIVE', 'INACTIVE', 'COMPLETED', 'ARCHIVED'];

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block';

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
    } catch (err: any) {
      const errorMsg = err.message || `Failed to ${isEdit ? 'update' : 'create'} batch`;
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
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 no-scrollbar">
        <div className="grid gap-8 py-2 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className={sectionLabel}>Batch Identity</label>
            <Input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Morning Shift A-1"
            />
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Academic Course</label>
            <Select
              disabled={isEdit}
              value={form.courseId}
              onValueChange={(v) => setForm((prev) => ({ ...prev, courseId: v }))}
            >
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id} className="text-sm font-medium">
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Operating Branch</label>
            <Select
              disabled={isEdit}
              value={form.branchId}
              onValueChange={(v) => setForm((prev) => ({ ...prev, branchId: v }))}
            >
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id} className="text-sm font-medium">
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Commencement Date</label>
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
            <label className={sectionLabel}>Estimated Conclusion</label>
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
            <label className={sectionLabel}>Student Capacity</label>
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
              placeholder="Maximum occupancy"
            />
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Operational Status</label>
            <Select
              value={form.status || 'ACTIVE'}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, status: v as BatchStatusType }))
              }
            >
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                {statusOptions.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-sm font-medium">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-base font-bold text-rose-600 uppercase tracking-widest flex items-center gap-3">
             <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
             {error}
          </div>
        )}
      </div>

      <div className="mt-auto shrink-0 border-t border-slate-100 bg-slate-50/80 px-8 pb-8 pt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-2xl border-slate-200 bg-white font-black uppercase tracking-[0.2em] text-[11px] text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all"
            onClick={closeModal}
          >
            Discard
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-[2] h-12 rounded-2xl bg-slate-900 font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {submitting ? 'Processing...' : isEdit ? 'Update Batch' : 'Authorize Batch'}
          </Button>
        </div>
      </div>
    </div>
  );
}
