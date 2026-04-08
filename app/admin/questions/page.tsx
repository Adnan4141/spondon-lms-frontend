'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  getQuestionFolders,
  getQuestions,
  deleteQuestion,
  getPassages,
  deleteQuestionFolder,
  copyQuestion,
  bulkCopyQuestions,
  deletePassage,
} from '@/lib/api/question-bank';
import { getCourses } from '@/lib/api/courses';
import type {
  Question,
  QuestionFolder,
  Difficulty,
  McqPassage,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

const difficultyOptions: (Difficulty | 'all')[] = ['all', 'EASY', 'MEDIUM', 'HARD'];

function getDifficultyBadgeClass(difficulty: string) {
  if (difficulty === 'EASY') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black uppercase';
  if (difficulty === 'MEDIUM') return 'bg-amber-50 text-amber-700 border-amber-100 font-black uppercase';
  if (difficulty === 'HARD') return 'bg-rose-50 text-rose-700 border-rose-100 font-black uppercase';
  return 'bg-slate-50 text-slate-600 border-slate-200 font-black uppercase';
}

export type QuestionTabId = 'MCQ' | 'COMBINED' | 'CQ' | 'SINGLE';

export function QuestionsPageInner({ initialTab = 'MCQ' as QuestionTabId }) {
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();

  const [folders, setFolders] = useState<QuestionFolder[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passages, setPassages] = useState<McqPassage[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<QuestionTabId>(initialTab);

  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(undefined);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');

  const [expandedPassageIds, setExpandedPassageIds] = useState<Set<string>>(new Set());
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyTargetFolderId, setCopyTargetFolderId] = useState<string>('');

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
      // SINGLE tab shares CQ type but we load all CQs and filter client-side
      const typeStr = (activeTab === 'CQ' || activeTab === 'SINGLE') ? 'CQ' : 'MCQ';
      const res = await getQuestions(
        activeFolderId || 'null',
        typeStr,
        difficulty,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      );
      if (res.success && res.data) setQuestions(res.data);
    } catch (err: unknown) {
      console.error(err);
    } finally { setLoading(false); }
  }, [activeFolderId, activeTab, difficultyFilter]);

  const loadPassages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPassages(activeFolderId || 'null');
      if (res.success && res.data) setPassages(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [activeFolderId]);

  useEffect(() => { loadFolders(); loadCourses(); }, [loadFolders, loadCourses]);

  useEffect(() => {
    if (activeTab === 'COMBINED') {
      loadPassages();
    } else {
      loadQuestions();
    }
  }, [activeFolderId, difficultyFilter, activeTab, loadQuestions, loadPassages]);

  const togglePassageExpand = (id: string) => {
    setExpandedPassageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleDeleteQuestion = useCallback(
    (id: string, list: 'questions' | 'passages') => {
      openModal({
        title: 'Delete Question',
        description: 'This action cannot be undone.',
        content: (
          <ConfirmationModal
            title="Confirm Delete"
            description="Delete this question permanently? It will be removed from all exam sets that use it, and matching answers in student attempts will be removed."
            variant="danger"
            onConfirm={async () => {
              try {
                const res = await deleteQuestion(id);
                if (res.success) {
                  toast({
                    title: 'Question deleted',
                    description: 'The question was removed from the bank and unlinked from exams.',
                  });
                  if (list === 'passages') await loadPassages();
                  else await loadQuestions();
                } else {
                  toast({
                    title: 'Could not delete question',
                    description: res.message || 'Unknown error',
                    variant: 'destructive',
                  });
                }
              } catch (err: unknown) {
                toast({
                  title: 'Could not delete question',
                  description: err instanceof Error ? err.message : 'Something went wrong',
                  variant: 'destructive',
                });
              }
            }}
          />
        ),
      });
    },
    [toast, loadQuestions, loadPassages, openModal],
  );

  const getBreadcrumbs = () => {
    const crumbs: QuestionFolder[] = [];
    let currentId = activeFolderId;
    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        crumbs.unshift(folder);
        currentId = folder.parentFolderId || undefined;
      } else {
        break;
      }
    }
    return crumbs;
  };

  const currentFolderSubfolders = folders.filter(f =>
    activeFolderId ? f.parentFolderId === activeFolderId : !f.parentFolderId
  ).filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCreateFolder = () => {
    openModal({
      title: activeFolderId ? 'Create Subfolder' : 'New Folder',
      description: 'Create a folder for questions.',
      className: 'sm:max-w-2xl',
      content: <FolderForm courses={courses} folders={folders} initialParentId={activeFolderId} onSuccess={loadFolders} />,
    });
  };

  const handleEditFolder = (folder: QuestionFolder) => {
    openModal({
      title: 'Update Folder',
      description: 'Edit folder details.',
      className: 'sm:max-w-2xl',
      content: <FolderForm courses={courses} folders={folders} folder={folder} onSuccess={loadFolders} />,
    });
  };

  const handleDeleteFolder = (id: string) => {
    openModal({
      title: 'Delete Folder',
      description: 'Delete this folder and its contents?',
      content: (
        <ConfirmationModal
          title="Confirm Delete"
          description="Remove this folder permanently?"
          variant="danger"
          onConfirm={async () => {
            await deleteQuestionFolder(id);
            await loadFolders();
            if (activeFolderId === id) setActiveFolderId(undefined);
          }}
        />
      ),
    });
  };

  const handleFolderAction = (folder: QuestionFolder, action: 'edit' | 'delete') => {
    if (action === 'edit') {
      handleEditFolder(folder);
    } else {
      handleDeleteFolder(folder.id);
    }
  }

  const handleCreateAction = (tab: QuestionTabId) => {
    const folderId = activeFolderId;
    if (tab === 'CQ') {
      openModal({
        title: 'Add CQ',
        description: 'Create a creative question with sub-parts.',
        className: 'sm:max-w-6xl',
        content: <CqForm folders={folders} initialFolderId={folderId} onSuccess={loadQuestions} />,
      });
    } else if (tab === 'SINGLE') {
      openModal({
        title: 'Add Short Question',
        description: 'Create a short / open-ended question.',
        className: 'sm:max-w-5xl',
        content: <SingleQuestionForm folders={folders} initialFolderId={folderId} onSuccess={loadQuestions} />,
      });
    } else if (tab === 'MCQ') {
      openModal({
        title: 'Add MCQ',
        description: 'Create a multiple choice question.',
        className: 'sm:max-w-6xl',
        content: <QuestionForm folders={folders} initialFolderId={folderId} initialType="MCQ" initialMcqType="SINGLE" onSuccess={loadQuestions} />,
      });
    } else {
      openModal({
        title: 'Add Combined MCQ',
        description: 'Add a passage with linked MCQs.',
        className: 'sm:max-w-4xl',
        content: <PassageForm folders={folders} initialFolderId={folderId} onSuccess={loadPassages} />,
      });
    }
  };

  const stripHtml = (html: string) => html ? html.replace(/<[^>]+>/g, '') : '';

  const handleCopySingle = (questionId: string) => {
    setSelectedQuestionIds(new Set([questionId]));
    setCopyModalOpen(true);
  };

  const handleCopySelected = () => {
    if (selectedQuestionIds.size === 0) return;
    setCopyModalOpen(true);
  };

  const executeCopy = async () => {
    if (!copyTargetFolderId || selectedQuestionIds.size === 0) return;
    try {
      const ids = Array.from(selectedQuestionIds);
      if (ids.length === 1) {
        await copyQuestion({ questionId: ids[0], targetFolderId: copyTargetFolderId });
      } else {
        await bulkCopyQuestions({ questionIds: ids, targetFolderId: copyTargetFolderId });
      }
      toast({ title: 'Success', description: `${ids.length} question(s) copied successfully` });
      setCopyModalOpen(false);
      setSelectedQuestionIds(new Set());
      setCopyTargetFolderId('');
      loadQuestions();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to copy questions', variant: 'destructive' });
    }
  };

  const toggleQuestionSelect = (id: string) => {
    setSelectedQuestionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedQuestionIds.size === filteredQuestions.length) {
      setSelectedQuestionIds(new Set());
    } else {
      setSelectedQuestionIds(new Set(filteredQuestions.map(q => q.id)));
    }
  };

  // Flat list of all folders for the copy picker
  const allFoldersFlat = folders.filter(f => f.id !== activeFolderId);

  const filteredQuestions = questions.filter(q => {
    const meta = q.meta as { isSingle?: boolean } | null;
    if (activeTab === 'SINGLE') {
      // Single questions: CQ type with isSingle flag
      if (q.type !== 'CQ' || !meta?.isSingle) return false;
    } else if (activeTab === 'CQ') {
      // CQ: type CQ but NOT single
      if (q.type !== 'CQ' || meta?.isSingle) return false;
    } else if (activeTab === 'MCQ') {
      if (q.type !== 'MCQ' || q.mcqType === 'PASSAGE_CHILD') return false;
    }
    const qry = searchQuery.toLowerCase();
    return !qry || q.prompt.toLowerCase().includes(qry) || q.explanation?.toLowerCase().includes(qry);
  });

  return (
    <div className="space-y-8 text-slate-900">
      <div className="flex flex-col gap-8 min-h-[70vh]">
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6 w-full">
          {/* Breadcrumbs and Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveFolderId(undefined)}
                className={cn("flex items-center gap-1 text-sm font-bold transition-colors shrink-0", !activeFolderId ? "text-slate-900" : "text-slate-500 hover:text-slate-800")}
              >
                <Home className="h-4 w-4" />
                <span className={!activeFolderId ? "hidden sm:inline" : "hidden md:inline"}>Root</span>
              </button>

              {getBreadcrumbs().map((crumb, idx, arr) => (
                <React.Fragment key={crumb.id}>
                  <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                  <button
                    onClick={() => setActiveFolderId(crumb.id)}
                    className={cn(
                      "text-sm font-bold truncate max-w-[150px] transition-colors",
                      idx === arr.length - 1 ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button variant="outline" onClick={handleCreateFolder} className="h-10 rounded-xl bg-white border-slate-200 text-slate-700 font-bold hover:bg-slate-50 shadow-sm">
                <FolderPlus className="mr-2 h-4 w-4" /> New folder
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-10 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-sm px-4">
                    <Plus className="mr-2 h-4 w-4" />
                    New Question
                    <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200/60 shadow-sm p-1">
                  <DropdownMenuItem onClick={() => handleCreateAction('MCQ')} className="font-medium cursor-pointer rounded-lg px-3 py-2.5 text-slate-700 focus:bg-slate-50 focus:text-slate-900">
                    <div className="flex flex-col">
                      <span>Multiple Choice (MCQ)</span>
                      <span className="text-xs text-slate-400 font-normal mt-0.5">Single question with options</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateAction('COMBINED')} className="font-medium cursor-pointer rounded-lg px-3 py-2.5 text-slate-700 focus:bg-slate-50 focus:text-slate-900">
                    <div className="flex flex-col">
                      <span>Combined MCQ</span>
                      <span className="text-xs text-slate-400 font-normal mt-0.5">A passage with linked MCQs</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateAction('CQ')} className="font-medium cursor-pointer rounded-lg px-3 py-2.5 text-slate-700 focus:bg-slate-50 focus:text-slate-900">
                    <div className="flex flex-col">
                      <span>Creative Question (CQ)</span>
                      <span className="text-xs text-slate-400 font-normal mt-0.5">Stimulus with sub-parts</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateAction('SINGLE')} className="font-medium cursor-pointer rounded-lg px-3 py-2.5 text-slate-700 focus:bg-slate-50 focus:text-slate-900">
                    <div className="flex flex-col">
                      <span>Short Question</span>
                      <span className="text-xs text-slate-400 font-normal mt-0.5">Open-ended text answer</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9 border-none bg-slate-50/50 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-medium"
              />
            </div>
            <Select value={difficultyFilter} onValueChange={(v) => setDifficultyFilter(v as any)}>
              <SelectTrigger className="h-10 w-[140px] border-none bg-slate-50/50 rounded-xl text-sm font-medium">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {difficultyOptions.filter(o => o !== 'all').map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-10 w-10 p-0 border-none bg-slate-50/50 rounded-xl hover:bg-slate-100" onClick={() => { loadFolders(); loadQuestions(); loadPassages(); }}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} text-slate-600`} />
            </Button>
          </div>

          <div className="flex flex-col bg-white overflow-hidden min-h-[500px]">
            <div className="flex-1">
              {loading ? (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                  <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Loading questions...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto mb-6">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-slate-200">
                          <TableHead className="py-4 text-sm font-bold text-slate-900">Folder Name</TableHead>
                          <TableHead className="py-4 text-sm font-bold text-slate-900 w-[150px]">Created by</TableHead>
                          <TableHead className="py-4 text-sm font-bold text-slate-900 w-[150px]"></TableHead>
                          <TableHead className="py-4 text-sm font-bold text-slate-900 w-[100px] text-center"></TableHead>
                          <TableHead className="w-[160px] text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Folders Grid (Always show if matches search) */}
                        {currentFolderSubfolders.map(folder => (
                          <TableRow key={folder.id} className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setActiveFolderId(folder.id)}>
                            <TableCell className="py-4 text-sm font-medium text-slate-700 flex items-center gap-3">
                              <Folder className="h-5 w-5 text-slate-400" />
                              {folder.name}
                            </TableCell>
                            <TableCell className="py-4 text-sm text-slate-500">
                              Admin
                            </TableCell>
                            <TableCell className="py-4 text-sm text-slate-500"></TableCell>
                            <TableCell className="py-4 text-sm text-slate-500 text-center"></TableCell>
                            <TableCell className="py-4 text-right">
                              <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => handleFolderAction(folder, 'edit')}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => handleFolderAction(folder, 'delete')}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {activeTab === 'COMBINED' ? (
                    <div className="p-8 space-y-6 pt-0">
                      {passages.map(p => {
                        const isExpanded = expandedPassageIds.has(p.id);
                        return (
                          <div key={p.id} className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-md transition-all hover:shadow-xl hover:border-indigo-100 group">
                            <div className="flex flex-col sm:flex-row gap-6 items-start justify-between cursor-pointer" onClick={() => togglePassageExpand(p.id)}>
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                  {isExpanded ? <ChevronUp className="h-4 w-4 text-indigo-500" /> : <ChevronDown className="h-4 w-4 text-slate-300 group-hover:text-indigo-500" />}
                                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black text-[10px] uppercase px-2 py-0.5 shadow-sm">COMBINED MCQ</Badge>
                                  {p.difficulty && <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] shadow-sm", getDifficultyBadgeClass(p.difficulty))}>{p.difficulty}</Badge>}
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">({p.questions?.length || 0} Inquiries)</span>
                                </div>
                                <h3 className="text-lg font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">{p.title || 'Untitled Combined Asset'}</h3>
                                {!isExpanded && <p className="text-base font-medium text-slate-500 line-clamp-2 leading-relaxed">{stripHtml(p.content)}</p>}
                              </div>
                              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => {
                                  openModal({
                                    title: 'Update Combined MCQ',
                                    description: 'Edit passage and its MCQ questions.',
                                    className: 'sm:max-w-4xl',
                                    content: <PassageForm folders={folders} passage={p} onSuccess={loadPassages} />,
                                  });
                                }}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => {
                                  openModal({
                                    title: 'Delete Combined MCQ',
                                    description: 'Delete this passage and all its questions?',
                                    content: (
                                      <ConfirmationModal
                                        title="Confirm Delete"
                                        description="This will permanently remove the passage and all its child questions."
                                        variant="danger"
                                        onConfirm={async () => {
                                          await deletePassage(p.id);
                                          await loadPassages();
                                        }}
                                      />
                                    ),
                                  });
                                }}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="mt-8 pt-8 border-t border-slate-100 space-y-8 animate-in fade-in">
                                <div className="bg-slate-50/50 p-8 rounded-[28px] border border-slate-100">
                                  <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: p.content }} />
                                </div>
                                {/* Child Questions */}
                                {p.questions && p.questions.length > 0 && (
                                  <div className="space-y-4">
                                    <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">Questions ({p.questions.length})</h4>
                                    {p.questions.map((cq, idx) => (
                                      <div key={cq.id} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
                                        <div className="flex items-start gap-3">
                                          <span className="shrink-0 h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">{idx + 1}</span>
                                          <div className="flex-1">
                                            <div className="prose prose-sm text-slate-800 font-medium leading-snug" dangerouslySetInnerHTML={{ __html: cq.prompt }} />
                                            {cq.options && cq.options.length > 0 && (
                                              <div className="grid grid-cols-2 gap-2 mt-3">
                                                {cq.options.map(opt => (
                                                  <div key={opt.id} className={cn("text-xs flex gap-1 p-2 rounded-lg", opt.isCorrect ? "bg-emerald-50 font-bold text-emerald-700" : "bg-slate-50 font-medium text-slate-600")}>
                                                    <span className="font-black shrink-0">{opt.label}.</span>
                                                    {opt.isCorrect && <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />}
                                                    <span className="truncate">{opt.text}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                            {cq.explanation && (
                                              <div className="mt-2 text-xs text-slate-500 italic">
                                                <span className="font-bold">Explanation:</span> {stripHtml(cq.explanation)}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex gap-1 shrink-0">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600" onClick={(e) => {
                                              e.stopPropagation();
                                              openModal({
                                                title: 'Update Question',
                                                description: 'Modify question contents and parameters.',
                                                className: 'sm:max-w-6xl',
                                                content: <QuestionForm folders={folders} initialFolderId={cq.folderId || undefined} initialType={cq.type} initialMcqType={cq.mcqType || undefined} question={cq} onSuccess={loadPassages} />,
                                              });
                                            }}><Edit className="h-3.5 w-3.5" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600" onClick={(e) => {
                                              e.stopPropagation();
                                              void handleDeleteQuestion(cq.id, 'passages');
                                            }}><Trash2 className="h-3.5 w-3.5" /></Button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {(!p.questions || p.questions.length === 0) && (
                                  <div className="text-center py-6 text-slate-400 text-sm font-medium">No questions added to this passage yet.</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {currentFolderSubfolders.length === 0 && passages.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-300">
                            <Search className="h-6 w-6" />
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-slate-600 font-bold">No questions found</p>
                            <p className="text-slate-400 text-sm font-medium">This directory is empty or nothing matches your search.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {filteredQuestions.length > 0 && (
                      <>
                      {selectedQuestionIds.size > 0 && (
                        <div className="flex items-center gap-3 p-3 mb-3 bg-indigo-50 rounded-xl border border-indigo-100">
                          <span className="text-sm font-bold text-indigo-700">{selectedQuestionIds.size} selected</span>
                          <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-100" onClick={handleCopySelected}>
                            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy to folder
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs font-bold text-slate-500" onClick={() => setSelectedQuestionIds(new Set())}>Clear</Button>
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-slate-200 bg-slate-50">
                              <TableHead className="py-4 w-[40px]">
                                <input type="checkbox" className="rounded border-slate-300" checked={filteredQuestions.length > 0 && selectedQuestionIds.size === filteredQuestions.length} onChange={toggleSelectAll} />
                              </TableHead>
                              <TableHead className="py-4 text-sm font-bold text-slate-900 w-full">Question </TableHead>
                              <TableHead className="py-4 text-sm font-bold text-slate-900 w-[150px]">Created by</TableHead>
                              <TableHead className="py-4 text-sm font-bold text-slate-900 w-[150px]">Question type</TableHead>
                              <TableHead className="py-4 text-sm font-bold text-slate-900 w-[100px] text-center">Marks</TableHead>
                              <TableHead className="w-[180px] text-right"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>

                            {/* Questions Data */}
                             {filteredQuestions.map((q) => {
                              const qMeta = q.meta as { isSingle?: boolean; marks?: number; answer?: string; totalMarks?: number; parts?: unknown[] } | null;
                              const isSingleQ = !!qMeta?.isSingle;
                              return (
                                <React.Fragment key={q.id}>
                                  <TableRow className="group border-b border-slate-100 transition-colors hover:bg-slate-50/50">
                                    <TableCell className="py-4 w-[40px]">
                                      <input type="checkbox" className="rounded border-slate-300" checked={selectedQuestionIds.has(q.id)} onChange={() => toggleQuestionSelect(q.id)} />
                                    </TableCell>
                                    <TableCell className="py-4 max-w-[400px]">
                                      <div className="flex items-start gap-4">
                                        <div className="flex flex-col gap-1 flex-1">
                                          <div className="prose prose-sm font-medium text-slate-800 leading-snug wrap-break-word" dangerouslySetInnerHTML={{ __html: stripHtml(q.prompt).substring(0, 150) + (stripHtml(q.prompt).length > 150 ? '...' : '') }} />
                                          {/* MCQ options */}
                                          {q.options && q.options.length > 0 && (
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                              {q.options.map(opt => (
                                                <div key={opt.id} className={cn("text-xs flex gap-1", opt.isCorrect ? "font-bold text-emerald-600" : "font-medium text-slate-500")}>
                                                  <span className="font-black shrink-0">{opt.label}.</span>
                                                  {opt.isCorrect && <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />}
                                                  <span className={cn("truncate", opt.isCorrect && "text-emerald-700")}>{opt.text}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {/* CQ sub-parts */}
                                          {q.type === 'CQ' && !isSingleQ && qMeta && Array.isArray(qMeta.parts) && qMeta.parts.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                              {(qMeta.parts as { label?: string; marks?: number; knowledgeLevel?: string }[]).map((part, pi) => (
                                                <div key={pi} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1">
                                                  <span className="h-5 w-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[9px] font-black">{part.label}</span>
                                                  <span className="text-[10px] font-bold text-indigo-600">{part.marks}m</span>
                                                  {part.knowledgeLevel && <span className="text-[9px] font-bold text-slate-400">{part.knowledgeLevel}</span>}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {/* Single question answer preview */}
                                          {isSingleQ && qMeta?.answer && (
                                            <p className="text-xs font-medium text-emerald-700 mt-1 line-clamp-1">
                                              <span className="font-black">Ans:</span> {stripHtml(qMeta.answer).substring(0, 80)}{stripHtml(qMeta.answer).length > 80 ? '…' : ''}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                      <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">A</div>
                                        <span className="text-sm font-medium text-slate-600">Admin</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                      <Badge className={cn(
                                        'font-bold text-[10px] uppercase shadow-none',
                                        isSingleQ
                                          ? 'bg-violet-50 text-violet-700 border-violet-100'
                                          : q.type === 'CQ'
                                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                                          : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                      )}>
                                        {isSingleQ ? 'SHORT' : q.type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="py-4 text-center text-sm font-bold text-slate-700">
                                      {isSingleQ ? (qMeta?.marks ?? '—') : q.type === 'CQ' && qMeta?.totalMarks ? qMeta.totalMarks : '1.0'}
                                    </TableCell>
                                    <TableCell className="py-4 text-right">
                                      <div className="flex justify-end gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" title="View question" onClick={(e) => {
                                          e.stopPropagation();
                                          const res = questions.find(question => question.id === q.id);
                                          if (res) {
                                            const resMeta = res.meta as { isSingle?: boolean } | null;
                                            if (resMeta?.isSingle) {
                                              openModal({
                                                title: 'View Short Question',
                                                description: 'Question details.',
                                                className: 'sm:max-w-3xl',
                                                content: (
                                                  <div className="space-y-4 text-slate-700">
                                                    <div>
                                                      <label className="text-xs font-bold uppercase text-slate-500 block mb-1.5">Question</label>
                                                      <div className="prose prose-sm max-w-none rounded-lg bg-slate-50 p-3" dangerouslySetInnerHTML={{ __html: res.prompt }} />
                                                    </div>
                                                    {resMeta?.answer && (
                                                      <div>
                                                        <label className="text-xs font-bold uppercase text-emerald-600 block mb-1.5">Answer</label>
                                                        <div className="prose prose-sm max-w-none rounded-lg bg-emerald-50 p-3" dangerouslySetInnerHTML={{ __html: resMeta.answer }} />
                                                      </div>
                                                    )}
                                                    {resMeta?.marks && (
                                                      <div>
                                                        <label className="text-xs font-bold uppercase text-slate-500 block mb-1.5">Marks</label>
                                                        <p className="font-semibold text-lg text-indigo-600">{resMeta.marks}</p>
                                                      </div>
                                                    )}
                                                  </div>
                                                ),
                                              });
                                            } else if (res.type === 'CQ') {
                                              const parts = (resMeta?.parts as { label?: string; marks?: number; knowledgeLevel?: string; prompt?: string; answer?: string }[]) || [];
                                              openModal({
                                                title: 'View Creative Question',
                                                description: 'Question details.',
                                                className: 'sm:max-w-4xl',
                                                content: (
                                                  <div className="space-y-4 text-slate-700">
                                                    <div>
                                                      <label className="text-xs font-bold uppercase text-slate-500 block mb-1.5">Question Stimulus</label>
                                                      <div className="prose prose-sm max-w-none rounded-lg bg-slate-50 p-4 border border-slate-100" dangerouslySetInnerHTML={{ __html: res.prompt }} />
                                                    </div>
                                                    {parts.length > 0 && (
                                                      <div>
                                                        <div className="space-y-4">
                                                          {parts.map((part, idx) => (
                                                            <div key={idx} className="flex flex-col gap-3 rounded-[20px] bg-white p-5 border border-slate-200 shadow-sm">
                                                              <div className="flex items-center gap-3">
                                                                <span className="flex items-center justify-center h-8 w-8 rounded-xl bg-slate-900 border-2 border-slate-100 text-white text-sm font-black shrink-0 shadow-sm">{part.label || String.fromCharCode(65 + idx)}</span>
                                                                <div className="flex items-center gap-2">
                                                                  <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider">{part.marks || '-'} Marks</span>
                                                                  {part.knowledgeLevel && <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full tracking-wider">{part.knowledgeLevel}</span>}
                                                                </div>
                                                              </div>
                                                              {part.prompt && (
                                                                <div className="prose prose-sm max-w-none text-slate-800 font-medium leading-relaxed pl-2" dangerouslySetInnerHTML={{ __html: part.prompt }} />
                                                              )}
                                                              {part.answer && (
                                                                <div className="mt-2 pl-4 border-l-4 border-emerald-400 bg-emerald-50/50 p-3 rounded-r-2xl">
                                                                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 block mb-1.5">Model Answer</label>
                                                                  <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: part.answer }} />
                                                                </div>
                                                              )}
                                                            </div>
                                                          ))}
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                ),
                                              });
                                            } else {
                                              // MCQ
                                              openModal({
                                                title: 'View Multiple Choice Question',
                                                description: 'Question details.',
                                                className: 'sm:max-w-4xl',
                                                content: (
                                                  <div className="space-y-4 text-slate-700">
                                                    <div>
                                                      <label className="text-xs font-bold uppercase text-slate-500 block mb-1.5">Question</label>
                                                      <div className="prose prose-sm max-w-none rounded-lg bg-slate-50 p-3" dangerouslySetInnerHTML={{ __html: res.prompt }} />
                                                    </div>
                                                    {res.options && res.options.length > 0 && (
                                                      <div>
                                                        <label className="text-xs font-bold uppercase text-slate-500 block mb-1.5">Options</label>
                                                        <div className="space-y-2">
                                                          {res.options.map((opt) => (
                                                            <div key={opt.id} className={cn("flex items-start gap-3 rounded-lg p-3", opt.isCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50")}>
                                                              <span className="font-bold shrink-0 text-slate-700">{opt.label}.</span>
                                                              <div className="flex-1 min-w-0">
                                                                <p className={cn("text-sm", opt.isCorrect ? "font-bold text-emerald-700" : "text-slate-600")}>{opt.text}</p>
                                                              </div>
                                                              {opt.isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />}
                                                            </div>
                                                          ))}
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                ),
                                              });
                                            }
                                          }
                                        }}><Eye className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" title="Copy to folder" onClick={(e) => { e.stopPropagation(); handleCopySingle(q.id); }}><Copy className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" title="Edit question" onClick={(e) => {
                                          e.stopPropagation();
                                          const res = questions.find(question => question.id === q.id);
                                          if (res) {
                                            const resMeta = res.meta as { isSingle?: boolean } | null;
                                            if (resMeta?.isSingle) {
                                              openModal({
                                                title: 'Update Single Question',
                                                description: 'Modify the short question.',
                                                className: 'sm:max-w-5xl',
                                                content: <SingleQuestionForm folders={folders} question={res} onSuccess={loadQuestions} />,
                                              });
                                            } else if (res.type === 'CQ') {
                                              openModal({
                                                title: 'Update CQ',
                                                description: 'Modify creative question and sub-parts.',
                                                className: 'sm:max-w-6xl',
                                                content: <CqForm folders={folders} question={res} onSuccess={loadQuestions} />,
                                              });
                                            } else {
                                              openModal({
                                                title: 'Update Question',
                                                description: 'Modify question contents and parameters.',
                                                className: 'sm:max-w-6xl',
                                                content: <QuestionForm folders={folders} initialFolderId={q.folderId || undefined} initialType={q.type} initialMcqType={q.mcqType || undefined} question={res} onSuccess={loadQuestions} />,
                                              });
                                            }
                                          }
                                        }}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" title="Delete question" onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q.id, 'questions'); }}><Trash2 className="h-4 w-4" /></Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                </React.Fragment>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      </>
                      )}
                      {currentFolderSubfolders.length === 0 && filteredQuestions.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-300">
                            <Search className="h-6 w-6" />
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-slate-600 font-bold">No questions found</p>
                            <p className="text-slate-400 text-sm font-medium">This directory is empty or nothing matches your search.</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Dialog
        open={copyModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCopyModalOpen(false);
            setCopyTargetFolderId('');
          }
        }}
      >
        <DialogContent
          showCloseButton
          className={cn(
            'flex max-h-[92vh] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-[32px] border border-slate-200/90 bg-white p-0 text-slate-900 shadow-[0_24px_80px_-12px_rgba(15,23,42,0.25)] sm:max-w-3xl',
          )}
        >
          <DialogHeader className="relative shrink-0 overflow-hidden border-b border-slate-100/90 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 px-8 pb-6 pt-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_100%_-20%,rgba(99,102,241,0.12),transparent_50%)]" />
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-400/10 blur-2xl" />
            <div className="relative flex items-start gap-4 pr-10">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-white shadow-sm shadow-indigo-500/5 ring-1 ring-white">
                <Copy className="h-6 w-6 text-indigo-600" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1 space-y-2 text-left">
                <div className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50/80 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700">
                  Question bank
                </div>
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 sm:text-[1.65rem]">
                  Copy question{selectedQuestionIds.size > 1 ? 's' : ''}
                </DialogTitle>
                <DialogDescription className="text-[15px] font-medium leading-relaxed text-slate-600">
                  Duplicate{' '}
                  <span className="font-bold text-slate-800">
                    {selectedQuestionIds.size} question{selectedQuestionIds.size > 1 ? 's' : ''}
                  </span>{' '}
                  into another folder. The originals stay untouched.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-8 py-7 no-scrollbar">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/90 to-white p-1 shadow-inner shadow-slate-200/40">
              <div className="rounded-[14px] bg-white/90 p-5 sm:p-6">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-indigo-600/90">
                      Destination
                    </p>
                    <label
                      htmlFor="copy-destination-folder"
                      className="text-lg font-black tracking-tight text-slate-900"
                    >
                      Target folder
                    </label>
                  </div>
                  <p className="text-xs font-semibold text-slate-400">
                    {allFoldersFlat.length} folder{allFoldersFlat.length === 1 ? '' : 's'} available
                  </p>
                </div>
                <Select
                  value={copyTargetFolderId || undefined}
                  onValueChange={setCopyTargetFolderId}
                >
                  <SelectTrigger
                    id="copy-destination-folder"
                    className="h-14 w-full rounded-2xl border-2 border-slate-200/90 bg-slate-50/50 px-4 text-left text-base font-bold text-slate-800 shadow-sm transition-all hover:border-slate-300 hover:bg-white focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/[0.12] focus:outline-none data-[placeholder]:font-semibold data-[placeholder]:text-slate-400 [&_svg]:size-5 [&_svg]:text-indigo-500/70"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100/80 text-indigo-700">
                        <Folder className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <SelectValue placeholder="Choose a folder…" />
                    </div>
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={10}
                    align="start"
                    className="z-200 w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-[0_16px_48px_-8px_rgba(15,23,42,0.22)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
                  >
                    {allFoldersFlat.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm font-semibold text-slate-400">
                        No folders yet. Create one first.
                      </div>
                    ) : (
                      allFoldersFlat.map((f) => (
                        <SelectItem
                          key={f.id}
                          value={f.id}
                          className="group mb-0.5 cursor-pointer rounded-xl py-3 pl-3 pr-10 text-[15px] font-bold text-slate-800 last:mb-0 focus:bg-transparent focus:text-slate-900 data-[highlighted]:bg-gradient-to-r data-[highlighted]:from-indigo-50 data-[highlighted]:to-violet-50/80 data-[highlighted]:text-indigo-950"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-500 transition-colors group-data-[highlighted]:border-indigo-200 group-data-[highlighted]:bg-white group-data-[highlighted]:text-indigo-600">
                              <Folder className="h-4 w-4" strokeWidth={2} />
                            </span>
                            <span className="truncate">{f.name}</span>
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="mt-3 text-xs font-medium leading-relaxed text-slate-500">
                  Copies appear as new drafts in the chosen folder. You can edit them after copying.
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/30 px-8 py-5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <Button
              variant="ghost"
              className="h-12 rounded-2xl px-7 font-bold text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
              onClick={() => {
                setCopyModalOpen(false);
                setCopyTargetFolderId('');
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-12 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-8 font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:from-slate-800 hover:to-slate-700 disabled:opacity-40"
              disabled={!copyTargetFolderId}
              onClick={executeCopy}
            >
              <Copy className="mr-2 h-4 w-4 opacity-90" />
              Confirm Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default function QuestionsPage() {
  return <QuestionsPageInner />;
}
