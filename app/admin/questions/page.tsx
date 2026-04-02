'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  getQuestionFolders,
  getQuestions,
  deleteQuestion,
  getPassages,
  deleteQuestionFolder,
  copyQuestion,
  bulkCopyQuestions,
  bulkDeleteQuestions,
  deletePassage,
  copyPassage,
} from '@/lib/api/question-bank';
import { getCourses } from '@/lib/api/courses';
import type { Question, QuestionFolder, Difficulty, McqPassage } from '@/types/question';
import type { Course } from '@/types/course';
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
  ChevronDown,
  ChevronUp,
  Edit,
  Folder,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Home,
  ChevronRight,
  ChevronLeft,
  FolderPlus,
  Trash2,
  Copy,
  Eye,
  FileQuestion,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { FolderForm } from '@/components/admin/questions/FolderForm';
import { PassageForm } from '@/components/admin/questions/PassageForm';
import { QuestionForm } from '@/components/admin/questions/QuestionForm';
import { CqForm } from '@/components/admin/questions/CqForm';
import { SingleQuestionForm } from '@/components/admin/questions/SingleQuestionForm';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ─── constants ───────────────────────────────────────────────────────────────

const difficultyOptions: (Difficulty | 'all')[] = ['all', 'EASY', 'MEDIUM', 'HARD'];

const TABS = [
  { id: 'MCQ', label: 'MCQs', short: 'MCQ' },
  { id: 'COMBINED', label: 'Combined MCQs', short: 'Combined' },
  { id: 'CQ', label: 'Creative Questions', short: 'CQ' },
  { id: 'SINGLE', label: 'Short Questions', short: 'Short' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ─── helpers ─────────────────────────────────────────────────────────────────

function difficultyClass(d: string) {
  if (d === 'EASY') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (d === 'MEDIUM') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (d === 'HARD') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

function typeClass(type: string, isSingle = false) {
  if (isSingle) return 'bg-violet-50 text-violet-700 border-violet-200';
  if (type === 'CQ') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-indigo-50 text-indigo-700 border-indigo-200';
}

function stripHtml(html: string) {
  return html ? html.replace(/<[^>]+>/g, '') : '';
}

/** Whole passages where every child is selected vs remaining question ids (standalone or partial passage). */
function partitionPassagesForSelection(
  passages: McqPassage[],
  selectedIds: Set<string>,
): { wholePassageIds: string[]; questionIdsOnly: string[] } {
  const ids = new Set(selectedIds);
  const wholePassageIds: string[] = [];
  const consumed = new Set<string>();
  for (const p of passages) {
    const cids = (p.questions ?? []).map((q) => q.id);
    if (cids.length > 0 && cids.every((id) => ids.has(id))) {
      wholePassageIds.push(p.id);
      cids.forEach((id) => consumed.add(id));
    }
  }
  const questionIdsOnly = [...ids].filter((id) => !consumed.has(id));
  return { wholePassageIds, questionIdsOnly };
}

// ─── component ───────────────────────────────────────────────────────────────

export default function QuestionsPage() {
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();

  const [folders, setFolders] = useState<QuestionFolder[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passages, setPassages] = useState<McqPassage[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('MCQ');
  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(undefined);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');

  const [expandedPassageIds, setExpandedPassageIds] = useState<Set<string>>(new Set());
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyTargetFolderId, setCopyTargetFolderId] = useState('');

  // ── data loading ────────────────────────────────────────────────────────

  const loadFolders = useCallback(async () => {
    try {
      const res = await getQuestionFolders();
      if (res.success && res.data) setFolders(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const loadCourses = useCallback(async () => {
    try {
      const res = await getCourses({});
      if (res.success && res.data) setCourses(res.data || []);
    } catch (err) { console.error(err); }
  }, []);

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const difficulty = difficultyFilter === 'all' ? undefined : difficultyFilter;
      const typeStr = activeTab === 'CQ' || activeTab === 'SINGLE' ? 'CQ' : 'MCQ';
      const res = await getQuestions(
        activeFolderId || 'null', typeStr, difficulty,
        undefined, undefined, undefined, undefined, undefined,
      );
      if (res.success && res.data) setQuestions(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [activeFolderId, activeTab, difficultyFilter]);

  const loadPassages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPassages(activeFolderId || 'null');
      if (res.success && res.data) setPassages(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [activeFolderId]);

  useEffect(() => { loadFolders(); loadCourses(); }, [loadFolders, loadCourses]);
  useEffect(() => {
    if (activeTab === 'COMBINED') {
      loadPassages();
    } else {
      void loadQuestions();
      if (activeTab === 'CQ') void loadPassages();
    }
  }, [activeFolderId, difficultyFilter, activeTab, loadQuestions, loadPassages]);

  useEffect(() => {
    setSelectedQuestionIds(new Set());
  }, [activeTab]);

  // ── derived state ────────────────────────────────────────────────────────

  const breadcrumbs = (() => {
    const crumbs: QuestionFolder[] = [];
    let id = activeFolderId;
    while (id) {
      const f = folders.find(x => x.id === id);
      if (f) { crumbs.unshift(f); id = f.parentFolderId || undefined; }
      else break;
    }
    return crumbs;
  })();

  const subfolders = folders
    .filter(f => (activeFolderId ? f.parentFolderId === activeFolderId : !f.parentFolderId))
    .filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredQuestions = questions.filter(q => {
    const meta = q.meta as { isSingle?: boolean } | null;
    if (activeTab === 'SINGLE' && (q.type !== 'CQ' || !meta?.isSingle)) return false;
    if (activeTab === 'CQ' && (q.type !== 'CQ' || meta?.isSingle || q.mcqType === 'PASSAGE_CHILD')) return false;
    if (activeTab === 'MCQ' && (q.type !== 'MCQ' || q.mcqType === 'PASSAGE_CHILD')) return false;
    const qry = searchQuery.toLowerCase();
    return !qry || q.prompt.toLowerCase().includes(qry) || q.explanation?.toLowerCase().includes(qry);
  });

  /** Combined MCQ tab: only passages whose children are all MCQ (HSC সৃজনশীল uses CQ children — stays on CQ tab). */
  const combinedMcqPassages = useMemo(
    () =>
      passages.filter((p) => {
        const qs = p.questions ?? [];
        if (qs.length === 0) return true;
        return qs.every((q) => q.type === 'MCQ');
      }),
    [passages],
  );

  const creativeCqPassages = useMemo(
    () =>
      passages.filter((p) => {
        const qs = p.questions ?? [];
        if (qs.length === 0) return false;
        return qs.every((q) => q.type === 'CQ');
      }),
    [passages],
  );

  const passagesForBulkOps = useMemo(() => {
    if (activeTab === 'COMBINED') return combinedMcqPassages;
    if (activeTab === 'CQ') return creativeCqPassages;
    return [] as McqPassage[];
  }, [activeTab, combinedMcqPassages, creativeCqPassages]);

  const selectableQuestionIds = useMemo(() => {
    if (activeTab === 'COMBINED') {
      return combinedMcqPassages.flatMap((p) => p.questions?.map((q) => q.id) ?? []);
    }
    if (activeTab === 'CQ') {
      const fromPassages = creativeCqPassages.flatMap((p) => p.questions?.map((q) => q.id) ?? []);
      const fromTable = filteredQuestions.map((q) => q.id);
      return [...new Set([...fromPassages, ...fromTable])];
    }
    return filteredQuestions.map((q) => q.id);
  }, [activeTab, combinedMcqPassages, creativeCqPassages, filteredQuestions]);

  const hasListBelowFolders =
    activeTab === 'COMBINED'
      ? combinedMcqPassages.length > 0
      : activeTab === 'CQ'
        ? creativeCqPassages.length > 0 || filteredQuestions.length > 0
        : filteredQuestions.length > 0;

  const allFoldersFlat = folders.filter(f => f.id !== activeFolderId);
  const isEmpty =
    subfolders.length === 0 &&
    (activeTab === 'COMBINED'
      ? combinedMcqPassages.length === 0
      : activeTab === 'CQ'
        ? creativeCqPassages.length === 0 && filteredQuestions.length === 0
        : filteredQuestions.length === 0);

  // ── handlers ─────────────────────────────────────────────────────────────

  const togglePassage = (id: string) =>
    setExpandedPassageIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleSelect = (id: string) =>
    setSelectedQuestionIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleSelectAll = () => {
    const all = selectableQuestionIds;
    const allSelected = all.length > 0 && all.every((id) => selectedQuestionIds.has(id));
    setSelectedQuestionIds(allSelected ? new Set() : new Set(all));
  };

  const handleDeleteQuestion = useCallback(
    (id: string, list: 'questions' | 'passages') => {
      openModal({
        title: 'Delete Question',
        description: 'This action cannot be undone.',
        content: (
          <ConfirmationModal
            title="Confirm Delete"
            description="Delete this question permanently? It will be removed from all exam sets."
            variant="danger"
            onConfirm={async () => {
              try {
                const res = await deleteQuestion(id);
                if (res.success) {
                  toast({ title: 'Question deleted' });
                  if (list === 'passages') await loadPassages(); else await loadQuestions();
                } else {
                  toast({ title: 'Could not delete', description: res.message, variant: 'destructive' });
                }
              } catch (err: unknown) {
                toast({ title: 'Error', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
              }
            }}
          />
        ),
      });
    },
    [toast, loadQuestions, loadPassages, openModal],
  );

  const handleBulkDeleteSelected = useCallback(() => {
    const ids = Array.from(selectedQuestionIds);
    if (ids.length === 0) return;
    const { wholePassageIds, questionIdsOnly } = partitionPassagesForSelection(
      passagesForBulkOps,
      selectedQuestionIds,
    );
    const passageCount = wholePassageIds.length;
    const qCount = questionIdsOnly.length;
    const summaryParts: string[] = [];
    if (passageCount) summaryParts.push(`${passageCount} passage set${passageCount === 1 ? '' : 's'} (উদ্দীপক + all sub-questions)`);
    if (qCount) summaryParts.push(`${qCount} question${qCount === 1 ? '' : 's'}`);
    const summary = summaryParts.join(' and ') || `${ids.length} selected`;
    openModal({
      title: 'Delete questions',
      description: 'This action cannot be undone.',
      content: (
        <ConfirmationModal
          title="Confirm Delete"
          description={`Delete ${summary} permanently? They will be removed from all exam sets, and related answers in student attempts will be removed.`}
          variant="danger"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={async () => {
            try {
              for (const pid of wholePassageIds) {
                await deletePassage(pid);
              }
              if (questionIdsOnly.length > 0) {
                const res = await bulkDeleteQuestions({ questionIds: questionIdsOnly });
                if (!res.success) {
                  toast({
                    title: 'Could not delete',
                    description: res.message || 'Unknown error',
                    variant: 'destructive',
                  });
                  await loadPassages();
                  await loadQuestions();
                  return;
                }
              }
              toast({
                title: 'Deleted',
                description:
                  passageCount || qCount
                    ? `Removed ${summary}.`
                    : `${ids.length} item(s) removed.`,
              });
              setSelectedQuestionIds(new Set());
              await loadPassages();
              await loadQuestions();
            } catch (err: unknown) {
              toast({
                title: 'Could not delete',
                description: err instanceof Error ? err.message : 'Something went wrong',
                variant: 'destructive',
              });
            }
          }}
        />
      ),
    });
  }, [selectedQuestionIds, passagesForBulkOps, openModal, toast, loadQuestions, loadPassages]);

  const handleCreateFolder = () =>
    openModal({
      title: activeFolderId ? 'Create Subfolder' : 'New Folder',
      description: 'Create a folder for questions.',
      className: 'sm:max-w-2xl',
      content: <FolderForm courses={courses} folders={folders} initialParentId={activeFolderId} onSuccess={loadFolders} />,
    });

  const handlePrimaryCreate = () => {
    const fid = activeFolderId;
    if (activeTab === 'CQ')
      openModal({ title: 'Add CQ', description: 'Create a creative question.', className: 'sm:max-w-6xl', content: <CqForm folders={folders} initialFolderId={fid} onSuccess={loadQuestions} /> });
    else if (activeTab === 'SINGLE')
      openModal({ title: 'Add Short Question', description: 'Create a short question.', className: 'sm:max-w-5xl', content: <SingleQuestionForm folders={folders} initialFolderId={fid} onSuccess={loadQuestions} /> });
    else if (activeTab === 'MCQ')
      openModal({ title: 'Add MCQ', description: 'Create a multiple choice question.', className: 'sm:max-w-6xl', content: <QuestionForm folders={folders} initialFolderId={fid} initialType="MCQ" initialMcqType="SINGLE" onSuccess={loadQuestions} /> });
    else
      openModal({ title: 'Add Combined MCQ', description: 'Add a passage with linked MCQs.', className: 'sm:max-w-4xl', content: <PassageForm folders={folders} initialFolderId={fid} onSuccess={loadPassages} /> });
  };

  const executeCopy = useCallback(async () => {
    if (!copyTargetFolderId || selectedQuestionIds.size === 0) return;
    try {
      const { wholePassageIds, questionIdsOnly } = partitionPassagesForSelection(
        passagesForBulkOps,
        selectedQuestionIds,
      );
      for (const pid of wholePassageIds) {
        const res = await copyPassage(pid, copyTargetFolderId);
        if (!res.success) {
          throw new Error(res.message || 'Failed to copy a passage set');
        }
      }
      if (questionIdsOnly.length === 1 && wholePassageIds.length === 0) {
        const res = await copyQuestion({ questionId: questionIdsOnly[0], targetFolderId: copyTargetFolderId });
        if (!res.success) throw new Error(res.message || 'Copy failed');
      } else if (questionIdsOnly.length > 0) {
        const res = await bulkCopyQuestions({
          questionIds: questionIdsOnly,
          targetFolderId: copyTargetFolderId,
        });
        if (!res.success) throw new Error(res.message || 'Bulk copy failed');
      }
      const n = selectedQuestionIds.size;
      toast({ title: 'Copied', description: `${n} item(s) copied to the folder.` });
      setCopyModalOpen(false);
      setSelectedQuestionIds(new Set());
      setCopyTargetFolderId('');
      await loadPassages();
      await loadQuestions();
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to copy',
        variant: 'destructive',
      });
    }
  }, [copyTargetFolderId, selectedQuestionIds, passagesForBulkOps, toast, loadPassages, loadQuestions]);

  const openViewModal = (q: Question) => {
    const meta = q.meta as { isSingle?: boolean; marks?: number; answer?: string; totalMarks?: number; parts?: unknown[] } | null;
    const isSingle = !!meta?.isSingle;
    if (isSingle) {
      openModal({
        title: 'Short Question', description: 'Question details.', className: 'sm:max-w-3xl',
        content: (
          <div className="space-y-4 text-slate-700">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Question</label>
              <div className="prose prose-sm max-w-none rounded-xl bg-slate-50 p-4" dangerouslySetInnerHTML={{ __html: q.prompt }} />
            </div>
            {meta?.answer && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-emerald-600">Answer</label>
                <div className="prose prose-sm max-w-none rounded-xl bg-emerald-50 p-4" dangerouslySetInnerHTML={{ __html: String(meta.answer) }} />
              </div>
            )}
          </div>
        ),
      });
    } else if (q.type === 'CQ') {
      const parts = (meta?.parts as { label?: string; marks?: number; knowledgeLevel?: string; prompt?: string; answer?: string }[]) || [];
      openModal({
        title: 'Creative Question', description: 'Question details.', className: 'sm:max-w-4xl',
        content: (
          <div className="space-y-5 text-slate-700">
            <div className="rounded-xl bg-slate-50 p-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Stimulus</label>
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: q.prompt }} />
            </div>
            {parts.map((part, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">{part.label || String.fromCharCode(65 + i)}</span>
                  <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 text-xs">{part.marks ?? '—'} marks</Badge>
                  {part.knowledgeLevel && <Badge variant="outline" className="text-xs">{part.knowledgeLevel}</Badge>}
                </div>
                {part.prompt && <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: part.prompt }} />}
                {part.answer && (
                  <div className="mt-3 rounded-lg border-l-4 border-emerald-400 bg-emerald-50 p-3">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-emerald-700">Model Answer</label>
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: part.answer }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ),
      });
    } else {
      openModal({
        title: 'Multiple Choice Question', description: 'Question details.', className: 'sm:max-w-3xl',
        content: (
          <div className="space-y-4 text-slate-700">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Question</label>
              <div className="prose prose-sm max-w-none rounded-xl bg-slate-50 p-4" dangerouslySetInnerHTML={{ __html: q.prompt }} />
            </div>
            {q.options && q.options.length > 0 && (
              <div className="space-y-2">
                {q.options.map(opt => (
                  <div key={opt.id} className={cn('flex items-start gap-3 rounded-lg p-3', opt.isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50')}>
                    <span className={cn('shrink-0 font-semibold', opt.isCorrect ? 'text-emerald-700' : 'text-slate-500')}>{opt.label}.</span>
                    <span className={cn('flex-1 text-sm', opt.isCorrect ? 'font-semibold text-emerald-700' : 'text-slate-600')}>{opt.text}</span>
                    {opt.isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        ),
      });
    }
  };

  const openEditModal = (q: Question) => {
    const meta = q.meta as { isSingle?: boolean } | null;
    if (meta?.isSingle)
      openModal({ title: 'Edit Short Question', description: '', className: 'sm:max-w-5xl', content: <SingleQuestionForm folders={folders} question={q} onSuccess={loadQuestions} /> });
    else if (q.type === 'CQ')
      openModal({ title: 'Edit CQ', description: '', className: 'sm:max-w-6xl', content: <CqForm folders={folders} question={q} onSuccess={loadQuestions} /> });
    else
      openModal({ title: 'Edit Question', description: '', className: 'sm:max-w-6xl', content: <QuestionForm folders={folders} initialFolderId={q.folderId || undefined} initialType={q.type} initialMcqType={q.mcqType || undefined} question={q} onSuccess={loadQuestions} /> });
  };

  // ── render ───────────────────────────────────────────────────────────────

  const newButtonLabel =
    activeTab === 'CQ' ? 'New CQ'
    : activeTab === 'MCQ' ? 'New MCQ'
    : activeTab === 'SINGLE' ? 'New Short Q'
    : 'New Combined MCQ';

  // ── parent folder for back navigation ────────────────────────────────────
  const parentFolderId = activeFolderId
    ? (folders.find(f => f.id === activeFolderId)?.parentFolderId ?? null)
    : null;

  const handleBack = () => {
    // null means go to root, undefined means already at root (no-op guarded by activeFolderId check)
    setActiveFolderId(parentFolderId ?? undefined);
  };

  return (
    <div className="flex min-h-0 flex-col gap-4 text-slate-900">

      {/* ── Top tab bar ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <div className="flex overflow-x-auto gap-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'shrink-0 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="min-w-0 space-y-4">

        {/* Breadcrumb + action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          {/* Back button + breadcrumb */}
          <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">

            {/* Back button — only shown when inside a folder */}
            {activeFolderId && (
              <button
                type="button"
                onClick={handleBack}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 mr-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </button>
            )}

            {/* Root crumb */}
            <button
              type="button"
              onClick={() => setActiveFolderId(undefined)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium transition-colors',
                !activeFolderId ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800',
              )}
            >
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Root</span>
            </button>

            {breadcrumbs.map((crumb, i, arr) => (
              <React.Fragment key={crumb.id}>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                <button
                  type="button"
                  onClick={() => setActiveFolderId(crumb.id)}
                  className={cn(
                    'max-w-[140px] shrink-0 truncate rounded-lg px-2 py-1 text-sm font-medium transition-colors',
                    i === arr.length - 1 ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateFolder}
              className="h-9 rounded-lg border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FolderPlus className="mr-1.5 h-3.5 w-3.5" />
              New folder
            </Button>
            <Button
              size="sm"
              onClick={handlePrimaryCreate}
              className="h-9 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {newButtonLabel}
            </Button>
          </div>
        </div>

          {/* Toolbar: search + filters */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search questions…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9 border-0 bg-slate-50 pl-8 text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg"
              />
            </div>
            {activeTab !== 'COMBINED' && (
              <Select value={difficultyFilter} onValueChange={v => setDifficultyFilter(v as Difficulty | 'all')}>
                <SelectTrigger className="h-9 w-[130px] rounded-lg border-0 bg-slate-50 text-sm font-medium focus:ring-0">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  {difficultyOptions.filter(o => o !== 'all').map(o => (
                    <SelectItem key={o} value={o}>{o.charAt(0) + o.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg hover:bg-slate-100"
              onClick={() => { loadFolders(); activeTab === 'COMBINED' ? loadPassages() : loadQuestions(); }}
            >
              <RefreshCw className={cn('h-4 w-4 text-slate-500', loading && 'animate-spin')} />
            </Button>
          </div>

          {/* Bulk selection bar (all tabs: MCQ, Combined passages, CQ, Short) */}
          {selectedQuestionIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5">
              <span className="text-sm font-semibold text-indigo-700">
                {selectedQuestionIds.size} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg border-indigo-200 text-xs font-semibold text-indigo-700 hover:bg-white"
                onClick={() => setCopyModalOpen(true)}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy to folder
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg border-rose-200 bg-white text-xs font-semibold text-rose-700 hover:bg-rose-50"
                onClick={handleBulkDeleteSelected}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete selected
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-lg text-xs font-medium text-slate-500 hover:bg-white"
                onClick={() => setSelectedQuestionIds(new Set())}
              >
                Clear
              </Button>
            </div>
          )}

          {/* ── Table / Cards ─────────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24">
                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-indigo-500 border-t-transparent" />
                <p className="text-xs font-medium text-slate-400">Loading…</p>
              </div>
            ) : (
              <>
                {/* ── Folders section ─────────────────────────────── */}
                {subfolders.length > 0 && (
                  <div className={cn(
                    'grid gap-px bg-slate-100',
                    hasListBelowFolders ? 'border-b border-slate-200' : '',
                  )}>
                    {subfolders.map(folder => (
                      <div
                        key={folder.id}
                        onClick={() => setActiveFolderId(folder.id)}
                        className="flex cursor-pointer items-center justify-between bg-white px-4 py-3 transition-colors hover:bg-slate-50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                            <Folder className="h-4 w-4 text-slate-500" />
                          </div>
                          <span className="text-sm font-medium text-slate-800">{folder.name}</span>
                        </div>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                            onClick={() => openModal({
                              title: 'Update Folder', description: 'Edit folder details.', className: 'sm:max-w-2xl',
                              content: <FolderForm courses={courses} folders={folders} folder={folder} onSuccess={loadFolders} />,
                            })}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => openModal({
                              title: 'Delete Folder', description: 'Delete this folder?',
                              content: (
                                <ConfirmationModal title="Confirm Delete" description="Remove this folder permanently?" variant="danger"
                                  onConfirm={async () => {
                                    await deleteQuestionFolder(folder.id);
                                    await loadFolders();
                                    if (activeFolderId === folder.id) setActiveFolderId(undefined);
                                  }}
                                />
                              ),
                            })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Select all (passage-only views: no question table header) */}
                {((activeTab === 'COMBINED' && combinedMcqPassages.length > 0) ||
                  (activeTab === 'CQ' && creativeCqPassages.length > 0 && filteredQuestions.length === 0)) && (
                  <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50/90 px-5 py-2.5">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                      checked={
                        selectableQuestionIds.length > 0 &&
                        selectableQuestionIds.every((id) => selectedQuestionIds.has(id))
                      }
                      onChange={toggleSelectAll}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Select all ({selectableQuestionIds.length})
                    </span>
                  </div>
                )}

                {/* ── Combined MCQ passages ────────────────────── */}
                {activeTab === 'COMBINED' && combinedMcqPassages.length > 0 && (
                  <div className="divide-y divide-slate-100">
                    {combinedMcqPassages.map(p => {
                      const expanded = expandedPassageIds.has(p.id);
                      const childIds = p.questions?.map((q) => q.id) ?? [];
                      const allKidsOn =
                        childIds.length > 0 && childIds.every((id) => selectedQuestionIds.has(id));
                      return (
                        <div key={p.id} className="transition-colors">
                          {/* Passage header */}
                          <div
                            className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 hover:bg-slate-50"
                            onClick={() => togglePassage(p.id)}
                          >
                            <div className="flex min-w-0 flex-1 items-start gap-2">
                              <div className="mt-0.5 shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  className="rounded border-slate-300"
                                  checked={allKidsOn}
                                  onChange={() => {
                                    setSelectedQuestionIds((prev) => {
                                      const n = new Set(prev);
                                      if (allKidsOn) childIds.forEach((id) => n.delete(id));
                                      else childIds.forEach((id) => n.add(id));
                                      return n;
                                    });
                                  }}
                                />
                              </div>
                              <div className="mt-0.5 shrink-0 text-slate-400">
                                {expanded
                                  ? <ChevronUp className="h-4 w-4 text-indigo-500" />
                                  : <ChevronDown className="h-4 w-4" />
                                }
                              </div>
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 text-[11px]">
                                    Combined MCQ
                                  </Badge>
                                  {p.difficulty && (
                                    <Badge variant="outline" className={cn('text-[11px]', difficultyClass(p.difficulty))}>
                                      {p.difficulty}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-slate-400">
                                    {p.questions?.length ?? 0} questions
                                  </span>
                                </div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {p.title || 'Untitled passage'}
                                </p>
                                {!expanded && (
                                  <p className="line-clamp-1 text-xs text-slate-500">
                                    {stripHtml(p.content)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                                onClick={() => openModal({
                                  title: 'Edit Combined MCQ', description: '', className: 'sm:max-w-4xl',
                                  content: <PassageForm folders={folders} passage={p} onSuccess={loadPassages} />,
                                })}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                onClick={() => openModal({
                                  title: 'Delete Combined MCQ', description: '',
                                  content: (
                                    <ConfirmationModal title="Confirm Delete" description="This will delete the passage and all child questions." variant="danger"
                                      onConfirm={async () => { await deletePassage(p.id); await loadPassages(); }}
                                    />
                                  ),
                                })}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Passage expanded content */}
                          {expanded && (
                            <div className="border-t border-slate-100 bg-slate-50/50 px-5 pb-5 pt-4 space-y-4">
                              <div className="rounded-lg bg-white p-4 border border-slate-200">
                                <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: p.content }} />
                              </div>
                              {p.questions && p.questions.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Questions ({p.questions.length})
                                  </p>
                                  {p.questions.map((cq, idx) => (
                                    <div key={cq.id} className="rounded-lg border border-slate-200 bg-white p-4">
                                      <div className="flex items-start gap-3">
                                        <div className="mt-1 shrink-0">
                                          <input
                                            type="checkbox"
                                            className="rounded border-slate-300"
                                            checked={selectedQuestionIds.has(cq.id)}
                                            onChange={() => toggleSelect(cq.id)}
                                          />
                                        </div>
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                          {idx + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <div className="prose prose-sm text-slate-800 leading-snug" dangerouslySetInnerHTML={{ __html: cq.prompt }} />
                                          {cq.options && cq.options.length > 0 && (
                                            <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                                              {cq.options.map(opt => (
                                                <div
                                                  key={opt.id}
                                                  className={cn(
                                                    'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs',
                                                    opt.isCorrect
                                                      ? 'bg-emerald-50 font-semibold text-emerald-700'
                                                      : 'bg-slate-50 text-slate-600',
                                                  )}
                                                >
                                                  <span className="font-bold shrink-0">{opt.label}.</span>
                                                  {opt.isCorrect && <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />}
                                                  <span className="truncate">{opt.text}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1">
                                          <button
                                            type="button"
                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                                            onClick={() => openModal({
                                              title: 'Edit Question', description: '', className: 'sm:max-w-6xl',
                                              content: <QuestionForm folders={folders} initialFolderId={cq.folderId || undefined} initialType={cq.type} initialMcqType={cq.mcqType || undefined} question={cq} onSuccess={loadPassages} />,
                                            })}
                                          >
                                            <Edit className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                            onClick={() => handleDeleteQuestion(cq.id, 'passages')}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── উদ্দীপকসহ সৃজনশীল CQ (passage + ক–ঘ); not Combined MCQ ── */}
                {activeTab === 'CQ' && creativeCqPassages.length > 0 && (
                  <div className="divide-y divide-slate-100 border-b border-slate-200">
                    {creativeCqPassages.map(p => {
                      const expanded = expandedPassageIds.has(p.id);
                      const childIds = p.questions?.map((q) => q.id) ?? [];
                      const allKidsOn =
                        childIds.length > 0 && childIds.every((id) => selectedQuestionIds.has(id));
                      return (
                        <div key={p.id} className="transition-colors">
                          <div
                            className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 hover:bg-slate-50"
                            onClick={() => togglePassage(p.id)}
                          >
                            <div className="flex min-w-0 flex-1 items-start gap-2">
                              <div className="mt-0.5 shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  className="rounded border-slate-300"
                                  checked={allKidsOn}
                                  onChange={() => {
                                    setSelectedQuestionIds((prev) => {
                                      const n = new Set(prev);
                                      if (allKidsOn) childIds.forEach((id) => n.delete(id));
                                      else childIds.forEach((id) => n.add(id));
                                      return n;
                                    });
                                  }}
                                />
                              </div>
                              <div className="mt-0.5 shrink-0 text-slate-400">
                                {expanded
                                  ? <ChevronUp className="h-4 w-4 text-amber-500" />
                                  : <ChevronDown className="h-4 w-4" />}
                              </div>
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 text-[11px]">
                                    সৃজনশীল CQ · উদ্দীপক
                                  </Badge>
                                  {p.difficulty && (
                                    <Badge variant="outline" className={cn('text-[11px]', difficultyClass(p.difficulty))}>
                                      {p.difficulty}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-slate-400">
                                    {p.questions?.length ?? 0} উপপ্রশ্ন (ক–ঘ)
                                  </span>
                                </div>
                                <p className="text-sm font-semibold text-slate-900">{p.title || 'Untitled'}</p>
                                {!expanded && (
                                  <p className="line-clamp-1 text-xs text-slate-500">{stripHtml(p.content)}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                                onClick={() => openModal({
                                  title: 'Edit উদ্দীপক / সেট',
                                  description: '',
                                  className: 'sm:max-w-4xl',
                                  content: <PassageForm folders={folders} passage={p} onSuccess={loadPassages} />,
                                })}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                onClick={() => openModal({
                                  title: 'Delete সৃজনশীল সেট',
                                  description: '',
                                  content: (
                                    <ConfirmationModal
                                      title="Confirm Delete"
                                      description="This will delete the উদ্দীপক and all (ক–ঘ) sub-questions."
                                      variant="danger"
                                      onConfirm={async () => { await deletePassage(p.id); await loadPassages(); }}
                                    />
                                  ),
                                })}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          {expanded && (
                            <div className="border-t border-slate-100 bg-slate-50/50 px-5 pb-5 pt-4 space-y-4">
                              <div className="rounded-lg border border-slate-200 bg-white p-4">
                                <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: p.content }} />
                              </div>
                              {p.questions && p.questions.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    উপপ্রশ্ন ({p.questions.length})
                                  </p>
                                  {p.questions.map((cq, idx) => {
                                    const pm = cq.meta as { banglaLabel?: string; marks?: number } | null;
                                    return (
                                      <div key={cq.id} className="rounded-lg border border-slate-200 bg-white p-4">
                                        <div className="flex items-start gap-3">
                                          <div className="mt-1 shrink-0">
                                            <input
                                              type="checkbox"
                                              className="rounded border-slate-300"
                                              checked={selectedQuestionIds.has(cq.id)}
                                              onChange={() => toggleSelect(cq.id)}
                                            />
                                          </div>
                                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                                            {pm?.banglaLabel?.replace(/[()]/g, '') ?? idx + 1}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            {pm?.marks != null && (
                                              <span className="mb-1 inline-block text-[10px] font-bold text-amber-700">{pm.marks} marks</span>
                                            )}
                                            <div className="prose prose-sm text-slate-800 leading-snug" dangerouslySetInnerHTML={{ __html: cq.prompt }} />
                                          </div>
                                          <div className="flex shrink-0 items-center gap-1">
                                            <button
                                              type="button"
                                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                                              onClick={() => openModal({
                                                title: 'Edit উপপ্রশ্ন',
                                                description: '',
                                                className: 'sm:max-w-6xl',
                                                content: (
                                                  <QuestionForm
                                                    folders={folders}
                                                    initialFolderId={cq.folderId || undefined}
                                                    initialType={cq.type}
                                                    initialMcqType={cq.mcqType || undefined}
                                                    question={cq}
                                                    onSuccess={loadPassages}
                                                  />
                                                ),
                                              })}
                                            >
                                              <Edit className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                              onClick={() => handleDeleteQuestion(cq.id, 'passages')}
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Questions table ──────────────────────────── */}
                {activeTab !== 'COMBINED' && filteredQuestions.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-left">
                          <th className="w-10 py-3 pl-4 pr-2">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300"
                              checked={
                                selectableQuestionIds.length > 0 &&
                                selectableQuestionIds.every((id) => selectedQuestionIds.has(id))
                              }
                              onChange={toggleSelectAll}
                            />
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Question</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 w-28">Type</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 w-24 text-center">Difficulty</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 w-20 text-center">Marks</th>
                          <th className="w-36 py-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredQuestions.map(q => {
                          const meta = q.meta as { isSingle?: boolean; marks?: number; answer?: string; totalMarks?: number; parts?: unknown[] } | null;
                          const isSingle = !!meta?.isSingle;
                          const isSelected = selectedQuestionIds.has(q.id);

                          return (
                            <tr
                              key={q.id}
                              className={cn(
                                'group transition-colors hover:bg-slate-50',
                                isSelected && 'bg-indigo-50/50',
                              )}
                            >
                              {/* Checkbox */}
                              <td className="w-10 py-3.5 pl-4 pr-2">
                                <input
                                  type="checkbox"
                                  className="rounded border-slate-300"
                                  checked={isSelected}
                                  onChange={() => toggleSelect(q.id)}
                                />
                              </td>

                              {/* Question prompt */}
                              <td className="px-3 py-3.5">
                                <div className="space-y-1.5">
                                  <p className="line-clamp-2 text-sm font-medium text-slate-800 leading-snug">
                                    {stripHtml(q.prompt).substring(0, 160)}{stripHtml(q.prompt).length > 160 ? '…' : ''}
                                  </p>
                                  {/* MCQ options preview */}
                                  {q.options && q.options.length > 0 && (
                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                      {q.options.map(opt => (
                                        <span
                                          key={opt.id}
                                          className={cn(
                                            'text-xs',
                                            opt.isCorrect ? 'font-semibold text-emerald-600' : 'text-slate-400',
                                          )}
                                        >
                                          <span className="font-bold">{opt.label}.</span>{' '}
                                          {opt.isCorrect && <CheckCircle2 className="inline h-3 w-3 mr-0.5 -mt-0.5" />}
                                          {opt.text.substring(0, 40)}{opt.text.length > 40 ? '…' : ''}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {/* CQ parts */}
                                  {q.type === 'CQ' && !isSingle && meta && Array.isArray(meta.parts) && meta.parts.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                      {(meta.parts as { label?: string; marks?: number; knowledgeLevel?: string }[]).map((part, pi) => (
                                        <span
                                          key={pi}
                                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                                        >
                                          <span className="font-bold">{part.label}</span>
                                          <span className="text-indigo-600">{part.marks}m</span>
                                          {part.knowledgeLevel && <span className="text-slate-400">{part.knowledgeLevel}</span>}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {/* Single Q answer preview */}
                                  {isSingle && meta?.answer && (
                                    <p className="line-clamp-1 text-xs text-emerald-600">
                                      <span className="font-semibold">Ans:</span>{' '}
                                      {stripHtml(String(meta.answer)).substring(0, 80)}
                                    </p>
                                  )}
                                </div>
                              </td>

                              {/* Type badge */}
                              <td className="px-3 py-3.5">
                                <Badge
                                  variant="outline"
                                  className={cn('text-xs font-semibold', typeClass(q.type, isSingle))}
                                >
                                  {isSingle ? 'Short' : q.type}
                                </Badge>
                              </td>

                              {/* Difficulty */}
                              <td className="px-3 py-3.5 text-center">
                                {q.difficulty ? (
                                  <Badge variant="outline" className={cn('text-xs font-semibold', difficultyClass(q.difficulty))}>
                                    {q.difficulty}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-slate-300">—</span>
                                )}
                              </td>

                              {/* Marks */}
                              <td className="px-3 py-3.5 text-center text-sm font-semibold tabular-nums text-slate-700">
                                {isSingle
                                  ? (meta?.marks ?? '—')
                                  : q.type === 'CQ' && meta?.totalMarks
                                    ? meta.totalMarks
                                    : '1'}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 pr-4 text-right">
                                <div className="flex items-center justify-end gap-0.5">
                                  <button
                                    type="button"
                                    title="View"
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
                                    onClick={() => openViewModal(q)}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Copy to folder"
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                                    onClick={() => { setSelectedQuestionIds(new Set([q.id])); setCopyModalOpen(true); }}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Edit"
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                                    onClick={() => openEditModal(q)}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Delete"
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                    onClick={() => handleDeleteQuestion(q.id, 'questions')}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Empty state */}
                {isEmpty && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                      <FileQuestion className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600">Nothing here yet</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {activeFolderId ? 'This folder is empty.' : 'Create a folder or add questions to get started.'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
      </div>

      {/* ── Copy Modal ─────────────────────────────────────────────────────── */}
      <Dialog
        open={copyModalOpen}
        onOpenChange={open => { if (!open) { setCopyModalOpen(false); setCopyTargetFolderId(''); } }}
      >
        <DialogContent className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-xl">
          <DialogHeader className="border-b border-slate-100 px-6 pb-4 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
                <Copy className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-slate-900">
                  Copy {selectedQuestionIds.size} question{selectedQuestionIds.size !== 1 ? 's' : ''}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs text-slate-500">
                  Originals remain untouched.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-5">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Destination folder
            </label>
            <Select value={copyTargetFolderId || undefined} onValueChange={setCopyTargetFolderId}>
              <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 text-sm font-medium">
                <SelectValue placeholder="Choose a folder…" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {allFoldersFlat.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">No folders available.</div>
                ) : (
                  allFoldersFlat.map(f => (
                    <SelectItem key={f.id} value={f.id} className="rounded-lg">
                      <span className="flex items-center gap-2">
                        <Folder className="h-3.5 w-3.5 text-slate-400" />
                        {f.name}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs text-slate-400">
              Copies appear as new drafts in the chosen folder.
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg"
              onClick={() => { setCopyModalOpen(false); setCopyTargetFolderId(''); }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!copyTargetFolderId}
              onClick={executeCopy}
              className="rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}