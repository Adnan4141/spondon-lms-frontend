'use client';

/**
 * ExamSectionsPanel — Multi-Exam Papers / Sections UI
 *
 * Allows admins to define separate papers within one exam:
 *   Exam: Admission Test 2026
 *   ├── Section 1: MCQ – 30 q – 30 min – 30 marks
 *   ├── Section 2: MCQ (Math) – 20 q – 30 min – 40 marks
 *   └── Section 3: Written (CQ) – 5 q – 60 min – 50 marks
 *
 * Each section stores type, duration, marks, pass marks, and
 * difficulty distribution. Sets generated for this exam are then
 * linked to sections via ExamSet.sectionId.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  getExamSections,
  createExamSection,
  updateExamSection,
  deleteExamSection,
  type ExamSection,
  type ExamSectionDto,
} from '@/lib/api/exams';
import {
  Plus, Trash2, Edit2, GripVertical, Clock,
  CheckCircle2, X, Save, Layers,
  RefreshCw, FileQuestion, BookOpen,
} from 'lucide-react';

// ─── Type badge colors ────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  MCQ: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
  CQ: { bg: 'bg-violet-50', text: 'text-violet-800', border: 'border-violet-200' },
  SHORT: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
};

// ─── Default section form ─────────────────────────────────────────────────────

const DEFAULT_FORM: ExamSectionDto = {
  name: '',
  type: 'MCQ',
  durationMinutes: undefined,
  questionCount: 0,
  marksPerQuestion: 1,
  negativeMarks: 0,
  passMarks: undefined,
  isMandatory: true,
  difficultyDistribution: { easy: 40, medium: 40, hard: 20 },
};

// ─── Section Form ─────────────────────────────────────────────────────────────

function SectionForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: ExamSectionDto;
  onSave: (data: ExamSectionDto) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<ExamSectionDto>(initial);
  const set = (patch: Partial<ExamSectionDto>) => setForm((f) => ({ ...f, ...patch }));
  const setDist = (k: 'easy' | 'medium' | 'hard', v: number) =>
    setForm((f) => ({
      ...f,
      difficultyDistribution: { ...(f.difficultyDistribution ?? { easy: 40, medium: 40, hard: 20 }), [k]: v },
    }));

  const dist = form.difficultyDistribution ?? { easy: 40, medium: 40, hard: 20 };
  const distSum = dist.easy + dist.medium + dist.hard;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-5 bg-slate-50/60 rounded-2xl border border-slate-200">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Name */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Section Name *</label>
          <input
            type="text"
            required
            placeholder="e.g., MCQ Section, Paper 1, Written"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Question Type *</label>
          <select
            value={form.type}
            onChange={(e) => set({ type: e.target.value as 'MCQ' | 'CQ' | 'SHORT' })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          >
            <option value="MCQ">MCQ (Multiple Choice)</option>
            <option value="CQ">CQ (Creative / Written)</option>
            <option value="SHORT">Short Answer</option>
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Duration (minutes)</label>
          <input
            type="number"
            min={0}
            placeholder="e.g., 30"
            value={form.durationMinutes ?? ''}
            onChange={(e) => set({ durationMinutes: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>

        {/* Question Count */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Question Count</label>
          <input
            type="number"
            min={0}
            placeholder="e.g., 30"
            value={form.questionCount || ''}
            onChange={(e) => set({ questionCount: Number(e.target.value) })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>

        {/* Marks per question */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Marks / Question</label>
          <input
            type="number"
            min={0}
            step={0.25}
            placeholder="e.g., 1"
            value={form.marksPerQuestion ?? ''}
            onChange={(e) => set({ marksPerQuestion: Number(e.target.value) })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>

        {/* Negative marks */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Negative Marks</label>
          <input
            type="number"
            min={0}
            step={0.25}
            placeholder="e.g., 0.25"
            value={form.negativeMarks ?? ''}
            onChange={(e) => set({ negativeMarks: Number(e.target.value) })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>

        {/* Pass marks */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pass Marks (optional)</label>
          <input
            type="number"
            min={0}
            step={0.5}
            placeholder="e.g., 15"
            value={form.passMarks ?? ''}
            onChange={(e) => set({ passMarks: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>

        {/* Total marks computed */}
        <div className="flex items-end">
          <div className="w-full rounded-xl border border-slate-100 bg-white px-3.5 py-2.5">
            <p className="text-xs text-slate-500">Computed Total Marks</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {(form.questionCount || 0) * (form.marksPerQuestion || 0)} marks
            </p>
          </div>
        </div>
      </div>

      {/* Difficulty distribution (MCQ only makes sense, but show for all) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-600">Difficulty Distribution</p>
          <span className={cn('text-xs font-bold', distSum === 100 ? 'text-emerald-600' : 'text-rose-600')}>
            {distSum}% {distSum !== 100 && '⚠ must equal 100%'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <div key={d}>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                {d}
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={dist[d]}
                  onChange={(e) => setDist(d, Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
            </div>
          ))}
        </div>
        {/* Visual bar */}
        <div className="mt-3 flex h-2 overflow-hidden rounded-full">
          <div className="bg-emerald-400 transition-all" style={{ width: `${dist.easy}%` }} />
          <div className="bg-amber-400 transition-all" style={{ width: `${dist.medium}%` }} />
          <div className="bg-rose-400 transition-all" style={{ width: `${dist.hard}%` }} />
        </div>
        <div className="mt-1.5 flex gap-4 text-[11px] text-slate-500">
          <span><span className="inline-block h-2 w-2 rounded-full bg-emerald-400 mr-1" />Easy</span>
          <span><span className="inline-block h-2 w-2 rounded-full bg-amber-400 mr-1" />Medium</span>
          <span><span className="inline-block h-2 w-2 rounded-full bg-rose-400 mr-1" />Hard</span>
        </div>
      </div>

      {/* Mandatory toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => set({ isMandatory: !form.isMandatory })}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
            form.isMandatory ? 'bg-indigo-600' : 'bg-slate-200',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform',
              form.isMandatory ? 'translate-x-4' : 'translate-x-0',
            )}
          />
        </button>
        <label className="text-sm font-medium text-slate-700">
          Mandatory section
          <span className="ml-1.5 text-xs text-slate-400">(student must attempt this)</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={saving} className="h-9 rounded-xl gap-1.5 bg-indigo-600 hover:bg-indigo-700">
          {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? 'Saving…' : 'Save Section'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="h-9 rounded-xl border-slate-200">
          <X className="h-3.5 w-3.5 mr-1" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionItem({
  section,
  onEdit,
  onDelete,
}: {
  section: ExamSection;
  onEdit: () => void;
  onDelete: () => void;
  index?: number;
  total?: number;
}) {
  const tc = TYPE_COLORS[section.type] ?? TYPE_COLORS.MCQ;
  const dist = section.difficultyDistribution;
  const qCount = section.sets?.reduce((s, set) => s + (set._count?.questions ?? 0), 0) ?? 0;
  const totalMarks = (section.questionCount || 0) * (section.marksPerQuestion || 0);

  return (
    <div className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 hover:border-slate-300 hover:shadow-sm transition-all">
      {/* Drag handle */}
      <div className="mt-1 shrink-0 text-slate-300 group-hover:text-slate-400 cursor-grab">
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="flex flex-1 min-w-0 flex-col gap-3">
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-bold',
              tc.bg, tc.text, tc.border,
            )}
          >
            {section.type}
          </span>
          <h4 className="text-sm font-bold text-slate-900 truncate">{section.name}</h4>
          {!section.isMandatory && (
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              Optional
            </span>
          )}
          {section.passMarks && (
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Pass: {String(section.passMarks)}+
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          {section.durationMinutes && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {section.durationMinutes} min
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <FileQuestion className="h-3.5 w-3.5" />
            {section.questionCount} questions
          </span>
          {section.marksPerQuestion && (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              {String(section.marksPerQuestion)} marks/q → <strong className="text-slate-700">{totalMarks} total</strong>
            </span>
          )}
          {section.negativeMarks != null && Number(section.negativeMarks) > 0 && (
            <span className="text-rose-600">-{String(section.negativeMarks)} neg</span>
          )}
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {section.sets?.length ?? 0} sets · {qCount} questions loaded
          </span>
        </div>

        {/* Difficulty bar */}
        {dist && (
          <div className="flex items-center gap-2">
            <div className="flex h-1.5 w-24 overflow-hidden rounded-full">
              <div className="bg-emerald-400" style={{ width: `${dist.easy}%` }} />
              <div className="bg-amber-400" style={{ width: `${dist.medium}%` }} />
              <div className="bg-rose-400" style={{ width: `${dist.hard}%` }} />
            </div>
            <span className="text-[11px] text-slate-400">
              E:{dist.easy}% M:{dist.medium}% H:{dist.hard}%
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-8 w-8 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
          title="Edit section"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
          title="Delete section"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

interface ExamSectionsPanelProps {
  examId: string;
}

export function ExamSectionsPanel({ examId }: ExamSectionsPanelProps) {
  const { toast } = useToast();
  const [sections, setSections] = useState<ExamSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // deletingId tracks which section's delete API call is in progress
  const [, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getExamSections(examId);
      if (res.success && res.data) setSections(res.data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load sections', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [examId, toast]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: ExamSectionDto) => {
    setSaving(true);
    try {
      const res = await createExamSection(examId, data);
      if (res.success) {
        toast({ title: 'Section created', variant: 'success' });
        setShowForm(false);
        await load();
      } else {
        toast({ title: 'Error', description: res.message, variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (sectionId: string, data: Partial<ExamSectionDto>) => {
    setSaving(true);
    try {
      const res = await updateExamSection(examId, sectionId, data);
      if (res.success) {
        toast({ title: 'Section updated', variant: 'success' });
        setEditingId(null);
        await load();
      } else {
        toast({ title: 'Error', description: res.message, variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sectionId: string) => {
    setDeletingId(sectionId);
    try {
      const res = await deleteExamSection(examId, sectionId);
      if (res.success) {
        toast({ title: 'Section deleted', variant: 'success' });
        await load();
      } else {
        toast({ title: 'Error', description: res.message, variant: 'destructive' });
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Summary totals
  const totalDuration = sections.reduce((s, sec) => s + (sec.durationMinutes ?? 0), 0);
  const totalQuestions = sections.reduce((s, sec) => s + (sec.questionCount ?? 0), 0);
  const totalMarks = sections.reduce((s, sec) => s + (sec.questionCount ?? 0) * (sec.marksPerQuestion ?? 0), 0);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Exam Sections</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Divide this exam into separate papers (MCQ section, Written section, etc.)
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="h-8 rounded-xl gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Section
        </Button>
      </div>

      {/* Summary strip */}
      {sections.length > 0 && (
        <div className="flex gap-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          {[
            { label: 'Sections', value: sections.length, icon: Layers },
            { label: 'Total duration', value: totalDuration ? `${totalDuration} min` : '—', icon: Clock },
            { label: 'Total questions', value: totalQuestions || '—', icon: FileQuestion },
            { label: 'Total marks', value: totalMarks || '—', icon: CheckCircle2 },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className="text-sm font-bold text-slate-900 tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      {showForm && !editingId && (
        <SectionForm
          initial={DEFAULT_FORM}
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
          saving={saving}
        />
      )}

      {/* Section list */}
      {sections.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3">
            <BookOpen className="h-7 w-7 text-indigo-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No sections yet</p>
          <p className="mt-1 text-xs text-slate-400 max-w-xs">
            Add sections to define separate papers within this exam (e.g., MCQ Paper, Written Paper).
          </p>
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="mt-4 h-8 rounded-xl gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add First Section
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, i) => (
            <div key={section.id}>
              {editingId === section.id ? (
                <SectionForm
                  initial={{
                    name: section.name,
                    type: section.type,
                    durationMinutes: section.durationMinutes,
                    questionCount: section.questionCount,
                    marksPerQuestion: section.marksPerQuestion,
                    negativeMarks: section.negativeMarks,
                    passMarks: section.passMarks,
                    isMandatory: section.isMandatory,
                    difficultyDistribution: section.difficultyDistribution ?? { easy: 40, medium: 40, hard: 20 },
                  }}
                  onSave={(data) => handleUpdate(section.id, data)}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              ) : (
                <SectionItem
                  section={section}
                  index={i}
                  total={sections.length}
                  onEdit={() => { setEditingId(section.id); setShowForm(false); }}
                  onDelete={() => {
                    if (window.confirm(`Delete section "${section.name}"? This will also remove linked question sets.`)) {
                      handleDelete(section.id);
                    }
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
