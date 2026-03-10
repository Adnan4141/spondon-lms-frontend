'use client';

import { useState, useEffect } from 'react';
import { createPassage, updatePassage, uploadQuestionImage } from '@/lib/api/question-bank';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import type { McqPassage, Difficulty, QuestionFolder } from '@/types/question';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block';

interface PassageFormProps {
  folders: QuestionFolder[];
  passage?: McqPassage | null;
  onSuccess: () => Promise<void>;
}

const difficultyOptions: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

export function PassageForm({ folders, passage, onSuccess }: PassageFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  const [form, setForm] = useState({
    folderId: '',
    title: '',
    content: '',
    difficulty: undefined as Difficulty | undefined,
    year: undefined as number | undefined,
    tags: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!passage;

  useEffect(() => {
    if (passage) {
      setForm({
        folderId: passage.folderId,
        title: passage.title || '',
        content: passage.content,
        difficulty: passage.difficulty || undefined,
        year: passage.year || undefined,
        tags: (passage.tags || []).join(', '),
      });
    }
  }, [passage]);

  const handleEditorImageUpload = async (file: File): Promise<string> => {
    try {
      const response = await uploadQuestionImage(file);
      if (response.success && response.data?.url) return response.data.url;
      throw new Error(response.message || 'Failed to upload image');
    } catch (err: any) {
      toast({ title: 'Image upload failed', description: err.message, variant: 'destructive' });
      throw err;
    }
  };

  const handleSubmit = async () => {
    if (!form.folderId || !form.content.trim()) {
      setError('Folder and passage content are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const payload = {
        folderId: form.folderId,
        title: form.title || undefined,
        content: form.content,
        difficulty: form.difficulty,
        year: form.year,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      if (isEdit && passage) {
        await updatePassage(passage.id, payload);
      } else {
        await createPassage(payload);
      }
      
      toast({
        title: 'Success',
        description: `Passage ${isEdit ? 'updated' : 'created'} successfully`,
        variant: 'success',
      });
      
      closeModal();
      await onSuccess();
    } catch (err: any) {
      const errorMsg = err.message || `Failed to ${isEdit ? 'update' : 'create'} passage`;
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
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className={sectionLabel}>Target Folder</label>
              <Select
                value={form.folderId}
                onValueChange={(v) => setForm((prev) => ({ ...prev, folderId: v }))}
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                  <SelectValue placeholder="Select Folder" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id} className="font-bold text-xs uppercase tracking-widest py-3">
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className={sectionLabel}>Passage Title (Optional)</label>
              <Input
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Physics Sample Reading"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className={sectionLabel}>Difficulty Level</label>
              <Select
                value={form.difficulty || 'none'}
                onValueChange={(v) => setForm((prev) => ({ ...prev, difficulty: v === 'none' ? undefined : v as Difficulty }))}
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                  <SelectValue placeholder="Select Difficulty" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                  <SelectItem value="none" className="font-bold text-xs uppercase tracking-widest py-3">Unspecified</SelectItem>
                  {difficultyOptions.map((opt) => (
                    <SelectItem key={opt} value={opt} className="font-bold text-xs uppercase tracking-widest py-3">
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className={sectionLabel}>Academic Year</label>
              <Input
                type="number"
                className={inputClass}
                value={form.year || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="e.g., 2024"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Metadata Tags</label>
            <Input
              className={inputClass}
              value={form.tags}
              onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="e.g., science, chapter-1, important (comma separated)"
            />
          </div>

          <div className="space-y-2">
            <label className={sectionLabel}>Passage Content (Rich Text)</label>
            <RichTextEditor
              value={form.content}
              onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
              onImageUpload={handleEditorImageUpload}
              placeholder="Draft your passage content here..."
            />
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-600 uppercase tracking-widest flex items-center gap-3">
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
            {submitting ? 'Processing...' : isEdit ? 'Update Passage' : 'Create Passage'}
          </Button>
        </div>
      </div>
    </div>
  );
}
