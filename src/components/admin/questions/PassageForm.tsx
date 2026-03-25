'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPassageWithQuestions, updatePassageWithQuestions, uploadQuestionImage } from '@/lib/api/question-bank';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import type { McqPassage, Difficulty, QuestionFolder, CreateMcqOptionDto } from '@/types/question';
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
import { Plus, X, CheckCircle2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block';

interface ChildQuestion {
  id?: string;
  prompt: string;
  explanation?: string;
  options: CreateMcqOptionDto[];
}

interface PassageFormProps {
  folders: QuestionFolder[];
  passage?: McqPassage | null;
  initialFolderId?: string;
  onSuccess: () => Promise<void>;
}

const difficultyOptions: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

function createEmptyQuestion(): ChildQuestion {
  return {
    prompt: '',
    explanation: '',
    options: [
      { label: 'A', text: '', isCorrect: false },
      { label: 'B', text: '', isCorrect: false },
      { label: 'C', text: '', isCorrect: false },
      { label: 'D', text: '', isCorrect: false },
    ],
  };
}

export function PassageForm({ folders, passage, initialFolderId, onSuccess }: PassageFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  const [form, setForm] = useState({
    folderId: initialFolderId || '',
    title: '',
    content: '',
    difficulty: undefined as Difficulty | undefined,
    year: undefined as number | undefined,
    tags: '',
  });
  const [childQuestions, setChildQuestions] = useState<ChildQuestion[]>([createEmptyQuestion()]);
  const [expandedQ, setExpandedQ] = useState<Set<number>>(new Set([0]));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const questionsEndRef = useRef<HTMLDivElement | null>(null);

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
      if (passage.questions && passage.questions.length > 0) {
        setChildQuestions(
          passage.questions.map((q) => ({
            id: q.id,
            prompt: q.prompt,
            explanation: q.explanation || '',
            options: q.options?.map((o) => ({
              label: o.label,
              text: o.text,
              isCorrect: o.isCorrect,
            })) || [
              { label: 'A', text: '', isCorrect: false },
              { label: 'B', text: '', isCorrect: false },
              { label: 'C', text: '', isCorrect: false },
              { label: 'D', text: '', isCorrect: false },
            ],
          }))
        );
        setExpandedQ(new Set([0]));
      }
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

  const addQuestion = () => {
    const newIdx = childQuestions.length;
    setChildQuestions((prev) => [...prev, createEmptyQuestion()]);
    setExpandedQ((prev) => new Set([...prev, newIdx]));
    setTimeout(() => questionsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const removeQuestion = (idx: number) => {
    setChildQuestions((prev) => prev.filter((_, i) => i !== idx));
    setExpandedQ((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < idx) next.add(i);
        else if (i > idx) next.add(i - 1);
      });
      return next;
    });
  };

  const updateQuestion = (idx: number, field: keyof ChildQuestion, value: any) => {
    setChildQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  };

  const addOption = (qIdx: number) => {
    setChildQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: [...q.options, { label: String.fromCharCode(65 + q.options.length), text: '', isCorrect: false }],
            }
          : q
      )
    );
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setChildQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: q.options.filter((_, j) => j !== oIdx).map((o, j) => ({ ...o, label: String.fromCharCode(65 + j) })),
            }
          : q
      )
    );
  };

  const updateOption = (qIdx: number, oIdx: number, field: keyof CreateMcqOptionDto, value: any) => {
    setChildQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.map((o, j) => (j === oIdx ? { ...o, [field]: value } : o)) }
          : q
      )
    );
  };

  const toggleExpanded = (idx: number) => {
    setExpandedQ((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!form.folderId || !form.content.trim()) {
      setError('Folder and passage content are required.');
      return;
    }

    for (let i = 0; i < childQuestions.length; i++) {
      const q = childQuestions[i];
      if (!q.prompt.trim()) {
        setError(`Question ${i + 1}: Prompt is required.`);
        setExpandedQ((prev) => new Set([...prev, i]));
        return;
      }
      if (q.options.length < 2) {
        setError(`Question ${i + 1}: At least 2 options required.`);
        setExpandedQ((prev) => new Set([...prev, i]));
        return;
      }
      if (!q.options.some((o) => o.isCorrect)) {
        setError(`Question ${i + 1}: Mark at least one correct answer.`);
        setExpandedQ((prev) => new Set([...prev, i]));
        return;
      }
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
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        questions: childQuestions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          explanation: q.explanation || undefined,
          options: q.options,
        })),
      };

      if (isEdit && passage) {
        await updatePassageWithQuestions(passage.id, payload);
      } else {
        await createPassageWithQuestions(payload);
      }

      toast({
        title: 'Success',
        description: `Combined MCQ ${isEdit ? 'updated' : 'created'} with ${childQuestions.length} question(s)`,
        variant: 'success',
      });

      closeModal();
      await onSuccess();
    } catch (err: any) {
      const errorMsg = err.message || `Failed to ${isEdit ? 'update' : 'create'} Combined MCQ`;
      setError(errorMsg);
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 no-scrollbar">
        <div className="space-y-8">
          {/* Passage Metadata */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className={sectionLabel}>Target Folder</label>
              <Select value={form.folderId} onValueChange={(v) => setForm((prev) => ({ ...prev, folderId: v }))}>
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
            <div className="space-y-2">
              <label className={sectionLabel}>Title (Optional)</label>
              <Input
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Physics Passage Set"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <label className={sectionLabel}>Difficulty</label>
              <Select
                value={form.difficulty || 'none'}
                onValueChange={(v) => setForm((prev) => ({ ...prev, difficulty: v === 'none' ? undefined : (v as Difficulty) }))}
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                  <SelectValue placeholder="Unspecified" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                  <SelectItem value="none" className="text-sm font-medium">Unspecified</SelectItem>
                  {difficultyOptions.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-sm font-medium">{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className={sectionLabel}>Year</label>
              <Input
                type="number"
                className={inputClass}
                value={form.year || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="e.g., 2024"
              />
            </div>
            <div className="space-y-2">
              <label className={sectionLabel}>Tags</label>
              <Input
                className={inputClass}
                value={form.tags}
                onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder="comma separated"
              />
            </div>
          </div>

          {/* Passage Content */}
          <div className="space-y-2">
            <label className={sectionLabel}>Passage / Stimulus Content (Rich Text)</label>
            <RichTextEditor
              value={form.content}
              onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
              onImageUpload={handleEditorImageUpload}
              placeholder="Write the passage or stimulus content here..."
            />
          </div>

          {/* Child Questions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className={sectionLabel}>
                MCQ Questions ({childQuestions.length})
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addQuestion}
                className="h-8 rounded-xl border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Question
              </Button>
            </div>

            {childQuestions.map((cq, qIdx) => {
              const isOpen = expandedQ.has(qIdx);
              const hasCorrect = cq.options.some((o) => o.isCorrect);
              const hasPrompt = cq.prompt.trim().length > 0;
              return (
                <div
                  key={qIdx}
                  className={cn(
                    'rounded-2xl border transition-all',
                    isOpen ? 'border-indigo-200 bg-indigo-50/30 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'
                  )}
                >
                  {/* Question Header */}
                  <div
                    className="flex items-center gap-3 px-5 py-4 cursor-pointer"
                    onClick={() => toggleExpanded(qIdx)}
                  >
                    <span className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                      {qIdx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate">
                        {hasPrompt
                          ? cq.prompt.replace(/<[^>]+>/g, '').substring(0, 80) + (cq.prompt.length > 80 ? '...' : '')
                          : 'Untitled Question'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn('text-[10px] font-black uppercase', hasPrompt ? 'text-emerald-600' : 'text-slate-400')}>
                          {hasPrompt ? 'Has prompt' : 'No prompt'}
                        </span>
                        <span className="text-slate-200">·</span>
                        <span className="text-[10px] font-black uppercase text-slate-400">{cq.options.length} options</span>
                        <span className="text-slate-200">·</span>
                        <span className={cn('text-[10px] font-black uppercase', hasCorrect ? 'text-emerald-600' : 'text-rose-500')}>
                          {hasCorrect ? 'Answer set' : 'No answer'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {childQuestions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeQuestion(qIdx);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {isOpen ? <ChevronUp className="h-4 w-4 text-indigo-500" /> : <ChevronDown className="h-4 w-4 text-slate-300" />}
                    </div>
                  </div>

                  {/* Question Body */}
                  {isOpen && (
                    <div className="px-5 pb-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="space-y-2">
                        <label className={sectionLabel}>Question Prompt</label>
                        <RichTextEditor
                          value={cq.prompt}
                          onChange={(html) => updateQuestion(qIdx, 'prompt', html)}
                          onImageUpload={handleEditorImageUpload}
                          placeholder="Write the question prompt..."
                        />
                      </div>

                      {/* Options */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className={sectionLabel}>Options</label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addOption(qIdx)}
                            className="h-7 px-2 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50"
                          >
                            <Plus className="mr-1 h-3 w-3" /> Option
                          </Button>
                        </div>
                        {cq.options.map((opt, oIdx) => (
                          <div key={oIdx} className="group flex gap-2 items-center">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 font-black text-sm text-slate-500">
                              {opt.label}
                            </div>
                            <Input
                              className="h-10 rounded-xl border-slate-200 bg-white px-3 text-sm font-medium flex-1"
                              value={opt.text}
                              onChange={(e) => updateOption(qIdx, oIdx, 'text', e.target.value)}
                              placeholder={`Option ${opt.label}...`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => updateOption(qIdx, oIdx, 'isCorrect', !opt.isCorrect)}
                              className={cn(
                                'h-10 w-10 shrink-0 rounded-xl border transition-all',
                                opt.isCorrect
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200'
                                  : 'bg-white border-slate-200 text-slate-300 hover:text-emerald-500 hover:border-emerald-200'
                              )}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            {cq.options.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOption(qIdx, oIdx)}
                                className="h-10 w-10 text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Explanation */}
                      <div className="space-y-2">
                        <label className={sectionLabel}>Explanation (Optional)</label>
                        <Input
                          className="h-10 rounded-xl border-slate-200 bg-white px-3 text-sm font-medium"
                          value={cq.explanation || ''}
                          onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                          placeholder="Brief explanation for the correct answer..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={questionsEndRef} />
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
              ? `Update Combined MCQ (${childQuestions.length} Q)`
              : `Create Combined MCQ (${childQuestions.length} Q)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
