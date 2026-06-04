'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createQuestion, updateQuestion, uploadQuestionImage, getPassages } from '@/lib/api/question-bank';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import type { 
  Question, 
  QuestionFolder, 
  QuestionType, 
  Difficulty, 
  McqType, 
  McqPassage,
  CreateQuestionDto,
  UpdateQuestionDto,
  CreateMcqOptionDto
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
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, X, CheckCircle2, ListFilter, Type, BarChart3, CalendarIcon, FolderOpen, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

const inputClass =
  'h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner';
const sectionLabel = 'text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 block';

interface QuestionFormProps {
  folders: QuestionFolder[];
  question?: Question | null;
  initialFolderId?: string;
  initialPassageId?: string;
  initialType?: QuestionType;
  initialMcqType?: McqType;
  onSuccess: () => Promise<void>;
}

const questionTypeOptions: QuestionType[] = ['MCQ', 'CQ'];
const difficultyOptions: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
const mcqTypeOptions: McqType[] = ['SINGLE', 'PASSAGE_CHILD'];
const MCQ_TYPE_LABELS: Record<McqType, string> = {
  SINGLE: 'Simple MCQ',
  PASSAGE_CHILD: 'Passage-Based MCQ',
};

export function QuestionForm({ 
  folders, 
  question, 
  initialFolderId, 
  initialPassageId, 
  initialType,
  initialMcqType,
  onSuccess 
}: QuestionFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  const [form, setForm] = useState<CreateQuestionDto>({
    folderId: initialFolderId || '',
    type: initialType || 'MCQ',
    mcqType: initialMcqType || 'SINGLE',
    passageId: initialPassageId || undefined,
    difficulty: 'EASY' as Difficulty | undefined,
    year: CURRENT_YEAR,
    prompt: '',
    explanation: '',
    tags: [],
    options: [],
  });
  const [mcqOptions, setMcqOptions] = useState<CreateMcqOptionDto[]>([]);
  const [passages, setPassages] = useState<McqPassage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  
  const optionsEndRef = useRef<HTMLDivElement | null>(null);
  const isEdit = !!question;

  useEffect(() => {
    if (question) {
      setForm({
        folderId: question.folderId,
        type: question.type,
        mcqType: (question.mcqType as McqType) || 'SINGLE',
        passageId: question.passageId || undefined,
        difficulty: question.difficulty || undefined,
        year: question.year || undefined,
        prompt: question.prompt,
        explanation: question.explanation || '',
        tags: question.tags || [],
        options: [],
      });
      setMcqOptions(
        question.options?.map((opt) => ({
          label: opt.label,
          text: opt.text,
          isCorrect: opt.isCorrect,
        })) || []
      );
      if (question.explanation) setShowExplanation(true);
    } else if (initialPassageId) {
       setForm(prev => ({ ...prev, mcqType: 'PASSAGE_CHILD', passageId: initialPassageId }));
       setMcqOptions([
         { label: 'A', text: '', isCorrect: false },
         { label: 'B', text: '', isCorrect: false },
         { label: 'C', text: '', isCorrect: false },
         { label: 'D', text: '', isCorrect: false },
       ]);
    }
  }, [question, initialPassageId]);

  useEffect(() => {
    const loadPassages = async () => {
      if (form.folderId) {
        const res = await getPassages(form.folderId);
        if (res.success && res.data) setPassages(res.data);
      }
    };
    loadPassages();
  }, [form.folderId]);

  const handleEditorImageUpload = async (file: File): Promise<string> => {
    try {
      const response = await uploadQuestionImage(file);
      if (response.success && response.data?.url) return response.data.url;
      throw new Error(response.message || 'Failed to upload image');
    } catch (err: any) {
      toast({ title: 'Image upload failed', description: err.message, variant: 'destructive' });
      throw err;
    }
  };

  const addOption = () => {
    setMcqOptions(prev => [...prev, { label: String.fromCharCode(65 + prev.length), text: '', isCorrect: false }]);
    setTimeout(() => optionsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const removeOption = (idx: number) => {
    setMcqOptions(prev => prev.filter((_, i) => i !== idx).map((opt, i) => ({ ...opt, label: String.fromCharCode(65 + i) })));
  };

  const updateOption = (idx: number, field: keyof CreateMcqOptionDto, value: any) => {
    setMcqOptions(prev => prev.map((opt, i) => i === idx ? { ...opt, [field]: value } : opt));
  };

  const handleSubmit = async () => {
    if (!form.folderId || !form.prompt.trim()) {
      setError('Folder and prompt are required.');
      return;
    }

    if (form.type === 'MCQ') {
      if (mcqOptions.length < 2) {
        setError('MCQ requires at least 2 options.');
        return;
      }
      if (!mcqOptions.some(o => o.isCorrect)) {
        setError('At least one correct option must be identified.');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const payload = {
        ...form,
        options: form.type === 'MCQ' ? mcqOptions : undefined,
      };

      if (isEdit && question) {
        await updateQuestion(question.id, payload as UpdateQuestionDto);
      } else {
        await createQuestion(payload as CreateQuestionDto);
      }
      
      toast({
        title: 'Success',
        description: `Question ${isEdit ? 'updated' : 'created'} successfully`,
        variant: 'success',
      });
      
      closeModal();
      await onSuccess();
    } catch (err: any) {
      setError(err.message || 'Action failed');
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 no-scrollbar">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-2">
              <label className={sectionLabel}>Question Prompt</label>
              <RichTextEditor
                value={form.prompt}
                onChange={(html) => setForm(prev => ({ ...prev, prompt: html }))}
                onImageUpload={handleEditorImageUpload}
                placeholder="Draft the primary question prompt..."
              />
            </div>

            <div className="space-y-2">
              {!showExplanation ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-10 rounded-xl border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50"
                  onClick={() => setShowExplanation(true)}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Solution Explanation
                </Button>
              ) : (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <label className={sectionLabel}>Solution Explanation (Optional)</label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setShowExplanation(false);
                        setForm(prev => ({ ...prev, explanation: '' }));
                      }}
                      className="h-6 px-2 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50"
                    >
                      Remove
                    </Button>
                  </div>
                  <RichTextEditor
                    value={form.explanation || ''}
                    onChange={(html) => setForm(prev => ({ ...prev, explanation: html }))}
                    onImageUpload={handleEditorImageUpload}
                    placeholder="Provide reasoning for the correct answer..."
                  />
                </div>
              )}
            </div>

            {form.type === 'MCQ' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <label className={sectionLabel}>MCQ Option Registry</label>
                   <Button type="button" variant="outline" size="sm" onClick={addOption} className="h-8 rounded-xl border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50">
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Option
                   </Button>
                </div>
                
                <div className="grid gap-3">
                   {mcqOptions.map((opt, idx) => (
                     <div key={idx} className="group flex gap-3 items-start animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 font-black text-slate-500">
                           {opt.label}
                        </div>
                        <div className="flex-1">
                           <Input 
                             className={inputClass} 
                             value={opt.text} 
                             onChange={(e) => updateOption(idx, 'text', e.target.value)}
                             placeholder={`Option ${opt.label} text...`}
                           />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => updateOption(idx, 'isCorrect', !opt.isCorrect)}
                          className={cn(
                            "h-12 w-12 shrink-0 rounded-2xl border transition-all",
                            opt.isCorrect ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-white border-slate-200 text-slate-300 hover:text-emerald-500 hover:border-emerald-200"
                          )}
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(idx)} className="h-12 w-12 rounded-2xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity">
                           <X className="h-5 w-5" />
                        </Button>
                     </div>
                   ))}
                   <div ref={optionsEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Configuration Sidebar */}
          <div className="space-y-8 lg:border-l lg:pl-8 border-slate-100">
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className={sectionLabel}><FolderOpen className="inline h-3 w-3 mr-1" /> Folder</label>
                   <Select value={form.folderId} onValueChange={(v) => setForm(p => ({ ...p, folderId: v }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700">
                         <SelectValue placeholder="Select Folder" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         {folders.map(f => <SelectItem key={f.id} value={f.id} className="text-sm font-medium">{f.name}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                   <label className={sectionLabel}><Type className="inline h-3 w-3 mr-1" /> Type</label>
                   <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v as QuestionType }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700">
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         {questionTypeOptions.map(o => <SelectItem key={o} value={o} className="text-sm font-medium">{o}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>

                {form.type === 'MCQ' && (
                  <div className="space-y-2">
                     <label className={sectionLabel}><ListFilter className="inline h-3 w-3 mr-1" /> MCQ Subtype</label>
                     <Select value={form.mcqType} onValueChange={(v) => setForm(p => ({ ...p, mcqType: v as McqType }))}>
                        <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                           {mcqTypeOptions.map(o => (
                             <SelectItem key={o} value={o} className="text-sm font-medium">
                               {MCQ_TYPE_LABELS[o]}
                             </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                )}

                {form.mcqType === 'PASSAGE_CHILD' && (
                  <div className="space-y-2">
                     <label className={sectionLabel}><FileText className="inline h-3 w-3 mr-1" /> Link Combined MCQ</label>
                     <Select value={form.passageId || 'none'} onValueChange={(v) => setForm(p => ({ ...p, passageId: v === 'none' ? undefined : v }))}>
                        <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-700">
                           <SelectValue placeholder="Select Combined MCQ" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                           <SelectItem value="none" className="text-sm font-medium">No Combined MCQ</SelectItem>
                           {passages.map(p => <SelectItem key={p.id} value={p.id} className="text-sm font-medium">{p.content.replace(/<[^>]+>/g, ' ').trim().slice(0, 40)}...</SelectItem>)}
                        </SelectContent>
                     </Select>
                  </div>
                )}

                <div className="space-y-2">
                   <label className={sectionLabel}><BarChart3 className="inline h-3 w-3 mr-1" /> Difficulty</label>
                   <Select 
                     value={form.difficulty ?? 'none'} 
                     onValueChange={(v) => setForm(p => ({ ...p, difficulty: v === 'none' ? undefined : v as Difficulty }))}
                   >
                      <SelectTrigger className={cn("h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold shadow-inner", 
                        !form.difficulty ? "text-slate-400" : "text-slate-700"
                      )}>
                         <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                         <SelectItem value="none" className="text-sm font-medium text-slate-400">Unspecified</SelectItem>
                         <SelectItem value="EASY" className="text-sm font-medium text-emerald-600">EASY</SelectItem>
                         <SelectItem value="MEDIUM" className="text-sm font-medium text-amber-600">MEDIUM</SelectItem>
                         <SelectItem value="HARD" className="text-sm font-medium text-rose-600">HARD</SelectItem>
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                   <label className={sectionLabel}><CalendarIcon className="inline h-3 w-3 mr-1" /> Year</label>
                   <Popover open={yearOpen} onOpenChange={setYearOpen}>
                     <PopoverTrigger asChild>
                       <Button
                         variant="outline"
                         className={cn(
                           'w-full h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-bold justify-start shadow-inner',
                           form.year ? 'text-slate-900' : 'text-slate-400'
                         )}
                       >
                         <CalendarIcon className="mr-2 h-4 w-4" />
                         {form.year ? form.year : 'Select Year'}
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-44 p-2 rounded-2xl border-slate-200 bg-white shadow-xl" align="start">
                       <div className="max-h-48 overflow-y-auto space-y-0.5 no-scrollbar">
                         <button
                           className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-50"
                           onClick={() => { setForm(p => ({ ...p, year: undefined })); setYearOpen(false); }}
                         >
                           None
                         </button>
                         {YEAR_OPTIONS.map(y => (
                           <button
                             key={y}
                             className={cn(
                               'w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-colors',
                               form.year === y ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                             )}
                             onClick={() => { setForm(p => ({ ...p, year: y })); setYearOpen(false); }}
                           >
                             {y}
                           </button>
                         ))}
                       </div>
                     </PopoverContent>
                   </Popover>
                </div>
             </div>

             <div className="rounded-[28px] bg-slate-900 p-6 text-white shadow-xl shadow-slate-200">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Editor Context</p>
                <p className="text-base font-bold leading-relaxed text-slate-300">
                  Questions are indexed by folder and used during automated exam generation. Use clear prompts and detailed explanations.
                </p>
             </div>
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-base font-bold text-rose-600 uppercase tracking-widest flex items-center gap-3">
             <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
             {error}
          </div>
        )}
      </div>

      <div className="mt-auto shrink-0 border-t border-slate-100 bg-slate-50/80 px-8 pb-8 pt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-2xl border-slate-200 bg-white font-black uppercase tracking-[0.2em] text-[11px] text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all"
            onClick={closeModal}
          >
            Discard
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-[2] h-12 rounded-2xl bg-slate-900 font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {submitting ? 'Processing...' : isEdit ? 'Update Question' : 'Create Question'}
          </Button>
        </div>
      </div>
    </div>
  );
}
