'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CONTENT_TYPES, RED, TYPE_CONFIG } from '../courseConstants';
import type { ContentForm } from '../courseTypes';

export function ContentItemModal({
  open, onClose, onSave, initial, existingSubjects,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (form: ContentForm) => Promise<void>;
  initial: ContentForm;
  existingSubjects: string[];
}) {
  const [form, setForm] = useState<ContentForm>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof ContentForm>(k: K, v: ContentForm[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.subjectTitle.trim()) { setError('Subject is required'); return; }
    if (!form.chapterTitle.trim()) { setError('Chapter is required'); return; }
    setSaving(true); setError('');
    try { await onSave(form); } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent showCloseButton={false} className="p-0 gap-0 max-h-[92vh] w-[95vw] sm:max-w-xl flex flex-col overflow-hidden">
        <DialogTitle className="sr-only">Content Item</DialogTitle>
        <DialogDescription className="sr-only">Course content item form</DialogDescription>
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-base font-black text-slate-900">Add / Edit Content Item</h2>
            <p className="text-xs text-slate-500 mt-0.5">Fill in the details for this lecture / material</p>
          </div>
          <button onClick={onClose} className="bg-red-100 hover:bg-red-200 text-red-700 rounded-lg p-1.5 transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subject <span className="text-rose-600">*</span></label>
            <Input list="subjects-dl" value={form.subjectTitle} onChange={e => set('subjectTitle', e.target.value)} placeholder="e.g. Physics" />
            <datalist id="subjects-dl">{existingSubjects.map(s => <option key={s} value={s} />)}</datalist>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Chapter <span className="text-rose-600">*</span></label>
            <Input value={form.chapterTitle} onChange={e => set('chapterTitle', e.target.value)} placeholder="e.g. Chapter ১ — Motion" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Title <span className="text-rose-600">*</span></label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. লেকচার 01 — Basic Concepts" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Content Type</label>
            <div className="flex gap-2 flex-wrap">
              {CONTENT_TYPES.map(t => {
                const cfg = TYPE_CONFIG[t];
                return (
                  <button key={t} onClick={() => set('type', t)} type="button"
                    className={cn('px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all cursor-pointer',
                      form.type === t ? `${cfg.bg} ${cfg.textColor} border-current` : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300')}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">File / URL</label>
            <Input value={form.fileUrl} onChange={e => set('fileUrl', e.target.value)}
              placeholder={form.type === 'VIDEO' ? 'https://youtube.com/watch?v=...' : 'https://...'} />
          </div>
          {(form.type === 'NOTE' || form.type === 'OTHER') && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Text / Notes</label>
              <textarea value={form.textBody} onChange={e => set('textBody', e.target.value)}
                placeholder="Paste note content..." rows={4}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => set('isFree', !form.isFree)}
              className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer',
                form.isFree ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300')}>
              {form.isFree && <span className="text-white text-[10px] font-black">✓</span>}
            </button>
            <label className="text-sm text-slate-700 font-medium cursor-pointer" onClick={() => set('isFree', !form.isFree)}>
              Free access (visible without login)
            </label>
          </div>
          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        </div>
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 shrink-0 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="text-white" style={{ background: RED }}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── COURSE FORM MODAL (4 tabs) ───────────────────────────────────────────────
