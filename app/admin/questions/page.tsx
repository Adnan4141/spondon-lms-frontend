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
  getQuestionFolderTree,
} from '@/lib/api/question-bank';
import type { FolderTreeNode } from '@/lib/api/question-bank';
import type {
  Question,
  QuestionFolder,
  Difficulty,
  McqPassage,
} from '@/types/question';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Folder,
  MoreVertical,
  Plus,
  Search,
  CheckCircle2,
  Home,
  ChevronRight,
  FolderPlus,
  Trash2,
  Copy,
  Eye,
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

export type QuestionTabId = 'MCQ' | 'COMBINED' | 'CQ' | 'SINGLE';
type TypeFilter = 'all' | 'MCQ' | 'COMBINED' | 'CQ' | 'SHORT';

const TYPE_BADGE: Record<string, string> = {
  MCQ: 'bg-blue-50 text-blue-700 border-blue-200',
  CQ: 'bg-amber-50 text-amber-700 border-amber-200',
  SHORT: 'bg-violet-50 text-violet-700 border-violet-200',
  COMBINED: 'bg-teal-50 text-teal-700 border-teal-200',
};
const DIFF_BADGE: Record<string, string> = {
  EASY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HARD: 'bg-rose-50 text-rose-700 border-rose-200',
};

function stripHtml(html: string) {
  return html ? html.replace(/<[^>]+>/g, '') : '';
}

/* ---------- Sidebar tree item ---------- */
function SidebarFolder({
  node,
  depth,
  activeFolderId,
  folderSearch,
  expandedFolderIds,
  onToggleExpand,
  onNavigate,
  onEdit,
  onDelete,
  onCreateSub,
}: {
  node: FolderTreeNode;
  depth: number;
  activeFolderId?: string;
  folderSearch: string;
  expandedFolderIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onNavigate: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateSub: (parentId: string) => void;
}) {
  const matches = !folderSearch || node.name.toLowerCase().includes(folderSearch);
  const childrenMatch = node.children.some(c => matchesSearch(c, folderSearch));
  if (!matches && !childrenMatch) return null;

  const isActive = activeFolderId === node.id;
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedFolderIds.has(node.id) || !!folderSearch;

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-1 py-1.5 rounded-lg cursor-pointer transition-colors text-[13px]',
          isActive ? 'bg-blue-50 text-blue-800' : 'hover:bg-slate-100 text-slate-700',
        )}
        style={{ paddingLeft: `${4 + depth * 16}px`, paddingRight: 6 }}
        onClick={() => onNavigate(node.id)}
      >
        {/* Expand/collapse chevron */}
        {hasChildren ? (
          <button
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-slate-200 shrink-0 transition-colors"
            onClick={(e) => { e.stopPropagation(); onToggleExpand(node.id); }}
          >
            <ChevronRight className={cn('h-3 w-3 text-slate-400 transition-transform', isExpanded && 'rotate-90')} />
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <Folder className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-blue-500' : 'text-slate-400')} />
        <span className="flex-1 truncate ml-1">{node.name}</span>
        <span className="text-[11px] text-slate-400 mr-0.5">{node.counts.total}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded-md hover:bg-slate-200 transition-opacity shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3.5 w-3.5 text-slate-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-xl p-1">
            <DropdownMenuItem className="gap-2 text-[13px] cursor-pointer rounded-lg" onClick={() => onNavigate(node.id)}>
              <Folder className="h-3.5 w-3.5" /> Open folder
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-[13px] cursor-pointer rounded-lg" onClick={() => onCreateSub(node.id)}>
              <FolderPlus className="h-3.5 w-3.5" /> New subfolder
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-[13px] cursor-pointer rounded-lg" onClick={() => onEdit(node.id)}>
              <Edit className="h-3.5 w-3.5" /> Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-[13px] cursor-pointer rounded-lg text-red-600 focus:text-red-700 focus:bg-red-50" onClick={() => onDelete(node.id)}>
              <Trash2 className="h-3.5 w-3.5" /> Delete folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isExpanded && node.children.map((child) => (
        <SidebarFolder
          key={child.id}
          node={child}
          depth={depth + 1}
          activeFolderId={activeFolderId}
          folderSearch={folderSearch}
          expandedFolderIds={expandedFolderIds}
          onToggleExpand={onToggleExpand}
          onNavigate={onNavigate}
          onEdit={onEdit}
          onDelete={onDelete}
          onCreateSub={onCreateSub}
        />
      ))}
    </>
  );
}

function matchesSearch(node: FolderTreeNode, q: string): boolean {
  if (!q) return true;
  if (node.name.toLowerCase().includes(q)) return true;
  return node.children.some((c) => matchesSearch(c, q));
}

function countTreeTotal(nodes: FolderTreeNode[]): number {
  return nodes.reduce((s, n) => s + n.counts.total + countTreeTotal(n.children), 0);
}

/* ================================================================ */
/*  Main component                                                   */
/* ================================================================ */
export function QuestionsPageInner({ initialTab }: { initialTab?: QuestionTabId } = {}) {
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();

  /* ---- data ---- */
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
  const [folders, setFolders] = useState<QuestionFolder[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passages, setPassages] = useState<McqPassage[]>([]);

  /* ---- ui ---- */
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [folderSearch, setFolderSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(
    initialTab === 'COMBINED' ? 'COMBINED' : initialTab === 'CQ' ? 'CQ' : initialTab === 'SINGLE' ? 'SHORT' : initialTab === 'MCQ' ? 'MCQ' : 'all',
  );
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');
  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedPassageIds, setExpandedPassageIds] = useState<Set<string>>(new Set());
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyTargetFolderId, setCopyTargetFolderId] = useState('');

  /* ================================================================ */
  /*  Data loading                                                     */
  /* ================================================================ */
  const loadFolderTree = useCallback(async () => {
    try {
      const res = await getQuestionFolderTree();
      if (res.success && res.data) setFolderTree(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const loadFolders = useCallback(async () => {
    try {
      const res = await getQuestionFolders();
      if (res.success && res.data) setFolders(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const difficulty = difficultyFilter === 'all' ? undefined : difficultyFilter;
      const fid = activeFolderId || undefined;
      const [qRes, pRes] = await Promise.all([
        getQuestions(fid, undefined, difficulty),
        getPassages(fid),
      ]);
      if (qRes.success && qRes.data) setQuestions(qRes.data);
      if (pRes.success && pRes.data) setPassages(pRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [activeFolderId, difficultyFilter]);

  useEffect(() => { loadFolderTree(); loadFolders(); }, [loadFolderTree, loadFolders]);
  useEffect(() => { loadData(); }, [loadData]);

  const reloadAll = useCallback(async () => { await Promise.all([loadFolderTree(), loadFolders(), loadData()]); }, [loadFolderTree, loadFolders, loadData]);

  /* ================================================================ */
  /*  Computed                                                         */
  /* ================================================================ */
  const breadcrumbs = useMemo(() => {
    const crumbs: QuestionFolder[] = [];
    let cur = activeFolderId;
    while (cur) {
      const f = folders.find((x) => x.id === cur);
      if (!f) break;
      crumbs.unshift(f);
      cur = f.parentFolderId || undefined;
    }
    return crumbs;
  }, [activeFolderId, folders]);

  type DisplayItem =
    | { kind: 'question'; data: Question; displayType: string }
    | { kind: 'passage'; data: McqPassage; displayType: 'COMBINED' };

  const filteredItems: DisplayItem[] = useMemo(() => {
    const items: DisplayItem[] = [];
    questions.forEach((q) => {
      if (q.mcqType === 'PASSAGE_CHILD') return;
      const meta = q.meta as { isSingle?: boolean } | null;
      const isSingle = !!meta?.isSingle;
      const dtype = q.type === 'CQ' && isSingle ? 'SHORT' : q.type === 'CQ' ? 'CQ' : 'MCQ';
      if (typeFilter !== 'all') {
        if (typeFilter === 'MCQ' && dtype !== 'MCQ') return;
        if (typeFilter === 'CQ' && dtype !== 'CQ') return;
        if (typeFilter === 'SHORT' && dtype !== 'SHORT') return;
        if (typeFilter === 'COMBINED') return;
      }
      if (searchQuery) {
        const sq = searchQuery.toLowerCase();
        if (!q.prompt.toLowerCase().includes(sq) && !q.explanation?.toLowerCase().includes(sq)) return;
      }
      items.push({ kind: 'question', data: q, displayType: dtype });
    });
    if (typeFilter === 'all' || typeFilter === 'COMBINED') {
      passages.forEach((p) => {
        if (searchQuery) {
          const sq = searchQuery.toLowerCase();
          if (!(p.title || '').toLowerCase().includes(sq) && !stripHtml(p.content).toLowerCase().includes(sq)) return;
        }
        if (difficultyFilter !== 'all' && p.difficulty !== difficultyFilter) return;
        items.push({ kind: 'passage', data: p, displayType: 'COMBINED' });
      });
    }
    return items;
  }, [questions, passages, typeFilter, searchQuery, difficultyFilter]);

  const allFoldersFlat = folders.filter((f) => f.id !== activeFolderId);
  const treeTotal = useMemo(() => countTreeTotal(folderTree), [folderTree]);
  const folderSearchLower = folderSearch.toLowerCase();

  /* ================================================================ */
  /*  Navigation                                                       */
  /* ================================================================ */
  const navigate = useCallback((id: string | undefined) => {
    setActiveFolderId(id);
    setSelectedIds(new Set());
  }, []);

  const toggleExpandFolder = useCallback((id: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  /* ================================================================ */
  /*  Actions                                                          */
  /* ================================================================ */
  const handleCreateFolder = useCallback((parentId?: string) => {
    openModal({
      title: parentId ? 'Create Subfolder' : 'New Folder',
      description: 'Create a folder for questions.',
      className: 'sm:max-w-2xl',
      content: <FolderForm folders={folders} initialParentId={parentId} onSuccess={reloadAll} />,
    });
  }, [openModal, folders, reloadAll]);

  const handleEditFolder = useCallback((folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;
    openModal({
      title: 'Update Folder',
      description: 'Edit folder details.',
      className: 'sm:max-w-2xl',
      content: <FolderForm folders={folders} folder={folder} onSuccess={reloadAll} />,
    });
  }, [openModal, folders, reloadAll]);

  const handleDeleteFolder = useCallback((folderId: string) => {
    openModal({
      title: 'Delete Folder',
      description: 'Delete this folder and its contents?',
      content: (
        <ConfirmationModal
          title="Confirm Delete"
          description="Remove this folder permanently?"
          variant="danger"
          onConfirm={async () => {
            await deleteQuestionFolder(folderId);
            await reloadAll();
            if (activeFolderId === folderId) setActiveFolderId(undefined);
          }}
        />
      ),
    });
  }, [openModal, activeFolderId, reloadAll]);

  const handleCreateAction = useCallback((tab: QuestionTabId) => {
    const folderId = activeFolderId;
    if (tab === 'CQ') {
      openModal({
        title: 'Add CQ',
        description: 'Create a creative question with sub-parts.',
        className: 'sm:max-w-6xl',
        content: <CqForm folders={folders} initialFolderId={folderId} onSuccess={reloadAll} />,
      });
    } else if (tab === 'SINGLE') {
      openModal({
        title: 'Add Short Question',
        description: 'Create a short / open-ended question.',
        className: 'sm:max-w-5xl',
        content: <SingleQuestionForm folders={folders} initialFolderId={folderId} onSuccess={reloadAll} />,
      });
    } else if (tab === 'MCQ') {
      openModal({
        title: 'Add MCQ',
        description: 'Create a multiple choice question.',
        className: 'sm:max-w-6xl',
        content: <QuestionForm folders={folders} initialFolderId={folderId} initialType="MCQ" initialMcqType="SINGLE" onSuccess={reloadAll} />,
      });
    } else {
      openModal({
        title: 'Add Combined MCQ',
        description: 'Add a passage with linked MCQs.',
        className: 'sm:max-w-4xl',
        content: <PassageForm folders={folders} initialFolderId={folderId} onSuccess={reloadAll} />,
      });
    }
  }, [openModal, folders, activeFolderId, reloadAll]);

  const handleDeleteQuestion = useCallback(
    (id: string, kind: 'question' | 'passage') => {
      openModal({
        title: 'Delete Question',
        description: 'This action cannot be undone.',
        content: (
          <ConfirmationModal
            title="Confirm Delete"
            description="Delete this question permanently? It will be removed from all exam sets that use it."
            variant="danger"
            onConfirm={async () => {
              try {
                const res = kind === 'passage' ? await deletePassage(id) : await deleteQuestion(id);
                if (res.success) {
                  toast({ title: 'Question deleted', description: 'Removed successfully.' });
                  reloadAll();
                } else {
                  toast({ title: 'Error', description: res.message || 'Unknown error', variant: 'destructive' });
                }
              } catch (err: unknown) {
                toast({ title: 'Error', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
              }
            }}
          />
        ),
      });
    },
    [openModal, toast, reloadAll],
  );

  const handleDeleteChildQuestion = useCallback(
    (id: string) => {
      openModal({
        title: 'Delete Question',
        description: 'This action cannot be undone.',
        content: (
          <ConfirmationModal
            title="Confirm Delete"
            description="Delete this question permanently? It will be removed from all exam sets that use it."
            variant="danger"
            onConfirm={async () => {
              try {
                const res = await deleteQuestion(id);
                if (res.success) {
                  toast({ title: 'Question deleted' });
                  reloadAll();
                } else {
                  toast({ title: 'Error', description: res.message || 'Unknown error', variant: 'destructive' });
                }
              } catch (err: unknown) {
                toast({ title: 'Error', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
              }
            }}
          />
        ),
      });
    },
    [openModal, toast, reloadAll],
  );

  /* ---- selection ---- */
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  /* ---- copy ---- */
  const handleCopySingle = useCallback((questionId: string) => {
    setSelectedIds(new Set([questionId]));
    setCopyModalOpen(true);
  }, []);

  const handleCopySelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    setCopyModalOpen(true);
  }, [selectedIds]);

  const executeCopy = useCallback(async () => {
    if (!copyTargetFolderId || selectedIds.size === 0) return;
    try {
      const ids = Array.from(selectedIds);
      if (ids.length === 1) {
        await copyQuestion({ questionId: ids[0], targetFolderId: copyTargetFolderId });
      } else {
        await bulkCopyQuestions({ questionIds: ids, targetFolderId: copyTargetFolderId });
      }
      toast({ title: 'Success', description: `${ids.length} question(s) copied` });
      setCopyModalOpen(false);
      setSelectedIds(new Set());
      setCopyTargetFolderId('');
      reloadAll();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to copy', variant: 'destructive' });
    }
  }, [copyTargetFolderId, selectedIds, toast, reloadAll]);

  /* ---- bulk delete ---- */
  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    openModal({
      title: 'Bulk Delete',
      description: `Delete ${selectedIds.size} selected question(s)?`,
      content: (
        <ConfirmationModal
          title="Confirm Bulk Delete"
          description={`Permanently remove ${selectedIds.size} question(s)? They will be unlinked from all exams.`}
          variant="danger"
          onConfirm={async () => {
            try {
              await bulkDeleteQuestions({ questionIds: Array.from(selectedIds) });
              toast({ title: 'Deleted', description: `${selectedIds.size} question(s) removed` });
              setSelectedIds(new Set());
              reloadAll();
            } catch (err: unknown) {
              toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
            }
          }}
        />
      ),
    });
  }, [selectedIds, openModal, toast, reloadAll]);

  /* ---- view question ---- */
  const handleViewQuestion = useCallback((q: Question) => {
    const meta = q.meta as { isSingle?: boolean; marks?: number; answer?: string; totalMarks?: number; parts?: { label?: string; marks?: number; knowledgeLevel?: string; prompt?: string; answer?: string }[] } | null;
    if (meta?.isSingle) {
      openModal({
        title: 'View Short Question', description: 'Question details.', className: 'sm:max-w-3xl',
        content: (
          <div className="space-y-4 text-slate-700">
            <div><label className="text-xs font-bold uppercase text-slate-500 block mb-1.5">Question</label><div className="prose prose-sm max-w-none rounded-lg bg-slate-50 p-3" dangerouslySetInnerHTML={{ __html: q.prompt }} /></div>
            {meta.answer && <div><label className="text-xs font-bold uppercase text-emerald-600 block mb-1.5">Answer</label><div className="prose prose-sm max-w-none rounded-lg bg-emerald-50 p-3" dangerouslySetInnerHTML={{ __html: meta.answer }} /></div>}
            {meta.marks && <div><label className="text-xs font-bold uppercase text-slate-500 block mb-1.5">Marks</label><p className="font-semibold text-lg text-indigo-600">{meta.marks}</p></div>}
          </div>
        ),
      });
    } else if (q.type === 'CQ') {
      const parts = (meta?.parts as { label?: string; marks?: number; knowledgeLevel?: string; prompt?: string; answer?: string }[]) || [];
      openModal({
        title: 'View Creative Question', description: 'Question details.', className: 'sm:max-w-4xl',
        content: (
          <div className="space-y-4 text-slate-700">
            <div><label className="text-xs font-bold uppercase text-slate-500 block mb-1.5">Question Stimulus</label><div className="prose prose-sm max-w-none rounded-lg bg-slate-50 p-4 border border-slate-100" dangerouslySetInnerHTML={{ __html: q.prompt }} /></div>
            {parts.length > 0 && <div className="space-y-4">{parts.map((part, idx) => (
              <div key={idx} className="flex flex-col gap-3 rounded-4xl bg-white p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-8 w-8 rounded-xl bg-slate-900 border-2 border-slate-100 text-white text-sm font-black shrink-0 shadow-sm">{part.label || String.fromCharCode(65 + idx)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider">{part.marks || '-'} Marks</span>
                    {part.knowledgeLevel && <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full tracking-wider">{part.knowledgeLevel}</span>}
                  </div>
                </div>
                {part.prompt && <div className="prose prose-sm max-w-none text-slate-800 font-medium leading-relaxed pl-2" dangerouslySetInnerHTML={{ __html: part.prompt }} />}
                {part.answer && (
                  <div className="mt-2 pl-4 border-l-4 border-emerald-400 bg-emerald-50/50 p-3 rounded-r-2xl">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 block mb-1.5">Model Answer</label>
                    <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: part.answer }} />
                  </div>
                )}
              </div>
            ))}</div>}
          </div>
        ),
      });
    } else {
      openModal({
        title: 'View MCQ', description: 'Question details.', className: 'sm:max-w-4xl',
        content: (
          <div className="space-y-4 text-slate-700">
            <div><label className="text-xs font-bold uppercase text-slate-500 block mb-1.5">Question</label><div className="prose prose-sm max-w-none rounded-lg bg-slate-50 p-3" dangerouslySetInnerHTML={{ __html: q.prompt }} /></div>
            {q.options && q.options.length > 0 && (
              <div><label className="text-xs font-bold uppercase text-slate-500 block mb-1.5">Options</label><div className="space-y-2">
                {q.options.map((opt) => (
                  <div key={opt.id} className={cn('flex items-start gap-3 rounded-lg p-3', opt.isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50')}>
                    <span className="font-bold shrink-0 text-slate-700">{opt.label}.</span>
                    <p className={cn('text-sm flex-1', opt.isCorrect ? 'font-bold text-emerald-700' : 'text-slate-600')}>{opt.text}</p>
                    {opt.isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />}
                  </div>
                ))}
              </div></div>
            )}
          </div>
        ),
      });
    }
  }, [openModal]);

  /* ---- edit question ---- */
  const handleEditQuestion = useCallback((q: Question) => {
    const meta = q.meta as { isSingle?: boolean } | null;
    if (meta?.isSingle) {
      openModal({ title: 'Update Short Question', description: 'Modify the short question.', className: 'sm:max-w-5xl', content: <SingleQuestionForm folders={folders} question={q} onSuccess={reloadAll} /> });
    } else if (q.type === 'CQ') {
      openModal({ title: 'Update CQ', description: 'Modify creative question.', className: 'sm:max-w-6xl', content: <CqForm folders={folders} question={q} onSuccess={reloadAll} /> });
    } else {
      openModal({ title: 'Update Question', description: 'Modify question.', className: 'sm:max-w-6xl', content: <QuestionForm folders={folders} initialFolderId={q.folderId || undefined} initialType={q.type} initialMcqType={q.mcqType || undefined} question={q} onSuccess={reloadAll} /> });
    }
  }, [openModal, folders, reloadAll]);

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div className="text-slate-900">
      <div className="grid grid-cols-[260px_1fr] min-h-175 bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">

        {/* ================= SIDEBAR ================= */}
        <div className="border-r border-slate-200/60 flex flex-col bg-slate-50/40">
          {/* Header */}
          <div className="px-3 py-3 border-b border-slate-200/60 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Folders</span>
            <button
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors"
              title="New folder"
              onClick={() => handleCreateFolder()}
            >
              <Plus className="h-3.5 w-3.5 text-slate-600" />
            </button>
          </div>

          {/* Search */}
          <div className="p-2 border-b border-slate-200/60">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search folders..."
                value={folderSearch}
                onChange={(e) => setFolderSearch(e.target.value)}
                className="h-8 pl-8 text-xs border-slate-200 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {/* Root "All questions" */}
            <div
              className={cn(
                'flex items-center gap-2 py-1.5 px-3 rounded-lg cursor-pointer transition-colors text-[13px]',
                !activeFolderId ? 'bg-blue-50 text-blue-800' : 'hover:bg-slate-100 text-slate-700',
              )}
              onClick={() => navigate(undefined)}
            >
              <Home className={cn('h-3.5 w-3.5 shrink-0', !activeFolderId ? 'text-blue-500' : 'text-slate-400')} />
              <span className="flex-1 truncate">All questions</span>
              <span className="text-[11px] text-slate-400">{treeTotal}</span>
            </div>
            {folderTree.map((node) => (
              <SidebarFolder
                key={node.id}
                node={node}
                depth={0}
                activeFolderId={activeFolderId}
                folderSearch={folderSearchLower}
                expandedFolderIds={expandedFolderIds}
                onToggleExpand={toggleExpandFolder}
                onNavigate={navigate}
                onEdit={handleEditFolder}
                onDelete={handleDeleteFolder}
                onCreateSub={handleCreateFolder}
              />
            ))}
          </div>
        </div>

        {/* ================= MAIN ================= */}
        <div className="flex flex-col">
          {/* Breadcrumb + Actions */}
          <div className="px-4 py-3 border-b border-slate-200/60 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => navigate(undefined)}
                className={cn('flex items-center gap-1 text-[13px] font-medium transition-colors shrink-0', !activeFolderId ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800')}
              >
                <Home className="h-3.5 w-3.5" /> Root
              </button>
              {breadcrumbs.map((crumb, idx, arr) => (
                <React.Fragment key={crumb.id}>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                  <button
                    onClick={() => navigate(crumb.id)}
                    className={cn('text-[13px] font-medium truncate max-w-35 transition-colors', idx === arr.length - 1 ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800')}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={() => handleCreateFolder(activeFolderId)}>
                <FolderPlus className="mr-1.5 h-3.5 w-3.5" /> New subfolder
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="h-8 text-xs rounded-lg bg-slate-900 text-white hover:bg-slate-800">
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add question <ChevronDown className="ml-1 h-3 w-3 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl p-1">
                  <DropdownMenuItem className="text-[13px] cursor-pointer rounded-lg px-3 py-2" onClick={() => handleCreateAction('MCQ')}>MCQ &mdash; multiple choice</DropdownMenuItem>
                  <DropdownMenuItem className="text-[13px] cursor-pointer rounded-lg px-3 py-2" onClick={() => handleCreateAction('COMBINED')}>Combined MCQ (passage)</DropdownMenuItem>
                  <DropdownMenuItem className="text-[13px] cursor-pointer rounded-lg px-3 py-2" onClick={() => handleCreateAction('CQ')}>CQ &mdash; creative question</DropdownMenuItem>
                  <DropdownMenuItem className="text-[13px] cursor-pointer rounded-lg px-3 py-2" onClick={() => handleCreateAction('SINGLE')}>Short / open-ended</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Filter bar */}
          <div className="px-4 py-2.5 border-b border-slate-200/60 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 text-[13px] border-slate-200 rounded-lg"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
              <SelectTrigger className="h-9 w-32.5 text-xs border-slate-200 rounded-lg">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="MCQ">MCQ</SelectItem>
                <SelectItem value="COMBINED">Combined</SelectItem>
                <SelectItem value="CQ">CQ</SelectItem>
                <SelectItem value="SHORT">Short</SelectItem>
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={(v) => setDifficultyFilter(v as Difficulty | 'all')}>
              <SelectTrigger className="h-9 w-32.5 text-xs border-slate-200 rounded-lg">
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-slate-400 whitespace-nowrap">{filteredItems.length} question{filteredItems.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Bulk bar */}
          {selectedIds.size > 0 && (
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-3">
              <span className="text-[13px] font-medium text-blue-700">{selectedIds.size} selected</span>
              <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg border-blue-200 text-blue-700 hover:bg-blue-100" onClick={handleCopySelected}>
                <Copy className="mr-1 h-3 w-3" /> Copy to folder
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg text-red-600 border-red-200 hover:bg-red-50" onClick={handleBulkDelete}>
                <Trash2 className="mr-1 h-3 w-3" /> Delete
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg text-slate-500 ml-auto" onClick={() => setSelectedIds(new Set())}>Clear</Button>
            </div>
          )}

          {/* Question list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="py-24 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
                <p className="text-xs text-slate-400 mt-4 uppercase tracking-wider font-semibold">Loading questions...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-24 text-center">
                <Search className="h-10 w-10 text-slate-300 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium text-slate-600">No questions found</p>
                <p className="text-[13px] text-slate-400 mt-1">Try adjusting your filters or navigate to a folder</p>
              </div>
            ) : (
              filteredItems.map((item) =>
                item.kind === 'question' ? (
                  <QuestionRow
                    key={item.data.id}
                    q={item.data}
                    displayType={item.displayType}
                    checked={selectedIds.has(item.data.id)}
                    onToggle={() => toggleSelect(item.data.id)}
                    onView={() => handleViewQuestion(item.data)}
                    onCopy={() => handleCopySingle(item.data.id)}
                    onEdit={() => handleEditQuestion(item.data)}
                    onDelete={() => handleDeleteQuestion(item.data.id, 'question')}
                  />
                ) : (
                  <PassageRow
                    key={item.data.id}
                    p={item.data}
                    isExpanded={expandedPassageIds.has(item.data.id)}
                    onToggleExpand={() => setExpandedPassageIds((prev) => { const n = new Set(prev); if (n.has(item.data.id)) n.delete(item.data.id); else n.add(item.data.id); return n; })}
                    onEdit={() => openModal({ title: 'Update Combined MCQ', description: 'Edit passage and its MCQ questions.', className: 'sm:max-w-4xl', content: <PassageForm folders={folders} passage={item.data} onSuccess={reloadAll} /> })}
                    onDelete={() => handleDeleteQuestion(item.data.id, 'passage')}
                    onEditChild={(cq) => handleEditQuestion(cq)}
                    onDeleteChild={(cq) => handleDeleteChildQuestion(cq.id)}
                  />
                ),
              )
            )}
          </div>
        </div>
      </div>

      {/* ================= COPY MODAL ================= */}
      <Dialog open={copyModalOpen} onOpenChange={(open) => { if (!open) { setCopyModalOpen(false); setCopyTargetFolderId(''); } }}>
        <DialogContent showCloseButton className="flex max-h-[92vh] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl sm:max-w-xl">
          <DialogHeader className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Copy className="h-5 w-5" /></div>
              <div>
                <DialogTitle className="text-lg font-bold">Copy question{selectedIds.size > 1 ? 's' : ''}</DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-0.5">
                  Duplicate <span className="font-semibold text-slate-700">{selectedIds.size}</span> question{selectedIds.size > 1 ? 's' : ''} into another folder.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Target folder</label>
            <Select value={copyTargetFolderId || undefined} onValueChange={setCopyTargetFolderId}>
              <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 text-sm font-medium">
                <div className="flex items-center gap-2"><Folder className="h-4 w-4 text-slate-400" /><SelectValue placeholder="Choose a folder..." /></div>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {allFoldersFlat.length === 0
                  ? <div className="px-4 py-6 text-center text-sm text-slate-400">No folders available</div>
                  : allFoldersFlat.map((f) => (
                    <SelectItem key={f.id} value={f.id} className="rounded-lg py-2.5 text-sm font-medium cursor-pointer">
                      <span className="flex items-center gap-2"><Folder className="h-3.5 w-3.5 text-slate-400" />{f.name}</span>
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs text-slate-400">Copies appear as new items in the chosen folder.</p>
          </div>
          <div className="flex gap-2 border-t border-slate-100 px-6 py-4 justify-end">
            <Button variant="ghost" className="rounded-xl" onClick={() => { setCopyModalOpen(false); setCopyTargetFolderId(''); }}>Cancel</Button>
            <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800" disabled={!copyTargetFolderId} onClick={executeCopy}>
              <Copy className="mr-1.5 h-4 w-4" /> Confirm Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

/* ================================================================ */
/*  Question row                                                     */
/* ================================================================ */
function QuestionRow({
  q,
  displayType,
  checked,
  onToggle,
  onView,
  onCopy,
  onEdit,
  onDelete,
}: {
  q: Question;
  displayType: string;
  checked: boolean;
  onToggle: () => void;
  onView: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = q.meta as { isSingle?: boolean; marks?: number; answer?: string; totalMarks?: number; parts?: { label?: string; marks?: number; knowledgeLevel?: string }[] } | null;
  const isSingle = !!meta?.isSingle;
  const marks = isSingle ? (meta?.marks ?? '—') : q.type === 'CQ' && meta?.totalMarks ? meta.totalMarks : '1';

  return (
    <div className="flex gap-3 items-start px-4 py-3 border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
      <input type="checkbox" checked={checked} onChange={onToggle} className="mt-1 shrink-0 cursor-pointer rounded border-slate-300" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <Badge variant="outline" className={cn('text-[10px] font-semibold uppercase px-2 py-0', TYPE_BADGE[displayType] || '')}>{displayType}</Badge>
          {q.difficulty && <Badge variant="outline" className={cn('text-[10px] font-semibold uppercase px-2 py-0', DIFF_BADGE[q.difficulty] || '')}>{q.difficulty}</Badge>}
          {q.year && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">{q.year}</span>}
          <span className="text-xs text-slate-400 ml-auto">{marks} mark{marks !== 1 && marks !== '1' ? 's' : ''}</span>
        </div>
        <p className="text-[13px] text-slate-800 leading-relaxed line-clamp-2">{stripHtml(q.prompt)}</p>
        {/* MCQ options */}
        {q.options && q.options.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {q.options.map((opt) => (
              <span key={opt.id} className={cn('text-[11px] px-2 py-0.5 rounded-md border', opt.isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold' : 'bg-slate-50 text-slate-500 border-slate-200')}>
                {opt.isCorrect && <span className="mr-0.5">&#10003;</span>} {opt.text}
              </span>
            ))}
          </div>
        )}
        {/* CQ parts */}
        {q.type === 'CQ' && !isSingle && meta?.parts && Array.isArray(meta.parts) && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {(meta.parts as { label?: string; marks?: number; knowledgeLevel?: string }[]).map((part, pi) => (
              <span key={pi} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                {part.label} &bull; {part.marks}m{part.knowledgeLevel ? ` \u00b7 ${part.knowledgeLevel}` : ''}
              </span>
            ))}
          </div>
        )}
        {/* Single answer preview */}
        {isSingle && meta?.answer && (
          <p className="text-xs text-emerald-700 mt-1 line-clamp-1">
            <span className="font-semibold">Ans:</span> {stripHtml(meta.answer).substring(0, 80)}{stripHtml(meta.answer).length > 80 ? '\u2026' : ''}
          </p>
        )}
      </div>
      <div className="flex gap-0.5 shrink-0 items-center mt-0.5">
        <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 hover:text-blue-600" title="Preview" onClick={onView}><Eye className="h-3.5 w-3.5" /></button>
        <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 hover:text-blue-600" title="Copy" onClick={onCopy}><Copy className="h-3.5 w-3.5" /></button>
        <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 hover:text-indigo-600" title="Edit" onClick={onEdit}><Edit className="h-3.5 w-3.5" /></button>
        <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 hover:text-red-600" title="Delete" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

/* ================================================================ */
/*  Passage (Combined MCQ) row                                       */
/* ================================================================ */
function PassageRow({
  p,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onEditChild,
  onDeleteChild,
}: {
  p: McqPassage;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onEditChild: (q: Question) => void;
  onDeleteChild: (q: Question) => void;
}) {
  return (
    <div className="border-b border-slate-100">
      <div className="flex gap-3 items-start px-4 py-3 hover:bg-slate-50/60 transition-colors cursor-pointer" onClick={onToggleExpand}>
        <div className="mt-1 shrink-0">
          {isExpanded ? <ChevronUp className="h-4 w-4 text-indigo-500" /> : <ChevronDown className="h-4 w-4 text-slate-300" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <Badge variant="outline" className={cn('text-[10px] font-semibold uppercase px-2 py-0', TYPE_BADGE.COMBINED)}>COMBINED</Badge>
            {p.difficulty && <Badge variant="outline" className={cn('text-[10px] font-semibold uppercase px-2 py-0', DIFF_BADGE[p.difficulty] || '')}>{p.difficulty}</Badge>}
            {p.year && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">{p.year}</span>}
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">{p.questions?.length || 0} linked MCQs</span>
          </div>
          <p className="text-[13px] font-medium text-slate-800">{p.title || 'Untitled Passage'}</p>
          {!isExpanded && <p className="text-[13px] text-slate-500 line-clamp-1 mt-0.5">{stripHtml(p.content)}</p>}
        </div>
        <div className="flex gap-0.5 shrink-0 items-center mt-0.5" onClick={(e) => e.stopPropagation()}>
          <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 hover:text-indigo-600" title="Edit" onClick={onEdit}><Edit className="h-3.5 w-3.5" /></button>
          <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 hover:text-red-600" title="Delete" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 ml-7 space-y-3 animate-in fade-in">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: p.content }} />
          </div>
          {p.questions && p.questions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Questions ({p.questions.length})</h4>
              {p.questions.map((cq, idx) => (
                <div key={cq.id} className="bg-white border border-slate-100 rounded-xl p-3 flex items-start gap-3">
                  <span className="shrink-0 h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-slate-800 leading-snug" dangerouslySetInnerHTML={{ __html: cq.prompt }} />
                    {cq.options && cq.options.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 mt-2">
                        {cq.options.map((opt) => (
                          <div key={opt.id} className={cn('text-[11px] flex gap-1 p-1.5 rounded-md', opt.isCorrect ? 'bg-emerald-50 font-semibold text-emerald-700' : 'bg-slate-50 text-slate-600')}>
                            <span className="font-bold shrink-0">{opt.label}.</span>
                            {opt.isCorrect && <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />}
                            <span className="truncate">{opt.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 hover:text-indigo-600" onClick={() => onEditChild(cq)}><Edit className="h-3 w-3" /></button>
                    <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 hover:text-red-600" onClick={() => onDeleteChild(cq)}><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {(!p.questions || p.questions.length === 0) && <p className="text-center py-4 text-sm text-slate-400">No questions in this passage yet.</p>}
        </div>
      )}
    </div>
  );
}

export default function QuestionsPage() {
  return <QuestionsPageInner />;
}
