'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import type { AnswerPayload, AttemptQuestion } from './exam-taking-types';
import { getExamUiStrings, type Lang } from './examUiCopy';
import { WrittenUploadPanel } from './WrittenUploadPanel';

export function WrittenQuestionBlock({
  q,
  examId,
  attemptId,
  answer,
  lang,
  onAnswerChange,
  onTextChange,
}: {
  q: AttemptQuestion;
  examId: string;
  attemptId: string;
  answer?: AnswerPayload;
  lang: Lang;
  onAnswerChange: (questionId: string, answer: AnswerPayload) => void;
  onTextChange: (questionId: string, text: string) => void;
}) {
  const ui = getExamUiStrings(lang);
  const cqBlock = q.question?.cqBlock;
  const [showTextNote, setShowTextNote] = useState(false);
  return (
    <div className="space-y-4 rounded-2xl border border-blue-100 bg-white p-5">
      {q.question?.type === 'CQ' && cqBlock ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-blue-600">উদ্দীপক</p>
            <div className="prose prose-lg max-w-none font-medium text-slate-800" dangerouslySetInnerHTML={{ __html: cqBlock.stimulus }} />
          </div>
          <div className="space-y-3">
            {cqBlock.parts.map((part) => (
              <div key={`${cqBlock.groupId}-${part.label}`} className="grid grid-cols-[42px_1fr_auto] gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="font-black text-blue-700">({part.label})</span>
                <div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: part.prompt }} />
                <Badge variant="outline" className="h-fit border-blue-200 bg-white text-blue-700">
                  {part.marks}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="prose prose-lg max-w-none font-medium text-slate-800" dangerouslySetInnerHTML={{ __html: q.question?.prompt ?? '' }} />
      )}
      <WrittenUploadPanel
        examId={examId}
        attemptId={attemptId}
        questionId={q.questionId}
        answer={answer}
        onChange={(nextAnswer) => onAnswerChange(q.questionId, nextAnswer)}
      />
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showTextNote}
            onChange={(e) => setShowTextNote(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-bold text-slate-600">Add optional typed note</span>
        </label>
        {showTextNote && (
          <textarea
            className="w-full min-h-24 rounded-2xl border border-slate-200 bg-white p-5 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all resize-y"
            value={(answer?.text as string) || ''}
            onChange={(e) => onTextChange(q.questionId, e.target.value)}
            placeholder={ui.cqPlaceholder}
          />
        )}
      </div>
    </div>
  );
}
