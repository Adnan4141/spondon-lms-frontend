'use client';

import { Badge } from '@/components/ui/badge';
import type { AnswerPayload, AttemptQuestion, ExamDisplayItem } from './exam-taking-types';
import { detectQuestionLang, type Lang } from './examUiCopy';
import { McqQuestionBlock } from './McqQuestionBlock';

export function PassageGroupBlock({
  item,
  answers,
  questionNumberFor,
  totalQuestions,
  lang,
  onSelect,
}: {
  item: Extract<ExamDisplayItem, { kind: 'passage' }>;
  answers: Record<string, AnswerPayload>;
  questionNumberFor: (q: AttemptQuestion) => number;
  totalQuestions: number;
  lang: Lang;
  onSelect: (questionId: string, optionId: string) => void;
}) {
  const passage = item.questions[0]?.question?.passage;
  return (
    <div className="space-y-5">
      {passage ? (
        <div className="sticky top-0 z-10 rounded-2xl border border-indigo-100 bg-indigo-50/95 p-6 shadow-sm backdrop-blur">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-black text-indigo-700">উদ্দীপক</p>
            <Badge variant="outline" className="border-indigo-200 bg-white/80 text-[10px] font-black text-indigo-700">
              {item.questions.length} MCQ
            </Badge>
          </div>
          <div
            className="prose prose-sm max-w-none text-slate-700"
            dangerouslySetInnerHTML={{ __html: passage.content }}
          />
        </div>
      ) : null}
      {item.questions.map((q) => (
        <McqQuestionBlock
          key={q.id}
          q={q}
          questionNumber={questionNumberFor(q)}
          totalQuestions={totalQuestions}
          answer={answers[q.questionId]}
          lang={detectQuestionLang(q.question, lang)}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
