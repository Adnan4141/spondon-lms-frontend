'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  getQuestionFolders,
  deleteQuestionFolder,
  getQuestions,
  getQuestionById,
  deleteQuestion,
  getPassages,
  getPassageById,
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
  Eye,
  Folder,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Database,
  LayoutGrid,
  FileText,
  Layers,
  FileSearch,
  Wand2,
  X,
  Home,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { FolderForm } from '@/components/admin/questions/FolderForm';
import { PassageForm } from '@/components/admin/questions/PassageForm';
import { QuestionForm } from '@/components/admin/questions/QuestionForm';
import { QuestionDetailsView } from '@/components/admin/questions/QuestionDetailsView';
import { FolderTree } from '@/components/admin/questions/FolderTree';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import { cn } from '@/lib/utils';

const difficultyOptions: (Difficulty | 'all')[] = ['all', 'EASY', 'MEDIUM', 'HARD'];

function getDifficultyBadgeClass(difficulty: string) {
  if (difficulty === 'EASY') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black uppercase';
  if (difficulty === 'MEDIUM') return 'bg-amber-50 text-amber-700 border-amber-100 font-black uppercase';
  if (difficulty === 'HARD') return 'bg-rose-50 text-rose-700 border-rose-100 font-black uppercase';
  return 'bg-slate-50 text-slate-600 border-slate-200 font-black uppercase';
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
  const [activeTab, setActiveTab] = useState<'MCQ' | 'CQ'>('MCQ');
  const [mcqSubTab, setMcqSubTab] = useState<'SINGLE' | 'PASSAGE'>('SINGLE');
  
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(undefined);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');
  
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<string>>(new Set());
  const [expandedPassageIds, setExpandedPassageIds] = useState<Set<string>>(new Set());

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
      const res = await getQuestions(
        activeFolderId,
        activeTab, 
        difficulty, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        selectedFolderIds.length > 0 ? selectedFolderIds : undefined
      );
      if (res.success && res.data) setQuestions(res.data);
    } catch (err: any) { 
      console.error(err);
    } finally { setLoading(false); }
  }, [activeFolderId, selectedFolderIds, activeTab, difficultyFilter]);

  const loadPassages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPassages(activeFolderId, selectedFolderIds.length > 0 ? selectedFolderIds : undefined);
      if (res.success && res.data) setPassages(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [activeFolderId, selectedFolderIds]);

  useEffect(() => { loadFolders(); loadCourses(); }, [loadFolders, loadCourses]);
  
  useEffect(() => {
    if (activeTab === 'MCQ' && mcqSubTab === 'PASSAGE') {
      loadPassages();
    } else {
      loadQuestions();
    }
  }, [activeFolderId, selectedFolderIds, difficultyFilter, activeTab, mcqSubTab, loadQuestions, loadPassages]);

  const toggleExpand = (id: string) => {
    setExpandedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const togglePassageExpand = (id: string) => {
    setExpandedPassageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

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
      description: 'Establish a new organizational layer for question categorization.',
      className: 'sm:max-w-2xl',
      content: <FolderForm courses={courses} folders={folders} initialParentId={activeFolderId} onSuccess={loadFolders} />,
    });
  };

  const handleEditFolder = (folder: QuestionFolder) => {
    openModal({
      title: 'Update Folder',
      description: 'Modify folder properties or parent association.',
      className: 'sm:max-w-2xl',
      content: <FolderForm courses={courses} folders={folders} folder={folder} onSuccess={loadFolders} />,
    });
  };

  const handleDeleteFolder = (id: string) => {
    openModal({
      title: 'Delete Folder',
      description: 'This will permanently remove the folder. All nested folders and questions will be impacted.',
      variant: 'danger',
      content: (
        <ConfirmationModal
          title="Confirm Purge"
          description="Are you sure you want to remove this folder hierarchy?"
          onConfirm={async () => {
            await deleteQuestionFolder(id);
            await loadFolders();
            if (activeFolderId === id) setActiveFolderId(undefined);
            setSelectedFolderIds(prev => prev.filter(fid => fid !== id));
          }}
        />
      ),
    });
  };

  const handlePrimaryCreateAction = () => {
    const folderId = activeFolderId;
    if (activeTab === 'CQ') {
      openModal({
        title: 'New Creative Write',
        description: 'Draft and configure a new CQ inquiry.',
        className: 'sm:max-w-6xl',
        content: <QuestionForm folders={folders} initialFolderId={folderId} initialType="CQ" onSuccess={loadQuestions} />,
      });
    } else if (mcqSubTab === 'SINGLE') {
      openModal({
        title: 'New Single MCQ',
        description: 'Draft and configure a new single-line MCQ.',
        className: 'sm:max-w-6xl',
        content: <QuestionForm folders={folders} initialFolderId={folderId} initialType="MCQ" initialMcqType="SINGLE" onSuccess={loadQuestions} />,
      });
    } else {
      openModal({
        title: 'Draft New Passage',
        description: 'Create a root passage for shared inquiry contexts.',
        className: 'sm:max-w-4xl',
        content: <PassageForm folders={folders} onSuccess={loadPassages} />,
      });
    }
  };

  const handleViewQuestion = async (id: string) => {
    const res = await getQuestionById(id);
    if (res.success && res.data) {
      openModal({
        title: 'Question Intelligence',
        description: 'Metadata and performance configuration details.',
        className: 'sm:max-w-3xl',
        content: <QuestionDetailsView question={res.data} />,
      });
    }
  };

  const handleGenerateQuestionSet = () => {
    const targetQuestions = activeTab === 'MCQ' && mcqSubTab === 'PASSAGE' ? [] : filteredQuestions;
    if (targetQuestions.length === 0) {
      toast({ title: 'No questions', description: 'Please select folders with questions first.', variant: 'destructive' });
      return;
    }

    openModal({
      title: 'Generate Question Set',
      description: `Reviewing ${targetQuestions.length} questions from selection.`,
      className: 'sm:max-w-5xl',
      content: (
        <div className="p-8 space-y-6">
           <div className="flex items-center justify-between bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Selected Population</p>
                 <h4 className="text-xl font-black text-indigo-900">{targetQuestions.length} Inquiry Assets</h4>
              </div>
              <Button className="rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-xs h-12 px-8">
                 Export to PDF / Exam
              </Button>
           </div>
           <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-2 no-scrollbar">
              {targetQuestions.map((q, i) => (
                <div key={q.id} className="p-5 rounded-[24px] border border-slate-100 bg-white shadow-sm">
                   <div className="flex gap-4">
                      <span className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 text-xs shrink-0">{i+1}</span>
                      <div className="space-y-3 flex-1">
                         <div className="prose prose-sm max-w-none text-slate-800 font-bold" dangerouslySetInnerHTML={{ __html: q.prompt }} />
                         {q.options && q.options.length > 0 && (
                           <div className="grid grid-cols-2 gap-2">
                              {q.options.map(opt => (
                                <div key={opt.id} className="text-xs font-medium text-slate-500 flex gap-2">
                                   <span className="font-black">{opt.label}.</span>
                                   <span>{opt.text}</span>
                                </div>
                              ))}
                           </div>
                         )}
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )
    });
  };

  const stripHtml = (html: string) => html ? html.replace(/<[^>]+>/g, '') : '';

  const filteredQuestions = questions.filter(q => {
    if (q.type !== activeTab) return false;
    if (activeTab === 'MCQ' && mcqSubTab === 'SINGLE' && q.mcqType === 'PASSAGE_CHILD') return false;
    const qry = searchQuery.toLowerCase();
    return !qry || q.prompt.toLowerCase().includes(qry) || q.explanation?.toLowerCase().includes(qry);
  });

  const getActiveFolderName = () => {
    if (!activeFolderId) return 'All Resources';
    const folder = folders.find(f => f.id === activeFolderId);
    return folder?.name || 'Nested Node';
  };

  return (
    <div className="space-y-8 text-slate-900">
      {/* Stats Header */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Inquiries', value: questions.length + passages.length, color: 'from-blue-600 to-cyan-500', icon: BookOpenCheck },
          { label: 'MCQ Repository', value: questions.filter(q => q.type === 'MCQ').length, color: 'from-indigo-600 to-purple-600', icon: Database },
          { label: 'Creative (CQ)', value: questions.filter(q => q.type === 'CQ').length, color: 'from-rose-600 to-pink-600', icon: LayoutGrid },
          { label: 'Asset Folders', value: folders.length, color: 'from-emerald-600 to-teal-500', icon: Folder },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl">
             <div className="flex items-center justify-between">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg group-hover:scale-110 transition-transform", stat.color)}>
                   <stat.icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-200 group-hover:text-indigo-500 transition-colors" />
             </div>
             <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="mt-1 text-3xl font-black text-slate-900">{stat.value}</p>
             </div>
          </div>
        ))}
      </section>

      <div className="flex flex-col lg:flex-row gap-8 min-h-[70vh]">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 space-y-2">
          {[
            { id: 'MCQ', label: 'MCQs', subTabs: ['SINGLE', 'PASSAGE'] },
            { id: 'CQ', label: 'Creative Questions', subTabs: [] },
            { id: 'COMBINED', label: 'Combined MCQs', subTabs: [] },
          ].map((tab) => (
            <div key={tab.id}>
              <button
                onClick={() => {
                   if(tab.id !== 'COMBINED') setActiveTab(tab.id as any);
                   if (tab.id === 'MCQ') setMcqSubTab('SINGLE');
                }}
                className={cn(
                  "w-full text-left px-5 py-3 rounded-2xl text-sm font-bold transition-all",
                  activeTab === tab.id ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {tab.label}
              </button>
              {activeTab === tab.id && tab.subTabs.length > 0 && (
                 <div className="ml-4 mt-2 border-l-2 border-slate-100 pl-4 space-y-2">
                    <button 
                       onClick={() => setMcqSubTab('SINGLE')}
                       className={cn("block w-full text-left text-sm font-semibold transition-colors", mcqSubTab === 'SINGLE' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800')}
                    >Single MCQs</button>
                    <button 
                       onClick={() => setMcqSubTab('PASSAGE')}
                       className={cn("block w-full text-left text-sm font-semibold transition-colors", mcqSubTab === 'PASSAGE' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800')}
                    >Passage Based MCQs</button>
                 </div>
              )}
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
                 <Plus className="mr-2 h-4 w-4" /> New question
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
                      <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Synchronizing Repository...</p>
                   </div>
                 ) : (
                   <>
                     {activeTab === 'MCQ' && mcqSubTab === 'PASSAGE' ? (
                       <div className="p-8 space-y-6">
                          {passages.map(p => {
                            const isExpanded = expandedPassageIds.has(p.id);
                            return (
                              <div key={p.id} className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-md transition-all hover:shadow-xl hover:border-indigo-100 group">
                                 <div className="flex flex-col sm:flex-row gap-6 items-start justify-between cursor-pointer" onClick={() => togglePassageExpand(p.id)}>
                                    <div className="flex-1 space-y-3">
                                       <div className="flex items-center gap-3">
                                          {isExpanded ? <ChevronUp className="h-4 w-4 text-indigo-500" /> : <ChevronDown className="h-4 w-4 text-slate-300 group-hover:text-indigo-500" />}
                                          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black text-[10px] uppercase px-2 py-0.5 shadow-sm">PASSAGE</Badge>
                                          {p.difficulty && <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] shadow-sm", getDifficultyBadgeClass(p.difficulty))}>{p.difficulty}</Badge>}
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">({p.questions?.length || 0} Inquiries)</span>
                                       </div>
                                       <h3 className="text-lg font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">{p.title || 'Untitled Passage Asset'}</h3>
                                       {!isExpanded && <p className="text-base font-medium text-slate-500 line-clamp-2 leading-relaxed">{stripHtml(p.content)}</p>}
                                    </div>
                                 </div>
                                 {isExpanded && (
                                   <div className="mt-8 pt-8 border-t border-slate-100 space-y-8 animate-in fade-in">
                                      <div className="bg-slate-50/50 p-8 rounded-[28px] border border-slate-100">
                                         <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: p.content }} />
                                      </div>
                                   </div>
                                 )}
                              </div>
                            );
                          })}
                       </div>
                     ) : (
                       <div className="overflow-x-auto">
                          <Table>
                             <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-slate-200">
                                   <TableHead className="py-4 text-sm font-bold text-slate-900">Name</TableHead>
                                   <TableHead className="py-4 text-sm font-bold text-slate-900 w-[150px]">Created by</TableHead>
                                   <TableHead className="py-4 text-sm font-bold text-slate-900 w-[150px]">Question type</TableHead>
                                   <TableHead className="py-4 text-sm font-bold text-slate-900 w-[100px] text-center">Marks</TableHead>
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
                                         Admin
                                      </TableCell>
                                      <TableCell className="py-4 text-sm text-slate-500">-</TableCell>
                                      <TableCell className="py-4 text-sm text-slate-500 text-center">-</TableCell>
                                      <TableCell className="py-4 text-right">
                                         <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={(e) => { e.stopPropagation(); handleEditFolder(folder); }}>
                                            <MoreVertical className="h-4 w-4" />
                                         </Button>
                                      </TableCell>
                                   </TableRow>
                                ))}

                                {/* Questions Data */}
                                {filteredQuestions.map((q) => {
                                  const isExpanded = expandedQuestionIds.has(q.id);
                                  return (
                                    <React.Fragment key={q.id}>
                                      <TableRow className="group border-b border-slate-100 transition-colors hover:bg-slate-50/50">
                                         <TableCell className="py-4 max-w-[400px]">
                                            <div className="flex items-start gap-4">
                                               <div className="flex flex-col gap-1 flex-1">
                                                  <div className="prose prose-sm font-medium text-slate-800 leading-snug break-words" dangerouslySetInnerHTML={{ __html: stripHtml(q.prompt).substring(0, 150) + (stripHtml(q.prompt).length > 150 ? '...' : '') }} />
                                                  {isExpanded ? null : q.options && q.options.length > 0 && (
                                                     <div className="flex flex-wrap gap-4 mt-2">
                                                        {q.options.slice(0,4).map((opt, i) => (
                                                          <div key={opt.id} className={cn("text-xs flex gap-1", opt.isCorrect ? "font-bold text-emerald-600" : "text-slate-500")}>
                                                             <span>{String.fromCharCode(65+i)}.</span>
                                                             {opt.isCorrect && <CheckCircle2 className="h-3 w-3 inline ml-0.5" />}
                                                             <span className="truncate max-w-[100px]">{opt.text}</span>
                                                          </div>
                                                        ))}
                                                     </div>
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
                                             <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold text-[10px] uppercase shadow-none">{q.type}</Badge>
                                         </TableCell>
                                         <TableCell className="py-4 text-center text-sm font-bold text-slate-700">
                                             1.0
                                         </TableCell>
                                         <TableCell className="py-4 text-right">
                                            <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                                               <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => toggleExpand(q.id)}><ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} /></Button>
                                               <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => handleEditQuestion(q.id)}><Edit className="h-4 w-4" /></Button>
                                            </div>
                                         </TableCell>
                                      </TableRow>
                                      {isExpanded && (
                                        <TableRow className="bg-slate-50/30 border-b border-slate-100">
                                           <TableCell colSpan={5} className="p-0">
                                              <div className="p-8 space-y-6 animate-in slide-in-from-top-2">
                                                 <div className="grid sm:grid-cols-2 gap-8">
                                                    <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
                                                       <div className="prose prose-sm max-w-none text-slate-700 font-medium" dangerouslySetInnerHTML={{ __html: q.prompt }} />
                                                    </div>
                                                 </div>
                                              </div>
                                           </TableCell>
                                        </TableRow>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                             </TableBody>
                          </Table>
                          {currentFolderSubfolders.length === 0 && filteredQuestions.length === 0 && (
                             <div className="py-20 text-center text-slate-400 text-sm font-medium">Directory is empty.</div>
                          )}
                       </div>
                     )}
                   </>
                 )}
              </div>
           </div>
        </div>
      </div>
      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
