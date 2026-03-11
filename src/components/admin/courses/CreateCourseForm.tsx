'use client';

import { useState } from 'react';
import { createCourse } from '@/lib/api/courses';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import {
  AdmissionStatus,
  BillingType,
  CourseStatus,
  CourseType,
  CreateCourseDto,
  Program,
} from '@/types/course';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';

const statusOptions: (CourseStatus)[] = ['ACTIVE', 'DISABLED', 'ARCHIVED'];
const typeOptions: (CourseType)[] = ['ONLINE', 'OFFLINE'];
const billingOptions: BillingType[] = ['ONE_TIME', 'MONTHLY'];
const admissionOptions: AdmissionStatus[] = ['OPEN', 'CLOSED'];

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const textareaClass =
  'w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block';

function checkboxClass() {
  return 'h-5 w-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

type EditFormState = {
  programId: string;
  name: string;
  code: string;
  type: CourseType;
  billingType: BillingType;
  fee: string;
  description: string;
  status: CourseStatus;
  admissionStatus: AdmissionStatus;
  featured: boolean;
  websiteVisible: boolean;
  settledOptionEnabled: boolean;
};

const defaultEditForm: EditFormState = {
  programId: '',
  name: '',
  code: '',
  type: 'ONLINE',
  billingType: 'ONE_TIME',
  fee: '0',
  description: '',
  status: 'ACTIVE',
  admissionStatus: 'OPEN',
  featured: false,
  websiteVisible: true,
  settledOptionEnabled: false,
};

export function CreateCourseForm({
  programs,
  onSuccess,
}: {
  programs: Program[];
  onSuccess: () => Promise<void>;
}) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  
  const [createForm, setCreateForm] = useState<EditFormState>(defaultEditForm);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateSubmit = async () => {
    const parsedFee = Number(createForm.fee);

    if (Number.isNaN(parsedFee) || parsedFee < 0) {
      setCreateError('Fee must be a valid positive number.');
      return;
    }

    if (!createForm.programId || !createForm.name.trim() || !createForm.code.trim()) {
      setCreateError('Program, name, and code are required.');
      return;
    }

    const payload: CreateCourseDto = {
      programId: createForm.programId,
      name: createForm.name.trim(),
      code: createForm.code.trim(),
      type: createForm.type,
      billingType: createForm.billingType,
      fee: parsedFee,
      description: createForm.description.trim() || undefined,
      status: createForm.status,
      admissionStatus: createForm.admissionStatus,
      featured: createForm.featured,
      websiteVisible: createForm.websiteVisible,
      settledOptionEnabled: createForm.settledOptionEnabled,
    };

    try {
      setCreateSubmitting(true);
      setCreateError(null);
      await createCourse(payload);
      
      toast({
        title: 'Success',
        description: 'Course created successfully',
        variant: 'success',
      });
      
      closeModal();
      await onSuccess();
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err) || 'Failed to create course';
      setCreateError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 no-scrollbar">
        <div className="grid gap-8 py-2 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={sectionLabel}>Program Hierarchy</label>
            <Select
              value={createForm.programId}
              onValueChange={(value) => setCreateForm((prev) => ({ ...prev, programId: value }))}
            >
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner transition-all focus:ring-4 focus:ring-indigo-500/10">
                <SelectValue placeholder="Select Program" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id} className="text-sm font-medium">
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Course Code</label>
            <Input
              className={inputClass}
              value={createForm.code}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="e.g., HSC-PHY-01"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className={sectionLabel}>Official Title</label>
            <Input
              className={inputClass}
              value={createForm.name}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Full course name"
            />
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Modality</label>
            <Select
              value={createForm.type}
              onValueChange={(value) => setCreateForm((prev) => ({ ...prev, type: value as CourseType }))}
            >
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                {typeOptions.map((option) => (
                  <SelectItem key={option} value={option} className="text-sm font-medium">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Billing Structure</label>
            <Select
              value={createForm.billingType}
              onValueChange={(value) =>
                setCreateForm((prev) => ({ ...prev, billingType: value as BillingType }))
              }
            >
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                {billingOptions.map((option) => (
                  <SelectItem key={option} value={option} className="text-sm font-medium">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Platform Status</label>
            <Select
              value={createForm.status}
              onValueChange={(value) => setCreateForm((prev) => ({ ...prev, status: value as CourseStatus }))}
            >
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                {statusOptions.map((option) => (
                  <SelectItem key={option} value={option} className="text-sm font-medium">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Admission Phase</label>
            <Select
              value={createForm.admissionStatus}
              onValueChange={(value) =>
                setCreateForm((prev) => ({ ...prev, admissionStatus: value as AdmissionStatus }))
              }
            >
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                {admissionOptions.map((option) => (
                  <SelectItem key={option} value={option} className="text-sm font-medium">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className={sectionLabel}>Tuition Fee (৳)</label>
            <Input
              className={inputClass}
              type="number"
              min="0"
              step="0.01"
              value={createForm.fee}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, fee: e.target.value }))}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className={sectionLabel}>Course Overview</label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              placeholder="Describe the course curriculum and objectives..."
              className={textareaClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:col-span-2 pt-2">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 transition-all hover:bg-white hover:shadow-md cursor-pointer group">
              <input
                type="checkbox"
                checked={createForm.featured}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, featured: e.target.checked }))}
                className={checkboxClass()}
              />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 group-hover:text-indigo-600 transition-colors">Featured</span>
            </label>
            
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 transition-all hover:bg-white hover:shadow-md cursor-pointer group">
              <input
                type="checkbox"
                checked={createForm.websiteVisible}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, websiteVisible: e.target.checked }))}
                className={checkboxClass()}
              />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 group-hover:text-indigo-600 transition-colors">Visible</span>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 transition-all hover:bg-white hover:shadow-md cursor-pointer group">
              <input
                type="checkbox"
                checked={createForm.settledOptionEnabled}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, settledOptionEnabled: e.target.checked }))
                }
                className={checkboxClass()}
              />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 group-hover:text-indigo-600 transition-colors">Settled</span>
            </label>
          </div>
        </div>

        {createError && (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-base font-bold text-rose-600 uppercase tracking-widest flex items-center gap-3">
             <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
             {createError}
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
            onClick={handleCreateSubmit}
            disabled={createSubmitting}
            className="flex-[2] h-12 rounded-2xl bg-slate-900 font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {createSubmitting ? 'Processing...' : 'Deploy Course'}
          </Button>
        </div>
      </div>
    </div>
  );
}
