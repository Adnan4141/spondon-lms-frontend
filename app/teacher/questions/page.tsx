'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  getQuestionFolders,
  getQuestions,
  getQuestionById,
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
import { confirmAction } from '@/features/admin/shared/confirm-action';
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
  ChevronDown,
  ChevronUp,
  Edit,
  Folder,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Database,
  LayoutGrid,
  FileSearch,
  Wand2,
  Home,
  ChevronRight,
  MoreVertical,
  FolderPlus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Copy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { FolderForm } from '@/features/admin/questions';
import { PassageForm } from '@/features/admin/questions';
import { QuestionForm } from '@/features/admin/questions';
import { CqForm } from '@/features/admin/questions';
import { ConfirmationModal } from '@/features/admin/shared';
import { cn } from '@/lib/utils';

const difficultyOptions: (Difficulty | 'all')[] = ['all', 'EASY', 'MEDIUM', 'HARD'];

function getDifficultyBadgeClass(difficulty: string) {
  if (difficulty === 'EASY') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black uppercase';
  if (difficulty === 'MEDIUM') return 'bg-amber-50 text-amber-700 border-amber-100 font-black uppercase';
  if (difficulty === 'HARD') return 'bg-rose-50 text-rose-700 border-rose-100 font-black uppercase';
  return 'bg-slate-50 text-slate-600 border-slate-200 font-black uppercase';
}

export default function TeacherQuestionsPage() {
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();

  const [userId, setUserId] = useState<string | null>(null);
  const [folders, setFolders] = useState<QuestionFolder[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passages, setPassages] = useState<McqPassage[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'MCQ' | 'COMBINED' | 'CQ'>('MCQ');

  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(undefined);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');

  const [expandedPassageIds, setExpandedPassageIds] = useState<Set<string>>(new Set());
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyTargetFolderId, setCopyTargetFolderId] = useState<string>('');

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!raw) return;
      const u = JSON.parse(raw);
      setUserId(u?.id ?? null);
    } catch {
      setUserId(null);
    }
  }, []);

  const loadFolders = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await getQuestionFolders(undefined, undefined, userId);
      if (res.success && res.data) setFolders(res.data);
    } catch (err) { console.error(err); }
  }, [userId]);

  const loadCourses = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await getCourses({ teacherUserId: userId });
      if (res.success && res.data) setCourses(res.data || []);
    } catch (err) { console.error(err); }
  }, [userId]);

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const difficulty = difficultyFilter === 'all' ? undefined : difficultyFilter;
      const typeStr = activeTab === 'CQ' ? 'CQ' : 'MCQ';
      const res = await getQuestions(
        activeFolderId || 'null',
        typeStr,
        difficulty
      );
      if (res.success && res.data) setQuestions(res.data);
    } catch (err: any) {
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

  useEffect(() => {
    if (userId) {
      loadFolders();
      loadCourses();
    }
  }, [userId, loadFolders, loadCourses]);

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
    async (id: string, list: 'questions' | 'passages') => {
      if (!(await confirmAction({
        title: 'Delete question permanently?',
        description:
          'It will be removed from all exam sets that use it, and matching answers in student attempts will be removed.',
        confirmLabel: 'Delete question',
        variant: 'danger',
      }))) {
        return;
      }
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
    },
    [toast, loadQuestions, loadPassages],
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

  const handlePrimaryCreateAction = () => {
    const folderId = activeFolderId;
    if (activeTab === 'CQ') {
      openModal({
        title: 'Add CQ',
        description: 'Create a creative question with sub-parts.',
        className: 'sm:max-w-6xl',
        content: <CqForm folders={folders} initialFolderId={folderId} onSuccess={loadQuestions} />,
      });
    } else if (activeTab === 'MCQ') {
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
    if (q.type !== (activeTab === 'CQ' ? 'CQ' : 'MCQ')) return false;
    if (activeTab === 'MCQ' && q.mcqType === 'PASSAGE_CHILD') return false;
    const qry = searchQuery.toLowerCase();
    return !qry || q.prompt.toLowerCase().includes(qry) || q.explanation?.toLowerCase().includes(qry);
  });

  return (
    <div className="space-y-10 pb-20">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Question Bank</h1>
        <p className="text-slate-500 mt-2 text-lg font-medium max-w-2xl">
          Organize and manage questions for your courses. Create folders to categorize your question sets.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 min-h-[70vh]">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 space-y-2">
          {[
            { id: 'MCQ', label: 'MCQs' },
            { id: 'COMBINED', label: 'Combined MCQs' },
            { id: 'CQ', label: 'Creative Questions' },
          ].map((tab) => (
            <div key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "w-full text-left px-5 py-3 rounded-2xl text-sm font-bold transition-all",
                  activeTab === tab.id ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {tab.label}
              </button>
            </div>
          ))}
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
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
              <Button onClick={handlePrimaryCreateAction} className="h-10 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                {activeTab === 'CQ' ? 'New CQ' : activeTab === 'MCQ' ? 'New MCQ' : 'New Combined MCQ'}
              </Button>
            </div>
          </div>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or question prompt..."
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
                          <TableHead className="py-4 text-sm font-bold text-slate-900 w-[150px]">Courses</TableHead>
                          <TableHead className="py-4 text-sm font-bold text-slate-900 w-[100px] text-center"></TableHead>
                          <TableHead className="w-[50px]"></TableHead>
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
                              {folder.course?.name || 'Assigned'}
                            </TableCell>
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
                                <h3 className="text-lg font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                  {(p.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || 'Passage'}
                                </h3>
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
                                            <div className="prose prose-sm text-slate-800 font-medium leading-snug break-words" dangerouslySetInnerHTML={{ __html: cq.prompt }} />
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
                        <div className="py-20 text-center text-slate-400 text-sm font-medium">Directory is empty.</div>
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
                              <TableHead className="py-4 text-sm font-bold text-slate-900 w-[150px]">Question type</TableHead>
                              <TableHead className="py-4 text-sm font-bold text-slate-900 w-[100px] text-center">Marks</TableHead>
                              <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>

                            {/* Questions Data */}
                            {filteredQuestions.map((q) => {
                              return (
                                <React.Fragment key={q.id}>
                                  <TableRow className="group border-b border-slate-100 transition-colors hover:bg-slate-50/50">
                                    <TableCell className="py-4 w-[40px]">
                                      <input type="checkbox" className="rounded border-slate-300" checked={selectedQuestionIds.has(q.id)} onChange={() => toggleQuestionSelect(q.id)} />
                                    </TableCell>
                                    <TableCell className="py-4 max-w-[400px]">
                                      <div className="flex items-start gap-4">
                                        <div className="flex flex-col gap-1 flex-1">
                                          <div className="prose prose-sm font-medium text-slate-800 leading-snug break-words" dangerouslySetInnerHTML={{ __html: stripHtml(q.prompt).substring(0, 150) + (stripHtml(q.prompt).length > 150 ? '...' : '') }} />
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
                                          {q.type === 'CQ' && q.meta && Array.isArray((q.meta as any).parts) && (q.meta as any).parts.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                              {(q.meta as any).parts.map((part: any, pi: number) => (
                                                <div key={pi} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1">
                                                  <span className="h-5 w-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[9px] font-black">{part.label}</span>
                                                  <span className="text-[10px] font-bold text-indigo-600">{part.marks}m</span>
                                                  {part.knowledgeLevel && <span className="text-[9px] font-bold text-slate-400">{part.knowledgeLevel}</span>}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold text-[10px] uppercase shadow-none">{q.type}</Badge>
                                    </TableCell>
                                    <TableCell className="py-4 text-center text-sm font-bold text-slate-700">
                                      {q.type === 'CQ' && q.meta && (q.meta as any).totalMarks ? (q.meta as any).totalMarks : '1.0'}
                                    </TableCell>
                                    <TableCell className="py-4 text-right">
                                      <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" title="Copy to folder" onClick={() => handleCopySingle(q.id)}><Copy className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => {
                                          const res = questions.find(question => question.id === q.id);
                                          if (res) {
                                            if (res.type === 'CQ') {
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
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => void handleDeleteQuestion(q.id, 'questions')}><Trash2 className="h-4 w-4" /></Button>
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
                        <div className="py-20 text-center text-slate-400 text-sm font-medium">Directory is empty.</div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Copy to Folder Modal */}
      {copyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setCopyModalOpen(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6" onClick={e => e.stopPropagation()}>
            <div>
              <h3 className="text-lg font-black text-slate-900">Copy {selectedQuestionIds.size} Question(s)</h3>
              <p className="text-sm text-slate-500 mt-1">Select target folder to copy the question(s) to.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Target Folder</label>
              <Select value={copyTargetFolderId} onValueChange={setCopyTargetFolderId}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select folder..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {allFoldersFlat.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" className="rounded-xl font-bold" onClick={() => { setCopyModalOpen(false); setCopyTargetFolderId(''); }}>Cancel</Button>
              <Button className="rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800" disabled={!copyTargetFolderId} onClick={executeCopy}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
            </div>
          </div>
        </div>
      )}
      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
