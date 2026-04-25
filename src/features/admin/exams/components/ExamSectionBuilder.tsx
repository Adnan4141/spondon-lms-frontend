'use client';

/**
 * ExamSectionBuilder — unified section-first question generation component.
 *
 * Used in:
 *   - ExamCreatorWizard (Step 3) for new/edited exams
 *   - /admin/exams/[id] "Sections" tab for existing exams
 *
 * Each section (MCQ / CQ / SHORT) gets its own question sets (A, B, C…)
 * linked via ExamSet.sectionId — the canonical generation model.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  getExamSections,
  createExamSection,
  updateExamSection,
  deleteExamSection,
  generateSectionSets,
  type ExamSection,
  type ExamSectionDto,
} from '@/lib/api/exams';
import { getQuestionFolderTree, type FolderTreeNode } from '@/lib/api/question-bank';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Layers,
  X,
  Check,
  Search,
  ChevronRight,
  Folder,
  FileText,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SectionFormState {
  name: string;
  type: 'MCQ' | 'CQ' | 'SHORT';
  mcqPassageCount: number;
  mcqSingleCount: number;
  cqCount: number;
  shortCount: number;
  marksPerQuestion: number;
  negativeMarks: number;
  durationMinutes: number;
  passMarks: number;
  isMandatory: boolean;
  selectedFolders: Set<string>;
}

const TYPE_CONFIG = {
  MCQ: { label: 'MCQ', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  CQ: { label: 'CQ', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  SHORT: { label: 'Short', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

function defaultForm(setCount = 3): SectionFormState {
  return {
    name: '',
    type: 'MCQ',
    mcqPassageCount: 0,
    mcqSingleCount: 10,
    cqCount: 4,
    shortCount: 5,
    marksPerQuestion: 1,
    negativeMarks: 0.25,
    durationMinutes: 0,
    passMarks: 0,
    isMandatory: true,
    selectedFolders: new Set(),
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ExamSectionBuilderProps {
  examId: string;
  courseId?: string;
  setCount?: number;
  onSetCountChange?: (v: number) => void;
  actingTeacherUserId?: string;
  /** Called after any successful generate, so parent can refresh exam state */
  onGenerated?: () => void;
}

export function ExamSectionBuilder({
  examId,
  courseId,
  setCount: externalSetCount,
  onSetCountChange,
  actingTeacherUserId,
  onGenerated,
}: ExamSectionBuilderProps) {
  const { toast } = useToast();

  const [sections, setSections] = useState<ExamSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [form, setForm] = useState<SectionFormState>(defaultForm());
  const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(null);
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
  const [folderTreeLoading, setFolderTreeLoading] = useState(false);
  const [internalSetCount, setInternalSetCount] = useState(externalSetCount ?? 3);

  const setCount = externalSetCount ?? internalSetCount;
  const handleSetCountChange = (v: number) => {
    setInternalSetCount(v);
    onSetCountChange?.(v);
  };

  const updateForm = useCallback((patch: Partial<SectionFormState>) => {
    setForm(prev => ({ ...prev, ...patch }));
  }, []);

  // Load sections
  const reloadSections = useCallback(async () => {
    setSectionsLoading(true);
    try {
      const res = await getExamSections(examId);
      if (res.success && res.data) setSections(res.data);
    } catch { /* ignore */ } finally {
      setSectionsLoading(false);
    }
  }, [examId]);

  useEffect(() => { reloadSections(); }, [reloadSections]);

  // Load folder tree
  useEffect(() => {
    if (!courseId) { setFolderTree([]); return; }
    let cancelled = false;
    setFolderTreeLoading(true);
    getQuestionFolderTree(courseId, actingTeacherUserId)
      .then(r => { if (!cancelled && r.success && r.data) setFolderTree(r.data); })
      .catch(() => { /* ignore */ })
      .finally(() => { if (!cancelled) setFolderTreeLoading(false); });
    return () => { cancelled = true; };
  }, [courseId, actingTeacherUserId]);

  // ── Form helpers ──────────────────────────────────────────────────────────

  const openAddForm = useCallback((type: 'MCQ' | 'CQ' | 'SHORT' = 'MCQ') => {
    const names: Record<'MCQ'|'CQ'|'SHORT', string> = {
      MCQ: 'MCQ Section',
      CQ: 'CQ Section',
      SHORT: 'Short Answer Section',
    };
    setForm({ ...defaultForm(setCount), type, name: names[type] });
    setEditingSectionId(null);
    setShowForm(true);
  }, [setCount]);

  const openEditForm = useCallback((sec: ExamSection) => {
    setForm({
      name: sec.name,
      type: sec.type,
      mcqPassageCount: 0,
      mcqSingleCount: sec.type === 'MCQ' ? sec.questionCount : 0,
      cqCount: sec.type === 'CQ' ? sec.questionCount : 0,
      shortCount: sec.type === 'SHORT' ? sec.questionCount : 0,
      marksPerQuestion: Number(sec.marksPerQuestion ?? 1),
      negativeMarks: Number(sec.negativeMarks ?? 0.25),
      durationMinutes: sec.durationMinutes ?? 0,
      passMarks: Number(sec.passMarks ?? 0),
      isMandatory: sec.isMandatory,
      selectedFolders: new Set(
        (sec.folderRules ?? []).map((r: any) => r.folderId).filter(Boolean)
      ),
    });
    setEditingSectionId(sec.id);
    setShowForm(true);
  }, []);

  const handleSave = async () => {
    const questionCount =
      form.type === 'MCQ' ? form.mcqPassageCount + form.mcqSingleCount :
      form.type === 'CQ' ? form.cqCount :
      form.shortCount;

    const dto: ExamSectionDto = {
      name: form.name.trim() || `${form.type} Section`,
      type: form.type,
      durationMinutes: form.durationMinutes || undefined,
      marksPerQuestion: form.marksPerQuestion,
      negativeMarks: form.negativeMarks,
      passMarks: form.passMarks || undefined,
      isMandatory: form.isMandatory,
      questionCount,
      folderRules: Array.from(form.selectedFolders).map(fid => ({ folderId: fid, questionCount: 0 })),
    };

    const res = editingSectionId
      ? await updateExamSection(examId, editingSectionId, dto)
      : await createExamSection(examId, dto);

    if (!res.success) {
      toast({ title: 'Error', description: res.message || 'Failed to save section', variant: 'destructive' });
      return;
    }

    await reloadSections();
    setShowForm(false);
    setEditingSectionId(null);
    toast({ title: editingSectionId ? 'Section updated' : 'Section added', variant: 'success' });
  };

  const handleDelete = async (sec: ExamSection) => {
    if (!confirm(`Delete section "${sec.name}"? All generated sets for this section will be removed.`)) return;
    const res = await deleteExamSection(examId, sec.id);
    if (!res.success) {
      toast({ title: 'Error', description: res.message || 'Failed to delete', variant: 'destructive' });
      return;
    }
    await reloadSections();
    toast({ title: 'Section deleted', variant: 'success' });
  };

  const handleGenerate = async (sec: ExamSection) => {
    const folders = (sec.folderRules ?? []).map((r: any) => r.folderId).filter(Boolean) as string[];
    if (!folders.length) {
      toast({ title: 'No folders', description: `Edit section "${sec.name}" and add folders before generating.`, variant: 'destructive' });
      return;
    }

    setGeneratingSectionId(sec.id);
    try {
      const res = await generateSectionSets(examId, sec.id, {
        folderIds: folders,
        setCount,
        shuffleQuestions: true,
        mcqSingleCount: sec.type === 'MCQ' ? sec.questionCount || 10 : 0,
        mcqPassageCount: 0,
        cqCount: sec.type === 'CQ' ? sec.questionCount || 4 : 0,
        shortCount: sec.type === 'SHORT' ? sec.questionCount || 5 : 0,
        marksPerQuestion: Number(sec.marksPerQuestion) || 1,
        negativeMarks: Number(sec.negativeMarks) || 0,
      });
      if (!res.success) throw new Error(res.message || 'Generation failed');
      await reloadSections();
      onGenerated?.();
      toast({ title: `"${sec.name}" generated`, description: `${setCount} set(s) created`, variant: 'success' });
    } catch (e) {
      toast({ title: 'Generation failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setGeneratingSectionId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const generatedCount = sections.filter(s => (s.sets?.length ?? 0) > 0).length;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[15px] font-medium text-slate-900">Section builder</div>
          <div className="text-xs text-slate-400">Each section = one paper type (MCQ / CQ / Short). Sets are generated per section.</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Sets (A–Z):</span>
          <Input
            type="number"
            className="h-8 w-14 text-center text-sm"
            min={1} max={26}
            value={setCount}
            onChange={e => handleSetCountChange(Math.max(1, Math.min(26, +e.target.value || 1)))}
          />
        </div>
      </div>

      {/* Quick-add buttons */}
      {!showForm && (
        <div className="flex flex-wrap gap-2 mb-4">
          {(['MCQ', 'CQ', 'SHORT'] as const).map(t => {
            const c = TYPE_CONFIG[t];
            return (
              <button
                key={t}
                onClick={() => openAddForm(t)}
                className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors hover:opacity-80', c.bg, c.text, c.border)}
              >
                <Plus className="h-3 w-3" /> Add {c.label} section
              </button>
            );
          })}
        </div>
      )}

      {/* Inline form */}
      {showForm && (
        <SectionForm
          form={form}
          updateForm={updateForm}
          isEditing={Boolean(editingSectionId)}
          folderTree={folderTree}
          folderTreeLoading={folderTreeLoading}
          courseId={courseId}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingSectionId(null); }}
        />
      )}

      {/* Sections list */}
      {sectionsLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading sections…
        </div>
      ) : sections.length === 0 && !showForm ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-14 text-center">
          <Layers className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <div className="text-sm font-medium text-slate-500 mb-1">No sections yet</div>
          <div className="text-xs text-slate-400 mb-4">Add at least one section to configure question counts and generate sets.</div>
          <div className="flex justify-center gap-2">
            {(['MCQ', 'CQ', 'SHORT'] as const).map(t => (
              <button key={t} onClick={() => openAddForm(t)} className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600">
                + {t}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {sections.map(sec => {
            const c = TYPE_CONFIG[sec.type] ?? TYPE_CONFIG.MCQ;
            const generated = (sec.sets?.length ?? 0) > 0;
            const qPerSet = sec.sets?.[0]?._count?.questions ?? sec.questionCount;
            const totalMarks = qPerSet * Number(sec.marksPerQuestion || 1);
            const folderCount = (sec.folderRules ?? []).length;
            const isGenerating = generatingSectionId === sec.id;

            return (
              <div key={sec.id} className={cn('rounded-lg border bg-white transition-all', generated ? 'border-green-200' : 'border-slate-200')}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className={cn('shrink-0 px-2 py-0.5 rounded text-[11px] font-bold border', c.bg, c.text, c.border)}>
                    {c.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{sec.name}</div>
                    <div className="text-[10px] text-slate-400 flex flex-wrap gap-2 mt-0.5">
                      <span>{qPerSet}Q/set</span>
                      <span>·</span>
                      <span>{totalMarks}m total</span>
                      {sec.durationMinutes ? <><span>·</span><span>{sec.durationMinutes}min</span></> : null}
                      {sec.passMarks ? <><span>·</span><span>Pass: {String(sec.passMarks)}</span></> : null}
                      <span>·</span>
                      <span>{folderCount} folder{folderCount !== 1 ? 's' : ''}</span>
                      {sec.isMandatory ? null : <><span>·</span><span className="text-amber-500">optional</span></>}
                    </div>
                  </div>
                  {generated ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-[10px] text-green-600 font-medium">{sec.sets?.length} set{sec.sets?.length !== 1 ? 's' : ''}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">not generated</span>
                  )}
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleGenerate(sec)}
                      disabled={isGenerating || folderCount === 0}
                      title={folderCount === 0 ? 'Edit section to add folders first' : 'Generate question sets'}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                      {generated ? 'Re-gen' : 'Generate'}
                    </button>
                    <button
                      onClick={() => openEditForm(sec)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                      title="Edit section"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sec)}
                      className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
                      title="Delete section"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Generated sets preview */}
                {generated && sec.sets && sec.sets.length > 0 && (
                  <div className="border-t border-slate-100 px-4 py-2 flex flex-wrap gap-1.5">
                    {sec.sets.map((s, i) => (
                      <span
                        key={s.id}
                        className={cn(
                          'text-[10px] font-medium px-2 py-0.5 rounded-md border',
                          i % 6 === 0 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          i % 6 === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          i % 6 === 2 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          i % 6 === 3 ? 'bg-violet-50 text-violet-700 border-violet-200' :
                          i % 6 === 4 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-slate-50 text-slate-700 border-slate-200',
                        )}
                      >
                        Set {s.name} · {s._count?.questions ?? 0}Q
                      </span>
                    ))}
                  </div>
                )}

                {/* No-folder warning */}
                {folderCount === 0 && (
                  <div className="border-t border-amber-100 bg-amber-50 px-4 py-2 flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                    <span className="text-[10px] text-amber-800">
                      No folders assigned — edit this section and select source folders for question sampling.
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Progress bar */}
      {sections.length > 0 && !showForm && (
        <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-500">Generation progress</span>
            <span className="font-medium text-slate-900">{generatedCount} / {sections.length} sections done</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${(generatedCount / Math.max(sections.length, 1)) * 100}%` }}
            />
          </div>
          {generatedCount === sections.length && sections.length > 0 && (
            <p className="text-[10px] text-green-600 mt-1.5 font-medium">
              All sections generated — {sections.reduce((t, s) => t + (s.sets?.length ?? 0), 0)} total set(s) ready.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SectionForm ──────────────────────────────────────────────────────────────

function SectionForm({
  form, updateForm, isEditing,
  folderTree, folderTreeLoading, courseId,
  onSave, onCancel,
}: {
  form: SectionFormState;
  updateForm: (patch: Partial<SectionFormState>) => void;
  isEditing: boolean;
  folderTree: FolderTreeNode[];
  folderTreeLoading: boolean;
  courseId?: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const TYPE_OPTIONS = [
    { value: 'MCQ' as const, label: 'MCQ' },
    { value: 'CQ' as const, label: 'Creative (CQ)' },
    { value: 'SHORT' as const, label: 'Short / Written' },
  ];

  return (
    <div className="rounded-xl border-2 border-blue-200 bg-blue-50/30 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-900">{isEditing ? 'Edit section' : 'New section'}</span>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Section name</span>
          <Input
            value={form.name}
            onChange={e => updateForm({ name: e.target.value })}
            placeholder="e.g. MCQ — Physics"
            className="text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Type</span>
          <div className="flex gap-1">
            {TYPE_OPTIONS.map(t => (
              <button
                key={t.value}
                onClick={() => updateForm({ type: t.value })}
                className={cn(
                  'flex-1 py-2 text-xs font-medium rounded-md border transition-all',
                  form.type === t.value ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {form.type === 'MCQ' && (
          <>
            <Field label="Passages">
              <Input type="number" min={0} value={form.mcqPassageCount} onChange={e => updateForm({ mcqPassageCount: +e.target.value || 0 })} className="text-sm" />
            </Field>
            <Field label="Single MCQ">
              <Input type="number" min={0} value={form.mcqSingleCount} onChange={e => updateForm({ mcqSingleCount: +e.target.value || 0 })} className="text-sm" />
            </Field>
          </>
        )}
        {form.type === 'CQ' && (
          <Field label="CQ count">
            <Input type="number" min={1} value={form.cqCount} onChange={e => updateForm({ cqCount: +e.target.value || 1 })} className="text-sm" />
          </Field>
        )}
        {form.type === 'SHORT' && (
          <Field label="Short Q count">
            <Input type="number" min={1} value={form.shortCount} onChange={e => updateForm({ shortCount: +e.target.value || 1 })} className="text-sm" />
          </Field>
        )}
        <Field label="Marks / Q">
          <Input type="number" min={0} step={0.25} value={form.marksPerQuestion} onChange={e => updateForm({ marksPerQuestion: +e.target.value || 0 })} className="text-sm" />
        </Field>
        <Field label="Negative">
          <Input type="number" min={0} step={0.25} value={form.negativeMarks} onChange={e => updateForm({ negativeMarks: +e.target.value || 0 })} className="text-sm" />
        </Field>
        <Field label="Duration (min)">
          <Input type="number" min={0} value={form.durationMinutes} onChange={e => updateForm({ durationMinutes: +e.target.value || 0 })} className="text-sm" />
        </Field>
        <Field label="Pass marks">
          <Input type="number" min={0} step={0.5} value={form.passMarks} onChange={e => updateForm({ passMarks: +e.target.value || 0 })} className="text-sm" />
        </Field>
      </div>

      {/* Folder picker */}
      <div className="mb-3">
        <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400 mb-1.5 block">
          Source folders {!courseId && <span className="normal-case text-amber-600">(save exam basics first to load folders)</span>}
        </span>
        <MiniTreePicker
          tree={folderTree}
          loading={folderTreeLoading}
          selectedFolders={form.selectedFolders}
          onSelectionChange={folders => updateForm({ selectedFolders: folders })}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 accent-blue-500"
            checked={form.isMandatory}
            onChange={e => updateForm({ isMandatory: e.target.checked })}
          />
          Mandatory (student must pass this section)
        </label>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-xs rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-1.5 text-xs font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1.5"
          >
            <Check className="h-3 w-3" />
            {isEditing ? 'Update section' : 'Add section'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-slate-400">{label}</span>
      {children}
    </div>
  );
}

// ─── Mini Folder Tree Picker ──────────────────────────────────────────────────

function MiniTreePicker({
  tree, loading, selectedFolders, onSelectionChange,
}: {
  tree: FolderTreeNode[];
  loading: boolean;
  selectedFolders: Set<string>;
  onSelectionChange: (s: Set<string>) => void;
}) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const roots = new Set<string>();
    tree.forEach(n => { if ((n.children ?? []).length) roots.add(n.id); });
    setExpanded(roots);
  }, [tree]);

  const toggleFolder = (id: string) => {
    const next = new Set(selectedFolders);
    if (next.has(id)) next.delete(id); else next.add(id);
    onSelectionChange(next);
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const q = search.toLowerCase();

  function matchesSearch(node: FolderTreeNode): boolean {
    if (!q) return true;
    if (node.name.toLowerCase().includes(q)) return true;
    return (node.children ?? []).some(matchesSearch);
  }

  function renderNode(node: FolderTreeNode, depth: number): React.ReactNode {
    if (q && !matchesSearch(node)) return null;
    const children = node.children ?? [];
    const isLeaf = children.length === 0;
    const isExpanded = expanded.has(node.id);
    const isSelected = selectedFolders.has(node.id);

    if (isLeaf) {
      const qCount = node.questionCount ?? node.counts?.total ?? 0;
      return (
        <div
          key={node.id}
          className="flex items-center gap-1.5 py-1 px-2 text-xs hover:bg-white cursor-pointer rounded"
          style={{ paddingLeft: 8 + depth * 14 }}
          onClick={() => toggleFolder(node.id)}
        >
          <FileText className="h-2.5 w-2.5 text-slate-400 shrink-0" />
          <span className="flex-1 truncate text-slate-600">{node.name}</span>
          <span className="text-[10px] text-slate-400">{qCount}Q</span>
          <input
            type="checkbox"
            className="w-3 h-3 accent-blue-500 shrink-0"
            checked={isSelected}
            onChange={() => toggleFolder(node.id)}
            onClick={e => e.stopPropagation()}
          />
        </div>
      );
    }

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-1.5 py-1 px-2 text-xs hover:bg-white cursor-pointer rounded"
          style={{ paddingLeft: 4 + depth * 14 }}
          onClick={() => toggleExpand(node.id)}
        >
          <button type="button" className="h-4 w-4 flex items-center justify-center text-slate-400 shrink-0">
            <ChevronRight className={cn('h-2.5 w-2.5 transition-transform', isExpanded && 'rotate-90')} />
          </button>
          <Folder className="h-3 w-3 text-slate-400 shrink-0" />
          <span className="flex-1 truncate font-medium text-slate-700">{node.name}</span>
          <input
            type="checkbox"
            className="w-3 h-3 accent-blue-500 shrink-0"
            checked={isSelected}
            onChange={() => toggleFolder(node.id)}
            onClick={e => e.stopPropagation()}
          />
        </div>
        {isExpanded && children.map(c => renderNode(c, depth + 1))}
      </div>
    );
  }

  const selected = useMemo(() => {
    const result: { id: string; name: string }[] = [];
    function walk(nodes: FolderTreeNode[]) {
      for (const n of nodes) {
        if (selectedFolders.has(n.id)) result.push({ id: n.id, name: n.name });
        if ((n.children ?? []).length) walk(n.children!);
      }
    }
    walk(tree);
    return result;
  }, [tree, selectedFolders]);

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50/50">
      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-slate-200">
        <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <Input
          className="h-7 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
          placeholder="Search folders…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {selected.length > 0 && (
          <button
            type="button"
            className="text-[10px] text-slate-500 hover:text-rose-600 shrink-0"
            onClick={() => onSelectionChange(new Set())}
          >
            Clear
          </button>
        )}
      </div>

      <div className="max-h-56 overflow-y-auto p-1">
        {loading && (
          <div className="flex items-center gap-2 py-6 text-xs text-slate-400 justify-center">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading folders…
          </div>
        )}
        {!loading && tree.length === 0 && (
          <p className="py-6 text-center text-[11px] text-slate-400">
            {!tree.length ? 'No folders found. Ensure a course is selected in Step 1.' : 'No matches.'}
          </p>
        )}
        {!loading && tree.map(n => renderNode(n, 0))}
      </div>

      {selected.length > 0 && (
        <div className="border-t border-slate-100 bg-white px-3 py-1.5 flex flex-wrap gap-1">
          {selected.map(f => (
            <span key={f.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded text-[10px] font-medium text-blue-800">
              {f.name}
              <button className="text-blue-500 hover:text-blue-800" onClick={() => toggleFolder(f.id)}>
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
