'use client';

import { CheckCircle2 } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { Question } from '@/types/question';
import { type QuestionMetaShape } from '../questions-page-utils';

type Props = {
  question: Question;
  meta: QuestionMetaShape | null;
};

export function QuestionExpandedRow({ question, meta }: Props) {
  return (
    <TableRow className="border-b border-slate-100 bg-slate-50/40">
      <TableCell colSpan={6} className="p-0">
        <div className="animate-in slide-in-from-top-2 space-y-4 p-6 duration-200">
          <div className="rounded-[16px] border border-slate-100 bg-white p-5">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Full Question</p>
            <div
              className="prose prose-sm max-w-none text-slate-700"
              dangerouslySetInnerHTML={{ __html: question.prompt }}
            />
          </div>

          {question.type === 'MCQ' && question.options && question.options.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {question.options.map((opt) => (
                <div
                  key={opt.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                    opt.isCorrect
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-slate-100 bg-white text-slate-600'
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-white text-xs font-black">
                    {opt.label}
                  </span>
                  <span className="flex-1 text-sm font-medium">{opt.text}</span>
                  {opt.isCorrect ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : null}
                </div>
              ))}
            </div>
          ) : null}

          {question.type === 'CQ' && meta?.parts ? (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Sub-parts ({meta.totalMarks} total marks)
              </p>
              {meta.parts.map((part) => (
                <div key={part.label} className="flex gap-3 rounded-xl border border-slate-100 bg-white p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white">
                    {part.label}
                  </span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-indigo-600">{part.marks}M</span>
                      {part.knowledgeLevel ? (
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          · {part.knowledgeLevel}
                        </span>
                      ) : null}
                    </div>
                    <div
                      className="text-sm text-slate-700"
                      dangerouslySetInnerHTML={{ __html: part.prompt }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {question.type === 'SHORT' && meta?.answer ? (
            <div className="rounded-[16px] border border-emerald-100 bg-emerald-50 p-5">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">Model Answer</p>
              <div
                className="prose prose-sm max-w-none text-emerald-800"
                dangerouslySetInnerHTML={{ __html: meta.answer }}
              />
            </div>
          ) : null}

          {question.explanation ? (
            <div className="rounded-[16px] border border-blue-100 bg-blue-50 p-5">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-blue-600">Explanation</p>
              <div
                className="prose prose-sm max-w-none text-blue-800"
                dangerouslySetInnerHTML={{ __html: question.explanation }}
              />
            </div>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
