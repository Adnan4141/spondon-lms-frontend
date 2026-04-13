'use client';

import { useState, useEffect, useRef } from 'react';
import { createProgram, updateProgram, uploadProgramThumbnail } from '@/lib/api/programs';
import { API_ORIGIN } from '@/lib/api';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import { Program, CreateProgramDto, UpdateProgramDto, BillingType } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const textareaClass =
  'w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block';

interface ProgramFormProps {
  program?: Program | null;
  onSuccess: () => Promise<void>;
}

export function ProgramForm({ program, onSuccess }: ProgramFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    thumbnail: '',
    admissionFeeEnabled: false,
    admissionFeeAmount: '',
    paymentCircle: 'ONE_TIME' as BillingType,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const pendingThumbnailFile = useRef<File | null>(null);

  const isEdit = !!program;

  useEffect(() => {
    if (program) {
      setForm({
        name: program.name,
        description: program.description || '',
        thumbnail: program.thumbnail || '',
        admissionFeeEnabled: program.admissionFeeEnabled || false,
        admissionFeeAmount: program.admissionFeeAmount ? String(program.admissionFeeAmount) : '',
        paymentCircle: program.paymentCircle || 'ONE_TIME',
      });
      if (program.thumbnail) {
        const url = program.thumbnail.startsWith('/') ? `${API_ORIGIN}${program.thumbnail}` : program.thumbnail;
        setThumbnailPreview(url);
      } else {
        setThumbnailPreview(null);
      }
      pendingThumbnailFile.current = null;
    } else {
      setForm({ 
        name: '', 
        description: '', 
        thumbnail: '',
        admissionFeeEnabled: false,
        admissionFeeAmount: '',
        paymentCircle: 'ONE_TIME',
      });
      setThumbnailPreview(null);
      pendingThumbnailFile.current = null;
    }
  }, [program]);

  const handleThumbnailSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setThumbnailPreview(localUrl);

    if (isEdit && program) {
      try {
        setThumbnailUploading(true);
        const res = await uploadProgramThumbnail(program.id, file);
        if (res.success && res.data?.thumbnail) {
          setForm((prev) => ({ ...prev, thumbnail: res.data!.thumbnail! }));
          setThumbnailPreview(res.data.thumbnail);
          toast({ title: 'Thumbnail uploaded', variant: 'success' });
        }
      } catch {
        toast({ title: 'Upload failed', variant: 'destructive' });
        const t = program?.thumbnail;
        setThumbnailPreview(
          t ? (t.startsWith('/') ? `${API_ORIGIN}${t}` : t) : null
        );
      } finally {
        setThumbnailUploading(false);
      }
    } else {
      pendingThumbnailFile.current = file;
      setForm((prev) => ({ ...prev, thumbnail: '' }));
    }
  };

  const clearThumbnail = () => {
    pendingThumbnailFile.current = null;
    setThumbnailPreview(null);
    setForm((prev) => ({ ...prev, thumbnail: '' }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Program name is required.');
      return;
    }

    const payload: CreateProgramDto | UpdateProgramDto = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      admissionFeeEnabled: form.admissionFeeEnabled,
      admissionFeeAmount: form.admissionFeeEnabled && form.admissionFeeAmount.trim()
        ? Number(form.admissionFeeAmount)
        : null,
      paymentCircle: form.paymentCircle,
    };

    try {
      setSubmitting(true);
      setError(null);

      if (isEdit && program) {
        await updateProgram(program.id, payload as UpdateProgramDto);
      } else {
        const res = await createProgram(payload as CreateProgramDto);
        if (res.success && res.data?.id && pendingThumbnailFile.current) {
          try {
            setThumbnailUploading(true);
            await uploadProgramThumbnail(res.data.id, pendingThumbnailFile.current);
          } catch {
            toast({
              title: 'Program created',
              description: 'Thumbnail upload failed — you can add it when editing the program.',
              variant: 'destructive',
            });
          } finally {
            setThumbnailUploading(false);
            pendingThumbnailFile.current = null;
          }
        }
      }

      toast({
        title: 'Success',
        description: `Program ${isEdit ? 'updated' : 'created'} successfully`,
        variant: 'success',
      });

      closeModal();
      await onSuccess();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'create'} program`;
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
        <div className="space-y-8">
          <div className="space-y-2">
            <label className={sectionLabel}>Program name</label>
            <Input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Higher Secondary Certificate (HSC)"
            />
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Program image (optional)</label>
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
                        {thumbnailPreview ? 'Change image' : 'Upload program image'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        JPEG, PNG, WebP · max 5MB
                        {!isEdit ? ' · saved after program is created' : ''}
                      </span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailSelect}
                  disabled={thumbnailUploading || submitting}
                />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <label className={sectionLabel}>Admission Fee Settings</label>
            <label className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 transition-all hover:bg-white hover:shadow-md cursor-pointer group">
              <input
                type="checkbox"
                checked={form.admissionFeeEnabled}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, admissionFeeEnabled: e.target.checked }))
                }
                className="h-5 w-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
              />
              <span className="text-sm font-bold text-emerald-800 group-hover:text-emerald-900 transition-colors">
                Enable Admission Fee (One-time per program)
              </span>
            </label>

            {form.admissionFeeEnabled && (
              <div className="space-y-2 pl-2">
                <label className={sectionLabel}>Admission Fee Amount (৳)</label>
                <Input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.admissionFeeAmount}
                  onChange={(e) => setForm((prev) => ({ ...prev, admissionFeeAmount: e.target.value }))}
                  placeholder="e.g., 1000"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Payment Circle</label>
            <Select
              value={form.paymentCircle}
              onValueChange={(value) => setForm((prev) => ({ ...prev, paymentCircle: value as BillingType }))}
            >
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                <SelectItem value="ONE_TIME" className="text-sm font-medium">Program-wise (One-time)</SelectItem>
                <SelectItem value="MONTHLY" className="text-sm font-medium">Monthly</SelectItem>
              </SelectContent>
            </Select>
            {form.paymentCircle === 'MONTHLY' && (
              <p className="text-xs font-medium text-amber-600 leading-relaxed">
                All courses under this program will be forced to use monthly billing.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={8}
              placeholder="Write a short description of this program..."
              className={textareaClass}
            />
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
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-2 h-12 rounded-2xl bg-slate-900 font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create program'}
          </Button>
        </div>
      </div>
    </div>
  );
}
