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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Plus, CalendarIcon, FolderOpen, BarChart3, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

interface ShortQuestionFormProps {
  folders: QuestionFolder[];
  question?: Question | null;
  initialFolderId?: string;
  onSuccess: () => Promise<void>;
}

export function ShortQuestionForm({ folders, question, initialFolderId, onSuccess }: ShortQuestionFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();

  const [form, setForm] = useState({
    folderId: initialFolderId || '',
    prompt: '',
    answer: '',
    explanation: '',
    difficulty: 'EASY' as Difficulty | undefined,
    year: CURRENT_YEAR as number | undefined,
    tags: '',
  });
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!question;

  useEffect(() => {
    if (question) {
      const meta = question.meta as any;
      setForm({
        folderId: question.folderId,
        prompt: question.prompt,
        answer: meta?.answer || '',
        explanation: question.explanation || '',
        difficulty: question.difficulty || undefined,
        year: question.year || undefined,
        tags: (question.tags || []).join(', '),
      });
      if (meta?.answer) setShowAnswer(true);
      if (question.explanation) setShowExplanation(true);
    }
  }, [question]);

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
    if (!form.folderId) {
      setError('Please select a folder.');
      return;
    }
    if (!form.prompt.trim()) {
      setError('Question prompt is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateQuestionDto = {
        folderId: form.folderId,
        type: 'SHORT',
        prompt: form.prompt,
        explanation: form.explanation || undefined,
        difficulty: form.difficulty,
        year: form.year,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        meta: form.answer ? { answer: form.answer } : undefined,
      };

      if (isEdit && question) {
        await updateQuestion(question.id, payload as UpdateQuestionDto);
      } else {
        await createQuestion(payload);
      }

      toast({
        title: 'Success',
        description: `Short question ${isEdit ? 'updated' : 'created'} successfully`,
        variant: 'success',
      });

      closeModal();
      await onSuccess();
    } catch (err: any) {
      const msg = err.message || `Failed to ${isEdit ? 'update' : 'create'} short question`;
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 no-scrollbar">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Prompt */}
            <div className="space-y-2">
              <label className={sectionLabel}>প্রশ্ন / Question Prompt</label>
              <RichTextEditor
                value={form.prompt}
                onChange={(html) => setForm((prev) => ({ ...prev, prompt: html }))}
                onImageUpload={handleEditorImageUpload}
                placeholder="Write the short question..."
              />
            </div>

            {/* Answer (optional toggle) */}
            {!showAnswer ? (
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200"
                onClick={() => setShowAnswer(true)}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Model Answer
              </Button>
            ) : (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <label className={sectionLabel}>উত্তর / Model Answer</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowAnswer(false); setForm((p) => ({ ...p, answer: '' })); }}
                    className="h-6 px-2 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50"
                  >
                    Remove
                  </Button>
                </div>
                <RichTextEditor
                  value={form.answer}
                  onChange={(html) => setForm((prev) => ({ ...prev, answer: html }))}
                  onImageUpload={handleEditorImageUpload}
                  placeholder="Write the model answer (1–3 lines)..."
                />
              </div>
            )}

            {/* Explanation (optional toggle) */}
            {!showExplanation ? (
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50"
                onClick={() => setShowExplanation(true)}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Explanation
              </Button>
            ) : (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <label className={sectionLabel}>ব্যাখ্যা / Explanation (Optional)</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowExplanation(false); setForm((p) => ({ ...p, explanation: '' })); }}
                    className="h-6 px-2 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50"
                  >
                    Remove
                  </Button>
                </div>
                <RichTextEditor
                  value={form.explanation}
                  onChange={(html) => setForm((prev) => ({ ...prev, explanation: html }))}
                  onImageUpload={handleEditorImageUpload}
                  placeholder="Provide additional explanation or context..."
                />
              </div>
            )}
          </div>

          {/* Configuration Sidebar */}
          <div className="space-y-6 lg:border-l lg:pl-8 border-slate-100">
            {/* Folder */}
            <div className="space-y-2">
              <label className={sectionLabel}><FolderOpen className="inline h-3 w-3 mr-1" /> Folder</label>
              <Select
                value={form.folderId}
                onValueChange={(v) => setForm((p) => ({ ...p, folderId: v }))}
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                  <SelectValue placeholder="Select Folder" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id} className="text-sm font-medium">
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <label className={sectionLabel}><BarChart3 className="inline h-3 w-3 mr-1" /> Difficulty</label>
              <Select
                value={form.difficulty ?? 'none'}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, difficulty: v === 'none' ? undefined : (v as Difficulty) }))
                }
              >
                <SelectTrigger
                  className={cn(
                    'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold shadow-inner',
                    !form.difficulty ? 'text-slate-400' : 'text-slate-700'
                  )}
                >
                  <SelectValue placeholder="Unspecified" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                  <SelectItem value="none" className="text-sm font-medium text-slate-400">Unspecified</SelectItem>
                  <SelectItem value="EASY" className="text-sm font-medium text-emerald-600">EASY</SelectItem>
                  <SelectItem value="MEDIUM" className="text-sm font-medium text-amber-600">MEDIUM</SelectItem>
                  <SelectItem value="HARD" className="text-sm font-medium text-rose-600">HARD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Year Picker */}
            <div className="space-y-2">
              <label className={sectionLabel}><CalendarIcon className="inline h-3 w-3 mr-1" /> Year</label>
              <Popover open={yearOpen} onOpenChange={setYearOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold justify-start shadow-inner',
                      form.year ? 'text-slate-900' : 'text-slate-400'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.year ? form.year : 'Select Year'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 rounded-2xl border-slate-200 bg-white shadow-xl" align="start">
                  <div className="max-h-48 overflow-y-auto space-y-0.5 no-scrollbar">
                    <button
                      className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-50"
                      onClick={() => { setForm((p) => ({ ...p, year: undefined })); setYearOpen(false); }}
                    >
                      None
                    </button>
                    {YEAR_OPTIONS.map((y) => (
                      <button
                        key={y}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-colors',
                          form.year === y
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-700 hover:bg-slate-50'
                        )}
                        onClick={() => { setForm((p) => ({ ...p, year: y })); setYearOpen(false); }}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className={sectionLabel}><Tag className="inline h-3 w-3 mr-1" /> Tags</label>
              <Input
                className={inputClass}
                value={form.tags}
                onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                placeholder="comma separated tags..."
              />
            </div>

            {/* Info card */}
            <div className="rounded-[24px] bg-slate-900 p-5 text-white shadow-xl shadow-slate-200">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Short Question</p>
              <p className="text-sm font-bold leading-relaxed text-slate-300">
                Direct recall, definition, or 1–3 line answer. No stimulus required.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-base font-bold text-rose-600 flex items-center gap-3">
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
            {submitting
              ? 'Processing...'
              : isEdit
              ? 'Update Short Question'
              : 'Create Short Question'}
          </Button>
        </div>
      </div>
    </div>
  );
}
