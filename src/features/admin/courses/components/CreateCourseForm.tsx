'use client';

import { useState, useRef } from 'react';
import { createCourse, uploadCourseThumbnail } from '@/lib/api/courses';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import {
  AdmissionStatus,
  CourseStatus,
  CourseType,
  CreateCourseDto,
  Program,
} from '@/types/course';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LazyRichTextEditor as RichTextEditor } from '@/components/ui/lazy-rich-text-editor';
import { uploadQuestionImage } from '@/lib/api/question-bank';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusOptions: (CourseStatus)[] = ['ACTIVE', 'DISABLED', 'ARCHIVED'];
const typeOptions: (CourseType)[] = ['ONLINE', 'OFFLINE'];
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
  slug: string;
  thumbnail: string;
  type: CourseType;
  fee: string;
  description: string;
  status: CourseStatus;
  admissionStatus: AdmissionStatus;
  featured: boolean;
  websiteVisible: boolean;
  enrollmentVisible: boolean;
  settledOptionEnabled: boolean;
};

const defaultEditForm: EditFormState = {
  programId: '',
  name: '',
  slug: '',
  thumbnail: '',
  type: 'ONLINE',
  fee: '0',
  description: '',
  status: 'ACTIVE',
  admissionStatus: 'OPEN',
  featured: false,
  websiteVisible: true,
  enrollmentVisible: true,
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
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const pendingThumbnailFile = useRef<File | null>(null);

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    pendingThumbnailFile.current = file;
    setThumbnailPreview(URL.createObjectURL(file));
    setCreateForm((prev) => ({ ...prev, thumbnail: '' }));
  };

  const clearThumbnail = () => {
    pendingThumbnailFile.current = null;
    setThumbnailPreview(null);
    setCreateForm((prev) => ({ ...prev, thumbnail: '' }));
  };

  const handleCreateSubmit = async () => {
    const parsedFee = Number(createForm.fee);

    if (Number.isNaN(parsedFee) || parsedFee < 0) {
      setCreateError('Fee must be a valid positive number.');
      return;
    }

    if (!createForm.programId || !createForm.name.trim() || !createForm.slug.trim()) {
      setCreateError('Program, name, and slug are required.');
      return;
    }

    const payload: CreateCourseDto = {
      programId: createForm.programId,
      name: createForm.name.trim(),
      slug: createForm.slug.trim().toLowerCase(),
      type: createForm.type,
      fee: parsedFee,
      description: createForm.description.trim() || undefined,
      status: createForm.status,
      admissionStatus: createForm.admissionStatus,
      featured: createForm.featured,
      websiteVisible: createForm.websiteVisible,
      enrollmentVisible: createForm.enrollmentVisible,
      settledOptionEnabled: createForm.settledOptionEnabled,
    };

    try {
      setCreateSubmitting(true);
      setCreateError(null);
      const res = await createCourse(payload);

      if (res.success && res.data?.id && pendingThumbnailFile.current) {
        try {
          setThumbnailUploading(true);
          await uploadCourseThumbnail(res.data.id, pendingThumbnailFile.current);
        } catch {
          toast({
            title: 'Course created',
            description: 'Thumbnail upload failed — you can add it from course settings.',
            variant: 'destructive',
          });
        } finally {
          setThumbnailUploading(false);
          pendingThumbnailFile.current = null;
        }
      }

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
            <label className={sectionLabel}>Course Slug</label>
            <Input
              className={inputClass}
              value={createForm.slug}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
              placeholder="e.g., hsc-physics-01"
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

          <div className="space-y-2 sm:col-span-2">
            <label className={sectionLabel}>Course thumbnail</label>
            <div className="flex items-start gap-4">
              {thumbnailPreview ? (
                <div className="relative shrink-0 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnailPreview}
                    alt=""
                    className="h-28 w-44 rounded-2xl border border-slate-200 object-cover shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={clearThumbnail}
                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  >
                    ✕
                  </button>
                </div>
              ) : null}
              <label className="flex-1 cursor-pointer">
                <div
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-6 px-4 transition-all hover:border-indigo-400 hover:bg-white',
                    thumbnailUploading && 'opacity-50 pointer-events-none'
                  )}
                >
                  {thumbnailUploading ? (
                    <span className="text-sm font-bold text-indigo-600 animate-pulse">Uploading…</span>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-slate-300" />
                      <span className="text-sm font-bold text-slate-500">
                        {thumbnailPreview ? 'Change image' : 'Upload cover image'}
                      </span>
                      <span className="text-[10px] text-slate-400">JPEG, PNG, WebP · max 5MB · saved after course is created</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailSelect}
                  disabled={thumbnailUploading || createSubmitting}
                />
              </label>
            </div>
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
            <RichTextEditor
              value={createForm.description}
              onChange={(html) => setCreateForm((prev) => ({ ...prev, description: html }))}
              onImageUpload={async (file) => {
                const res = await uploadQuestionImage(file);
                return res.data?.url || '';
              }}
              placeholder="Describe the course curriculum and objectives..."
              className="min-h-[200px]"
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
