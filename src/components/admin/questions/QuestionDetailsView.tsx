'use client';

import { Question } from '@/types/question';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  HelpCircle, 
  BarChart3, 
  Calendar, 
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Lightbulb
} from 'lucide-react';

interface QuestionDetailsViewProps {
  question: Question;
}

export function QuestionDetailsView({ question }: QuestionDetailsViewProps) {
  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar">
        {/* Header Hero */}
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-50/50 p-8 shadow-sm mb-10">
           <div className="absolute top-0 right-0 p-6 flex gap-2">
              <Badge variant="outline" className="rounded-xl px-4 py-2 text-[10px] uppercase tracking-widest bg-white border-slate-200 font-black">
                {question.type}
              </Badge>
              {question.difficulty && (
                <Badge variant="outline" className={cn("rounded-xl px-4 py-2 text-[10px] uppercase tracking-widest font-black", 
                  question.difficulty === 'EASY' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  question.difficulty === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-rose-50 text-rose-700 border-rose-100'
                )}>
                  {question.difficulty}
                </Badge>
              )}
           </div>
           
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-slate-200 text-indigo-600 shadow-sm">
                    <HelpCircle className="h-6 w-6" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Question Identifier</span>
                    <span className="text-[10px] font-bold text-slate-400">ID: {question.id.slice(0, 12)}...</span>
                 </div>
              </div>
              
              <div className="flex flex-wrap gap-6 pt-2">
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <FolderOpen className="h-4 w-4 text-indigo-500" />
                    {question.folder?.name}
                 </div>
                 {question.year && (
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Calendar className="h-4 w-4 text-emerald-500" />
                      Academic Year {question.year}
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* Question Content */}
        <div className="space-y-10">
           <section>
              <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                 <FileText className="h-4 w-4" />
                 Inquiry Prompt
              </h3>
              <div className="prose prose-slate max-w-none bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 min-h-[100px] text-slate-800 font-medium" dangerouslySetInnerHTML={{ __html: question.prompt }} />
           </section>

           {question.type === 'MCQ' && question.options && question.options.length > 0 && (
             <section>
                <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                   <AlertCircle className="h-4 w-4" />
                   Option Registry
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                   {question.options.map((opt) => (
                     <div key={opt.id} className={cn(
                       "flex items-center gap-4 p-5 rounded-[24px] border transition-all",
                       opt.isCorrect ? "bg-emerald-50 border-emerald-200 shadow-sm" : "bg-white border-slate-100"
                     )}>
                        <div className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black",
                          opt.isCorrect ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                        )}>
                           {opt.label}
                        </div>
                        <span className={cn("text-sm font-bold flex-1", opt.isCorrect ? "text-emerald-900" : "text-slate-700")}>
                          {opt.text}
                        </span>
                        {opt.isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                     </div>
                   ))}
                </div>
             </section>
           )}

           {question.explanation && (
             <section>
                <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4">
                   <Lightbulb className="h-4 w-4" />
                   Intellectual Rationale
                </h3>
                <div className="prose prose-slate max-w-none bg-indigo-50/30 p-8 rounded-[32px] border border-indigo-100 text-slate-600 italic leading-relaxed" dangerouslySetInnerHTML={{ __html: question.explanation }} />
             </section>
           )}
        </div>
      </div>
    </div>
  );
}
