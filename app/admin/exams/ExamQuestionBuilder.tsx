'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  addQuestionsToSet,
  removeQuestionFromSet,
  createExamSet,
  deleteExamSet,
  getExams,
  getExamById,
  importQuestionsFromExamSet,
  generateSetPdf,
  getExamPdfDownloadUrl,
} from '@/lib/api/exams';
import { getQuestionFolders } from '@/lib/api/question-bank';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Printer, Loader2, FolderInput, Wand2, PencilLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Exam, ExamSet, ExamQuestion } from '@/types/exam';
import type { QuestionFolder } from '@/types/question';
import { OfflineExamSheet } from './OfflineExamSheet';

export interface ExamQuestionBuilderProps {
  examId: string;
  exam: Exam;
  sets: ExamSet[];
  onRefresh: () => void | Promise<void>;
}

function stripHtml(html: string | undefined): string {
  return (html ?? '').replace(/<[^>]+>/g, '').trim();
}

export function ExamQuestionBuilder({ examId, exam, sets, onRefresh }: ExamQuestionBuilderProps) {
  const { toast } = useToast();

  const [folders, setFolders] = useState<QuestionFolder[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>(sets[0]?.id ?? '');
  const [newSetName, setNewSetName] = useState('');

  const [folderId, setFolderId] = useState('');
  const [useDistribution, setUseDistribution] = useState(false);
  const [count, setCount] = useState<number>(0);
  const [cqCount, setCqCount] = useState<number>(0);
  const [mcqSingleCount, setMcqSingleCount] = useState<number>(0);
  const [mcqPassageCount, setMcqPassageCount] = useState<number>(0);
  const [marks, setMarks] = useState(1);

  const [pdfLoadingSetId, setPdfLoadingSetId] = useState<string | null>(null);
  const [offlineSheetSet, setOfflineSheetSet] = useState<ExamSet | null>(null);

  const [autoSetCount, setAutoSetCount] = useState<number>(1);

  const [builderMode, setBuilderMode] = useState<'manual' | 'auto'>('manual');

  const [importOpen, setImportOpen] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [otherExams, setOtherExams] = useState<Exam[]>([]);
  const [sourceExamId, setSourceExamId] = useState('');
  const [sourceExamDetail, setSourceExamDetail] = useState<Exam | null>(null);
  const [sourceSetId, setSourceSetId] = useState('');
  const [importSelectedIds, setImportSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getQuestionFolders(exam.courseId || undefined).then((res) => {
      if (res.success) setFolders(res.data || []);
    });
  }, [exam.courseId]);

  useEffect(() => {
    const ids = new Set(sets.map((s) => s.id));
    if (selectedSetId && ids.has(selectedSetId)) return;
    setSelectedSetId(sets[0]?.id ?? '');
  }, [sets, selectedSetId]);

  const refresh = useCallback(async () => {
    await onRefresh();
  }, [onRefresh]);

  const requestedCount = useDistribution
    ? cqCount + mcqSingleCount + mcqPassageCount
    : count;
  const defaultBaseSetName = useMemo(() => {
    const used = new Set((sets || []).map((s) => s.name?.trim()).filter(Boolean));
    for (let i = 0; i < 26; i++) {
      const candidate = String.fromCharCode(65 + i); // A, B, C...
      if (!used.has(candidate)) return candidate;
    }
    return `Set ${sets.length + 1}`;
  }, [sets]);

  const canAddQuestions =
    (builderMode === 'auto' || Boolean(selectedSetId)) &&
    Boolean(folderId) &&
    Number.isFinite(marks) &&
    marks > 0 &&
    Number.isFinite(requestedCount) &&
    requestedCount > 0;

  const handleCreateSet = async () => {
    if (!newSetName.trim()) return;
    const res = await createExamSet({ examId, name: newSetName.trim() });
    if (res.success) {
      toast({ title: 'Set created' });
      setNewSetName('');
      await refresh();
    } else {
      toast({ title: 'Could not create set', description: res.message, variant: 'destructive' });
    }
  };

  const handleAddQuestions = async () => {
    if (!folderId) {
      toast({ title: 'Select a folder', variant: 'destructive' });
      return;
    }

    if (!Number.isFinite(marks) || marks <= 0) {
      toast({ title: 'Enter valid marks', description: 'Marks per question must be greater than 0.', variant: 'destructive' });
      return;
    }

    if (!Number.isFinite(requestedCount) || requestedCount <= 0) {
      toast({
        title: 'Enter question count',
        description: useDistribution ? 'Set at least one type count.' : 'Question count must be greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    let baseSetId = selectedSetId;
    // In auto mode, allow generating sets without pre-selecting: create a base set on the fly
    if (builderMode === 'auto' && !baseSetId) {
      const createRes = await createExamSet({ examId, name: defaultBaseSetName });
      if (!createRes.success || !createRes.data?.id) {
        toast({ title: 'Could not create base set', description: createRes.message, variant: 'destructive' });
        return;
      }
      baseSetId = createRes.data.id;
      setSelectedSetId(baseSetId);
    }

    if (!baseSetId) {
      toast({ title: 'Select or create a set', variant: 'destructive' });
      return;
    }

    const res = await addQuestionsToSet({
      examSetId: baseSetId,
      folderId,
      count: !useDistribution ? count : undefined,
      autoSetCount: builderMode === 'auto' ? Math.max(1, autoSetCount) : 1,
      cqCount: useDistribution ? cqCount : undefined,
      mcqSingleCount: useDistribution ? mcqSingleCount : undefined,
      mcqPassageCount: useDistribution ? mcqPassageCount : undefined,
      marks,
    });

    if (res.success) {
      const added = res.data?.addedCount ?? 0;
      const skipped = res.data?.skippedDuplicates ?? 0;
      const generatedSetCount = res.data?.generatedSetCount ?? 1;
      toast({
        title: 'Questions processed',
        description:
          generatedSetCount > 1
            ? `Generated ${generatedSetCount} sets · added ${added}, skipped ${skipped} duplicate(s).`
            : skipped > 0
              ? `Added ${added}, skipped ${skipped} duplicate(s).`
              : `Added ${added} question(s).`,
      });
      await refresh();
    } else {
      toast({ title: 'Could not add questions', description: res.message, variant: 'destructive' });
    }
  };

  const handleRemove = async (id: string) => {
    if (
      !window.confirm(
        'Remove this question from the current set? The question remains in the question bank.',
      )
    ) {
      return;
    }
    try {
      const res = await removeQuestionFromSet(id);
      if (res.success) {
        toast({ title: 'Removed from set', description: 'The question was removed from this exam set.' });
        await refresh();
      } else {
        toast({
          title: 'Could not remove question',
          description: res.message || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast({
        title: 'Could not remove question',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSet = async (e: React.MouseEvent, setId: string, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`Delete set "${name}"? Questions in this set will be unlinked.`)) return;
    const res = await deleteExamSet(setId);
    if (res.success) {
      toast({ title: 'Set deleted' });
      if (selectedSetId === setId) setSelectedSetId('');
      await refresh();
    } else {
      toast({ title: 'Could not delete set', description: res.message, variant: 'destructive' });
    }
  };

  const handlePrintSet = async (e: React.MouseEvent, set: ExamSet) => {
    e.stopPropagation();
    if (exam.mode === 'OFFLINE') {
      setOfflineSheetSet(set);
      return;
    }
    setPdfLoadingSetId(set.id);
    try {
      const res = await generateSetPdf(examId, set.id, 2);
      if (res.success && res.data?.pdfUrl) {
        window.open(getExamPdfDownloadUrl(res.data.pdfUrl), '_blank', 'noopener,noreferrer');
        toast({ title: 'PDF ready' });
      } else {
        toast({
          title: 'Could not generate PDF',
          description: res.message,
          variant: 'destructive',
        });
      }
    } finally {
      setPdfLoadingSetId(null);
    }
  };

  const openImport = async () => {
    setImportOpen(true);
    setSourceExamId('');
    setSourceExamDetail(null);
    setSourceSetId('');
    setImportSelectedIds(new Set());
    const res = await getExams({ courseId: exam.courseId, limit: 80 });
    if (res.success && res.data) {
      setOtherExams(res.data.filter((x) => x.id !== examId));
    } else {
      setOtherExams([]);
    }
  };

  const onSourceExamChange = async (id: string) => {
    setSourceExamId(id);
    setSourceSetId('');
    setImportSelectedIds(new Set());
    if (!id) {
      setSourceExamDetail(null);
      return;
    }
    const res = await getExamById(id);
    if (res.success && res.data) {
      setSourceExamDetail(res.data);
    } else {
      setSourceExamDetail(null);
      toast({ title: 'Could not load exam', description: res.message, variant: 'destructive' });
    }
  };

  const sourceQuestions = useMemo(() => {
    const s = sourceExamDetail?.sets?.find((x) => x.id === sourceSetId);
    return s?.questions ?? [];
  }, [sourceExamDetail, sourceSetId]);

  const setImportIdChecked = (qid: string, checked: boolean) => {
    setImportSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(qid);
      else next.delete(qid);
      return next;
    });
  };

  const runImport = async () => {
    if (!selectedSetId || !sourceExamId || !sourceSetId) {
      toast({ title: 'Select source exam and set', variant: 'destructive' });
      return;
    }
    setImportBusy(true);
    try {
      const ids = importSelectedIds.size ? Array.from(importSelectedIds) : undefined;
      const res = await importQuestionsFromExamSet(examId, selectedSetId, {
        sourceExamId,
        sourceSetId,
        questionIds: ids,
      });
      if (res.success && res.data) {
        toast({
          title: 'Import finished',
          description: `Added ${res.data.added}, skipped ${res.data.skipped}.`,
        });
        setImportOpen(false);
        await refresh();
      } else {
        toast({ title: 'Import failed', description: res.message, variant: 'destructive' });
      }
    } finally {
      setImportBusy(false);
    }
  };

  const currentSet = sets.find((s) => s.id === selectedSetId);
  const sortedQuestions = useMemo(() => {
    const list = [...(currentSet?.questions ?? [])];
    list.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    return list;
  }, [currentSet?.questions]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Question sets</h2>
          <Button type="button" variant="outline" size="sm" onClick={openImport} disabled={!selectedSetId}>
            <FolderInput className="mr-1.5 h-4 w-4" />
            Import
          </Button>
        </div>

        <div className="space-y-2">
          {sets.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
              No sets yet. Create one below.
            </p>
          ) : (
            sets.map((s) => {
              const active = s.id === selectedSetId;
              return (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedSetId(s.id)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault();
                      setSelectedSetId(s.id);
                    }
                  }}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-3 transition-colors',
                    active ? 'bg-indigo-600 text-white' : 'bg-card hover:bg-muted/50',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className={cn(active && 'text-white hover:bg-white/15')}
                      title={exam.mode === 'OFFLINE' ? 'Offline sheet' : 'Download PDF'}
                      disabled={pdfLoadingSetId === s.id}
                      onClick={(e) => handlePrintSet(e, s)}
                    >
                      {pdfLoadingSetId === s.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Printer className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className={cn(active && 'text-white hover:bg-white/15')}
                      title="Delete set"
                      onClick={(e) => handleDeleteSet(e, s.id, s.name)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-2 border-t pt-4">
          <Label className="text-xs text-muted-foreground">New set</Label>
          <Input
            placeholder="Set name"
            value={newSetName}
            onChange={(e) => setNewSetName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateSet()}
          />
          <Button type="button" onClick={handleCreateSet} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
            Create set
          </Button>
        </div>
      </div>

      <div className="space-y-6 lg:col-span-2">

        {/* ── Mode toggle ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={() => setBuilderMode('manual')}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors',
              builderMode === 'manual'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-600 text-white hover:bg-slate-700',
            )}
          >
            <PencilLine className="h-4 w-4 shrink-0" />
            Manual — add to set
          </button>
          <button
            type="button"
            onClick={() => setBuilderMode('auto')}
            className={cn(
              'flex items-center justify-center gap-2 border-l border-slate-200 px-4 py-3 text-sm font-semibold transition-colors',
              builderMode === 'auto'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-600 text-white hover:bg-slate-700',
            )}
          >
            <Wand2 className="h-4 w-4 shrink-0" />
            Auto-generate N sets
          </button>
        </div>

        {/* ── Shared folder + count inputs ────────────────────────────── */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          {builderMode === 'manual' ? (
            <div>
              <h2 className="mb-1 font-semibold text-slate-800">Add to selected set</h2>
              <p className="text-xs text-slate-400">
                Questions are appended to{' '}
                <span className="font-bold text-indigo-600">{currentSet?.name ?? '—'}</span>.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="mb-1 font-semibold text-slate-800">Auto-generate N sets</h2>
              <p className="text-xs text-slate-400">
                Picks the same question pool and distributes it into{' '}
                <span className="font-bold text-indigo-600">{Math.max(1, autoSetCount)} set{autoSetCount > 1 ? 's' : ''}</span>{' '}
                with single-letter names (A, B, C…). Skips existing letters.
              </p>
            </div>
          )}

          {/* Folder */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Question folder</Label>
            <Select value={folderId} onValueChange={setFolderId}>
              <SelectTrigger className="rounded-lg border-slate-200">
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Count mode toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pick method</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="default"
                size="sm"
                className={cn('rounded-lg text-white', !useDistribution ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-600 hover:bg-slate-700')}
                onClick={() => setUseDistribution(false)}
              >
                Random count
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                className={cn('rounded-lg text-white', useDistribution ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-600 hover:bg-slate-700')}
                onClick={() => setUseDistribution(true)}
              >
                By type
              </Button>
            </div>
          </div>

          {/* Count inputs */}
          {!useDistribution ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">How many questions</Label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 30"
                value={Number.isNaN(count) ? '' : count || ''}
                onChange={(e) => setCount(e.target.value === '' ? 0 : +e.target.value)}
                className="rounded-lg border-slate-200"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Question distribution</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-400">CQ</Label>
                  <Input type="number" min={0} placeholder="0" value={cqCount || ''}
                    onChange={(e) => setCqCount(e.target.value === '' ? 0 : +e.target.value)}
                    className="rounded-lg border-slate-200" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-400">MCQ single</Label>
                  <Input type="number" min={0} placeholder="0" value={mcqSingleCount || ''}
                    onChange={(e) => setMcqSingleCount(e.target.value === '' ? 0 : +e.target.value)}
                    className="rounded-lg border-slate-200" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-400">Passage</Label>
                  <Input type="number" min={0} placeholder="0" value={mcqPassageCount || ''}
                    onChange={(e) => setMcqPassageCount(e.target.value === '' ? 0 : +e.target.value)}
                    className="rounded-lg border-slate-200" />
                </div>
              </div>
            </div>
          )}

          {/* Marks */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Marks per question</Label>
            <Input
              type="number"
              min={0}
              step={0.5}
              value={marks}
              onChange={(e) => setMarks(+e.target.value)}
              className="rounded-lg border-slate-200"
            />
          </div>

          {/* Auto-mode only: N sets */}
          {builderMode === 'auto' && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500">Auto-generate options</h3>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Number of sets (N)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={26}
                  placeholder="e.g. 3"
                  value={autoSetCount || ''}
                  onChange={(e) => setAutoSetCount(e.target.value === '' ? 1 : Math.max(1, Math.min(26, +e.target.value)))}
                  className="rounded-lg border-indigo-200 bg-white"
                />
                <p className="text-[10px] text-slate-400">
                  Creates sets named <span className="font-semibold">A</span>,{' '}
                  <span className="font-semibold">B</span>,{' '}
                  <span className="font-semibold">C</span>… (max 26). Skips existing letters.
                </p>
              </div>

              <div className="rounded-lg border border-indigo-100 bg-white px-3 py-2.5">
                <p className="text-xs font-semibold text-slate-700">✨ Questions are automatically shuffled per set</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Each set gets a unique randomized question order</p>
              </div>
            </div>
          )}

          {/* Summary pill */}
          <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-500">
            <span>
              {builderMode === 'auto'
                ? `${Math.max(1, autoSetCount)} set${autoSetCount > 1 ? 's' : ''} × ${Math.max(0, requestedCount)} question${requestedCount !== 1 ? 's' : ''}`
                : `${Math.max(0, requestedCount)} question${requestedCount !== 1 ? 's' : ''} → ${currentSet?.name ?? '—'}`}
            </span>
            <span className="font-semibold text-slate-400">
              {marks} mark{marks !== 1 ? 's' : ''} each
            </span>
          </div>

          <Button
            type="button"
            onClick={handleAddQuestions}
            className={cn(
              'w-full font-semibold',
              builderMode === 'auto'
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white',
            )}
            disabled={!canAddQuestions}
          >
            {builderMode === 'auto'
              ? <><Wand2 className="mr-2 h-4 w-4" />Generate {Math.max(1, autoSetCount)} set{autoSetCount > 1 ? 's' : ''}</>
              : <><PencilLine className="mr-2 h-4 w-4" />Add to {currentSet?.name ?? 'set'}</>}
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border">
          <div className="border-b bg-muted/30 px-4 py-3 font-semibold">
            Questions {currentSet ? `· ${currentSet.name}` : ''}
          </div>

          {sortedQuestions.length ? (
            <ul className="divide-y">
              {sortedQuestions.map((q: ExamQuestion, i: number) => (
                <li
                  key={q.id}
                  className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/30"
                >
                  <div className="flex min-w-0 flex-1 gap-3">
                    <span className="shrink-0 tabular-nums text-muted-foreground">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{stripHtml(q.question?.prompt)}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {q.question?.type} · {q.marks} marks
                        </span>
                        {q.sectionKey ? (
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {q.sectionKey}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => handleRemove(q.id)}
                    title="Remove from set"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              {selectedSetId ? 'No questions in this set yet.' : 'Select or create a set.'}
            </div>
          )}
        </div>
      </div>

      {offlineSheetSet ? (
        <OfflineExamSheet exam={exam} set={offlineSheetSet} onClose={() => setOfflineSheetSet(null)} />
      ) : null}

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import questions from another exam</DialogTitle>
            <DialogDescription>
              Copies into the currently selected set: <strong>{currentSet?.name ?? '—'}</strong>. Leave none
              checked to import all from the source set.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Source exam</Label>
              <Select value={sourceExamId} onValueChange={onSourceExamChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose exam" />
                </SelectTrigger>
                <SelectContent>
                  {otherExams.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id}>
                      {ex.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {sourceExamDetail ? (
              <div className="space-y-2">
                <Label>Source set</Label>
                <Select value={sourceSetId} onValueChange={setSourceSetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose set" />
                  </SelectTrigger>
                  <SelectContent>
                    {(sourceExamDetail.sets ?? []).map((st) => (
                      <SelectItem key={st.id} value={st.id}>
                        {st.name} ({st.questions?.length ?? 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {sourceQuestions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Optional: pick specific questions (otherwise all in the set are considered).
                </p>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">
                  {sourceQuestions.map((eq) => {
                    const qid = eq.questionId;
                    return (
                      <label
                        key={eq.id}
                        className="flex cursor-pointer items-start gap-2 rounded px-1 py-1 text-sm hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={importSelectedIds.has(qid)}
                          onCheckedChange={(c) => setImportIdChecked(qid, c === true)}
                        />
                        <span className="line-clamp-2">{stripHtml(eq.question?.prompt)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setImportOpen(false)} className="text-white bg-slate-600 hover:bg-slate-700 border-slate-600">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={runImport}
              disabled={importBusy || !sourceExamId || !sourceSetId || !selectedSetId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {importBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
