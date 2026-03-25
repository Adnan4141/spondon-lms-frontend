'use client';

import { useState, useEffect } from 'react';
import { 
  addQuestionsToSet, 
  removeQuestionFromSet, 
  createExamSet, 
  deleteExamSet 
} from '@/lib/api/exams';
import { getQuestionFolders } from '@/lib/api/question-bank';
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
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Layers, 
  Settings2, 
  Dice5, 
  CheckCircle2, 
  Folder,
  ChevronRight,
  FileText,
  Split,
  Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useModalStore } from '@/store/modalStore';
import { OfflineExamSheet } from './OfflineExamSheet';

interface ExamQuestionBuilderProps {
  examId: string;
  exam?: any;
  sets: any[];
  onRefresh: () => void;
}

export function ExamQuestionBuilder({ examId, exam, sets, onRefresh }: ExamQuestionBuilderProps) {
  const { toast } = useToast();
  const { openModal, closeModal } = useModalStore();
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedSetId, setSelectedSetId] = useState(sets[0]?.id || '');
  const [newSetName, setNewSetName] = useState('');
  const [loading, setLoading] = useState(false);

  // Question Adding State
  const [folderId, setFolderId] = useState('');
  const [useDistribution, setUseDistribution] = useState(false);
  const [count, setCount] = useState<number>(0); 
  const [cqCount, setCqCount] = useState<number>(0);
  const [mcqSingleCount, setMcqSingleCount] = useState<number>(0);
  const [mcqPassageCount, setMcqPassageCount] = useState<number>(0);
  const [marks, setMarks] = useState(1);

  useEffect(() => {
    const loadFolders = async () => {
      const res = await getQuestionFolders();
      if (res.success) setFolders(res.data || []);
    };
    loadFolders();
  }, []);

  const handleCreateSet = async () => {
    if (!newSetName.trim()) return;
    try {
      setLoading(true);
      const res = await createExamSet({ examId, name: newSetName.trim() });
      if (res.success) {
        toast({ title: 'Set Created', description: 'New question set initialized' });
        setNewSetName('');
        onRefresh();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestions = async () => {
    if (!selectedSetId || !folderId) {
      toast({ title: 'Parameters Missing', description: 'Please select a target set and source folder', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      const res = await addQuestionsToSet({
        examSetId: selectedSetId,
        folderId,
        count: !useDistribution && count > 0 ? count : undefined,
        cqCount: useDistribution ? cqCount : undefined,
        mcqSingleCount: useDistribution ? mcqSingleCount : undefined,
        mcqPassageCount: useDistribution ? mcqPassageCount : undefined,
        marks
      });

      if (res.success) {
        toast({ title: 'Sequence Synchronized', description: res.message, variant: 'success' });
        onRefresh();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveQuestion = async (eqId: string) => {
    try {
      const res = await removeQuestionFromSet(eqId);
      if (res.success) {
        toast({ title: 'Removed', description: 'Question detached from set' });
        onRefresh();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleExportSet = (set: any) => {
    openModal({
      title: 'Institutional Exam Compilation',
      description: 'Preparing high-fidelity offline assessment payload.',
      className: 'sm:max-w-[950px] h-[95vh]',
      content: <OfflineExamSheet exam={exam} set={set} onClose={closeModal} />
    });
  };

  const currentSet = sets.find(s => s.id === selectedSetId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Set Management Area */}
      <div className="grid gap-8 lg:grid-cols-3">
         <div className="lg:col-span-1 space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
               <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4 flex items-center gap-2">
                  <Layers className="h-4 w-4" /> Set Registry
               </h3>
               <div className="space-y-3">
                  {sets.map(s => (
                    <div key={s.id} className="group relative">
                      <button
                        onClick={() => setSelectedSetId(s.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                          selectedSetId === s.id ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-indigo-200"
                        )}
                      >
                         <span className="font-bold text-sm truncate pr-10">{s.name}</span>
                         <Badge variant="outline" className={cn("text-[9px] font-black", selectedSetId === s.id ? "bg-white/20 text-white border-white/30" : "bg-white text-slate-400")}>
                            {s.questions?.length || 0} Q
                         </Badge>
                      </button>
                      <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className={cn("h-8 w-8 rounded-lg", selectedSetId === s.id ? "text-white hover:bg-white/10" : "text-indigo-600 hover:bg-indigo-50")}
                           onClick={(e) => { e.stopPropagation(); handleExportSet(s); }}
                         >
                            <Printer className="h-4 w-4" />
                         </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-slate-100 mt-4 space-y-3">
                     <Input 
                        placeholder="New Set Identity..." 
                        value={newSetName} 
                        onChange={e => setNewSetName(e.target.value)}
                        className="h-10 rounded-xl border-slate-200 font-bold text-xs"
                     />
                     <Button onClick={handleCreateSet} disabled={loading || !newSetName} className="w-full h-10 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] shadow-lg">
                        <Plus className="mr-2 h-3.5 w-3.5" /> Initialize Set
                     </Button>
                  </div>
               </div>
            </div>
         </div>

         {/* Question Integration Engine */}
         <div className="lg:col-span-2 space-y-6">
            {selectedSetId ? (
              <>
                <div className="rounded-[32px] border border-indigo-100 bg-indigo-50/20 p-8 shadow-sm">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="h-12 w-12 rounded-[20px] bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                         <Settings2 className="h-6 w-6" />
                      </div>
                      <div>
                         <h2 className="text-xl font-black text-slate-900 tracking-tight">Question Integration Protocol</h2>
                         <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Active Target: {currentSet?.name}</p>
                      </div>
                   </div>

                   <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Source Repository</Label>
                         <Select value={folderId} onValueChange={setFolderId}>
                            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold shadow-inner">
                               <SelectValue placeholder="Select Folder" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-xl max-h-[300px]">
                               {folders.map(f => <SelectItem key={f.id} value={f.id} className="font-bold py-3">{f.name}</SelectItem>)}
                            </SelectContent>
                         </Select>
                      </div>

                      <div className="space-y-2">
                         <div className="flex items-center justify-between px-1 mb-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selection Logic</Label>
                            <button 
                              onClick={() => setUseDistribution(!useDistribution)}
                              className="flex items-center gap-1 text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                               {useDistribution ? <RefreshCw className="h-3 w-3" /> : <Split className="h-3 w-3" />}
                               {useDistribution ? "Bulk Mode" : "Granular Mode"}
                            </button>
                         </div>
                         {!useDistribution ? (
                           <div className="grid grid-cols-2 gap-3">
                              <Input 
                                 type="number" 
                                 placeholder="All" 
                                 value={count || ''} 
                                 onChange={e => setCount(parseInt(e.target.value) || 0)}
                                 className="h-12 rounded-2xl border-slate-200 bg-white font-bold shadow-inner"
                              />
                              <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4">
                                 {count > 0 ? (
                                   <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase italic">
                                      <Dice5 className="h-3 w-3" /> Random
                                   </div>
                                 ) : (
                                   <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase italic">
                                      <CheckCircle2 className="h-3 w-3" /> Select All
                                   </div>
                                 )}
                              </div>
                           </div>
                         ) : (
                           <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                 <Input type="number" placeholder="CQ" value={cqCount || ''} onChange={e => setCqCount(parseInt(e.target.value) || 0)} className="h-10 rounded-xl border-slate-200 bg-white text-center font-bold text-xs" />
                                 <p className="text-[8px] font-black text-center text-slate-400 uppercase tracking-tighter">CQ</p>
                              </div>
                              <div className="space-y-1">
                                 <Input type="number" placeholder="Single" value={mcqSingleCount || ''} onChange={e => setMcqSingleCount(parseInt(e.target.value) || 0)} className="h-10 rounded-xl border-slate-200 bg-white text-center font-bold text-xs" />
                                 <p className="text-[8px] font-black text-center text-slate-400 uppercase tracking-tighter">Single MCQ</p>
                              </div>
                              <div className="space-y-1">
                                 <Input type="number" placeholder="Combined" value={mcqPassageCount || ''} onChange={e => setMcqPassageCount(parseInt(e.target.value) || 0)} className="h-10 rounded-xl border-slate-200 bg-white text-center font-bold text-xs" />
                                 <p className="text-[8px] font-black text-center text-slate-400 uppercase tracking-tighter">Combined MCQ</p>
                              </div>
                           </div>
                         )}
                      </div>

                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Marks</Label>
                         <Input 
                            type="number" 
                            step="0.5" 
                            value={marks} 
                            onChange={e => setMarks(parseFloat(e.target.value) || 1)}
                            className="h-12 rounded-2xl border-slate-200 bg-white font-bold shadow-inner"
                         />
                      </div>

                      <div className="flex items-end">
                         <Button onClick={handleAddQuestions} disabled={loading || !folderId} className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02]">
                            {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Execute Integration
                         </Button>
                      </div>
                   </div>
                </div>

                {/* Current Set Questions */}
                <div className="rounded-[32px] border border-slate-200 bg-white overflow-hidden shadow-xl shadow-slate-200/20">
                   <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Integrated Inquiry Registry</h3>
                      <Badge variant="outline" className="bg-white text-indigo-600 font-black">{currentSet?.questions?.length || 0} Identified</Badge>
                   </div>
                   <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto no-scrollbar">
                      {(() => {
                        const questions = currentSet?.questions || [];
                        // Group questions: standalone items + passage blocks
                        const rendered: React.ReactNode[] = [];
                        const seenPassageIds = new Set<string>();
                        let questionNumber = 0;

                        for (let i = 0; i < questions.length; i++) {
                          const eq = questions[i];
                          const passageId = eq.question?.passageId;

                          if (passageId && !seenPassageIds.has(passageId)) {
                            // First encounter of this passage — render passage block + all children
                            seenPassageIds.add(passageId);
                            const passageContent = eq.question?.passage?.content;
                            const children = questions.filter((q: any) => q.question?.passageId === passageId);

                            rendered.push(
                              <div key={`passage-${passageId}`} className="border-b border-slate-100">
                                {/* Passage Header */}
                                <div className="p-6 bg-indigo-50/40 border-b border-indigo-100/60">
                                  <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                                      <Layers className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge className="text-[8px] font-black uppercase bg-indigo-100 text-indigo-700 border-indigo-200">Combined MCQ Passage</Badge>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{children.length} Questions</span>
                                      </div>
                                      {passageContent && (
                                        <p className="text-sm font-medium text-indigo-900 line-clamp-2">
                                          {passageContent.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Child Questions */}
                                {children.map((child: any) => {
                                  questionNumber++;
                                  return (
                                    <div key={child.id} className="group p-5 pl-14 flex items-center justify-between transition-all hover:bg-indigo-50/20 border-l-4 border-indigo-200 ml-6">
                                      <div className="flex items-center gap-4">
                                        <span className="text-sm font-black text-indigo-400 w-6">{questionNumber}.</span>
                                        <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                                          <FileText className="h-4 w-4" />
                                        </div>
                                        <div className="space-y-0.5">
                                          <p className="text-sm font-bold text-slate-700 line-clamp-1">
                                            {child.question?.prompt?.replace(/<[^>]+>/g, '')}
                                          </p>
                                          <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Weight: {child.marks} Points</span>
                                            <span className="h-1 w-1 rounded-full bg-slate-200" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Index: {child.orderIndex}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                        onClick={() => handleRemoveQuestion(child.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          } else if (!passageId) {
                            // Standalone question (Single MCQ or CQ)
                            questionNumber++;
                            rendered.push(
                              <div key={eq.id} className="group p-6 flex items-center justify-between transition-all hover:bg-slate-50">
                                <div className="flex items-center gap-5">
                                  <span className="text-sm font-black text-slate-300 w-6">{questionNumber}.</span>
                                  <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-400 group-hover:text-indigo-600 flex items-center justify-center shadow-sm transition-colors">
                                    <FileText className="h-5 w-5" />
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="text-base font-bold text-slate-800 line-clamp-1">
                                      {eq.question?.prompt?.replace(/<[^>]+>/g, '')}
                                    </p>
                                    <div className="flex items-center gap-3">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Weight: {eq.marks} Points</span>
                                      <Badge variant="outline" className="text-[8px] font-black uppercase bg-white text-slate-500 border-slate-200">{eq.question?.type}</Badge>
                                      <span className="h-1 w-1 rounded-full bg-slate-200" />
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Index: {eq.orderIndex}</span>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                  onClick={() => handleRemoveQuestion(eq.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          }
                          // If passageId is already seen, skip (already rendered as part of the passage block)
                        }

                        if (rendered.length === 0) {
                          return <div className="p-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 italic">No inquiries linked to this set protocol.</div>;
                        }
                        return rendered;
                      })()}
                   </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-20 rounded-[40px] border-2 border-dashed border-slate-100 bg-slate-50/30 text-center">
                 <Layers className="h-12 w-12 text-slate-200 mb-4" />
                 <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Select or initialize a question set to activate protocol.</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}
