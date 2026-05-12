'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  getQuestionFolders,
  deleteQuestionFolder,
  getQuestions,
  getQuestionById,
  deleteQuestion,
  getPassages,
  deletePassage,
} from '@/lib/api/question-bank';
import { getCourses } from '@/lib/api/courses';
import type {
  Question,
  QuestionFolder,
  Difficulty,
  McqPassage,
  QuestionType,
} from '@/types/question';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  BookOpenCheck,
  ChevronDown,
  ChevronUp,
  Edit,
  Folder,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  CheckCircle2,
  Database,
  LayoutGrid,
  FileText,
  Home,
  ChevronRight,
  FolderPlus,
  MoreHorizontal,
  Layers,
  AlignLeft,
  PenLine,
  Upload,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { FolderForm } from '@/features/admin/questions';
import { PassageForm } from '@/features/admin/questions';
import { QuestionForm } from '@/features/admin/questions';
import { CqForm } from '@/features/admin/questions';
import { ShortQuestionForm } from '@/features/admin/questions';
import { QuestionDetailsView } from '@/features/admin/questions';
import { FolderTree } from '@/features/admin/questions';
import { BulkQuestionImportModal } from '@/features/admin/questions/components/BulkQuestionImportModal';
import { BULK_QUESTION_IMPORT_COMPLETE_EVENT } from '@/features/admin/students';
import { ConfirmationModal } from '@/features/admin/shared';
import { cn } from '@/lib/utils';

type ActiveTab = 'MCQ_SIMPLE' | 'MCQ_PASSAGE' | 'CQ' | 'SHORT';

const difficultyOptions: (Difficulty | 'all')[] = ['all', 'EASY', 'MEDIUM', 'HARD'];

function getDifficultyBadgeClass(difficulty: string) {
  if (difficulty === 'EASY') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (difficulty === 'MEDIUM') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (difficulty === 'HARD') return 'bg-rose-50 text-rose-700 border-rose-100';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

function getTypeBadgeClass(type: QuestionType) {
  if (type === 'MCQ') return 'bg-indigo-50 text-indigo-700 border-indigo-100';
  if (type === 'CQ') return 'bg-violet-50 text-violet-700 border-violet-100';
  if (type === 'SHORT') return 'bg-sky-50 text-sky-700 border-sky-100';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

const TAB_CONFIG: { id: ActiveTab; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'MCQ_SIMPLE', label: 'Simple MCQ', icon: Database, description: '1 question · 4 options · 1 answer' },
  { id: 'MCQ_PASSAGE', label: 'Passage MCQ', icon: Layers, description: 'Stimulus + multiple MCQs' },
  { id: 'CQ', label: 'Creative (CQ)', icon: PenLine, description: 'ক খ গ ঘ — 10 mark structure' },
  { id: 'SHORT', label: 'Short Questions', icon: AlignLeft, description: 'Direct recall · 1–3 line answer' },
];

function stripHtml(html: string) {
  return html ? html.replace(/<[^>]+>/g, '') : '';
}

export default function QuestionsPage() {
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();

  const [folders, setFolders] = useState<QuestionFolder[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passages, setPassages] = useState<McqPassage[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [folderSearchQuery, setFolderSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('MCQ_SIMPLE');
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(undefined);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<string>>(new Set());
  const [expandedPassageIds, setExpandedPassageIds] = useState<Set<string>>(new Set());

  // ─── Data Loaders ────────────────────────────────────────────────────────────

  const loadFolders = useCallback(async () => {
    try {
      const res = await getQuestionFolders();
      if (res.success && res.data) setFolders(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadCourses = useCallback(async () => {
    try {
      const res = await getCourses({});
      if (res.success && res.data) setCourses(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const difficulty = difficultyFilter === 'all' ? undefined : difficultyFilter;
      const questionType: string = activeTab === 'MCQ_SIMPLE' || activeTab === 'MCQ_PASSAGE' ? 'MCQ' : activeTab;
      const mcqType = activeTab === 'MCQ_SIMPLE' ? 'SINGLE' : activeTab === 'MCQ_PASSAGE' ? undefined : undefined;
      const res = await getQuestions(
        activeFolderId,
        questionType,
        difficulty,
        undefined,
        undefined,
        mcqType,
        undefined,
        selectedFolderIds.length > 0 ? selectedFolderIds : undefined,
      );
      if (res.success && res.data) setQuestions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeFolderId, selectedFolderIds, activeTab, difficultyFilter]);

  const loadPassages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPassages(
        activeFolderId,
        selectedFolderIds.length > 0 ? selectedFolderIds : undefined,
      );
      if (res.success && res.data) setPassages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeFolderId, selectedFolderIds]);

  useEffect(() => {
    loadFolders();
    loadCourses();
  }, [loadFolders, loadCourses]);

  useEffect(() => {
    if (activeTab === 'MCQ_PASSAGE') {
      loadPassages();
    } else {
      loadQuestions();
    }
  }, [activeFolderId, selectedFolderIds, difficultyFilter, activeTab, loadQuestions, loadPassages]);

  // ─── Folder Navigation ───────────────────────────────────────────────────────

  const getBreadcrumbs = (): QuestionFolder[] => {
    const crumbs: QuestionFolder[] = [];
    let currentId = activeFolderId;
    while (currentId) {
      const folder = folders.find((f) => f.id === currentId);
      if (folder) {
        crumbs.unshift(folder);
        currentId = folder.parentFolderId ?? undefined;
      } else {
        break;
      }
    }
    return crumbs;
  };

  const currentSubfolders = folders.filter((f) =>
    activeFolderId ? f.parentFolderId === activeFolderId : !f.parentFolderId,
  );

  const getFolderById = useCallback(
    (id?: string) => (id ? folders.find((f) => f.id === id) : undefined),
    [folders],
  );

  const getDescendantFolders = useCallback(
    (rootId?: string) => {
      const roots = rootId ? [rootId] : folders.filter((f) => !f.parentFolderId).map((f) => f.id);
      const levels: QuestionFolder[][] = [];
      let queue = roots.map((id) => ({ id, level: 0 }));
      const visited = new Set<string>();
      while (queue.length > 0) {
        const next: Array<{ id: string; level: number }> = [];
        queue.forEach(({ id, level }) => {
          if (visited.has(id)) return;
          visited.add(id);
          const node = getFolderById(id);
          if (!node) return;
          if (!levels[level]) levels[level] = [];
          levels[level].push(node);
          folders
            .filter((f) => f.parentFolderId === id)
            .forEach((child) => next.push({ id: child.id, level: level + 1 }));
        });
        queue = next;
      }
      return levels;
    },
    [folders, getFolderById],
  );

  // ─── Folder Actions ──────────────────────────────────────────────────────────

  const handleCreateFolder = (parentId?: string) => {
    openModal({
      title: parentId ? 'New Subfolder' : 'New Folder',
      description: 'Create a new folder to organise your questions.',
      className: 'sm:max-w-2xl',
      content: (
        <FolderForm
          folders={folders}
          initialParentId={parentId ?? activeFolderId}
          onSuccess={loadFolders}
        />
      ),
    });
  };

  const handleEditFolder = (folder: QuestionFolder) => {
    openModal({
      title: 'Edit Folder',
      description: 'Update folder name or move it to a different parent.',
      className: 'sm:max-w-2xl',
      content: <FolderForm folders={folders} folder={folder} onSuccess={loadFolders} />,
    });
  };

  const handleDeleteFolder = (id: string) => {
    openModal({
      title: 'Delete Folder',
      description: 'This will permanently remove the folder and all its contents.',
      content: (
        <ConfirmationModal
          title="Confirm Delete"
          description="Are you sure you want to delete this folder? All nested questions will be affected."
          onConfirm={async () => {
            await deleteQuestionFolder(id);
            await loadFolders();
            if (activeFolderId === id) setActiveFolderId(undefined);
            setSelectedFolderIds((prev) => prev.filter((fid) => fid !== id));
          }}
        />
      ),
    });
  };

  // ─── Question Actions ────────────────────────────────────────────────────────

  const handleCreateQuestion = () => {
    const fid = activeFolderId;
    switch (activeTab) {
      case 'MCQ_SIMPLE':
        openModal({
          title: 'New Simple MCQ',
          description: 'One question with 4 options and one correct answer.',
          className: 'sm:max-w-6xl',
          content: (
            <QuestionForm
              folders={folders}
              initialFolderId={fid}
              initialType="MCQ"
              initialMcqType="SINGLE"
              onSuccess={loadQuestions}
            />
          ),
        });
        break;
      case 'MCQ_PASSAGE':
        openModal({
          title: 'New Passage (Combined MCQ)',
          description: 'Create a stimulus passage for 2–5 MCQ questions.',
          className: 'sm:max-w-4xl',
          content: <PassageForm folders={folders} onSuccess={loadPassages} />,
        });
        break;
      case 'CQ':
        openModal({
          title: 'New Creative Question',
          description: 'Create a CQ with ক, খ, গ, ঘ sub-parts (10 marks).',
          className: 'sm:max-w-6xl',
          content: (
            <CqForm folders={folders} initialFolderId={fid} onSuccess={loadQuestions} />
          ),
        });
        break;
      case 'SHORT':
        openModal({
          title: 'New Short Question',
          description: 'Direct recall or definition — 1 to 3 line answer.',
          className: 'sm:max-w-4xl',
          content: (
            <ShortQuestionForm folders={folders} initialFolderId={fid} onSuccess={loadQuestions} />
          ),
        });
        break;
    }
  };

  const handleBulkImport = () => {
    const folder = getFolderById(activeFolderId);
    if (!folder) {
      toast({
        title: 'Select a folder',
        description: 'Bulk import uses one selected target folder.',
        variant: 'destructive',
      });
      return;
    }

    openModal({
      title: 'Bulk Import Questions',
      description: `Import questions into ${folder.name}.`,
      className: 'sm:max-w-6xl',
      content: <BulkQuestionImportModal folder={folder} />,
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleQuestionImportComplete = () => {
      void loadFolders();
      void loadQuestions();
      void loadPassages();
    };

    window.addEventListener(BULK_QUESTION_IMPORT_COMPLETE_EVENT, handleQuestionImportComplete);
    return () => {
      window.removeEventListener(BULK_QUESTION_IMPORT_COMPLETE_EVENT, handleQuestionImportComplete);
    };
  }, [loadFolders, loadPassages, loadQuestions]);

  const handleEditQuestion = async (id: string) => {
    const res = await getQuestionById(id);
    if (!res.success || !res.data) {
      toast({ title: 'Error', description: 'Could not load question.', variant: 'destructive' });
      return;
    }
    const q = res.data;
    if (q.type === 'CQ') {
      openModal({
        title: 'Edit Creative Question',
        description: 'Update the CQ stimulus and sub-parts.',
        className: 'sm:max-w-6xl',
        content: <CqForm folders={folders} question={q} onSuccess={loadQuestions} />,
      });
    } else if (q.type === 'SHORT') {
      openModal({
        title: 'Edit Short Question',
        description: 'Update the short question.',
        className: 'sm:max-w-4xl',
        content: <ShortQuestionForm folders={folders} question={q} onSuccess={loadQuestions} />,
      });
    } else {
      openModal({
        title: 'Edit MCQ',
        description: 'Update the MCQ prompt and options.',
        className: 'sm:max-w-6xl',
        content: <QuestionForm folders={folders} question={q} onSuccess={loadQuestions} />,
      });
    }
  };

  const handleDeleteQuestion = (id: string) => {
    openModal({
      title: 'Delete Question',
      description: 'This will permanently remove the question.',
      content: (
        <ConfirmationModal
          title="Confirm Delete"
          description="Are you sure you want to delete this question? This cannot be undone."
          onConfirm={async () => {
            await deleteQuestion(id);
            await loadQuestions();
          }}
        />
      ),
    });
  };

  const handleDeletePassage = (id: string) => {
    openModal({
      title: 'Delete Passage',
      description: 'This will remove the passage and all its linked questions.',
      content: (
        <ConfirmationModal
          title="Confirm Delete"
          description="Are you sure? All child MCQ questions linked to this passage will also be deleted."
          onConfirm={async () => {
            await deletePassage(id);
            await loadPassages();
          }}
        />
      ),
    });
  };

  // ─── Filtering ────────────────────────────────────────────────────────────────

  const filteredQuestions = questions.filter((q) => {
    if (activeTab === 'MCQ_SIMPLE') {
      if (q.type !== 'MCQ' || q.mcqType === 'PASSAGE_CHILD') return false;
    } else if (activeTab === 'MCQ_PASSAGE') {
      return false; // passages handled separately
    } else if (activeTab === 'CQ') {
      if (q.type !== 'CQ') return false;
    } else if (activeTab === 'SHORT') {
      if (q.type !== 'SHORT') return false;
    }
    const qry = searchQuery.toLowerCase();
    return !qry || stripHtml(q.prompt).toLowerCase().includes(qry);
  });

  const filteredPassages = passages.filter((p) => {
    const qry = searchQuery.toLowerCase();
    return !qry || (p.title || '').toLowerCase().includes(qry) || stripHtml(p.content).toLowerCase().includes(qry);
  });

  const filteredSubfolders = currentSubfolders.filter(
    (f) => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const nestedLevels = getDescendantFolders(activeFolderId);
  const activeFolderName = getFolderById(activeFolderId)?.name ?? 'Root';

  // ─── Stats ────────────────────────────────────────────────────────────────────

  const statsAll = {
    mcq: questions.filter((q) => q.type === 'MCQ').length,
    cq: questions.filter((q) => q.type === 'CQ').length,
    short: questions.filter((q) => q.type === 'SHORT').length,
  };

  // ─── Toggle helpers ────────────────────────────────────────────────────────────

  const toggleExpand = (id: string) => {
    setExpandedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePassageExpand = (id: string) => {
    setExpandedPassageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const breadcrumbs = getBreadcrumbs();

  const createButtonLabel = () => {
    switch (activeTab) {
      case 'MCQ_SIMPLE': return 'New Simple MCQ';
      case 'MCQ_PASSAGE': return 'New Passage';
      case 'CQ': return 'New CQ';
      case 'SHORT': return 'New Short Q';
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* ── Stats Header ── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: 'Total Questions',
            value: questions.length + passages.length,
            color: 'from-blue-600 to-cyan-500',
            icon: BookOpenCheck,
          },
          { label: 'Simple MCQ', value: statsAll.mcq, color: 'from-indigo-600 to-purple-600', icon: Database },
          { label: 'Passages', value: passages.length, color: 'from-violet-600 to-indigo-500', icon: Layers },
          { label: 'Creative (CQ)', value: statsAll.cq, color: 'from-rose-600 to-pink-600', icon: PenLine },
          { label: 'Short Questions', value: statsAll.short, color: 'from-sky-600 to-teal-500', icon: AlignLeft },
        ].map((stat, i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-[28px] border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/30 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md group-hover:scale-110 transition-transform',
                  stat.color,
                )}
              >
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <p className="mt-0.5 text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Main Layout ── */}
      <div className="flex gap-6 min-h-[75vh]">
        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-64 shrink-0 space-y-4 hidden lg:block">
          {/* Type Navigator */}
          <div className="rounded-[24px] border border-slate-100 bg-white p-3 shadow-sm space-y-1">
            <p className="px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
              Question Type
            </p>
            {TAB_CONFIG.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all duration-200',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )}
                >
                  <div
                    className={cn(
                      'h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-sm font-bold leading-tight truncate', isActive && 'text-indigo-700')}>
                      {tab.label}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{tab.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Folder Tree */}
          <div className="rounded-[24px] border border-slate-100 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between px-2 py-1.5 mb-2">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Folders</p>
              <button
                onClick={() => handleCreateFolder()}
                className="h-6 w-6 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 flex items-center justify-center transition-colors"
                title="New Root Folder"
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mb-2 px-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={folderSearchQuery}
                  onChange={(e) => setFolderSearchQuery(e.target.value)}
                  placeholder="Find nested folders..."
                  className="h-8 pl-8 pr-2 border-none bg-slate-50 rounded-xl text-xs font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            {/* Root option */}
            <button
              onClick={() => setActiveFolderId(undefined)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all',
                !activeFolderId
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )}
            >
              <Home className="h-4 w-4 shrink-0" />
              All Folders
            </button>

            <div className="mt-1">
              <FolderTree
                folders={folders}
                selectedFolderIds={selectedFolderIds}
                onSelectFolders={setSelectedFolderIds}
                onEditFolder={handleEditFolder}
                onDeleteFolder={handleDeleteFolder}
                onCreateSubfolder={(parentId) => handleCreateFolder(parentId)}
                activeFolderId={activeFolderId}
                onActiveFolderChange={(id) => setActiveFolderId(id)}
                searchQuery={folderSearchQuery}
              />
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Breadcrumb + Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3 rounded-[24px] border border-slate-200/60 shadow-sm">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveFolderId(undefined)}
                className={cn(
                  'flex items-center gap-1.5 text-sm font-bold transition-colors shrink-0 px-2 py-1 rounded-lg',
                  !activeFolderId ? 'text-slate-900 bg-slate-100' : 'text-slate-400 hover:text-slate-700',
                )}
              >
                <Home className="h-3.5 w-3.5" />
                <span>Root</span>
              </button>

              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.id}>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                  <button
                    onClick={() => setActiveFolderId(crumb.id)}
                    className={cn(
                      'text-sm font-bold truncate max-w-[160px] transition-colors px-2 py-1 rounded-lg',
                      idx === breadcrumbs.length - 1
                        ? 'text-slate-900 bg-slate-100'
                        : 'text-slate-400 hover:text-slate-700',
                    )}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={handleBulkImport}
                disabled={!activeFolderId}
                className="h-9 rounded-xl bg-white border-slate-200 text-slate-700 font-bold hover:bg-slate-50 shadow-sm text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Upload className="mr-1.5 h-4 w-4" />
                Bulk Import
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCreateFolder()}
                className="h-9 rounded-xl bg-white border-slate-200 text-slate-700 font-bold hover:bg-slate-50 shadow-sm text-sm"
              >
                <FolderPlus className="mr-1.5 h-4 w-4" />
                New Folder
              </Button>
              <Button
                onClick={handleCreateQuestion}
                className="h-9 rounded-xl bg-slate-900 text-white font-bold hover:bg-indigo-600 shadow-sm text-sm transition-colors"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                {createButtonLabel()}
              </Button>
            </div>
          </div>

          {/* Search + Filter toolbar */}
          <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-3 rounded-[24px] border border-slate-200/60 shadow-sm">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search questions or folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 border-none bg-slate-50 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-medium"
              />
            </div>

            {activeTab !== 'MCQ_PASSAGE' && (
              <Select
                value={difficultyFilter}
                onValueChange={(v) => setDifficultyFilter(v as Difficulty | 'all')}
              >
                <SelectTrigger className="h-9 w-[140px] border-none bg-slate-50 rounded-xl text-sm font-medium">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Levels</SelectItem>
                  {difficultyOptions
                    .filter((o) => o !== 'all')
                    .map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}

            <Button
              variant="outline"
              className="h-9 w-9 p-0 border-none bg-slate-50 rounded-xl hover:bg-slate-100 shrink-0"
              onClick={() => {
                loadFolders();
                if (activeTab === 'MCQ_PASSAGE') loadPassages();
                else loadQuestions();
              }}
            >
              <RefreshCw className={cn('h-4 w-4 text-slate-600', loading && 'animate-spin')} />
            </Button>

            {selectedFolderIds.length > 0 && (
              <button
                onClick={() => setSelectedFolderIds([])}
                className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {selectedFolderIds.length} folder{selectedFolderIds.length > 1 ? 's' : ''} selected · clear
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-sm overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                  Loading...
                </p>
              </div>
            ) : (
              <>
                {/* ── Subfolder Grid ── */}
                {filteredSubfolders.length > 0 && (
                  <div className="px-6 pt-6 pb-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                      Folders ({filteredSubfolders.length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {filteredSubfolders.map((folder) => {
                        const hasChildren = folders.some((f) => f.parentFolderId === folder.id);
                        return (
                          <button
                            key={folder.id}
                            onClick={() => setActiveFolderId(folder.id)}
                            className="group flex flex-col items-start gap-2 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50 hover:border-indigo-100 transition-all text-left"
                          >
                            {hasChildren ? (
                              <FolderOpen className="h-7 w-7 text-amber-400 group-hover:text-indigo-500 transition-colors" />
                            ) : (
                              <Folder className="h-7 w-7 text-amber-400 group-hover:text-indigo-500 transition-colors" />
                            )}
                            <div className="min-w-0 w-full">
                              <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 truncate transition-colors">
                                {folder.name}
                              </p>
                              {folder._count && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {folder._count.questions} questions
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="border-b border-slate-100 mt-5" />
                  </div>
                )}

                {/* ── Nested Folder Browser ── */}
                {nestedLevels.length > 0 && (
                  <div className="px-6 pb-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Nested Browser · {activeFolderName}
                        </p>
                        {activeFolderId && (
                          <button
                            onClick={() => setActiveFolderId(undefined)}
                            className="text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            Back to root
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {nestedLevels.slice(1).map((levelFolders, depthIdx) => (
                          <div key={depthIdx}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1.5">
                              Level {depthIdx + 1}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {levelFolders.map((folder) => (
                                <button
                                  key={folder.id}
                                  onClick={() => setActiveFolderId(folder.id)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                                >
                                  <Folder className="h-3.5 w-3.5" />
                                  <span>{folder.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        {nestedLevels.length <= 1 && (
                          <p className="text-xs text-slate-400">No deeper nested folders under this node.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Passage View (MCQ_PASSAGE tab) ── */}
                {activeTab === 'MCQ_PASSAGE' && (
                  <div className="p-6 space-y-4">
                    {filteredPassages.length === 0 ? (
                      <div className="py-16 text-center text-slate-400 text-sm font-medium">
                        No passages found. Create the first passage.
                      </div>
                    ) : (
                      filteredPassages.map((p) => {
                        const isExpanded = expandedPassageIds.has(p.id);
                        return (
                          <div
                            key={p.id}
                            className="rounded-[20px] border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-all hover:border-indigo-100 group"
                          >
                            <div
                              className="flex items-start justify-between gap-4 cursor-pointer"
                              onClick={() => togglePassageExpand(p.id)}
                            >
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-indigo-500 shrink-0" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 shrink-0" />
                                  )}
                                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black text-[10px] uppercase px-2 py-0.5">
                                    PASSAGE
                                  </Badge>
                                  {p.difficulty && (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        'px-2 py-0.5 text-[10px] font-bold uppercase',
                                        getDifficultyBadgeClass(p.difficulty),
                                      )}
                                    >
                                      {p.difficulty}
                                    </Badge>
                                  )}
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                                    {p.questions?.length || 0} questions
                                  </span>
                                </div>
                                <h3 className="text-base font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                                  {p.title || 'Untitled Passage'}
                                </h3>
                                {!isExpanded && (
                                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                                    {stripHtml(p.content)}
                                  </p>
                                )}
                              </div>
                              <div
                                className="flex items-center gap-1 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                  onClick={() => handleDeletePassage(p.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="mt-5 pt-5 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="bg-slate-50 p-5 rounded-[16px] border border-slate-100">
                                  <div
                                    className="prose prose-sm max-w-none text-slate-700"
                                    dangerouslySetInnerHTML={{ __html: p.content }}
                                  />
                                </div>
                                {p.questions && p.questions.length > 0 && (
                                  <div className="mt-4 space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                      Linked Questions
                                    </p>
                                    {p.questions.map((q, qi) => (
                                      <div
                                        key={q.id}
                                        className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100"
                                      >
                                        <span className="h-6 w-6 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black flex items-center justify-center shrink-0">
                                          {qi + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-slate-700 line-clamp-2">
                                            {stripHtml(q.prompt)}
                                          </p>
                                          {q.options && (
                                            <div className="flex flex-wrap gap-3 mt-1.5">
                                              {q.options.map((opt) => (
                                                <span
                                                  key={opt.id}
                                                  className={cn(
                                                    'text-xs font-medium',
                                                    opt.isCorrect ? 'text-emerald-600 font-bold' : 'text-slate-400',
                                                  )}
                                                >
                                                  {opt.label}. {opt.text}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-lg text-slate-400 hover:text-indigo-600"
                                            onClick={() => handleEditQuestion(q.id)}
                                          >
                                            <Edit className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-500"
                                            onClick={() => handleDeleteQuestion(q.id)}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* ── Questions Table (MCQ_SIMPLE, CQ, SHORT tabs) ── */}
                {activeTab !== 'MCQ_PASSAGE' && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-slate-100">
                          <TableHead className="py-3 pl-6 text-xs font-black uppercase tracking-wider text-slate-500">
                            Question
                          </TableHead>
                          <TableHead className="py-3 text-xs font-black uppercase tracking-wider text-slate-500 w-[120px]">
                            Type
                          </TableHead>
                          <TableHead className="py-3 text-xs font-black uppercase tracking-wider text-slate-500 w-[100px]">
                            Difficulty
                          </TableHead>
                          <TableHead className="py-3 text-xs font-black uppercase tracking-wider text-slate-500 w-[70px]">
                            Year
                          </TableHead>
                          <TableHead className="py-3 pr-6 w-[90px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredQuestions.length === 0 && filteredSubfolders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="py-20 text-center text-slate-400 text-sm font-medium">
                              No questions found.{' '}
                              <button
                                onClick={handleCreateQuestion}
                                className="text-indigo-500 font-bold hover:underline"
                              >
                                Create one now.
                              </button>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredQuestions.map((q) => {
                            const isExpanded = expandedQuestionIds.has(q.id);
                            const meta = q.meta as any;
                            return (
                              <React.Fragment key={q.id}>
                                <TableRow className="group border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                  <TableCell className="py-4 pl-6 max-w-[420px]">
                                    <div className="space-y-1.5">
                                      <div
                                        className="text-sm font-medium text-slate-800 leading-snug line-clamp-2"
                                        dangerouslySetInnerHTML={{
                                          __html:
                                            stripHtml(q.prompt).substring(0, 180) +
                                            (stripHtml(q.prompt).length > 180 ? '...' : ''),
                                        }}
                                      />
                                      {q.type === 'MCQ' && q.options && q.options.length > 0 && !isExpanded && (
                                        <div className="flex flex-wrap gap-3">
                                          {q.options.slice(0, 4).map((opt) => (
                                            <span
                                              key={opt.id}
                                              className={cn(
                                                'text-xs flex items-center gap-1',
                                                opt.isCorrect
                                                  ? 'font-bold text-emerald-600'
                                                  : 'text-slate-400',
                                              )}
                                            >
                                              {opt.isCorrect && (
                                                <CheckCircle2 className="h-3 w-3" />
                                              )}
                                              <span>
                                                {opt.label}. {opt.text}
                                              </span>
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {q.type === 'CQ' && meta?.parts && !isExpanded && (
                                        <div className="flex gap-2 flex-wrap">
                                          {(meta.parts as any[]).slice(0, 4).map((part: any) => (
                                            <span
                                              key={part.label}
                                              className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg"
                                            >
                                              ({part.label}) {part.marks}M
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {q.type === 'SHORT' && meta?.answer && !isExpanded && (
                                        <p className="text-xs text-slate-400 line-clamp-1 italic">
                                          ↳ {stripHtml(meta.answer)}
                                        </p>
                                      )}
                                      {q.tags && q.tags.length > 0 && (
                                        <div className="flex gap-1.5 flex-wrap mt-1">
                                          {q.tags.slice(0, 3).map((tag) => (
                                            <span
                                              key={tag}
                                              className="text-[9px] font-black uppercase tracking-wide bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-md"
                                            >
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <Badge
                                      className={cn(
                                        'font-bold text-[10px] uppercase shadow-none border',
                                        getTypeBadgeClass(q.type),
                                      )}
                                    >
                                      {q.type === 'MCQ'
                                        ? q.mcqType === 'PASSAGE_CHILD'
                                          ? 'Passage MCQ'
                                          : 'Simple MCQ'
                                        : q.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    {q.difficulty ? (
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          'font-bold text-[10px] uppercase',
                                          getDifficultyBadgeClass(q.difficulty),
                                        )}
                                      >
                                        {q.difficulty}
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-slate-300">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="py-4 text-sm font-medium text-slate-500">
                                    {q.year ?? <span className="text-slate-300">—</span>}
                                  </TableCell>
                                  <TableCell className="py-4 pr-6">
                                    <div
                                      className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                        onClick={() => toggleExpand(q.id)}
                                        title="Expand"
                                      >
                                        {isExpanded ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                        onClick={() => handleEditQuestion(q.id)}
                                        title="Edit"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                        onClick={() => handleDeleteQuestion(q.id)}
                                        title="Delete"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>

                                {/* Expanded row */}
                                {isExpanded && (
                                  <TableRow className="bg-slate-50/40 border-b border-slate-100">
                                    <TableCell colSpan={5} className="p-0">
                                      <div className="p-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                        {/* Full prompt */}
                                        <div className="bg-white rounded-[16px] border border-slate-100 p-5">
                                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                                            Full Question
                                          </p>
                                          <div
                                            className="prose prose-sm max-w-none text-slate-700"
                                            dangerouslySetInnerHTML={{ __html: q.prompt }}
                                          />
                                        </div>

                                        {/* MCQ Options */}
                                        {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                                          <div className="grid sm:grid-cols-2 gap-2">
                                            {q.options.map((opt) => (
                                              <div
                                                key={opt.id}
                                                className={cn(
                                                  'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                                                  opt.isCorrect
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                                    : 'bg-white border-slate-100 text-slate-600',
                                                )}
                                              >
                                                <span className="h-7 w-7 rounded-lg bg-white border border-current/20 flex items-center justify-center text-xs font-black shrink-0">
                                                  {opt.label}
                                                </span>
                                                <span className="text-sm font-medium flex-1">{opt.text}</span>
                                                {opt.isCorrect && (
                                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* CQ Parts */}
                                        {q.type === 'CQ' && meta?.parts && (
                                          <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                              Sub-parts ({meta.totalMarks} total marks)
                                            </p>
                                            {(meta.parts as any[]).map((part: any) => (
                                              <div
                                                key={part.label}
                                                className="flex gap-3 p-4 bg-white rounded-xl border border-slate-100"
                                              >
                                                <span className="h-8 w-8 rounded-xl bg-slate-900 text-white text-sm font-black flex items-center justify-center shrink-0">
                                                  {part.label}
                                                </span>
                                                <div className="flex-1 space-y-1">
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase">
                                                      {part.marks}M
                                                    </span>
                                                    {part.knowledgeLevel && (
                                                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                        · {part.knowledgeLevel}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <div
                                                    className="text-sm text-slate-700"
                                                    dangerouslySetInnerHTML={{ __html: part.prompt }}
                                                  />
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* SHORT answer */}
                                        {q.type === 'SHORT' && meta?.answer && (
                                          <div className="bg-emerald-50 border border-emerald-100 rounded-[16px] p-5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">
                                              Model Answer
                                            </p>
                                            <div
                                              className="prose prose-sm max-w-none text-emerald-800"
                                              dangerouslySetInnerHTML={{ __html: meta.answer }}
                                            />
                                          </div>
                                        )}

                                        {/* Explanation */}
                                        {q.explanation && (
                                          <div className="bg-blue-50 border border-blue-100 rounded-[16px] p-5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">
                                              Explanation
                                            </p>
                                            <div
                                              className="prose prose-sm max-w-none text-blue-800"
                                              dangerouslySetInnerHTML={{ __html: q.explanation }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
