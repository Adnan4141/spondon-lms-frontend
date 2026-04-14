'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getExamFolderRules,
  upsertExamFolderRule,
  deleteExamFolderRule,
  generateFromFolders,
  type UpsertExamFolderRuleDto,
  type GenerateFromFoldersDto,
} from '@/lib/api/exams';
import { getQuestionFolders } from '@/lib/api/question-bank';
import type { ExamFolderRule, SelectionMode } from '@/types/exam';
import type { QuestionFolder } from '@/types/question';
import type { ExamSet } from '@/types/exam';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Hand,
  Zap,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface ExamFolderRulesProps {
  examId: string;
  sets?: ExamSet[];
  onGenerated?: () => void;
}

const DIFFICULTY_OPTIONS = ['EASY', 'MEDIUM', 'HARD'];
const QUESTION_TYPE_OPTIONS = [
  { value: 'MCQ', label: 'MCQ' },
  { value: 'CQ', label: 'CQ' },
];

function RuleCard({
  rule,
  onDelete,
  deleting,
}: {
  rule: ExamFolderRule;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const isRandom = rule.selectionMode === 'RANDOM';
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="shrink-0 h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
        <FolderOpen className="h-5 w-5 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-900 text-sm truncate">
            {rule.folder?.name ?? rule.folderId}
          </span>
          {rule.folder?._count && (
            <span className="text-xs text-slate-400">
              ({rule.folder._count.questions} questions)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <Badge
            className={cn(
              'text-[11px] font-black uppercase tracking-wider rounded-full px-2 py-0.5',
              isRandom
                ? 'bg-violet-50 text-violet-700 border-violet-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            )}
          >
            {isRandom ? (
              <><Shuffle className="h-3 w-3 mr-1 inline" />Random</>
            ) : (
              <><Hand className="h-3 w-3 mr-1 inline" />Manual</>
            )}
          </Badge>
          {isRandom && rule.questionCount != null && (
            <Badge className="text-[11px] font-bold bg-slate-100 text-slate-700 border-slate-200 rounded-full px-2 py-0.5">
              Pick {rule.questionCount}
            </Badge>
          )}
          {rule.difficulty && (
            <Badge className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full px-2 py-0.5">
              {rule.difficulty}
            </Badge>
          )}
          {rule.questionTypes && rule.questionTypes.length > 0 && (
            <Badge className="text-[11px] font-bold bg-blue-50 text-blue-700 border-blue-200 rounded-full px-2 py-0.5">
              {rule.questionTypes.join(', ')}
            </Badge>
          )}
          {rule.tags && rule.tags.length > 0 && (
            <Badge className="text-[11px] font-bold bg-pink-50 text-pink-700 border-pink-200 rounded-full px-2 py-0.5">
              {rule.tags.join(', ')}
            </Badge>
          )}
          {rule.isMandatory && (
            <Badge className="text-[11px] font-bold bg-rose-50 text-rose-700 border-rose-200 rounded-full px-2 py-0.5">
              Mandatory
            </Badge>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
        onClick={() => onDelete(rule.id)}
        disabled={deleting}
      >
        {deleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

interface AddRuleFormValues {
  folderId: string;
  selectionMode: SelectionMode;
  questionCount: string;
  difficulty: string;
  questionTypes: string[];
  tags: string;
  isMandatory: boolean;
}

const defaultForm: AddRuleFormValues = {
  folderId: '',
  selectionMode: 'RANDOM',
  questionCount: '',
  difficulty: '',
  questionTypes: [],
  tags: '',
  isMandatory: false,
};

export function ExamFolderRules({ examId, sets = [], onGenerated }: ExamFolderRulesProps) {
  const { toast } = useToast();

  const [rules, setRules] = useState<ExamFolderRule[]>([]);
  const [folders, setFolders] = useState<QuestionFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<AddRuleFormValues>(defaultForm);
  const [saving, setSaving] = useState(false);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState<{
    examSetId: string;
    marks: string;
    negativeMarks: string;
    replaceExisting: boolean;
  }>({ examSetId: '', marks: '1', negativeMarks: '0', replaceExisting: false });
  const [generating, setGenerating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, foldersRes] = await Promise.all([
        getExamFolderRules(examId),
        getQuestionFolders(),
      ]);
      if (rulesRes.success && rulesRes.data) setRules(rulesRes.data);
      if (foldersRes.success && foldersRes.data) setFolders(foldersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteExamFolderRule(examId, id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      toast({ title: 'Rule removed', variant: 'success' });
    } catch {
      toast({ title: 'Failed to remove rule', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddRule = async () => {
    if (!form.folderId) {
      toast({ title: 'Please select a folder', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: UpsertExamFolderRuleDto = {
        folderId: form.folderId,
        selectionMode: form.selectionMode,
        questionCount: form.selectionMode === 'RANDOM' && form.questionCount ? Number(form.questionCount) : null,
        difficulty: form.difficulty || null,
        questionTypes: form.questionTypes.length > 0 ? form.questionTypes : [],
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        isMandatory: form.isMandatory,
      };;
      const res = await upsertExamFolderRule(examId, payload);
      if (res.success && res.data) {
        setRules((prev) => {
          const idx = prev.findIndex((r) => r.folderId === res.data!.folderId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res.data!;
            return next;
          }
          return [...prev, res.data!];
        });
        toast({ title: 'Folder rule saved', variant: 'success' });
        setAddOpen(false);
        setForm(defaultForm);
      } else {
        toast({ title: res.message || 'Failed to save rule', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: err.message || 'Failed to save rule', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!generateForm.examSetId) {
      toast({ title: 'Please select an exam set', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const payload: GenerateFromFoldersDto = {
        examSetId: generateForm.examSetId,
        marks: Number(generateForm.marks) || 1,
        negativeMarks: Number(generateForm.negativeMarks) || 0,
        replaceExisting: generateForm.replaceExisting,
      };
      const res = await generateFromFolders(examId, payload);
      if (res.success) {
        toast({
          title: 'Questions generated',
          description: `${res.data?.generated ?? 0} questions added to the set.`,
          variant: 'success',
        });
        setGenerateOpen(false);
        onGenerated?.();
      } else {
        toast({ title: res.message || 'Generation failed', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: err.message || 'Generation failed', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const toggleQType = (type: string) => {
    setForm((prev) => ({
      ...prev,
      questionTypes: prev.questionTypes.includes(type)
        ? prev.questionTypes.filter((t) => t !== type)
        : [...prev.questionTypes, type],
    }));
  };

  const usedFolderIds = new Set(rules.map((r) => r.folderId));
  const availableFolders = folders.filter((f) => !usedFolderIds.has(f.id) || f.id === form.folderId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Folder Rules</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select question folders and configure how questions are picked for this exam.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="h-8 rounded-xl text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            className="h-8 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            onClick={() => { setForm(defaultForm); setAddOpen(true); }}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Folder
          </Button>
          {rules.filter((r) => r.selectionMode === 'RANDOM').length > 0 && sets.length > 0 && (
            <Button
              size="sm"
              className="h-8 rounded-xl text-xs font-black bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
              onClick={() => setGenerateOpen(true)}
            >
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Generate Questions
            </Button>
          )}
        </div>
      </div>

      {/* Rules list */}
      {rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
          <BookOpen className="h-10 w-10 text-slate-300 mb-3" />
          <p className="font-bold text-slate-500 text-sm">No folder rules yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Add folders to define where questions are pulled from.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onDelete={handleDelete}
              deleting={deletingId === rule.id}
            />
          ))}
        </div>
      )}

      {/* Info about manual rules */}
      {rules.some((r) => r.selectionMode === 'MANUAL') && (
        <div className="flex gap-2 items-start rounded-xl border border-amber-200 bg-amber-50 p-3">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            <span className="font-bold">Manual rules</span> — select specific questions from those
            folders using the Question Builder panel below.
          </p>
        </div>
      )}

      {/* Add Rule Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 uppercase tracking-widest">
              Add Folder Rule
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Folder */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block">
                Question Folder
              </label>
              <Select
                value={form.folderId}
                onValueChange={(v) => setForm((prev) => ({ ...prev, folderId: v }))}
              >
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 font-semibold text-sm text-slate-700">
                  <SelectValue placeholder="Select a folder…" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  {availableFolders.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">
                      All folders already added
                    </div>
                  ) : (
                    availableFolders.map((f) => (
                      <SelectItem key={f.id} value={f.id} className="text-sm">
                        <span className="font-semibold">{f.name}</span>
                        {(f as any)._count?.questions != null && (
                          <span className="ml-2 text-xs text-slate-400">
                            ({(f as any)._count.questions} Qs)
                          </span>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Selection Mode */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block">
                Selection Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['RANDOM', 'MANUAL'] as SelectionMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, selectionMode: mode }))}
                    className={cn(
                      'flex items-center justify-center gap-2 h-11 rounded-xl border-2 font-black text-xs uppercase tracking-wider transition-all',
                      form.selectionMode === mode
                        ? mode === 'RANDOM'
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    )}
                  >
                    {mode === 'RANDOM' ? (
                      <Shuffle className="h-3.5 w-3.5" />
                    ) : (
                      <Hand className="h-3.5 w-3.5" />
                    )}
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count (Random only) */}
            {form.selectionMode === 'RANDOM' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block">
                  Questions to Pick
                </label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 10 (leave empty = all)"
                  value={form.questionCount}
                  onChange={(e) => setForm((prev) => ({ ...prev, questionCount: e.target.value }))}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 font-semibold text-sm"
                />
              </div>
            )}

            {/* Difficulty filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block">
                Difficulty Filter (optional)
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, difficulty: '' }))}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border transition-all',
                    !form.difficulty
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  )}
                >
                  All
                </button>
                {DIFFICULTY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, difficulty: prev.difficulty === d ? '' : d }))}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border transition-all',
                      form.difficulty === d
                        ? d === 'EASY'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : d === 'MEDIUM'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Question type filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block">
                Question Type Filter (optional)
              </label>
              <div className="flex gap-2">
                {QUESTION_TYPE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleQType(value)}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border transition-all',
                      form.questionTypes.includes(value)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block">
                Tags Filter (optional, comma-separated)
              </label>
              <Input
                placeholder="e.g. algebra, chapter-1"
                value={form.tags}
                onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                className="h-11 rounded-xl border-slate-200 bg-slate-50 font-semibold text-sm"
              />
            </div>

            {/* Mandatory toggle */}
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">
              <Checkbox
                checked={form.isMandatory}
                onCheckedChange={(c) => setForm((prev) => ({ ...prev, isMandatory: c === true }))}
              />
              Mandatory subject (students must answer all questions from this folder)
            </label>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              className="rounded-xl font-black text-xs uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRule}
              disabled={saving || !form.folderId}
              className="rounded-xl font-black text-xs uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Save Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Questions Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 uppercase tracking-widest">
              Generate Questions from Folders
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-700">
              <p className="font-bold mb-1">How it works</p>
              <p>
                Questions will be randomly picked from each folder based on the rules you
                configured and added to the selected exam set.
              </p>
            </div>

            {/* Exam Set */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block">
                Target Exam Set
              </label>
              <Select
                value={generateForm.examSetId}
                onValueChange={(v) => setGenerateForm((prev) => ({ ...prev, examSetId: v }))}
              >
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 font-semibold text-sm text-slate-700">
                  <SelectValue placeholder="Select exam set…" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  {sets.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-sm font-semibold">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Marks per question */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block">
                  Marks per Question
                </label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={generateForm.marks}
                  onChange={(e) => setGenerateForm((prev) => ({ ...prev, marks: e.target.value }))}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 font-semibold text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block">
                  Negative Marks
                </label>
                <Input
                  type="number"
                  min={0}
                  step={0.25}
                  value={generateForm.negativeMarks}
                  onChange={(e) =>
                    setGenerateForm((prev) => ({ ...prev, negativeMarks: e.target.value }))
                  }
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 font-semibold text-sm"
                />
              </div>
            </div>

            {/* Replace existing */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <input
                type="checkbox"
                id="replaceExisting"
                checked={generateForm.replaceExisting}
                onChange={(e) =>
                  setGenerateForm((prev) => ({ ...prev, replaceExisting: e.target.checked }))
                }
                className="h-4 w-4 rounded accent-rose-600 cursor-pointer"
              />
              <label htmlFor="replaceExisting" className="text-xs font-bold text-slate-700 cursor-pointer">
                Replace existing questions in this set
                <span className="block font-normal text-slate-400 mt-0.5">
                  Warning: this will delete all current questions in the set.
                </span>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setGenerateOpen(false)}
              className="rounded-xl font-black text-xs uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating || !generateForm.examSetId}
              className="rounded-xl font-black text-xs uppercase tracking-wider bg-violet-600 hover:bg-violet-700 text-white"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Zap className="h-4 w-4 mr-1.5" />
              )}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
