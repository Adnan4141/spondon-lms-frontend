'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Printer, X, GraduationCap, Clock, FileText, Info, BookOpen, Columns, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineExamSheetProps {
  exam: any;
  set: any;
  onClose: () => void;
}

export function OfflineExamSheet({ exam, set, onClose }: OfflineExamSheetProps) {
  const [isTwoColumn, setIsTwoColumn] = useState(true);

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
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 mr-4 shadow-sm">
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className={cn("h-8 px-3 rounded-lg text-[9px] font-black uppercase transition-all", !isTwoColumn ? "bg-slate-900 text-white shadow-md" : "text-slate-400")}
                 onClick={() => setIsTwoColumn(false)}
               >
                  <Square className="mr-1.5 h-3 w-3" /> Standard
               </Button>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className={cn("h-8 px-3 rounded-lg text-[9px] font-black uppercase transition-all", isTwoColumn ? "bg-slate-900 text-white shadow-md" : "text-slate-400")}
                 onClick={() => setIsTwoColumn(true)}
               >
                  <Columns className="mr-1.5 h-3 w-3" /> Two Column
               </Button>
            </div>
            <Button onClick={handlePrint} className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg transition-all">
               <Printer className="mr-2 h-4 w-4" /> Export to PDF / Print
            </Button>
            <Button variant="outline" onClick={onClose} className="h-10 w-10 rounded-xl border-slate-200">
               <X className="h-4 w-4" />
            </Button>
         </div>
      </div>

      {/* Printable Area */}
      <div className="flex-1 overflow-y-auto p-10 print:p-0 no-scrollbar">
         <div className="max-w-[1000px] mx-auto bg-white print:max-w-none">
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
            <div className={cn(
               "gap-x-12",
               isTwoColumn ? "columns-2 [column-rule:1px_solid_#e2e8f0] print:[column-rule:1px_solid_#000]" : "columns-1"
            )}>
               {set.questions?.map((eq: any) => {
                  const q = eq.question;
                  const p = eq.passage;

                  if (p) {
                    return (
                      <div key={eq.id} className="mb-10 break-inside-avoid pt-2">
                         <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 print:bg-transparent print:border-slate-900 print:rounded-xl">
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 print:border-slate-900">
                               <BookOpen className="h-4 w-4 text-indigo-600 print:text-slate-900" />
                               <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 print:text-slate-900">Reading Passage Context</h3>
                            </div>
                            <div className="text-[13px] leading-relaxed text-slate-800 font-medium prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: p.content }} />
                            <p className="mt-4 pt-3 border-t border-dotted border-slate-300 text-[9px] font-bold italic text-slate-400 uppercase tracking-widest print:border-slate-900">
                               Solve the related inquiries below
                            </p>
                         </div>
                      </div>
                    );
                  }

                  if (q) {
                    questionNumber++;
                    const isChild = !!q.passageId;

                    return (
                      <div key={eq.id} className={cn(
                        "mb-10 break-inside-avoid", 
                        isChild ? "ml-6 border-l-2 border-slate-100 pl-6 py-2" : "pt-2"
                      )}>
                         <div className="flex items-start gap-3">
                            <span className={cn("text-base font-black text-slate-900 min-w-[25px] pt-0.5", isChild && "text-sm text-slate-500")}>
                               {questionNumber}.
                            </span>
                            <div className="flex-1 space-y-4">
                               <div className="flex justify-between items-start gap-4">
                                  <div className={cn("text-[14px] font-bold text-slate-900 leading-snug", isChild && "text-[13px]")} dangerouslySetInnerHTML={{ __html: q.prompt }} />
                                  <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 whitespace-nowrap print:border-slate-900 shrink-0">
                                     {eq.marks} PTS
                                  </span>
                               </div>

                               {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                                 <div className={cn(
                                    "grid gap-x-6 gap-y-2 pt-1",
                                    isTwoColumn ? "grid-cols-1" : "grid-cols-2"
                                 )}>
                                    {q.options.map((opt: any) => (
                                      <div key={opt.id} className="flex items-center gap-2">
                                         <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0 print:border-slate-900" />
                                         <span className="text-[13px] font-black text-slate-400 w-4">{opt.label}.</span>
                                         <span className="text-[13px] font-semibold text-slate-700">{opt.text}</span>
                                      </div>
                                    ))}
                                 </div>
                               )}

                               {q.type === 'CQ' && (
                                 <div className="pt-2 space-y-2">
                                    <div className="h-24 w-full border border-dashed border-slate-200 rounded-xl print:border-slate-400" />
                                    <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em] text-center italic">Response Matrix</p>
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
            <footer className="mt-20 pt-12 border-t-4 border-slate-900 flex flex-col gap-8">
               <div className="grid grid-cols-3 gap-10">
                  <div className="border-t border-slate-200 pt-2 text-center print:border-slate-900">
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-900">Instructor Signature</p>
                  </div>
                  <div className="border-t border-slate-200 pt-2 text-center print:border-slate-900">
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-900">Branch Controller</p>
                  </div>
                  <div className="border-t border-slate-200 pt-2 text-center print:border-slate-900">
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-900">Internal Audit</p>
                  </div>
               </div>
               
               <div className="flex items-center justify-between opacity-40 print:opacity-100">
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                     © Spondon LMS Institutional Protocol
                  </div>
                  <div className="font-mono text-[8px] font-bold text-slate-400 uppercase">
                     REF_ID: {set.id.toUpperCase()} • {new Date().toISOString().slice(0, 10)}
                  </div>
               </div>
            </footer>
         </div>
      </div>
    </div>
  );
}
