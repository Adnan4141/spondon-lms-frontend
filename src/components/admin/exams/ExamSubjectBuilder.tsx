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

  const totalMarks = subject.questionCount * Number(subject.marksPerQuestion);
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
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="shrink-0 h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm">{subject.name}</span>
            {subject.isMandatory && (
              <Badge className="text-[10px] font-bold bg-rose-50 text-rose-700 border-rose-200 rounded-full px-1.5 py-0">
                Mandatory
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span>{subject.questionCount} Q × {Number(subject.marksPerQuestion)} marks = {totalMarks} marks</span>
            {subject.negativeMarks != null && Number(subject.negativeMarks) > 0 && (
              <span className="text-rose-500">-{Number(subject.negativeMarks)}</span>
            )}
            <span>{rules.length} folder{rules.length !== 1 ? 's' : ''}</span>
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
              <Select value={ruleForm.difficulty} onValueChange={(v) => setRuleForm((f) => ({ ...f, difficulty: v }))}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Any difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-xs">Any</SelectItem>
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
    questionCount: '10',
    marksPerQuestion: '1',
    negativeMarks: '',
    passMarks: '',
    isMandatory: false,
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
      const payload: CreateExamSubjectDto = {
        name: form.name.trim(),
        questionCount: parseInt(form.questionCount) || 10,
        marksPerQuestion: parseFloat(form.marksPerQuestion) || 1,
        negativeMarks: form.negativeMarks ? parseFloat(form.negativeMarks) : undefined,
        passMarks: form.passMarks ? parseFloat(form.passMarks) : undefined,
        isMandatory: form.isMandatory,
        sortOrder: subjects.length,
      };
      const res = await createExamSubject(examId, payload);
      if (res.success) {
        toast({ title: 'Subject added' });
        setForm({ name: '', questionCount: '10', marksPerQuestion: '1', negativeMarks: '', passMarks: '', isMandatory: false });
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

  const totalQuestions = subjects.reduce((s, sub) => s + sub.questionCount, 0);
  const totalMarks = subjects.reduce((s, sub) => s + sub.questionCount * Number(sub.marksPerQuestion), 0);

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
              {subjects.length} subject{subjects.length !== 1 ? 's' : ''} · {totalQuestions} questions · {totalMarks} marks
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Questions</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.questionCount}
                  onChange={(e) => setForm((f) => ({ ...f, questionCount: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Marks per Q</Label>
                <Input
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={form.marksPerQuestion}
                  onChange={(e) => setForm((f) => ({ ...f, marksPerQuestion: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Negative Marks</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.25}
                  value={form.negativeMarks}
                  onChange={(e) => setForm((f) => ({ ...f, negativeMarks: e.target.value }))}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Pass Marks</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.passMarks}
                  onChange={(e) => setForm((f) => ({ ...f, passMarks: e.target.value }))}
                  placeholder="Optional"
                  className="mt-1"
                />
              </div>
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
