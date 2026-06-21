'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { McqPassage } from '@/types/question';
import { cn } from '@/lib/utils';
import { getDifficultyBadgeClass, stripHtml } from '../questions-page-utils';

const PASSAGE_PAGE_SIZE = 20;

type Props = {
  passages: McqPassage[];
  expandedPassageIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onEditPassage: (passage: McqPassage) => void;
  onDeletePassage: (id: string) => void;
  onEditQuestion: (id: string) => void;
  onDeleteQuestion: (id: string) => void;
};

export function PassagesTabPanel({
  passages,
  expandedPassageIds,
  onToggleExpand,
  onEditPassage,
  onDeletePassage,
  onEditQuestion,
  onDeleteQuestion,
}: Props) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(passages.length / PASSAGE_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pagedPassages = useMemo(() => {
    const start = (safePage - 1) * PASSAGE_PAGE_SIZE;
    return passages.slice(start, start + PASSAGE_PAGE_SIZE);
  }, [passages, safePage]);

  useEffect(() => {
    setPage(1);
  }, [passages]);

  if (passages.length === 0) {
    return (
      <div className="p-6">
        <div className="py-16 text-center text-sm font-medium text-slate-400">
          No passages found. Create the first passage.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {pagedPassages.map((p) => {
        const isExpanded = expandedPassageIds.has(p.id);
        return (
          <div
            key={p.id}
            className="group rounded-[20px] border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md"
          >
            <div
              className="flex cursor-pointer items-start justify-between gap-4"
              onClick={() => onToggleExpand(p.id)}
            >
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-indigo-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-indigo-400" />
                  )}
                  <Badge className="border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-black uppercase text-indigo-700">
                    PASSAGE
                  </Badge>
                  {p.difficulty ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        'px-2 py-0.5 text-[10px] font-bold uppercase',
                        getDifficultyBadgeClass(p.difficulty),
                      )}
                    >
                      {p.difficulty}
                    </Badge>
                  ) : null}
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    {p.questions?.length || 0} questions
                  </span>
                </div>
                <h3 className="line-clamp-2 text-base font-black text-slate-800 transition-colors group-hover:text-indigo-600">
                  {stripHtml(p.content).slice(0, 120) || 'Passage'}
                </h3>
                {!isExpanded ? (
                  <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">{stripHtml(p.content)}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                  onClick={() => onEditPassage(p)}
                  title="Edit full passage"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                  onClick={() => onDeletePassage(p.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {isExpanded ? (
              <div className="mt-5 animate-in fade-in border-t border-slate-100 pt-5 duration-200 slide-in-from-top-2">
                <div className="rounded-[16px] border border-slate-100 bg-slate-50 p-5">
                  <div
                    className="prose prose-sm max-w-none text-slate-700"
                    dangerouslySetInnerHTML={{ __html: p.content }}
                  />
                </div>
                {p.questions && p.questions.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Linked Questions</p>
                    {p.questions.map((q, qi) => (
                      <div
                        key={q.id}
                        className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-500">
                          {qi + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium text-slate-700">{stripHtml(q.prompt)}</p>
                          {q.options ? (
                            <div className="mt-1.5 flex flex-wrap gap-3">
                              {q.options.map((opt) => (
                                <span
                                  key={opt.id}
                                  className={cn(
                                    'text-xs font-medium',
                                    opt.isCorrect ? 'font-bold text-emerald-600' : 'text-slate-400',
                                  )}
                                >
                                  {opt.label}. {opt.text}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-slate-400 hover:text-indigo-600"
                            onClick={() => onEditQuestion(q.id)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-500"
                            onClick={() => onDeleteQuestion(q.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-500">
            Page {safePage} of {totalPages} · {passages.length} passages
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
