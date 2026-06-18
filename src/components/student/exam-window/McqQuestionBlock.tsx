'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { detectQuestionLang, getExamUiStrings, getOptionLabel, type Lang } from './examUiCopy';
import type { AnswerPayload, AttemptQuestion } from './exam-taking-types';

export function McqQuestionBlock({
  q,
  questionNumber,
  totalQuestions,
  answer,
  lang,
  onSelect,
}: {
  q: AttemptQuestion;
  questionNumber: number;
  totalQuestions: number;
  answer?: AnswerPayload;
  lang: Lang;
  onSelect: (questionId: string, optionId: string) => void;
}) {
  const ui = getExamUiStrings(lang);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs font-black text-slate-400">{ui.questionLabel(questionNumber, totalQuestions)}</span>
        <Badge variant="outline" className="text-[9px] font-black">
          {q.marks} {ui.marksLabel}
        </Badge>
      </div>
      <div
        className="prose prose-lg mb-5 max-w-none font-medium text-slate-800"
        dangerouslySetInnerHTML={{ __html: q.question?.prompt ?? '' }}
      />
      <div className="space-y-3">
        {(q.question?.options ?? []).map((opt) => {
          const isSelected = answer?.selectedOptionId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(q.questionId, opt.id)}
              className={cn(
                'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all',
                isSelected
                  ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200 shadow-md'
                  : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-black transition-all',
                  isSelected
                    ? 'border-indigo-500 bg-indigo-600 text-white'
                    : 'border-slate-300 bg-white text-slate-600',
                )}
              >
                {getOptionLabel(opt.label, lang)}
              </span>
              <span
                className={cn('text-base font-medium transition-colors', isSelected ? 'text-indigo-700' : 'text-slate-700')}
                dangerouslySetInnerHTML={{ __html: opt.text }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
