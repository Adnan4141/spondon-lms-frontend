'use client';

import React, { useState, useEffect } from 'react';
import { createQuestion, updateQuestion, uploadQuestionImage } from '@/lib/api/question-bank';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import type { Question, QuestionFolder, Difficulty, CreateQuestionDto, UpdateQuestionDto } from '@/types/question';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LazyRichTextEditor as RichTextEditor } from '@/components/ui/lazy-rich-text-editor';
import { cn } from '@/lib/utils';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block';

const difficultyOptions: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

interface SingleQuestionFormProps {
  folders: QuestionFolder[];
  question?: Question | null;
  initialFolderId?: string;
  onSuccess: () => Promise<void>;
}

export function SingleQuestionForm({ folders, question, initialFolderId, onSuccess }: SingleQuestionFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();

  const [form, setForm] = useState({
    folderId: initialFolderId || '',
    prompt: '',
    answer: '',
    explanation: '',
    marks: 5,
    difficulty: 'EASY' as Difficulty | undefined,
    year: undefined as number | undefined,
    tags: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!question;

  useEffect(() => {
    if (question) {
      const meta = question.meta as { marks?: number; answer?: string; isSingle?: boolean } | null;
      setForm({
        folderId: question.folderId,
        prompt: question.prompt,
        answer: meta?.answer || '',
        explanation: question.explanation || '',
        marks: meta?.marks ?? 5,
        difficulty: question.difficulty || undefined,
        year: question.year || undefined,
        tags: (question.tags || []).join(', '),
      });
    }
  }, [question]);

  const handleEditorImageUpload = async (file: File): Promise<string> => {
    try {
      const response = await uploadQuestionImage(file);
      if (response.success && response.data?.url) return response.data.url;
      throw new Error(response.message || 'Failed to upload image');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast({ title: 'Image upload failed', description: msg, variant: 'destructive' });
      throw err;
    }
  };

  const handleSubmit = async () => {
    if (!form.folderId) { setError('Please select a target folder.'); return; }
    if (!form.prompt.trim()) { setError('Question prompt is required.'); return; }
    if (!form.marks || form.marks <= 0) { setError('Marks must be greater than 0.'); return; }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateQuestionDto = {
        folderId: form.folderId,
        type: 'CQ',
        prompt: form.prompt,
        explanation: form.explanation || undefined,
        difficulty: form.difficulty,
        year: form.year,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        meta: {
          isSingle: true,
          marks: form.marks,
          answer: form.answer || undefined,
        },
      };

      if (isEdit && question) {
        await updateQuestion(question.id, payload as UpdateQuestionDto);
      } else {
        await createQuestion(payload);
      }

      toast({
        title: 'Success',
        description: `Single question ${isEdit ? 'updated' : 'created'} successfully`,
        variant: 'success',
      });

      closeModal();
      await onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'create'} question`;
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 no-scrollbar">
        <div className="space-y-8">

          {/* Metadata Row */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 lg:col-span-2">
              <label className={sectionLabel}>Target Folder</label>
              <Select value={form.folderId} onValueChange={(v) => setForm(prev => ({ ...prev, folderId: v }))}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                  <SelectValue placeholder="Select Folder" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                  {folders.map(f => (
                    <SelectItem key={f.id} value={f.id} className="text-sm font-medium">{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className={sectionLabel}>Marks</label>
              <Input
                type="number"
                min={1}
                className={inputClass}
                value={form.marks}
                onChange={e => setForm(prev => ({ ...prev, marks: Number(e.target.value) || 1 }))}
                placeholder="e.g., 5"
              />
            </div>

            <div className="space-y-2">
              <label className={sectionLabel}>Difficulty</label>
              <Select
                value={form.difficulty || 'none'}
                onValueChange={v => setForm(prev => ({ ...prev, difficulty: v === 'none' ? undefined : v as Difficulty }))}
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                  <SelectValue placeholder="Unspecified" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                  <SelectItem value="none" className="text-sm font-medium">Unspecified</SelectItem>
                  {difficultyOptions.map(opt => (
                    <SelectItem key={opt} value={opt} className="text-sm font-medium">{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Second Metadata Row */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className={sectionLabel}>Year (Optional)</label>
              <Input
                type="number"
                className={inputClass}
                value={form.year || ''}
                onChange={e => setForm(prev => ({ ...prev, year: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="e.g., 2024"
              />
            </div>
            <div className="space-y-2">
              <label className={sectionLabel}>Tags (comma separated)</label>
              <Input
                className={inputClass}
                value={form.tags}
                onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="e.g., physics, motion"
              />
            </div>
          </div>

          {/* Question Prompt */}
          <div className="space-y-2">
            <label className={sectionLabel}>প্রশ্ন / Question Prompt <span className="text-rose-500">*</span></label>
            <RichTextEditor
              value={form.prompt}
              onChange={html => setForm(prev => ({ ...prev, prompt: html }))}
              onImageUpload={handleEditorImageUpload}
              placeholder="Write the short question here..."
            />
          </div>

          {/* Model Answer */}
          <div className="space-y-2">
            <label className={sectionLabel}>
              উত্তর / Model Answer
              <span className={cn('ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full', 'bg-slate-100 text-slate-500')}>
                optional
              </span>
            </label>
            <RichTextEditor
              value={form.answer}
              onChange={html => setForm(prev => ({ ...prev, answer: html }))}
              onImageUpload={handleEditorImageUpload}
              placeholder="Write the model answer or marking guidelines..."
            />
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <label className={sectionLabel}>
              ব্যাখ্যা / Explanation
              <span className={cn('ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full', 'bg-slate-100 text-slate-500')}>
                optional
              </span>
            </label>
            <RichTextEditor
              value={form.explanation}
              onChange={html => setForm(prev => ({ ...prev, explanation: html }))}
              onImageUpload={handleEditorImageUpload}
              placeholder="Additional notes or explanation for teachers..."
            />
          </div>

        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-base font-bold text-rose-600 flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
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
            {submitting
              ? 'Processing...'
              : isEdit
              ? `Update Single Question (${form.marks} marks)`
              : `Create Single Question (${form.marks} marks)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
