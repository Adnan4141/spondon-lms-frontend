'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, X, GraduationCap, BookOpen, Columns, Square, FileText } from 'lucide-react';
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

  let questionNumber = 0;

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      {/* Premium Action Bar (Hidden on Print) */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white print:hidden shrink-0 z-50 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
               <FileText className="h-6 w-6" />
            </div>
            <div>
               <h3 className="text-lg font-black text-slate-900 leading-none">Exam Compilation Matrix</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">Offline Set Identity: {set.name}</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 shadow-inner">
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className={cn("h-9 px-4 rounded-xl text-[10px] font-black uppercase transition-all", !isTwoColumn ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-400")}
                 onClick={() => setIsTwoColumn(false)}
               >
                  <Square className="mr-2 h-3.5 w-3.5" /> Single
               </Button>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className={cn("h-9 px-4 rounded-xl text-[10px] font-black uppercase transition-all", isTwoColumn ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-400")}
                 onClick={() => setIsTwoColumn(true)}
               >
                  <Columns className="mr-2 h-3.5 w-3.5" /> Dual
               </Button>
            </div>
            <Button onClick={handlePrint} className="h-12 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 transition-all active:scale-95">
               <Printer className="mr-2.5 h-4 w-4" /> Finalize & Print PDF
            </Button>
            <Button variant="outline" onClick={onClose} className="h-12 w-12 rounded-2xl border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all">
               <X className="h-5 w-5" />
            </Button>
         </div>
      </div>

      {/* Global Print Isolation Styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything in the body */
          body * {
            visibility: hidden;
          }
          
          /* Specifically show ONLY the printable canvas and its children */
          #printable-exam-canvas, #printable-exam-canvas * {
            visibility: visible;
          }

          /* Reset positioning for the printable area to take full page */
          #printable-exam-canvas {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            visibility: visible !important;
            display: block !important;
          }

          @page {
            size: A4;
            margin: 15mm;
          }

          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-no-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* High-Fidelity Printable Canvas */}
      <div className="flex-1 overflow-y-auto p-12 bg-slate-100/30 print:bg-white print:p-0 no-scrollbar">
         <div id="printable-exam-canvas" className="w-full max-w-[900px] mx-auto bg-white shadow-2xl border border-slate-200 p-12 print:shadow-none print:border-none print:p-0 print:max-w-none">
            
            {/* Header / Institutional Branding (Standard Div - Shows only once at the top) */}
            <header className="border-b-[4px] border-slate-900 pb-8 mb-8 w-full">
               <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-6">
                     <div className="h-16 w-16 rounded-[24px] bg-slate-900 flex items-center justify-center text-white shadow-lg">
                        <GraduationCap className="h-10 w-10" />
                     </div>
                     <div>
                        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Spondon Academy</h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Official Assessment Registry</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="inline-block px-5 py-1.5 bg-slate-900 rounded-xl font-black text-xs uppercase tracking-[0.2em] text-white">
                        SET_{set.name}
                     </div>
                     <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-widest">Protocol: {set.id.slice(0,8).toUpperCase()}</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[32px] border border-slate-200 print:bg-transparent print:border-none print:p-0">
                  <div className="space-y-3">
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Assessment Title</p>
                        <p className="text-xl font-black text-slate-900 leading-tight">{exam.title}</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Academic Course</p>
                        <p className="text-base font-bold text-slate-700">{exam.course?.name} <span className="text-slate-400 font-mono">[{exam.course?.code}]</span></p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 border-l-[2px] border-slate-900/10 pl-10 print:border-l-slate-900">
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Duration</p>
                        <p className="text-lg font-black text-slate-900">{exam.durationMinutes || '---'} MIN</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Weightage</p>
                        <p className="text-lg font-black text-slate-900">{set.questions?.reduce((sum: number, q: any) => sum + Number(q.marks), 0)} PTS</p>
                     </div>
                     <div className="col-span-2 pt-2 border-t border-slate-200 print:border-t-slate-900/20">
                        <p className="text-[9px] font-bold text-slate-600 uppercase leading-relaxed italic">
                           Analyze all inquiries thoroughly. Marks per node are specified in the margin.
                        </p>
                     </div>
                  </div>
               </div>
            </header>

            {/* Candidate Identity Protocol */}
            <div className="grid grid-cols-3 gap-10 mb-12 border-b-2 border-dashed border-slate-200 pb-10 print-no-break">
               <div className="border-b border-slate-900 pb-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-6 tracking-widest">Full Candidate Identity</p>
               </div>
               <div className="border-b border-slate-900 pb-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-6 tracking-widest">Institutional Roll / ID</p>
               </div>
               <div className="border-b border-slate-900 pb-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-6 tracking-widest">Auth Signature</p>
               </div>
            </div>

            {/* Questions Registry Matrix */}
            <div className={cn(
               "gap-x-12",
               isTwoColumn ? "columns-2 [column-rule:1px_solid_#f1f5f9] print:[column-rule:1px_solid_#000]" : "columns-1"
            )}>
               {(() => {
                  const questions = set.questions || [];
                  const rendered: React.ReactNode[] = [];
                  const seenPassageIds = new Set<string>();

                  for (let i = 0; i < questions.length; i++) {
                    const eq = questions[i];
                    const q = eq.question;
                    const passageId = q?.passageId;

                    if (passageId && !seenPassageIds.has(passageId)) {
                      // Render passage block once, then all child questions
                      seenPassageIds.add(passageId);
                      const passageContent = q?.passage?.content;
                      const children = questions.filter((c: any) => c.question?.passageId === passageId);

                      rendered.push(
                        <div key={`passage-${passageId}`} className="mb-6 print-no-break">
                          {/* Passage Context Block */}
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 print:bg-transparent print:border-slate-900 print:rounded-xl mb-4">
                         
                            {passageContent && (
                              <div className="text-[13px] leading-relaxed text-slate-800 font-medium prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: passageContent }} />
                            )}
                           
                          </div>

                          {/* Child Questions */}
                          {children.map((child: any) => {
                            questionNumber++;
                            const cq = child.question;
                            return (
                              <div key={child.id} className={cn(
                                "mb-6 print-no-break ml-6 border-l-2 border-slate-100 pl-6 py-2"
                              )}>
                                <div className="flex items-start gap-3">
                                  <span className="text-sm font-black text-slate-500 min-w-[25px] pt-0.5">
                                    {questionNumber}.
                                  </span>
                                  <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-start gap-4">
                                      <div className="text-[13px] font-bold text-slate-900 leading-snug" dangerouslySetInnerHTML={{ __html: cq?.prompt || '' }} />
                                      <span className="text-[9px] font-black text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-100 whitespace-nowrap print:border-slate-900 shrink-0">
                                        {child.marks} PTS
                                      </span>
                                    </div>
                                    {cq?.type === 'MCQ' && cq?.options && cq.options.length > 0 && (
                                      <div className={cn(
                                        "grid gap-x-6 gap-y-2 pt-1",
                                        isTwoColumn ? "grid-cols-1" : "grid-cols-2"
                                      )}>
                                        {cq.options.map((opt: any) => (
                                          <div key={opt.id} className="flex items-center gap-2">
                                            <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0 print:border-slate-900" />
                                            <span className="text-[13px] font-black text-slate-400 w-4">{opt.label}.</span>
                                            <span className="text-[13px] font-semibold text-slate-700">{opt.text}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    } else if (!passageId) {
                      // Standalone question
                      questionNumber++;
                      rendered.push(
                        <div key={eq.id} className={cn("mb-10 print-no-break pt-2")}>
                          <div className="flex items-start gap-3">
                            <span className="text-base font-black text-slate-900 min-w-[25px] pt-0.5">
                              {questionNumber}.
                            </span>
                            <div className="flex-1 space-y-4">
                              <div className="flex justify-between items-start gap-4">
                                <div className="text-[14px] font-bold text-slate-900 leading-snug" dangerouslySetInnerHTML={{ __html: q?.prompt || '' }} />
                                <span className="text-[9px] font-black text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-100 whitespace-nowrap print:border-slate-900 shrink-0">
                                  {eq.marks} PTS
                                </span>
                              </div>

                              {q?.type === 'MCQ' && q?.options && q.options.length > 0 && (
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

                              {q?.type === 'CQ' && (
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
   
                 
                  }
                  return rendered;
               })()}
            </div>

      
         </div>
      </div>
    </div>
  );
}
