'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getExamSubjects,
  createExamSubject,
  updateExamSubject,
  deleteExamSubject,
  upsertSubjectFolderRule,
  deleteSubjectFolderRule,
  validateExamSubjects,
  generateFromSubjects,
  type CreateExamSubjectDto,
  type UpsertSubjectFolderRuleDto,
  type GenerateFromSubjectsDto,
} from '@/lib/api/exams';
import { getQuestionFolders } from '@/lib/api/question-bank';
import type { ExamSubject, ExamSubjectFolderRule, SelectionMode, Difficulty } from '@/types/exam';
import type { QuestionFolder } from '@/types/question';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  BookOpen,
  FolderOpen,
  Plus,
  Trash2,
  Shuffle,
  Zap,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DIFFICULTY_OPTIONS: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

const SUBJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#64748b', '#a16207',
];

interface ExamSubjectBuilderProps {
  examId: string;
  onGenerated?: () => void;
}

// ─── Folder Rule Row ────────────────────────────────────────────────────

function FolderRuleRow({
  rule,
  onDelete,
  deleting,
}: {
  rule: ExamSubjectFolderRule;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
      <FolderOpen className="h-4 w-4 text-indigo-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-slate-800 truncate block">
          {rule.folder?.name ?? rule.folderId}
        </span>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <Badge className="text-[10px] font-bold bg-violet-50 text-violet-700 border-violet-200 rounded-full px-1.5 py-0">
            <Shuffle className="h-2.5 w-2.5 mr-0.5 inline" />
            {rule.selectionMode}
          </Badge>
          <Badge className="text-[10px] font-bold bg-slate-100 text-slate-700 border-slate-200 rounded-full px-1.5 py-0">
            Pick {rule.questionCount}
          </Badge>
          {rule.difficulty && (
            <Badge className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full px-1.5 py-0">
              {rule.difficulty}
            </Badge>
          )}
          {rule.folder?._count && (
            <span className="text-[10px] text-slate-400">
              ({rule.folder._count.questions} avail.)
            </span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
        onClick={() => onDelete(rule.id)}
        disabled={deleting}
      >
        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

// ─── Subject Card ───────────────────────────────────────────────────────

function SubjectCard({
  subject,
  folders,
  examId,
  onRefresh,
}: {
  subject: ExamSubject;
  folders: QuestionFolder[];
  examId: string;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [addingRule, setAddingRule] = useState(false);
  const [ruleForm, setRuleForm] = useState({ folderId: '', questionCount: '5', difficulty: '', selectionMode: 'RANDOM' as SelectionMode });

  const mcqSingle = subject.mcqSingleCount ?? 0;
  const mcqPassage = subject.mcqPassageCount ?? 0;
  const cq = subject.cqCount ?? 0;
  const short = subject.shortCount ?? 0;
  const totalQ = mcqSingle + mcqPassage + cq + short || subject.questionCount;
  const totalMarks = totalQ * Number(subject.marksPerQuestion);
  const rules = subject.folderRules ?? [];

  const handleDeleteSubject = async () => {
    setDeletingSubject(true);
    try {
      await deleteExamSubject(examId, subject.id);
      toast({ title: 'Subject deleted' });
      onRefresh();
    } catch {
      toast({ title: 'Failed to delete subject', variant: 'destructive' });
    } finally {
      setDeletingSubject(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    setDeletingRuleId(ruleId);
    try {
      await deleteSubjectFolderRule(examId, subject.id, ruleId);
      toast({ title: 'Folder rule removed' });
      onRefresh();
    } catch {
      toast({ title: 'Failed to delete rule', variant: 'destructive' });
    } finally {
      setDeletingRuleId(null);
    }
  };

  const handleAddRule = async () => {
    if (!ruleForm.folderId) return;
    setAddingRule(true);
    try {
      const payload: UpsertSubjectFolderRuleDto = {
        folderId: ruleForm.folderId,
        questionCount: parseInt(ruleForm.questionCount) || 5,
        difficulty: (ruleForm.difficulty || undefined) as Difficulty | undefined,
        selectionMode: ruleForm.selectionMode,
      };
      await upsertSubjectFolderRule(examId, subject.id, payload);
      toast({ title: 'Folder rule added' });
      setRuleForm({ folderId: '', questionCount: '5', difficulty: '', selectionMode: 'RANDOM' });
      onRefresh();
    } catch {
      toast({ title: 'Failed to add folder rule', variant: 'destructive' });
    } finally {
      setAddingRule(false);
    }
  };

  // Exclude already-used folder IDs
  const usedFolderIds = new Set(rules.map((r) => r.folderId));
  const availableFolders = folders.filter((f) => !usedFolderIds.has(f.id));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ borderLeftColor: subject.color ?? undefined, borderLeftWidth: subject.color ? 3 : undefined }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div
          className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: subject.color ? `${subject.color}20` : '#eef2ff' }}
        >
          <BookOpen className="h-5 w-5" style={{ color: subject.color ?? '#6366f1' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm">{subject.name}</span>
            {subject.isMandatory && (
              <Badge className="text-[10px] font-bold bg-rose-50 text-rose-700 border-rose-200 rounded-full px-1.5 py-0">
                Mandatory
              </Badge>
            )}
            {subject.timeLimitMinutes != null && (
              <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 rounded-full px-1.5 py-0">
                {subject.timeLimitMinutes}min
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
            {mcqSingle > 0 && <span>{mcqSingle} MCQ-S</span>}
            {mcqPassage > 0 && <span>{mcqPassage} MCQ-P</span>}
            {cq > 0 && <span>{cq} CQ</span>}
            {short > 0 && <span>{short} Short</span>}
            {(mcqSingle + mcqPassage + cq + short === 0) && <span>{subject.questionCount} Q</span>}
            <span>× {Number(subject.marksPerQuestion)} = <span className="font-medium text-slate-700">{totalMarks} marks</span></span>
            {subject.negativeMarks != null && Number(subject.negativeMarks) > 0 && (
              <span className="text-rose-500">−{Number(subject.negativeMarks)}/wrong</span>
            )}
            {subject.passMarks != null && (
              <span className="text-blue-500">cutoff: {Number(subject.passMarks)}</span>
            )}
            <span className="text-slate-400">{rules.length} folder{rules.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
          onClick={(e) => { e.stopPropagation(); handleDeleteSubject(); }}
          disabled={deletingSubject}
        >
          {deletingSubject ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-3">
          {/* Existing folder rules */}
          {rules.length > 0 ? (
            <div className="space-y-2">
              {rules.map((rule) => (
                <FolderRuleRow
                  key={rule.id}
                  rule={rule}
                  onDelete={handleDeleteRule}
                  deleting={deletingRuleId === rule.id}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
              <AlertCircle className="h-4 w-4" />
              No folder rules yet — add at least one to source questions.
            </div>
          )}

          {/* Add folder rule form */}
          <div className="rounded-xl border border-dashed border-slate-200 p-3 space-y-3 bg-slate-50/50">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add Folder Source</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Select value={ruleForm.folderId} onValueChange={(v) => setRuleForm((f) => ({ ...f, folderId: v }))}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  {availableFolders.map((f) => (
                    <SelectItem key={f.id} value={f.id} className="text-xs">
                      {f.name} ({f._count?.questions ?? 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={1}
                value={ruleForm.questionCount}
                onChange={(e) => setRuleForm((f) => ({ ...f, questionCount: e.target.value }))}
                placeholder="Pick count"
                className="h-9 text-xs"
              />
              <Select value={ruleForm.difficulty || '__any__'} onValueChange={(v) => setRuleForm((f) => ({ ...f, difficulty: v === '__any__' ? '' : v }))}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Any difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__any__" className="text-xs">Any</SelectItem>
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" className="h-9 text-xs" onClick={handleAddRule} disabled={addingRule || !ruleForm.folderId}>
                {addingRule ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export function ExamSubjectBuilder({ examId, onGenerated }: ExamSubjectBuilderProps) {
  const { toast } = useToast();

  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [folders, setFolders] = useState<QuestionFolder[]>([]);
  const [loading, setLoading] = useState(true);

  // Add subject dialog
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    mcqSingleCount: '10',
    mcqPassageCount: '0',
    cqCount: '0',
    shortCount: '0',
    marksPerQuestion: '1',
    negativeMarks: '0.25',
    passMarks: '',
    isMandatory: false,
    color: SUBJECT_COLORS[0],
    timeLimitMinutes: '',
  });
  const [saving, setSaving] = useState(false);

  // Generate dialog
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genForm, setGenForm] = useState({ setCount: '1', language: 'bn' as 'bn' | 'en', replaceExisting: true });
  const [generating, setGenerating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[]; warnings: string[] } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [subjectsRes, foldersRes] = await Promise.all([
        getExamSubjects(examId),
        getQuestionFolders(),
      ]);
      if (subjectsRes.success && subjectsRes.data) setSubjects(subjectsRes.data);
      if (foldersRes.success && foldersRes.data) setFolders(foldersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddSubject = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const mcqS = parseInt(form.mcqSingleCount) || 0;
      const mcqP = parseInt(form.mcqPassageCount) || 0;
      const cq = parseInt(form.cqCount) || 0;
      const short = parseInt(form.shortCount) || 0;
      const payload: CreateExamSubjectDto = {
        name: form.name.trim(),
        questionCount: mcqS + mcqP + cq + short,
        mcqSingleCount: mcqS,
        mcqPassageCount: mcqP,
        cqCount: cq,
        shortCount: short,
        marksPerQuestion: parseFloat(form.marksPerQuestion) || 1,
        negativeMarks: form.negativeMarks ? parseFloat(form.negativeMarks) : undefined,
        passMarks: form.passMarks ? parseFloat(form.passMarks) : undefined,
        isMandatory: form.isMandatory,
        color: form.color || undefined,
        timeLimitMinutes: form.timeLimitMinutes ? parseInt(form.timeLimitMinutes) : undefined,
        sortOrder: subjects.length,
      };
      const res = await createExamSubject(examId, payload);
      if (res.success) {
        toast({ title: 'Subject added' });
        setForm({ name: '', mcqSingleCount: '10', mcqPassageCount: '0', cqCount: '0', shortCount: '0', marksPerQuestion: '1', negativeMarks: '0.25', passMarks: '', isMandatory: false, color: SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length], timeLimitMinutes: '' });
        setAddOpen(false);
        loadData();
      } else {
        toast({ title: res.message || 'Failed to add subject', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to add subject', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    const sc = parseInt(genForm.setCount) || 1;
    const res = await validateExamSubjects(examId, sc);
    if (res.success && res.data) {
      setValidationResult(res.data);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const payload: GenerateFromSubjectsDto = {
        setCount: parseInt(genForm.setCount) || 1,
        language: genForm.language,
        replaceExisting: genForm.replaceExisting,
      };
      const res = await generateFromSubjects(examId, payload);
      if (res.success) {
        toast({ title: 'Paper generated successfully!' });
        setGenerateOpen(false);
        setValidationResult(null);
        onGenerated?.();
      } else {
        toast({ title: res.message || 'Generation failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Generation failed', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const totalQuestions = subjects.reduce((s, sub) => {
    const typed = (sub.mcqSingleCount ?? 0) + (sub.mcqPassageCount ?? 0) + (sub.cqCount ?? 0) + (sub.shortCount ?? 0);
    return s + (typed || sub.questionCount);
  }, 0);
  const totalMarks = subjects.reduce((s, sub) => {
    const typed = (sub.mcqSingleCount ?? 0) + (sub.mcqPassageCount ?? 0) + (sub.cqCount ?? 0) + (sub.shortCount ?? 0);
    return s + (typed || sub.questionCount) * Number(sub.marksPerQuestion);
  }, 0);
  const totalTimeMins = subjects.reduce((s, sub) => s + (sub.timeLimitMinutes ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Exam Subjects</h3>
          {subjects.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {subjects.length} subject{subjects.length !== 1 ? 's' : ''} · {totalQuestions} Q · {totalMarks} marks
              {totalTimeMins > 0 && ` · ${totalTimeMins} min total`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Subject
          </Button>
          {subjects.length > 0 && (
            <Button size="sm" onClick={() => { setGenerateOpen(true); setValidationResult(null); }}>
              <Zap className="h-4 w-4 mr-1" /> Generate Paper
            </Button>
          )}
        </div>
      </div>

      {/* Live total strip */}
      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs">
          <span className="text-slate-500">Total:</span>
          <span className="font-semibold text-slate-800">{totalQuestions} Questions</span>
          <span className="text-slate-300">·</span>
          <span className="font-semibold text-slate-800">{totalMarks} Marks</span>
          {totalTimeMins > 0 && (
            <>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-slate-800">{totalTimeMins} min</span>
            </>
          )}
          {subjects.some(s => s.passMarks != null) && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-blue-600">cutoffs configured</span>
            </>
          )}
        </div>
      )}

      {/* Subject list */}
      {subjects.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
          <Settings2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No subjects configured yet.</p>
          <p className="text-xs text-slate-400 mt-1">Add subjects and configure folder rules to auto-generate exam papers.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map((sub) => (
            <SubjectCard key={sub.id} subject={sub} folders={folders} examId={examId} onRefresh={loadData} />
          ))}
        </div>
      )}

      {/* Add Subject Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-bold">Subject Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Physics, বাংলা"
                className="mt-1"
              />
            </div>

            {/* Color picker */}
            <div>
              <Label className="text-xs font-bold">Color</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {SUBJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn('h-6 w-6 rounded-full border-2 transition-all', form.color === c ? 'border-slate-800 scale-110' : 'border-transparent')}
                    style={{ backgroundColor: c }}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                  />
                ))}
              </div>
            </div>

            {/* Per-type question counts */}
            <div>
              <Label className="text-xs font-bold">Question Counts by Type</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {[
                  { key: 'mcqSingleCount', label: 'MCQ-S' },
                  { key: 'mcqPassageCount', label: 'MCQ-P' },
                  { key: 'cqCount', label: 'CQ' },
                  { key: 'shortCount', label: 'Short' },
                ].map(({ key, label }) => (
                  <div key={key} className="text-center">
                    <div className="text-[10px] text-slate-500 mb-1">{label}</div>
                    <Input
                      type="number"
                      min={0}
                      value={(form as any)[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="h-8 text-center text-sm px-1"
                    />
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Total: {(parseInt(form.mcqSingleCount)||0) + (parseInt(form.mcqPassageCount)||0) + (parseInt(form.cqCount)||0) + (parseInt(form.shortCount)||0)} questions
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs font-bold">Marks/Q</Label>
                <Input
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={form.marksPerQuestion}
                  onChange={(e) => setForm((f) => ({ ...f, marksPerQuestion: e.target.value }))}
                  className="mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Negative</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.25}
                  value={form.negativeMarks}
                  onChange={(e) => setForm((f) => ({ ...f, negativeMarks: e.target.value }))}
                  placeholder="0.25"
                  className="mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Cutoff marks</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.passMarks}
                  onChange={(e) => setForm((f) => ({ ...f, passMarks: e.target.value }))}
                  placeholder="None"
                  className="mt-1 h-8"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold">Time limit (minutes, optional)</Label>
              <Input
                type="number"
                min={1}
                value={form.timeLimitMinutes}
                onChange={(e) => setForm((f) => ({ ...f, timeLimitMinutes: e.target.value }))}
                placeholder="e.g. 30"
                className="mt-1 h-8"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSubject} disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Add Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Paper Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Paper from Subjects</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Number of Sets</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={genForm.setCount}
                  onChange={(e) => setGenForm((f) => ({ ...f, setCount: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Language</Label>
                <Select value={genForm.language} onValueChange={(v) => setGenForm((f) => ({ ...f, language: v as 'bn' | 'en' }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bn">বাংলা</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {validationResult && (
              <div className={cn(
                'rounded-xl p-3 text-sm',
                validationResult.valid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              )}>
                {validationResult.valid ? (
                  <p className="font-medium">✓ Validation passed — ready to generate!</p>
                ) : (
                  <div className="space-y-1">
                    <p className="font-medium">✗ Validation failed:</p>
                    <ul className="list-disc list-inside text-xs space-y-0.5">
                      {validationResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleValidate}>
              Validate
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
