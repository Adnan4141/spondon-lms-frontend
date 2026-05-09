'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, X, BookOpen, Layers, Type, Link2, DownloadCloud, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { isLocalUploadPath, isValidHttpUrl } from '@/lib/attachment-url';
import { normalizeYoutubeWatchUrl, parseYoutubeVideoId } from '@/lib/youtube';
import { CONTENT_TYPES, TYPE_CONFIG } from '../courseConstants';
import type { ContentForm } from '../courseTypes';

export function ContentItemModal({
  open,
  onClose,
  onSave,
  initial,
  existingSubjects,
  existingChaptersBySubject = {},
  mode = 'add',
}: {
  open: boolean;
  onClose: () => void;
  onSave: (form: ContentForm, attachment: { mode: 'upload' | 'link'; file: File | null }) => Promise<void>;
  initial: ContentForm;
  existingSubjects: string[];
  existingChaptersBySubject?: Record<string, string[]>;
  mode?: 'add' | 'edit';
}) {
  const [form, setForm] = useState<ContentForm>(initial);
  const [attachmentMode, setAttachmentMode] = useState<'upload' | 'link'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasExistingLocalUpload = useMemo(() => isLocalUploadPath(form.fileUrl), [form.fileUrl]);

  const chapterHints = useMemo(() => {
    const key = form.subjectTitle.trim();
    if (!key) return [];
    return existingChaptersBySubject[key] ?? [];
  }, [form.subjectTitle, existingChaptersBySubject]);

  useEffect(() => {
    if (!open) return;
    setForm(initial);
    const u = initial.fileUrl;
    setAttachmentMode(u && !isLocalUploadPath(u) && isValidHttpUrl(u) ? 'link' : 'upload');
    setFile(null);
    setError('');
  }, [open, initial]);

  const set = <K extends keyof ContentForm>(k: K, v: ContentForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.subjectTitle.trim()) { setError('Module is required'); return; }
    if (!form.chapterTitle.trim()) { setError('Section is required'); return; }
    if (attachmentMode === 'link' && form.type === 'VIDEO' && form.fileUrl.trim() && !parseYoutubeVideoId(form.fileUrl.trim())) {
      setError('Use a valid YouTube watch, youtu.be, embed, Shorts, or raw video id. Use Unlisted, not Private.');
      return;
    }
    if (attachmentMode === 'link' && form.type !== 'VIDEO' && form.fileUrl.trim() && !isValidHttpUrl(form.fileUrl.trim())) {
      setError('Please enter a valid http(s) link'); return;
    }
    if (attachmentMode === 'upload' && !file && !hasExistingLocalUpload) {
      setError('Please choose a file for local upload'); return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(
        attachmentMode === 'link' && form.type === 'VIDEO'
          ? { ...form, fileUrl: normalizeYoutubeWatchUrl(form.fileUrl.trim()) ?? form.fileUrl.trim() }
          : form,
        { mode: attachmentMode, file },
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const labelCls = 'text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5';
  const inputTheme = "transition-all duration-200 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 shadow-sm rounded-xl py-2.5 h-auto text-sm";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="bg-white p-0 gap-0 flex flex-col overflow-hidden rounded-2xl border-slate-200 shadow-2xl max-h-[92vh] w-full max-w-[calc(100%-2rem)] sm:max-w-[700px]">
        <DialogTitle className="sr-only">Lesson</DialogTitle>
        <DialogDescription className="sr-only">Course lesson form</DialogDescription>
        
        {/* PREMIUM MODAL HEADER */}
        <div className="flex shrink-0 items-start justify-between bg-gradient-to-r from-indigo-50/80 to-white px-6 py-5 border-b border-indigo-100">
          <div className="flex gap-4 items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-indigo-100 text-indigo-600">
              {mode === 'edit' ? <FileText className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {mode === 'edit' ? 'Edit Lesson' : 'Add New Lesson'}
              </h2>
              <p className="mt-0.5 text-[13px] font-medium text-slate-500">
                Configure your course material and organize it in a module and section.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full bg-white border border-slate-200 p-2 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600 shadow-sm hover:shadow"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto bg-slate-50/30 p-6 px-6 relative">
          
          {/* Section: Organization */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-500" /> Organization
            </h3>
            <div className="grid gap-5 sm:grid-cols-2 p-5 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
              <div>
                <label className={labelCls}>Module <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                  </div>
                  <Input list="content-subjects-dl" value={form.subjectTitle} onChange={(e) => set('subjectTitle', e.target.value)} placeholder="e.g. Mathematics" className={cn(inputTheme, "pl-10")} autoComplete="off" />
                </div>
                <datalist id="content-subjects-dl">{existingSubjects.map((s) => <option key={s} value={s} />)}</datalist>
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Main top-level grouping container.</p>
              </div>
              <div>
                <label className={labelCls}>Section <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Layers className="h-4 w-4 text-slate-400" />
                  </div>
                  <Input list="content-chapters-dl" value={form.chapterTitle} onChange={(e) => set('chapterTitle', e.target.value)} placeholder="e.g. Chapter 1: Foundations" className={cn(inputTheme, "pl-10")} autoComplete="off" />
                </div>
                <datalist id="content-chapters-dl">{chapterHints.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
            </div>
          </div>

          {/* Section: Primary Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Type className="h-4 w-4 text-indigo-500" /> Primary Details
            </h3>
            <div className="space-y-5 p-5 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
              <div>
                <label className={labelCls}>Lesson Title <span className="text-rose-500">*</span></label>
                <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Introduction to Variables" className={inputTheme} />
              </div>
              <div>
                <label className={labelCls}>Outline Sidebar Label (Optional)</label>
                <Input value={form.topicTitle} onChange={(e) => set('topicTitle', e.target.value)} placeholder="Override the lesson title in the public sidebar outline..." className={inputTheme} />
              </div>
            </div>
          </div>

          {/* Section: Content Type selector */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-500" /> Content Type
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {CONTENT_TYPES.map((t) => {
                const cfg = TYPE_CONFIG[t];
                const TypeIcon = cfg.icon;
                const isSelected = form.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('type', t)}
                    className={cn(
                      'cursor-pointer rounded-xl border-2 p-3 text-center transition-all flex flex-col items-center justify-center gap-2',
                      isSelected ? `${cfg.bg} ${cfg.textColor} border-current shadow-sm ring-1 ring-current/20 scale-[1.02]` : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <TypeIcon className={cn("h-5 w-5", isSelected ? 'opacity-100' : 'opacity-70')} />
                    <span className="text-[11px] font-bold tracking-tight">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {form.type === 'VIDEO' && (
            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
              <Label className={labelCls}>Video Duration (minutes, optional)</Label>
              <Input type="number" min={0} value={form.durationMinutes} onChange={(e) => set('durationMinutes', e.target.value)} placeholder="e.g. 45" className={cn(inputTheme, "bg-white max-w-[200px]")} />
            </div>
          )}

          {/* Section: Upload & Body */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
               <DownloadCloud className="h-4 w-4 text-indigo-500" /> Material & Assets
            </h3>
            <div className="p-5 bg-white rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 shadow-sm p-1 bg-slate-50">
                <button type="button" onClick={() => setAttachmentMode('upload')} className={cn('px-4 py-1.5 text-xs font-bold transition-all rounded-lg', attachmentMode === 'upload' ? 'bg-white text-indigo-700 shadow border border-slate-200/60' : 'text-slate-500 hover:text-slate-700')} >
                  File Upload
                </button>
                <button type="button" onClick={() => setAttachmentMode('link')} className={cn('px-4 py-1.5 text-xs font-bold transition-all rounded-lg', attachmentMode === 'link' ? 'bg-white text-indigo-700 shadow border border-slate-200/60' : 'text-slate-500 hover:text-slate-700')} >
                  {form.type === 'VIDEO' ? 'YouTube Link' : 'External Link'}
                </button>
              </div>

              {attachmentMode === 'upload' ? (
                <div>
                  <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} accept={form.type === 'VIDEO' ? 'video/*' : undefined} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  {hasExistingLocalUpload && !file && <p className="text-[11px] text-slate-500 mt-2 font-medium">Existing upload is preserved unless replaced.</p>}
                  {file && <p className="text-[11px] text-slate-600 mt-2 font-bold flex items-center gap-1.5"><BookOpen className="h-3 w-3" /> Selected: {file.name}</p>}
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Link2 className="h-4 w-4 text-slate-400" />
                  </div>
                  <Input value={form.fileUrl} onChange={(e) => set('fileUrl', e.target.value)} placeholder={form.type === 'VIDEO' ? 'https://youtube.com/watch?v=…' : 'https://…'} className={cn(inputTheme, "pl-10")} />
                  {form.type === 'VIDEO' && (
                    <p className="mt-2 px-1 text-[11px] font-medium leading-relaxed text-slate-500">
                      Use Unlisted YouTube, not Private. Students will see it through the LMS anti-casual-sharing player.
                    </p>
                  )}
                </div>
              )}

              {(form.type === 'NOTE' || form.type === 'OTHER') && (
                <div className="pt-2">
                  <label className={labelCls}>Rich Text / Notes (Optional)</label>
                  <textarea value={form.textBody} onChange={(e) => set('textBody', e.target.value)} placeholder="Type additional text context here..." rows={4} className={cn(inputTheme, "w-full resize-none block p-3")} />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <button type="button" onClick={() => set('isFree', !form.isFree)} className={cn('flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border-2 transition-all', form.isFree ? 'border-emerald-500 bg-emerald-500 shadow-sm shadow-emerald-200' : 'border-slate-300 bg-white')}>
              {form.isFree && <span className="text-xs font-black text-white">✓</span>}
            </button>
            <label className="cursor-pointer text-[13px] font-bold text-slate-700 select-none" onClick={() => set('isFree', !form.isFree)}>
              Make this lesson FREE (Available to preview before purchase)
            </label>
          </div>

          {error && <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100 text-center">{error}</div>}

          {/* Collapsible advanced ordering */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            <button type="button" className="flex w-full cursor-pointer items-center justify-between bg-slate-50/70 px-4 py-3 text-left transition-colors hover:bg-slate-100/70 group" onClick={() => setShowAdvanced((v) => !v)}>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-700 transition-colors">Advanced Ordering Matrix</span>
              <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform duration-300', showAdvanced && 'rotate-180')} />
            </button>
            <div className={cn("grid gap-5 sm:grid-cols-2 overflow-hidden transition-all duration-300", showAdvanced ? "max-h-40 p-5 border-t border-slate-100" : "max-h-0 opacity-0")}>
              <div>
                <Label className={labelCls}>Order in section</Label>
                <Input type="number" min={0} value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} className={inputTheme} />
              </div>
              <div>
                <Label className={labelCls}>Sidebar public order</Label>
                <Input type="number" min={0} value={form.topicSortOrder} onChange={(e) => set('topicSortOrder', e.target.value)} className={inputTheme} />
              </div>
            </div>
          </div>

        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={saving} className="rounded-xl border-slate-300 text-slate-700 bg-white hover:bg-slate-50">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-indigo-600 px-6 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200">
            {saving ? 'Saving changes…' : 'Save Lesson'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
