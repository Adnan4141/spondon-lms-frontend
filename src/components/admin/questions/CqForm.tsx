'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block';

const PART_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ'];
const KNOWLEDGE_LEVELS = ['জ্ঞান', 'অনুধাবন', 'প্রয়োগ', 'উচ্চতর দক্ষতা'];
const difficultyOptions: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

interface CqPart {
  label: string;
  prompt: string;
  marks: number;
  knowledgeLevel?: string;
  answer?: string;
}

interface CqFormProps {
  folders: QuestionFolder[];
  question?: Question | null;
  initialFolderId?: string;
  onSuccess: () => Promise<void>;
}

function createEmptyPart(index: number): CqPart {
  return {
    label: PART_LABELS[index] || String.fromCharCode(0x0995 + index),
    prompt: '',
    marks: 1,
    knowledgeLevel: KNOWLEDGE_LEVELS[Math.min(index, KNOWLEDGE_LEVELS.length - 1)],
    answer: '',
  };
}

export function CqForm({ folders, question, initialFolderId, onSuccess }: CqFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();

  const [form, setForm] = useState({
    folderId: initialFolderId || '',
    prompt: '',
    explanation: '',
    difficulty: undefined as Difficulty | undefined,
    year: undefined as number | undefined,
    tags: '',
  });
  const [parts, setParts] = useState<CqPart[]>([
    createEmptyPart(0),
    createEmptyPart(1),
    createEmptyPart(2),
    createEmptyPart(3),
  ]);
  const [expandedParts, setExpandedParts] = useState<Set<number>>(new Set([0]));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const partsEndRef = useRef<HTMLDivElement | null>(null);

  const isEdit = !!question;

  useEffect(() => {
    if (question) {
      setForm({
        folderId: question.folderId,
        prompt: question.prompt,
        explanation: question.explanation || '',
        difficulty: question.difficulty || undefined,
        year: question.year || undefined,
        tags: (question.tags || []).join(', '),
      });

      // Load parts from meta
      const meta = question.meta as any;
      if (meta?.parts && Array.isArray(meta.parts) && meta.parts.length > 0) {
        setParts(
          meta.parts.map((p: any, i: number) => ({
            label: p.label || PART_LABELS[i] || `${i + 1}`,
            prompt: p.prompt || '',
            marks: p.marks ?? 1,
            knowledgeLevel: p.knowledgeLevel || '',
            answer: p.answer || '',
          }))
        );
      }
      setExpandedParts(new Set([0]));
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

  const addPart = () => {
    const newIdx = parts.length;
    setParts((prev) => [...prev, createEmptyPart(newIdx)]);
    setExpandedParts((prev) => new Set([...prev, newIdx]));
    setTimeout(() => partsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const removePart = (idx: number) => {
    setParts((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      return updated.map((p, i) => ({ ...p, label: PART_LABELS[i] || `${i + 1}` }));
    });
    setExpandedParts((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < idx) next.add(i);
        else if (i > idx) next.add(i - 1);
      });
      return next;
    });
  };

  const updatePart = (idx: number, field: keyof CqPart, value: any) => {
    setParts((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const toggleExpanded = (idx: number) => {
    setExpandedParts((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const totalMarks = parts.reduce((sum, p) => sum + (p.marks || 0), 0);

  const handleSubmit = async () => {
    if (!form.folderId || !form.prompt.trim()) {
      setError('Folder and main question stem are required.');
      return;
    }

    for (let i = 0; i < parts.length; i++) {
      if (!parts[i].prompt.trim()) {
        setError(`Part (${parts[i].label}): Prompt is required.`);
        setExpandedParts((prev) => new Set([...prev, i]));
        return;
      }
      if (!parts[i].marks || parts[i].marks <= 0) {
        setError(`Part (${parts[i].label}): Marks must be greater than 0.`);
        setExpandedParts((prev) => new Set([...prev, i]));
        return;
      }
    }

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
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        meta: {
          parts: parts.map((p) => ({
            label: p.label,
            prompt: p.prompt,
            marks: p.marks,
            knowledgeLevel: p.knowledgeLevel || undefined,
            answer: p.answer || undefined,
          })),
          totalMarks,
        },
      };

      if (isEdit && question) {
        await updateQuestion(question.id, payload as UpdateQuestionDto);
      } else {
        await createQuestion(payload);
      }

      toast({
        title: 'Success',
        description: `Creative Question ${isEdit ? 'updated' : 'created'} with ${parts.length} part(s)`,
        variant: 'success',
      });

      closeModal();
      await onSuccess();
    } catch (err: any) {
      const errorMsg = err.message || `Failed to ${isEdit ? 'update' : 'create'} CQ`;
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
          {/* Metadata Row */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className={sectionLabel}>Target Folder</label>
              <Select value={form.folderId} onValueChange={(v) => setForm((prev) => ({ ...prev, folderId: v }))}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700 shadow-inner">
                  <SelectValue placeholder="Select Folder" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id} className="text-sm font-medium">{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          {/* Main Stem / Context */}
          <div className="space-y-2">
            <label className={sectionLabel}>উদ্দীপক / Main Stem (Rich Text)</label>
            <RichTextEditor
              value={form.prompt}
              onChange={(html) => setForm((prev) => ({ ...prev, prompt: html }))}
              onImageUpload={handleEditorImageUpload}
              placeholder="Write the stimulus / context for the creative question..."
            />
          </div>

          {/* Sub-Parts Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className={sectionLabel}>
                  প্রশ্ন — Sub-Parts ({parts.length})
                </label>
                <p className="text-xs font-bold text-slate-500 -mt-1">
                  Total Marks: <span className="text-indigo-600">{totalMarks}</span>
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPart}
                className="h-8 rounded-xl border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Part
              </Button>
            </div>

            {parts.map((part, pIdx) => {
              const isOpen = expandedParts.has(pIdx);
              const hasPrompt = part.prompt.trim().length > 0;
              return (
                <div
                  key={pIdx}
                  className={cn(
                    'rounded-2xl border transition-all',
                    isOpen ? 'border-indigo-200 bg-indigo-50/30 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'
                  )}
                >
                  {/* Part Header */}
                  <div
                    className="flex items-center gap-3 px-5 py-4 cursor-pointer"
                    onClick={() => toggleExpanded(pIdx)}
                  >
                    <span className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-black shrink-0">
                      {part.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate">
                        {hasPrompt
                          ? part.prompt.replace(/<[^>]+>/g, '').substring(0, 80) + (part.prompt.length > 80 ? '...' : '')
                          : 'Empty part'}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] font-black uppercase text-indigo-600">{part.marks} mark{part.marks !== 1 ? 's' : ''}</span>
                        {part.knowledgeLevel && (
                          <>
                            <span className="text-slate-200">·</span>
                            <span className="text-[10px] font-black uppercase text-slate-400">{part.knowledgeLevel}</span>
                          </>
                        )}
                        <span className="text-slate-200">·</span>
                        <span className={cn('text-[10px] font-black uppercase', hasPrompt ? 'text-emerald-600' : 'text-rose-500')}>
                          {hasPrompt ? 'Has prompt' : 'No prompt'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {parts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePart(pIdx);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {isOpen ? <ChevronUp className="h-4 w-4 text-indigo-500" /> : <ChevronDown className="h-4 w-4 text-slate-300" />}
                    </div>
                  </div>

                  {/* Part Body */}
                  {isOpen && (
                    <div className="px-5 pb-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Marks + Knowledge Level */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className={sectionLabel}>Marks</label>
                          <Input
                            type="number"
                            min={1}
                            className="h-10 rounded-xl border-slate-200 bg-white px-3 text-sm font-medium"
                            value={part.marks}
                            onChange={(e) => updatePart(pIdx, 'marks', Number(e.target.value) || 1)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={sectionLabel}>জ্ঞানস্তর / Knowledge Level</label>
                          <Select
                            value={part.knowledgeLevel || 'none'}
                            onValueChange={(v) => updatePart(pIdx, 'knowledgeLevel', v === 'none' ? '' : v)}
                          >
                            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white px-3 text-sm font-medium">
                              <SelectValue placeholder="Select Level" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="none" className="text-sm">Unspecified</SelectItem>
                              {KNOWLEDGE_LEVELS.map((lv) => (
                                <SelectItem key={lv} value={lv} className="text-sm">{lv}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Part Prompt */}
                      <div className="space-y-2">
                        <label className={sectionLabel}>প্রশ্ন / Question Prompt</label>
                        <RichTextEditor
                          value={part.prompt}
                          onChange={(html) => updatePart(pIdx, 'prompt', html)}
                          onImageUpload={handleEditorImageUpload}
                          placeholder={`Write question for part (${part.label})...`}
                        />
                      </div>

                      {/* Part Answer */}
                      <div className="space-y-2">
                        <label className={sectionLabel}>উত্তর / Answer (Optional)</label>
                        <RichTextEditor
                          value={part.answer || ''}
                          onChange={(html) => updatePart(pIdx, 'answer', html)}
                          onImageUpload={handleEditorImageUpload}
                          placeholder={`Model answer for part (${part.label})...`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={partsEndRef} />
          </div>

          {/* General Explanation */}
          <div className="space-y-2">
            <label className={sectionLabel}>সামগ্রিক ব্যাখ্যা / Overall Explanation (Optional)</label>
            <RichTextEditor
              value={form.explanation}
              onChange={(html) => setForm((prev) => ({ ...prev, explanation: html }))}
              onImageUpload={handleEditorImageUpload}
              placeholder="Overall explanation or marking guidelines..."
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
              ? `Update CQ (${parts.length} parts, ${totalMarks} marks)`
              : `Create CQ (${parts.length} parts, ${totalMarks} marks)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
