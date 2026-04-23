'use client';

/**
 * _components.tsx — Co-located private components for the /admin/exams route.
 * Exports: ExamWizardModal, ExamRow, ENGINE_CONFIG, MODE_CONFIG, STATUS_CONFIG
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check, X, Info, Eye, Pencil, Trash2, Plus, Minus,
  ChevronRight, Zap, List, Loader2, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { createExam, updateExam, createExamSubject, generateFromSubjects, addQuestionsToSet } from '@/lib/api/exams';
import type { Exam, ExamEngineType, ExamMode, ExamScope, ExamStatus } from '@/types/exam';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';

// ─── CONFIG MAPS ──────────────────────────────────────────────────────────────

export const ENGINE_CONFIG: Record<ExamEngineType, { label: string; tc: string; bg: string; desc: string }> = {
  REGULAR:           { label: 'MCQ',           tc: 'text-rose-600',   bg: 'bg-rose-50',   desc: 'Auto-graded MCQ exam from question bank' },
  COMPETITIVE:       { label: 'CQ / Written',  tc: 'text-blue-600',   bg: 'bg-blue-50',   desc: 'Teacher-evaluated written / CQ exam' },
  MULTI_SUBJECT:     { label: 'Multi-Subject', tc: 'text-teal-600',   bg: 'bg-teal-50',   desc: 'Combined exam across multiple subjects' },
  TALENT_HUNT:       { label: 'Talent Hunt',   tc: 'text-purple-600', bg: 'bg-purple-50', desc: 'Special competitive talent evaluation' },
  OMR_BOOK:          { label: 'OMR Sheet',     tc: 'text-amber-600',  bg: 'bg-amber-50',  desc: 'Physical OMR sheet, scanned for grading' },
  UNIVERSITY_SPECIAL:{ label: 'University',    tc: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'University admission format exam' },
};

export const MODE_CONFIG: Record<ExamMode, { label: string; tc: string; bg: string }> = {
  ONLINE:  { label: 'Online',  tc: 'text-blue-600',   bg: 'bg-blue-50'   },
  OFFLINE: { label: 'Offline', tc: 'text-amber-600',  bg: 'bg-amber-50'  },
  WRITTEN: { label: 'Written', tc: 'text-purple-600', bg: 'bg-purple-50' },
};

export const STATUS_CONFIG: Record<ExamStatus, { label: string; tc: string; bg: string }> = {
  DRAFT:     { label: 'Draft',     tc: 'text-amber-600',  bg: 'bg-amber-50'  },
  PUBLISHED: { label: 'Published', tc: 'text-emerald-600',bg: 'bg-emerald-50'},
  CLOSED:    { label: 'Closed',    tc: 'text-slate-500',  bg: 'bg-slate-100' },
};

const RESULT_INPUT_OPTIONS: Record<ExamEngineType, { value: string; label: string }[]> = {
  REGULAR:           [{ value: 'AUTOMATED',    label: 'Automated (instant)' }],
  COMPETITIVE:       [
    { value: 'SINGLE_MANUAL', label: 'Manual — Single entry' },
    { value: 'BULK_MANUAL',   label: 'Manual — Multiple entry' },
    { value: 'BULK_EXCEL',    label: 'Excel bulk upload' },
  ],
  MULTI_SUBJECT:     [{ value: 'AUTOMATED', label: 'Automated (all subjects)' }],
  TALENT_HUNT:       [{ value: 'AUTOMATED', label: 'Automated' }],
  OMR_BOOK:          [
    { value: 'SINGLE_MANUAL', label: 'Manual — Single entry' },
    { value: 'BULK_MANUAL',   label: 'Manual — Multiple entry' },
    { value: 'BULK_EXCEL',    label: 'Excel bulk upload' },
    { value: 'OMR_SCAN',      label: 'Automated OMR Scan' },
  ],
  UNIVERSITY_SPECIAL:[
    { value: 'SINGLE_MANUAL', label: 'Manual — Single entry' },
    { value: 'BULK_EXCEL',    label: 'Excel bulk upload' },
  ],
};

// ─── FORM STATE ───────────────────────────────────────────────────────────────

interface ExamFormState {
  courseId: string;
  branchId: string;
  title: string;
  examEngine: ExamEngineType;
  mode: ExamMode;
  scope: ExamScope;
  status: ExamStatus;
  durationMinutes: number;
  allowedAttempts: number;
  totalSets: number;
  questionCount: number;
  totalMarks: number;
  negativeMarks: number;
  resultInputMode: string;
  omrQuestionCount: number;
  omrOptionCount: number;
  showLeaderboard: boolean;
  showPercentile: boolean;
  hideResult: boolean;
  startAt: string;
  endAt: string;
}

interface SubjectRow {
  localId: string;
  name: string;
  questionCount: number;
  marksPerQ: number;
  negativeMarks: number;
  passMarks: number;
  mandatory: boolean;
}

const EMPTY_FORM: ExamFormState = {
  courseId: '', branchId: '',
  title: '',
  examEngine: 'REGULAR',
  mode: 'ONLINE',
  scope: 'COURSE',
  status: 'DRAFT',
  durationMinutes: 30, allowedAttempts: 1, totalSets: 1,
  questionCount: 30, totalMarks: 30, negativeMarks: 0,
  resultInputMode: 'AUTOMATED',
  omrQuestionCount: 30, omrOptionCount: 4,
  showLeaderboard: false, showPercentile: false, hideResult: false,
  startAt: '', endAt: '',
};

function examToForm(exam: Exam): ExamFormState {
  const s = (exam.settings ?? {}) as Record<string, unknown>;
  return {
    courseId: exam.courseId,
    branchId: exam.branchId ?? '',
    title: exam.title,
    examEngine: exam.examEngine ?? 'REGULAR',
    mode: exam.mode,
    scope: exam.scope ?? 'COURSE',
    status: exam.status,
    durationMinutes: exam.durationMinutes ?? 30,
    allowedAttempts: exam.allowedAttempts ?? 1,
    totalSets: exam.totalSets ?? 1,
    questionCount: (s.questionCount as number) ?? 30,
    totalMarks: (s.totalMarks as number) ?? 30,
    negativeMarks: (s.negativeMarks as number) ?? 0,
    resultInputMode: (s.resultInputMode as string) ?? 'AUTOMATED',
    omrQuestionCount: exam.omrQuestionCount ?? 30,
    omrOptionCount: exam.omrOptionCount ?? 4,
    showLeaderboard: exam.showLeaderboard ?? false,
    showPercentile: exam.showPercentile ?? false,
    hideResult: (s.hideResult as boolean) ?? false,
    startAt: exam.startAt ? exam.startAt.slice(0, 16) : '',
    endAt:   exam.endAt   ? exam.endAt.slice(0, 16)   : '',
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
      {children}{required && <span className="text-rose-600 ml-0.5">*</span>}
    </label>
  );
}

function ToggleGroup<T extends string>({
  value, onChange, options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; tc?: string; bg?: string }[];
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cn('px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all cursor-pointer',
            value === o.value
              ? `${o.bg ?? 'bg-slate-900'} ${o.tc ?? 'text-white'} border-transparent`
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function newLocalId() { return Math.random().toString(36).slice(2, 10); }
const emptySubject = (): SubjectRow => ({
  localId: newLocalId(), name: '', questionCount: 10, marksPerQ: 1, negativeMarks: 0, passMarks: 0, mandatory: false,
});

// ─── STEP INDICATOR ───────────────────────────────────────────────────────────

function StepIndicator({ step, isMultiSubject }: { step: number; isMultiSubject: boolean }) {
  const steps = isMultiSubject
    ? [{ n: 1, label: 'Setup' }, { n: 2, label: 'Subjects' }, { n: 3, label: 'Question Sets' }]
    : [{ n: 1, label: 'Setup' }, { n: 3, label: 'Question Sets' }];

  return (
    <div className="flex items-center gap-0 shrink-0 px-6 py-4 border-b border-slate-100 bg-slate-50">
      {steps.map((s, idx) => (
        <div key={s.n} className="flex items-center">
          {idx > 0 && <ChevronRight className="h-4 w-4 text-slate-300 mx-2" />}
          <div className="flex items-center gap-2">
            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all',
              step === s.n ? 'bg-rose-600 text-white'
              : step > s.n ? 'bg-emerald-500 text-white'
              : 'bg-slate-200 text-slate-500')}>
              {step > s.n ? <Check className="h-3.5 w-3.5" /> : s.n}
            </div>
            <span className={cn('text-xs font-bold',
              step === s.n ? 'text-rose-600' : step > s.n ? 'text-emerald-600' : 'text-slate-400')}>
              {s.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── EXAM WIZARD MODAL ────────────────────────────────────────────────────────

export function ExamWizardModal({
  open, onClose, onSaved, exam, courses, branches,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (exam: Exam) => void;
  exam?: Exam | null;
  courses: { id: string; name: string }[];
  branches: Branch[];
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ExamFormState>(exam ? examToForm(exam) : EMPTY_FORM);
  const [subjects, setSubjects] = useState<SubjectRow[]>([emptySubject()]);
  const [savedExam, setSavedExam] = useState<Exam | null>(exam ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 3 state
  const [genMode, setGenMode] = useState<'auto' | 'manual'>('auto');
  const [genSetCount, setGenSetCount] = useState(1);
  const [genLanguage, setGenLanguage] = useState<'bn' | 'en'>('bn');
  const [genReplaceExisting, setGenReplaceExisting] = useState(false);
  const [genResult, setGenResult] = useState<{ sets?: string[]; message?: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  const isNew = !exam?.id;
  const isMultiSubject = form.examEngine === 'MULTI_SUBJECT';

  useEffect(() => {
    if (open) {
      setStep(1);
      setForm(exam ? examToForm(exam) : EMPTY_FORM);
      setSubjects([emptySubject()]);
      setSavedExam(exam ?? null);
      setError('');
      setSaving(false);
      setGenResult(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof ExamFormState>(k: K, v: ExamFormState[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const resultOpts = RESULT_INPUT_OPTIONS[form.examEngine] ?? RESULT_INPUT_OPTIONS.REGULAR;

  // ── Step 1: Save/update exam ───────────────────────────────────────────────
  const handleStep1Save = async () => {
    if (!form.title.trim()) { setError('Exam title is required'); return; }
    if (!form.courseId)     { setError('Please select a course'); return; }
    if (!form.branchId)     { setError('Please select a branch'); return; }
    setSaving(true); setError('');
    try {
      const dto = {
        courseId: form.courseId,
        branchId: form.branchId,
        title: form.title,
        type: 'SCHEDULED' as const,
        examEngine: form.examEngine,
        mode: form.mode,
        scope: form.scope,
        status: form.status,
        durationMinutes: form.durationMinutes || undefined,
        allowedAttempts: form.allowedAttempts,
        totalSets: form.totalSets || undefined,
        omrQuestionCount: form.examEngine === 'OMR_BOOK' ? form.omrQuestionCount : undefined,
        omrOptionCount:   form.examEngine === 'OMR_BOOK' ? form.omrOptionCount   : undefined,
        showLeaderboard: form.showLeaderboard,
        showPercentile:  form.showPercentile,
        hideResult:      form.hideResult,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
        endAt:   form.endAt   ? new Date(form.endAt).toISOString()   : undefined,
        settings: {
          questionCount:   form.questionCount,
          totalMarks:      form.totalMarks,
          negativeMarks:   form.negativeMarks,
          resultInputMode: form.resultInputMode,
        },
      };
      const res = savedExam
        ? await updateExam(savedExam.id, dto)
        : await createExam(dto);
      if (!res.success || !res.data) throw new Error((res as { message?: string }).message ?? 'Save failed');
      setSavedExam(res.data);
      // Advance: skip Step 2 if not multi-subject
      setStep(isMultiSubject ? 2 : 3);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save exam');
    } finally {
      setSaving(false);
    }
  };

  // ── Step 2: Save subjects ──────────────────────────────────────────────────
  const handleStep2Save = async () => {
    if (!savedExam) { setError('Exam not yet saved'); return; }
    if (subjects.some(s => !s.name.trim())) { setError('All subjects must have a name'); return; }
    setSaving(true); setError('');
    try {
      for (const subj of subjects) {
        await createExamSubject(savedExam.id, {
          name: subj.name.trim(),
          questionCount: subj.questionCount,
          marksPerQuestion: subj.marksPerQ,
          negativeMarks: subj.negativeMarks,
          passMarks: subj.passMarks,
          isMandatory: subj.mandatory,
        });
      }
      setStep(3);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save subjects');
    } finally {
      setSaving(false);
    }
  };

  // ── Step 3: Generate question sets ────────────────────────────────────────
  const handleGenerate = async () => {
    if (!savedExam) return;
    setGenerating(true); setGenResult(null); setError('');
    try {
      const res = await generateFromSubjects(savedExam.id, {
        setCount: genSetCount,
        language: genLanguage,
        replaceExisting: genReplaceExisting,
      });
      if (!res.success) throw new Error((res as { message?: string }).message ?? 'Generation failed');
      setGenResult({ sets: res.data?.generatedSetNames ?? [], message: `Generated ${res.data?.generatedSetCount ?? genSetCount} set(s) successfully.` });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate question sets');
    } finally {
      setGenerating(false);
    }
  };

  const handleFinish = () => {
    if (savedExam) onSaved(savedExam);
    else onClose();
  };

  // Subject row helpers
  const addSubject = () => setSubjects(prev => [...prev, emptySubject()]);
  const removeSubject = (id: string) => setSubjects(prev => prev.filter(s => s.localId !== id));
  const patchSubject = <K extends keyof SubjectRow>(id: string, k: K, v: SubjectRow[K]) =>
    setSubjects(prev => prev.map(s => s.localId === id ? { ...s, [k]: v } : s));

  const totalQs    = subjects.reduce((s, r) => s + r.questionCount, 0);
  const totalMarks = subjects.reduce((s, r) => s + r.questionCount * r.marksPerQ, 0);

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent showCloseButton={false}
        className="p-0 gap-0 max-h-[93vh] w-[98vw] sm:max-w-2xl flex flex-col overflow-hidden">
        <DialogTitle className="sr-only">Exam Wizard</DialogTitle>
        <DialogDescription className="sr-only">Create or edit an exam</DialogDescription>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-base font-black text-slate-900">{isNew ? 'Create Exam' : 'Edit Exam'}</h2>
            <p className="text-xs text-slate-500 mt-1">Configure exam settings, subjects, and question sets</p>
          </div>
          <button onClick={onClose} className="bg-red-100 hover:bg-red-200 text-red-700 rounded-lg p-1.5 transition-colors cursor-pointer shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        <StepIndicator step={step} isMultiSubject={isMultiSubject} />

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── STEP 1: Setup ──────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <FieldLabel required>Exam Title</FieldLabel>
                <Input value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Chapter ১ MCQ Test" className="focus-visible:ring-rose-200" />
              </div>

              {/* Course + Branch */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Course</FieldLabel>
                  <Select value={form.courseId} onValueChange={v => set('courseId', v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select course" /></SelectTrigger>
                    <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel required>Branch</FieldLabel>
                  <Select value={form.branchId} onValueChange={v => set('branchId', v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Engine type — 2-column card grid */}
              <div>
                <FieldLabel>Exam Type</FieldLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.entries(ENGINE_CONFIG) as [ExamEngineType, typeof ENGINE_CONFIG[ExamEngineType]][]).map(([engine, cfg]) => (
                    <button key={engine} type="button"
                      onClick={() => {
                        set('examEngine', engine);
                        set('resultInputMode', RESULT_INPUT_OPTIONS[engine]?.[0]?.value ?? 'AUTOMATED');
                      }}
                      className={cn('flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all cursor-pointer',
                        form.examEngine === engine ? `${cfg.bg} border-current ${cfg.tc}` : 'bg-white border-slate-200 hover:border-slate-300')}>
                      <div className={cn('w-2.5 h-2.5 rounded-full mt-1 shrink-0', form.examEngine === engine ? cfg.tc.replace('text-', 'bg-') : 'bg-slate-300')} />
                      <div>
                        <p className={cn('text-xs font-black', form.examEngine === engine ? cfg.tc : 'text-slate-700')}>{cfg.label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{cfg.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* MULTI_SUBJECT info box */}
              {isMultiSubject && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex gap-2">
                  <Info className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-teal-700">Multi-Subject: You&apos;ll configure each subject&apos;s question count and marks in Step 2.</p>
                </div>
              )}

              {/* Mode + Scope */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Delivery Mode</FieldLabel>
                  <ToggleGroup value={form.mode} onChange={v => set('mode', v)}
                    options={[
                      { value: 'ONLINE'  as ExamMode, label: 'Online',  tc: 'text-blue-600',   bg: 'bg-blue-50'   },
                      { value: 'OFFLINE' as ExamMode, label: 'Offline', tc: 'text-amber-600',  bg: 'bg-amber-50'  },
                      { value: 'WRITTEN' as ExamMode, label: 'Written', tc: 'text-purple-600', bg: 'bg-purple-50' },
                    ]} />
                </div>
                <div>
                  <FieldLabel>Scope</FieldLabel>
                  <ToggleGroup value={form.scope} onChange={v => set('scope', v)}
                    options={[
                      { value: 'COURSE' as ExamScope, label: 'Enrolled Only', tc: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { value: 'GLOBAL' as ExamScope, label: 'Open to All',   tc: 'text-purple-600',  bg: 'bg-purple-50'  },
                    ]} />
                </div>
              </div>

              {/* Config numbers */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Exam Configuration</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { k: 'questionCount',  label: 'Questions'       },
                    { k: 'durationMinutes',label: 'Duration (min)'  },
                    { k: 'totalMarks',     label: 'Total Marks'     },
                    { k: 'negativeMarks',  label: 'Neg. Marks/wrong'},
                    { k: 'totalSets',      label: 'Paper Sets'      },
                    { k: 'allowedAttempts',label: 'Allowed Attempts'},
                  ] as { k: keyof ExamFormState; label: string }[]).map(({ k, label }) => (
                    <div key={k}>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
                      <Input type="number" min={0} value={form[k] as number}
                        onChange={e => set(k, Number(e.target.value) as ExamFormState[typeof k])}
                        className="text-right focus-visible:ring-rose-200" />
                    </div>
                  ))}
                </div>
              </div>

              {/* OMR config (conditional) */}
              {form.examEngine === 'OMR_BOOK' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-amber-800 mb-3">OMR Sheet Configuration</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>OMR Question Count</FieldLabel>
                      <Input type="number" min={1} value={form.omrQuestionCount}
                        onChange={e => set('omrQuestionCount', Number(e.target.value))}
                        className="focus-visible:ring-amber-300 border-amber-200" />
                    </div>
                    <div>
                      <FieldLabel>Options per Question</FieldLabel>
                      <Select value={String(form.omrOptionCount)} onValueChange={v => set('omrOptionCount', Number(v))}>
                        <SelectTrigger className="border-amber-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">4 options (A–D)</SelectItem>
                          <SelectItem value="5">5 options (A–E)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-amber-700">Sheet sizes: 20/30 → ⅓ A4 · 50 → ½ A4 · 100/120 → A4</p>
                </div>
              )}

              {/* Result input mode */}
              <div>
                <FieldLabel>Result Input Mode</FieldLabel>
                <div className="flex gap-2 flex-wrap">
                  {resultOpts.map(opt => (
                    <button key={opt.value} type="button" onClick={() => set('resultInputMode', opt.value)}
                      className={cn('px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all cursor-pointer',
                        form.resultInputMode === opt.value
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300')}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Result Visibility</p>
                <div className="flex gap-3 flex-wrap">
                  {([
                    { k: 'showLeaderboard', label: 'Show Leaderboard' },
                    { k: 'showPercentile',  label: 'Show Percentile'  },
                    { k: 'hideResult',      label: 'Hide Until Released' },
                  ] as { k: 'showLeaderboard' | 'showPercentile' | 'hideResult'; label: string }[]).map(opt => (
                    <label key={opt.k}
                      className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-xs font-semibold transition-colors select-none',
                        form[opt.k] ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50')}>
                      <input type="checkbox" checked={form[opt.k]} onChange={e => set(opt.k, e.target.checked)} className="sr-only" />
                      {form[opt.k] && <Check className="h-3 w-3" />}
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Start At (optional)</FieldLabel>
                  <input type="datetime-local" value={form.startAt} onChange={e => set('startAt', e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200 bg-white" />
                </div>
                <div>
                  <FieldLabel>End At (optional)</FieldLabel>
                  <input type="datetime-local" value={form.endAt} onChange={e => set('endAt', e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200 bg-white" />
                </div>
              </div>

              {/* Status */}
              <div>
                <FieldLabel>Status</FieldLabel>
                <ToggleGroup value={form.status} onChange={v => set('status', v)}
                  options={[
                    { value: 'DRAFT'     as ExamStatus, label: 'Draft',     tc: 'text-amber-700',  bg: 'bg-amber-50'   },
                    { value: 'PUBLISHED' as ExamStatus, label: 'Published', tc: 'text-emerald-700',bg: 'bg-emerald-50' },
                  ]} />
              </div>

              {error && <p className="text-sm text-rose-600 font-semibold">{error}</p>}
            </div>
          )}

          {/* ── STEP 2: Subjects (Multi-Subject only) ──────────────────────── */}
          {step === 2 && (
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Add subjects for this Multi-Subject exam. Each subject draws from its own question folder.
              </p>

              {/* Subject rows */}
              <div className="space-y-3">
                {subjects.map((subj, idx) => (
                  <div key={subj.localId} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black text-slate-500">Subject {idx + 1}</span>
                      {subjects.length > 1 && (
                        <button onClick={() => removeSubject(subj.localId)} type="button"
                          className="text-rose-500 hover:text-rose-700 transition-colors">
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject Name</label>
                        <Input value={subj.name} onChange={e => patchSubject(subj.localId, 'name', e.target.value)} placeholder="e.g. Physics" />
                      </div>
                      {([
                        { k: 'questionCount', label: 'Questions' },
                        { k: 'marksPerQ',     label: 'Marks/Q'   },
                        { k: 'negativeMarks', label: 'Neg. Marks'},
                        { k: 'passMarks',     label: 'Pass Marks'},
                      ] as { k: keyof SubjectRow; label: string }[]).map(({ k, label }) => (
                        <div key={k}>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
                          <Input type="number" min={0} value={subj[k] as number}
                            onChange={e => patchSubject(subj.localId, k, Number(e.target.value) as SubjectRow[typeof k])} />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button type="button" onClick={() => patchSubject(subj.localId, 'mandatory', !subj.mandatory)}
                        className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer shrink-0',
                          subj.mandatory ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300')}>
                        {subj.mandatory && <Check className="h-3 w-3 text-white" />}
                      </button>
                      <label className="text-xs text-slate-600 font-medium cursor-pointer"
                        onClick={() => patchSubject(subj.localId, 'mandatory', !subj.mandatory)}>
                        Mandatory (student must attempt this subject)
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={addSubject} type="button"
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:border-teal-400 hover:text-teal-600 transition-all cursor-pointer">
                <Plus className="h-3.5 w-3.5" /> Add Subject
              </button>

              {/* Running total */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex gap-6">
                <div className="text-center">
                  <p className="text-xl font-black text-teal-700">{totalQs}</p>
                  <p className="text-[11px] text-teal-600">Total Questions</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-teal-700">{totalMarks}</p>
                  <p className="text-[11px] text-teal-600">Total Marks</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-teal-700">{subjects.length}</p>
                  <p className="text-[11px] text-teal-600">Subjects</p>
                </div>
              </div>

              {error && <p className="text-sm text-rose-600 font-semibold">{error}</p>}
            </div>
          )}

          {/* ── STEP 3: Question Set Generator ─────────────────────────────── */}
          {step === 3 && (
            <div className="p-6 space-y-5">
              {savedExam && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-700 font-semibold">
                    Exam &quot;{savedExam.title}&quot; saved (ID: {savedExam.id.slice(0, 8)}…). Now set up question sets.
                  </p>
                </div>
              )}

              {/* Mode tabs */}
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                <button type="button" onClick={() => setGenMode('auto')}
                  className={cn('flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all cursor-pointer',
                    genMode === 'auto' ? 'bg-white text-rose-600 shadow' : 'text-slate-500')}>
                  <Zap className="h-3.5 w-3.5" /> Auto Generate
                </button>
                <button type="button" onClick={() => setGenMode('manual')}
                  className={cn('flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all cursor-pointer',
                    genMode === 'manual' ? 'bg-white text-slate-700 shadow' : 'text-slate-500')}>
                  <List className="h-3.5 w-3.5" /> Manual Selection
                </button>
              </div>

              {/* Auto mode */}
              {genMode === 'auto' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Number of Sets</FieldLabel>
                      <Input type="number" min={1} max={10} value={genSetCount}
                        onChange={e => setGenSetCount(Number(e.target.value))} />
                    </div>
                    <div>
                      <FieldLabel>Language</FieldLabel>
                      <div className="flex gap-2">
                        {(['bn', 'en'] as const).map(lang => (
                          <button key={lang} type="button" onClick={() => setGenLanguage(lang)}
                            className={cn('flex-1 py-2 rounded-lg border-2 text-xs font-bold transition-all cursor-pointer',
                              genLanguage === lang ? 'bg-indigo-50 text-indigo-700 border-indigo-400' : 'bg-white text-slate-500 border-slate-200')}>
                            {lang === 'bn' ? 'বাংলা' : 'English'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setGenReplaceExisting(!genReplaceExisting)}
                      className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer shrink-0',
                        genReplaceExisting ? 'bg-rose-500 border-rose-500' : 'bg-white border-slate-300')}>
                      {genReplaceExisting && <Check className="h-3 w-3 text-white" />}
                    </button>
                    <label className="text-xs text-slate-600 cursor-pointer" onClick={() => setGenReplaceExisting(!genReplaceExisting)}>
                      Replace existing question sets
                    </label>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-3">
                      The system will randomly select questions from the question bank linked to this exam&apos;s course/subjects and generate {genSetCount} paper set(s).
                    </p>
                    <Button onClick={handleGenerate} disabled={generating || !savedExam}
                      className="gap-2 bg-slate-900 hover:bg-rose-700 text-white transition-colors w-full">
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                      {generating ? 'Generating…' : `Generate ${genSetCount} Set(s)`}
                    </Button>
                  </div>

                  {genResult && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <p className="text-sm font-bold text-emerald-700 mb-1">✓ {genResult.message}</p>
                      {genResult.sets && genResult.sets.length > 0 && (
                        <ul className="list-disc list-inside text-xs text-emerald-600 space-y-0.5">
                          {genResult.sets.map(s => <li key={s}>{s}</li>)}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Manual mode */}
              {genMode === 'manual' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-blue-600 shrink-0" />
                      <p className="text-sm font-bold text-blue-700">Manual Question Selection</p>
                    </div>
                    <p className="text-xs text-blue-600">
                      For manual selection, use the Exam Detail page after saving. Navigate to the exam, then use the Question Bank panel to browse subjects and chapters and hand-pick questions for each set.
                    </p>
                  </div>

                  {savedExam && (
                    <div className="text-center py-4">
                      <p className="text-sm text-slate-500 mb-3">Exam ID: <code className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{savedExam.id}</code></p>
                      <p className="text-xs text-slate-400">You can finish here and go to the exam detail page to add questions manually.</p>
                    </div>
                  )}
                </div>
              )}

              {error && <p className="text-sm text-rose-600 font-semibold">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(isMultiSubject ? step - 1 : 1)}>
                ← Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {step === 1 && (
              <Button onClick={handleStep1Save} disabled={saving}
                className="gap-2 bg-slate-900 hover:bg-rose-700 text-white transition-colors">
                <Check className="h-4 w-4" />
                {saving ? 'Saving…' : (isMultiSubject ? 'Next: Subjects →' : 'Next: Question Sets →')}
              </Button>
            )}
            {step === 2 && (
              <Button onClick={handleStep2Save} disabled={saving}
                className="gap-2 bg-slate-900 hover:bg-rose-700 text-white transition-colors">
                <Check className="h-4 w-4" />
                {saving ? 'Saving…' : 'Next: Question Sets →'}
              </Button>
            )}
            {step === 3 && (
              <Button onClick={handleFinish}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
                <Check className="h-4 w-4" />
                Finish & Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Keep the old name as an alias so the page import doesn't break
export { ExamWizardModal as ExamFormModal };

// ─── EXAM ROW ─────────────────────────────────────────────────────────────────

export function ExamRow({
  exam, onEdit, onDelete, onPublish,
}: {
  exam: Exam;
  onEdit: (e: Exam) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
}) {
  const router = useRouter();
  const engineCfg = ENGINE_CONFIG[exam.examEngine ?? 'REGULAR'] ?? ENGINE_CONFIG.REGULAR;
  const modeCfg   = MODE_CONFIG[exam.mode];
  const statusCfg = STATUS_CONFIG[exam.status];
  const s = (exam.settings ?? {}) as Record<string, unknown>;

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <p className="font-bold text-slate-900 text-sm">{exam.title}</p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', engineCfg.bg, engineCfg.tc)}>{engineCfg.label}</span>
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', modeCfg.bg, modeCfg.tc)}>{modeCfg.label}</span>
          {exam.scope === 'GLOBAL' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600">Global</span>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="font-bold text-sm text-slate-700">{(s.questionCount as number) ?? '—'}</span>
        <p className="text-[10px] text-slate-400">questions</p>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="font-bold text-sm text-slate-700">{exam.durationMinutes ?? '—'}</span>
        <p className="text-[10px] text-slate-400">min</p>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="font-bold text-sm text-slate-700">{(s.totalMarks as number) ?? '—'}</span>
        {((s.negativeMarks as number) ?? 0) > 0 && <p className="text-[10px] text-rose-500">-{s.negativeMarks}/wrong</p>}
      </td>
      <td className="px-3 py-3 text-center">
        <span className="text-sm text-slate-600">{exam.totalSets ?? 1}</span>
      </td>
      <td className="px-3 py-3 text-center">
        <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-bold', statusCfg.bg, statusCfg.tc)}>{statusCfg.label}</span>
      </td>
      <td className="px-3 py-3 text-center text-xs text-slate-400">
        {exam.startAt ? exam.startAt.slice(0, 10) : '—'}
      </td>
      <td className="px-3 py-3">
        <div className="flex gap-1.5 justify-end">
          <button
            onClick={() => router.push(`/admin/exams/${exam.id}`)}
            className="bg-slate-900 hover:bg-slate-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
            <Settings className="h-3 w-3" /> Manage
          </button>
          {exam.status === 'DRAFT' && (
            <button onClick={() => onPublish(exam.id)}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
              <Eye className="h-3 w-3" /> Publish
            </button>
          )}
          <button onClick={() => onEdit(exam)}
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
            <Pencil className="h-3 w-3" /> Edit
          </button>
          <button onClick={() => onDelete(exam.id)}
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-2 py-1 rounded-lg text-xs flex items-center transition-colors">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Re-export types used by the page
export type { Exam, ExamEngineType, ExamMode, ExamStatus };
export type { Course };
export type { Branch };
