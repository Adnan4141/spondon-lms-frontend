'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Printer, X, GraduationCap, Clock, FileText, Info, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineExamSheetProps {
  exam: any;
  set: any;
  onClose: () => void;
}

export function OfflineExamSheet({ exam, set, onClose }: OfflineExamSheetProps) {
  const handlePrint = () => {
    window.print();
  };

  const stripHtml = (html: string) => html ? html.replace(/<[^>]+>/g, '') : '';

  // Calculate real question numbers (skipping passage entries)
  let questionNumber = 0;

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      {/* Action Bar (Hidden on Print) */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 print:hidden shrink-0">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
               <FileText className="h-5 w-5" />
            </div>
            <div>
               <h3 className="text-base font-black text-slate-900 leading-none">Offline Set Preview</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Examination Format</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <Button onClick={handlePrint} className="h-10 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg transition-all">
               <Printer className="mr-2 h-4 w-4" /> Export to PDF / Print
            </Button>
            <Button variant="outline" onClick={onClose} className="h-10 w-10 rounded-xl border-slate-200">
               <X className="h-4 w-4" />
            </Button>
         </div>
      </div>

      {/* Printable Area */}
      <div className="flex-1 overflow-y-auto p-10 print:p-0 no-scrollbar">
         <div className="max-w-[800px] mx-auto bg-white print:max-w-none">
            {/* Header / Branding */}
            <header className="border-b-[3px] border-slate-900 pb-8 mb-10">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                     <div className="h-16 w-16 rounded-[24px] bg-slate-900 flex items-center justify-center text-white">
                        <GraduationCap className="h-10 w-10" />
                     </div>
                     <div>
                        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Spondon Academy</h1>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Academic Excellence & Assessment Center</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="inline-block px-4 py-1 bg-slate-100 rounded-lg font-black text-xs uppercase tracking-widest border border-slate-200">
                        SET_IDENTITY: {set.name}
                     </div>
                     <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Official Exam Registry</p>
                  </div>
               </div>

               <div className="mt-10 grid grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[32px] border border-slate-100 print:bg-transparent print:border-none print:p-0">
                  <div className="space-y-4">
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Examination Title</p>
                        <p className="text-2xl font-black text-slate-900">{exam.title}</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Academic Course</p>
                        <p className="text-lg font-bold text-slate-700">{exam.course?.name} <span className="text-slate-400">[{exam.course?.code}]</span></p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 border-l-2 border-slate-200 pl-10 print:border-l-slate-900">
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Duration</p>
                        <p className="text-xl font-black text-slate-900">{exam.durationMinutes || '---'} Minutes</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Weight</p>
                        <p className="text-xl font-black text-slate-900">{set.questions?.reduce((sum: number, q: any) => sum + Number(q.marks), 0)} Marks</p>
                     </div>
                     <div className="col-span-2 pt-2 border-t border-slate-100 print:border-t-slate-200">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Core Instructions</p>
                        <p className="text-[11px] font-bold text-slate-600 uppercase leading-relaxed mt-1">
                           Analyze all inquiries thoroughly. Marks allocated per question are indicated in the right margin. 
                           Passage contexts are mandatory for the subsequent marked questions.
                        </p>
                     </div>
                  </div>
               </div>
            </header>

            {/* Candidate Identity Protocol */}
            <div className="grid grid-cols-3 gap-10 mb-16 border-b-2 border-dashed border-slate-200 pb-10">
               <div className="border-b border-slate-900 pb-2">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-6 tracking-[0.2em]">Candidate Full Name</p>
               </div>
               <div className="border-b border-slate-900 pb-2">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-6 tracking-[0.2em]">Registry Roll / ID</p>
               </div>
               <div className="border-b border-slate-900 pb-2">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-6 tracking-[0.2em]">Authenticity Signature</p>
               </div>
            </div>

            {/* Questions Registry */}
            <div className="space-y-5">
               {set.questions?.map((eq: any) => {
                  const q = eq.question;
                  const p = eq.passage;

                  if (p) {
                    return (
                      <div key={eq.id} className="space-y-8 break-inside-avoid pt-4">
                         <div className="bg-slate-50 p-5 r border-slate-200 print:bg-transparent print:border-slate-900 print:rounded-2xl">
                         
                            <div className="text-[15px] leading-[1.8] text-slate-800 font-medium prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: p.content }} />
                            
                         </div>
                      </div>
                    );
                  }

                  if (q) {
                    questionNumber++;
                    const isChild = !!q.passageId;

                    return (
                      <div key={eq.id} className={cn(
                        "group relative break-inside-avoid", 
                        isChild ? "ml-5 border-l-4 border-slate-100 pl-10 py-6 bg-slate-50/30 rounded-r-[32px] print:border-l-slate-300 print:bg-transparent" : "pt-4"
                      )}>
                         <div className="flex items-start gap-6">
                            <span className={cn("text-lg font-black text-slate-900 min-w-[40px] pt-0.5", isChild && "text-slate-500")}>
                               {questionNumber}.
                            </span>
                            <div className="flex-1 space-y-8">
                               <div className="flex justify-between items-start gap-6">
                                  <div className={cn("text-[16px] font-bold text-slate-900 leading-relaxed", isChild && "text-[15px]")} dangerouslySetInnerHTML={{ __html: q.prompt }} />
                                  <div className="flex flex-col items-end gap-1 shrink-0">
                                     <span className="text-[11px] font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 whitespace-nowrap print:border-slate-900">
                                        {eq.marks} PTS
                                     </span>
                                     {isChild && <span className="text-[8px] font-black text-indigo-500 uppercase tracking-tighter">Passage_Linked</span>}
                                  </div>
                               </div>

                               {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                                 <div className="grid grid-cols-2 gap-x-16 gap-y-6 pt-4">
                                    {q.options.map((opt: any) => (
                                      <div key={opt.id} className="flex items-center gap-4">
                                         <div className="h-6 w-6 rounded-full border-2 border-slate-300 shrink-0 print:border-slate-900" />
                                         <span className="text-base font-black text-slate-400 w-5">{opt.label}.</span>
                                         <span className="text-[15px] font-semibold text-slate-700">{opt.text}</span>
                                      </div>
                                    ))}
                                 </div>
                               )}

                               {q.type === 'CQ' && (
                                 <div className="pt-6 space-y-4">
                                    <div className="h-40 w-full border-2 border-dashed border-slate-200 rounded-[32px] print:border-slate-400" />
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] text-center">Protocol Response Matrix</p>
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                    );
                  }
                  return null;
               })}
            </div>

            {/* Institutional Compliance Footer */}
            <footer className="mt-32 pt-16 border-t-4 border-slate-900 flex flex-col gap-10">
               <div className="grid grid-cols-3 gap-20">
                  <div className="border-t border-slate-200 pt-3 text-center print:border-slate-900">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Assessing Instructor</p>
                  </div>
                  <div className="border-t border-slate-200 pt-3 text-center print:border-slate-900">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Branch Controller</p>
                  </div>
                  <div className="border-t border-slate-200 pt-3 text-center print:border-slate-900">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Internal Audit</p>
                  </div>
               </div>
               
               <div className="flex items-center justify-between opacity-40 print:opacity-100">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                     © Spondon LMS Institutional Protocol v2.0
                  </div>
                  <div className="font-mono text-[9px] font-bold text-slate-400 uppercase">
                     REF_ID: {set.id.toUpperCase()} • {new Date().toISOString().slice(0, 10)}
                  </div>
               </div>
            </footer>
         </div>
      </div>
    </div>
  );
}
