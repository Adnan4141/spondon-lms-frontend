'use client';

import React, { useEffect, useState } from 'react';
import {
  getQuestionFolders,
  getQuestionFolderById,
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
  QuestionType,
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
  FolderPlus,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  HelpCircle,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  Database,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useModalStore } from '@/store/modalStore';
import { FolderForm } from '@/components/admin/questions/FolderForm';
import { PassageForm } from '@/components/admin/questions/PassageForm';
import { QuestionForm } from '@/components/admin/questions/QuestionForm';
import { QuestionDetailsView } from '@/components/admin/questions/QuestionDetailsView';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import { cn } from '@/lib/utils';

const difficultyOptions: (Difficulty | 'all')[] = ['all', 'EASY', 'MEDIUM', 'HARD'];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default function QuestionsPage() {
  const { openModal } = useModalStore();
  const { toast, toasts, removeToast } = useToast();
  
  const [folders, setFolders] = useState<QuestionFolder[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passages, setPassages] = useState<McqPassage[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'MCQ' | 'CQ'>('MCQ');
  const [mcqSubTab, setMcqSubTab] = useState<'SINGLE' | 'PASSAGE'>('SINGLE');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');
  
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<string>>(new Set());
  const [expandedPassageIds, setExpandedPassageIds] = useState<Set<string>>(new Set());

  const loadFolders = async () => {
    try {
      const res = await getQuestionFolders();
      if (res.success && res.data) setFolders(res.data);
    } catch (err) { console.error(err); }
  };

  const loadCourses = async () => {
    try {
      const res = await getCourses({});
      if (res.success && res.data) setCourses(res.data || []);
    } catch (err) { console.error(err); }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const folderId = selectedFolderId === 'all' ? undefined : selectedFolderId;
      const difficulty = difficultyFilter === 'all' ? undefined : difficultyFilter;

      const res = await getQuestions(folderId, activeTab, difficulty);
      if (res.success && res.data) setQuestions(res.data);
    } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  };

  const loadPassages = async () => {
    try {
      const folderId = selectedFolderId === 'all' ? undefined : selectedFolderId;
      const res = await getPassages(folderId);
      if (res.success && res.data) setPassages(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadFolders(); loadCourses(); }, []);
  
  useEffect(() => {
    if (activeTab === 'MCQ' && mcqSubTab === 'PASSAGE') {
      loadPassages();
    } else {
      loadQuestions();
    }
  }, [selectedFolderId, difficultyFilter, activeTab, mcqSubTab]);

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

  // Folder Actions
  const handleCreateFolder = () => {
    openModal({
      title: 'Initialize Folder',
      description: 'Create a new container for question organization.',
      className: 'sm:max-w-2xl',
      content: <FolderForm courses={courses} folders={folders} onSuccess={loadFolders} />,
    });
  };

  const handleEditFolder = async (id: string) => {
    const res = await getQuestionFolderById(id);
    if (res.success && res.data) {
      openModal({
        title: 'Update Folder',
        description: 'Modify folder identity and hierarchy.',
        className: 'sm:max-w-2xl',
        content: <FolderForm courses={courses} folders={folders} folder={res.data} onSuccess={loadFolders} />,
      });
    }
  };

  // Question Actions
  const handleCreateQuestion = () => {
    openModal({
      title: 'Authorize New Question',
      description: 'Draft and configure a new inquiry for the bank.',
      className: 'sm:max-w-6xl',
      content: <QuestionForm folders={folders} initialFolderId={selectedFolderId !== 'all' ? selectedFolderId : undefined} onSuccess={loadQuestions} />,
    });
  };

  const handleEditQuestion = async (id: string) => {
    const res = await getQuestionById(id);
    if (res.success && res.data) {
      openModal({
        title: 'Update Question',
        description: 'Refine question prompt, options, or metadata.',
        className: 'sm:max-w-6xl',
        content: <QuestionForm folders={folders} question={res.data} onSuccess={loadQuestions} />,
      });
    }
  };

  const handleViewQuestion = async (id: string) => {
    const res = await getQuestionById(id);
    if (res.success && res.data) {
      openModal({
        title: 'Question Intelligence',
        description: 'Detailed audit of the question prompt and option registry.',
        className: 'sm:max-w-4xl',
        content: <QuestionDetailsView question={res.data} />,
      });
    }
  };

  // Passage Actions
  const handleCreatePassage = () => {
    openModal({
      title: 'Draft New Passage',
      description: 'Create a root passage for shared inquiry contexts.',
      className: 'sm:max-w-4xl',
      content: <PassageForm folders={folders} onSuccess={loadPassages} />,
    });
  };

  const handleEditPassage = async (id: string) => {
    const res = await getPassageById(id);
    if (res.success && res.data) {
      openModal({
        title: 'Update Passage',
        description: 'Refine passage content and shared metadata.',
        className: 'sm:max-w-4xl',
        content: <PassageForm folders={folders} passage={res.data} onSuccess={loadPassages} />,
      });
    }
  };

  const startCreateChildQuestion = (passage: McqPassage) => {
    openModal({
      title: 'Add Passage Question',
      description: `Draft a child MCQ linked to: ${passage.title || 'Selected Passage'}`,
      className: 'sm:max-w-6xl',
      content: <QuestionForm folders={folders} initialFolderId={passage.folderId} initialPassageId={passage.id} onSuccess={loadPassages} />,
    });
  };

  const handleDeleteQuestion = (id: string, callback: () => void) => {
    openModal({
      title: 'Question Deletion',
      description: 'Are you sure you want to permanently remove this inquiry from the repository? This action is non-reversible.',
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm Deletion"
          description="Permanently purging this inquiry asset from the institutional intelligence bank."
          variant="danger"
          onConfirm={async () => {
            await deleteQuestion(id);
            callback();
            toast({ title: 'Success', description: 'Question purged successfully', variant: 'success' });
          }}
        />
      ),
    });
  };

  const handleDeletePassage = (id: string, callback: () => void) => {
    openModal({
      title: 'Passage Deletion',
      description: 'Are you sure you want to permanently remove this contextual passage? All linked child inquiries will be impacted.',
      className: 'sm:max-w-xl',
      content: (
        <ConfirmationModal
          title="Confirm Deletion"
          description="Permanently purging this root passage asset and its structural linkages."
          variant="danger"
          onConfirm={async () => {
            await deletePassage(id);
            callback();
            toast({ title: 'Success', description: 'Passage purged successfully', variant: 'success' });
          }}
        />
      ),
    });
  };

  const stripHtml = (html: string) => html ? html.replace(/<[^>]+>/g, '') : '';

  const filteredQuestions = questions.filter(q => {
    if (q.type !== activeTab) return false;
    
    if (activeTab === 'MCQ') {
      if (mcqSubTab === 'SINGLE') {
        if (q.mcqType === 'PASSAGE_CHILD') return false;
      }
    }

    const qry = searchQuery.toLowerCase();
    return !qry || q.prompt.toLowerCase().includes(qry) || q.explanation?.toLowerCase().includes(qry);
  });

  const mcqTotal = questions.filter(q => q.type === 'MCQ').length;
  const cqTotal = questions.filter(q => q.type === 'CQ').length;

  return (
    <div className="space-y-8 text-slate-900">
      {/* Stats Section */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Inquiries', value: questions.length + passages.length, color: 'from-blue-600 to-cyan-500', icon: BookOpenCheck },
          { label: 'MCQ Repository', value: mcqTotal, color: 'from-indigo-600 to-purple-600', icon: Database },
          { label: 'Creative (CQ)', value: cqTotal, color: 'from-rose-600 to-pink-600', icon: Database },
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

      {/* Filters & Actions Section */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap flex-1 items-center gap-4">
            <div className="min-w-[300px] flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="Search inquiries by prompt or rationale..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                />
              </div>
            </div>
            
            <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white text-sm font-medium shadow-sm">
                <SelectValue placeholder="All Folders" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                <SelectItem value="all" className="text-sm font-medium">All Folders</SelectItem>
                {folders.map(f => <SelectItem key={f.id} value={f.id} className="text-sm font-medium">{f.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={difficultyFilter} onValueChange={(v) => setDifficultyFilter(v as any)}>
              <SelectTrigger className="h-12 w-[150px] rounded-2xl border-slate-200 bg-white text-sm font-medium shadow-sm">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                <SelectItem value="all" className="text-sm font-medium">All Levels</SelectItem>
                {difficultyOptions.filter(o => o !== 'all').map(o => <SelectItem key={o} value={o} className="text-sm font-medium">{o}</SelectItem>)}
              </SelectContent>
            </Select>

            <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" onClick={loadQuestions}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-slate-200 bg-white px-6 font-black uppercase tracking-widest text-[10px] text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              onClick={handleCreateFolder}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
            <Button
              className="h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-slate-200 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
              onClick={handleCreateQuestion}
            >
              <Plus className="mr-2 h-4 w-4" />
              Authorize Question
            </Button>
          </div>
        </div>
      </section>

      {/* Tabs Layout */}
      <div className="flex flex-col gap-6">
        {/* Root Level Tabs */}
        <div className="flex items-center justify-between px-2">
          <div className="flex gap-4 border-b border-slate-100 w-full">
            {[
              { id: 'MCQ', label: 'Multiple Choice (MCQ)' },
              { id: 'CQ', label: 'Creative (CQ)' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-6 py-4 text-sm font-black uppercase tracking-[0.2em] transition-all relative",
                  activeTab === tab.id 
                    ? "text-indigo-600" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full shadow-[0_-4px_12px_rgba(79,70,229,0.4)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-Level Tabs (Only for MCQ) */}
        {activeTab === 'MCQ' && (
          <div className="flex justify-center">
            <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-[20px] border border-slate-200/60 shadow-inner">
              {[
                { id: 'SINGLE', label: 'Single Line MCQ' },
                { id: 'PASSAGE', label: 'Passage Based MCQ' }
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setMcqSubTab(sub.id as any)}
                  className={cn(
                    "relative px-8 py-2.5 rounded-[14px] text-sm font-black uppercase tracking-widest transition-all duration-300",
                    mcqSubTab === sub.id 
                      ? "text-indigo-600 bg-white shadow-md transform scale-[1.02] border border-indigo-100/50" 
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/30"
                  )}
                >
                  {mcqSubTab === sub.id && (
                    <div className="absolute top-1/2 left-3 h-1 w-1 -translate-y-1/2 rounded-full bg-indigo-500" />
                  )}
                  <span className={cn(mcqSubTab === sub.id ? "ml-2" : "")}>{sub.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col rounded-[32px] border border-slate-200 bg-white overflow-hidden shadow-xl shadow-slate-200/30">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-4">
             <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {activeTab === 'MCQ' ? `${mcqSubTab} Context Registry` : 'Creative Repository'}
                </h3>
             </div>
             <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                <span className="font-bold text-indigo-600">
                  {activeTab === 'MCQ' && mcqSubTab === 'PASSAGE' ? passages.length : filteredQuestions.length}
                </span>
                <span>Assets Identified</span>
             </div>
          </div>

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
                      <div className="flex items-center justify-between">
                         <p className="text-sm font-black uppercase tracking-[0.2em] text-white">Contextual Passages Registry</p>
                         <Button onClick={handleCreatePassage} className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-black uppercase tracking-widest text-xs  text-white shadow-lg shadow-indigo-200">
                            <Plus className="mr-2 h-4 w-4" /> New Passage
                         </Button>
                      </div>

                      <div className="grid gap-6">
                         {passages.map(p => {
                           const isExpanded = expandedPassageIds.has(p.id);
                           return (
                             <div key={p.id} className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-md transition-all hover:shadow-xl hover:border-indigo-100 group">
                                <div className="flex flex-col sm:flex-row gap-6 items-start justify-between cursor-pointer" onClick={() => togglePassageExpand(p.id)}>
                                   <div className="flex-1 space-y-3">
                                      <div className="flex items-center gap-3">
                                         {isExpanded ? <ChevronUp className="h-4 w-4 text-indigo-500" /> : <ChevronDown className="h-4 w-4 text-slate-300 group-hover:text-indigo-500" />}
                                         <Badge className="bg-indigo-50 text-indigo-700 font-black text-xs uppercase px-2 py-0.5">PASSAGE</Badge>
                                         {p.difficulty && <Badge variant="outline" className="font-black text-xs uppercase px-2 py-0.5">{p.difficulty}</Badge>}
                                         <span className="text-sm font-black text-slate-400 uppercase tracking-widest">({p.questions?.length || 0} Linked Inquiries)</span>
                                      </div>
                                      <h3 className="text-lg font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                                         {p.title || 'Untitled Passage Asset'}
                                      </h3>
                                      {!isExpanded && <p className="text-base font-medium text-slate-500 line-clamp-2 leading-relaxed">{stripHtml(p.content)}</p>}
                                   </div>
                                   <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                      <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200 bg-white font-black uppercase tracking-widest text-xs text-indigo-600 hover:bg-indigo-50" onClick={() => startCreateChildQuestion(p)}>
                                         <Plus className="mr-1.5 h-3.5 w-3.5" /> Link MCQ
                                      </Button>
                                      <Button variant="outline" size="sm" className="h-9 w-9 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm" onClick={() => handleEditPassage(p.id)}>
                                         <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button variant="outline" size="sm" className="h-9 w-9 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 shadow-sm" onClick={() => handleDeletePassage(p.id, loadPassages)}>
                                         <Trash2 className="h-4 w-4" />
                                      </Button>
                                   </div>
                                </div>

                                {isExpanded && (
                                  <div className="mt-8 pt-8 border-t border-slate-100 space-y-8 animate-in fade-in duration-500">
                                     <div className="bg-slate-50/50 p-8 rounded-[28px] border border-slate-100">
                                        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Passage Content</p>
                                        <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: p.content }} />
                                     </div>

                                     {p.questions && p.questions.length > 0 && (
                                       <div className="space-y-4">
                                          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 px-2 flex items-center gap-2">
                                             <BookOpenCheck className="h-4 w-4" /> Linked Question Assets
                                          </p>
                                          <div className="grid gap-3">
                                             {p.questions.map(q => (
                                               <div key={q.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 transition-all cursor-pointer group/q" onClick={() => handleViewQuestion(q.id)}>
                                                  <div className="flex flex-col">
                                                     <span className="text-base font-bold text-slate-800 group-hover/q:text-indigo-600 transition-colors">{stripHtml(q.prompt)}</span>
                                                     <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{q.options?.length || 0} Options</span>
                                                  </div>
                                                  <div className="flex gap-2">
                                                     <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-indigo-600" onClick={e => { e.stopPropagation(); handleEditQuestion(q.id); }}><Edit className="h-3.5 w-3.5" /></Button>
                                                     <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-500" onClick={e => { e.stopPropagation(); handleDeleteQuestion(q.id, loadPassages); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                                                  </div>
                                               </div>
                                             ))}
                                          </div>
                                       </div>
                                     )}
                                  </div>
                                )}
                             </div>
                           );
                         })}
                      </div>
                   </div>
                 ) : (
                   <div className="overflow-x-auto">
                      <Table>
                         <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-b border-slate-100">
                               <TableHead className="px-8 font-black text-sm uppercase tracking-widest text-slate-400">Inquiry Data</TableHead>
                               <TableHead className="font-black text-sm uppercase tracking-widest text-slate-400">Folder context</TableHead>
                               <TableHead className="font-black text-sm uppercase tracking-widest text-slate-400">Classification</TableHead>
                               <TableHead className="font-black text-sm uppercase tracking-widest text-slate-400">Details</TableHead>
                               <TableHead className="px-8 font-black text-sm uppercase tracking-widest text-slate-400 text-center">Manage</TableHead>
                            </TableRow>
                         </TableHeader>
                         <TableBody>
                            {filteredQuestions.map((q) => {
                              const isExpanded = expandedQuestionIds.has(q.id);
                              return (
                                <React.Fragment key={q.id}>
                                  <TableRow className="group border-slate-100 transition-colors hover:bg-slate-50/80 cursor-pointer" onClick={() => toggleExpand(q.id)}>
                                     <TableCell className="px-8 py-5 max-w-md">
                                        <div className="flex flex-col gap-1">
                                           <div className="flex items-center gap-2">
                                              {isExpanded ? <ChevronUp className="h-4 w-4 text-indigo-500" /> : <ChevronDown className="h-4 w-4 text-slate-300 group-hover:text-indigo-500" />}
                                              <span className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{stripHtml(q.prompt)}</span>
                                           </div>
                                           <span className="text-sm font-medium text-slate-400 ml-6">ID: {q.id.slice(0, 8)}...</span>
                                        </div>
                                     </TableCell>
                                     <TableCell className="py-5">
                                        <Badge variant="outline" className="rounded-lg bg-slate-50 border-slate-200 text-slate-600 font-bold text-xs uppercase px-2 py-0.5">
                                           {q.folder?.name || 'Unsorted'}
                                        </Badge>
                                     </TableCell>
                                     <TableCell className="py-5">
                                        <div className="flex flex-wrap gap-2">
                                           <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black text-xs uppercase px-2 py-0.5">{q.type}</Badge>
                                           {q.difficulty && (
                                             <Badge variant="outline" className={cn("font-black text-xs uppercase px-2 py-0.5", 
                                               q.difficulty === 'EASY' ? 'bg-emerald-50 text-emerald-700' : 
                                               q.difficulty === 'MEDIUM' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                                             )}>
                                               {q.difficulty}
                                             </Badge>
                                           )}
                                        </div>
                                     </TableCell>
                                     <TableCell className="py-5">
                                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                           {q.type === 'MCQ' ? `${q.options?.length || 0} Options` : 'Creative'}
                                        </span>
                                     </TableCell>
                                     <TableCell className="px-8 py-5 text-center">
                                        <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                                           <Button variant="outline" size="sm" className="h-9 w-9 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm" onClick={() => handleViewQuestion(q.id)}>
                                              <Eye className="h-4 w-4" />
                                           </Button>
                                           <Button variant="outline" size="sm" className="h-9 w-9 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm" onClick={() => handleEditQuestion(q.id)}>
                                              <Edit className="h-4 w-4" />
                                           </Button>
                                           <Button variant="outline" size="sm" className="h-9 w-9 rounded-xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm" onClick={() => handleDeleteQuestion(q.id, loadQuestions)}>
                                              <Trash2 className="h-4 w-4" />
                                           </Button>
                                        </div>
                                     </TableCell>
                                  </TableRow>
                                  {isExpanded && (
                                    <TableRow className="bg-slate-50/30 border-b border-slate-100">
                                       <TableCell colSpan={5} className="p-0">
                                          <div className="p-8 space-y-6 animate-in slide-in-from-top-2 duration-300">
                                             <div className="grid sm:grid-cols-2 gap-8">
                                                <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
                                                   <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Prompt Analysis</p>
                                                   <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: q.prompt }} />
                                                </div>
                                                {q.explanation && (
                                                  <div className="bg-indigo-50/20 border border-indigo-100/50 rounded-[24px] p-6 shadow-sm">
                                                     <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">Rationale</p>
                                                     <div className="prose prose-sm max-w-none text-slate-600 italic" dangerouslySetInnerHTML={{ __html: q.explanation }} />
                                                  </div>
                                                )}
                                             </div>
                                             {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                                               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                  {q.options.map(opt => (
                                                    <div key={opt.id} className={cn(
                                                      "flex items-center gap-3 p-4 rounded-2xl border transition-all",
                                                      opt.isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-100 text-slate-500"
                                                    )}>
                                                       <span className="font-black">{opt.label}.</span>
                                                       <span className="text-base font-bold flex-1">{opt.text}</span>
                                                       {opt.isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                                                    </div>
                                                  ))}
                                               </div>
                                             )}
                                          </div>
                                       </TableCell>
                                    </TableRow>
                                  )}
                                </React.Fragment>
                              );
                            })}
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
