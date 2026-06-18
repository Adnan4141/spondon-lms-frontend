'use client';

import React from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Question } from '@/types/question';
import { cn } from '@/lib/utils';
import {
  getDifficultyBadgeClass,
  getTypeBadgeClass,
  stripHtml,
  type QuestionMetaShape,
} from '../questions-page-utils';
import { QuestionExpandedRow } from './QuestionExpandedRow';

type Props = {
  questions: Question[];
  hasSubfolders: boolean;
  expandedQuestionIds: Set<string>;
  selectedQuestionIds: string[];
  allVisibleQuestionsSelected: boolean;
  questionsPage: number;
  questionsTotalPages: number;
  loading: boolean;
  onToggleExpand: (id: string) => void;
  onToggleSelection: (id: string, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onMove: (ids: string[]) => void;
  onCopy: (ids: string[]) => void;
  onDelete: (ids: string[]) => void;
  onEdit: (id: string) => void;
  onCreateQuestion: () => void;
  onPageChange: (page: number) => void;
};

export function QuestionsTable({
  questions,
  hasSubfolders,
  expandedQuestionIds,
  selectedQuestionIds,
  allVisibleQuestionsSelected,
  questionsPage,
  questionsTotalPages,
  loading,
  onToggleExpand,
  onToggleSelection,
  onToggleSelectAll,
  onMove,
  onCopy,
  onDelete,
  onEdit,
  onCreateQuestion,
  onPageChange,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-slate-100 hover:bg-transparent">
            <TableHead className="w-[56px] py-3 pl-6">
              <Checkbox
                checked={allVisibleQuestionsSelected}
                onCheckedChange={onToggleSelectAll}
                aria-label="Select all questions"
              />
            </TableHead>
            <TableHead className="py-3 pl-6 text-xs font-black uppercase tracking-wider text-slate-500">
              Question
            </TableHead>
            <TableHead className="w-[120px] py-3 text-xs font-black uppercase tracking-wider text-slate-500">
              Type
            </TableHead>
            <TableHead className="w-[100px] py-3 text-xs font-black uppercase tracking-wider text-slate-500">
              Difficulty
            </TableHead>
            <TableHead className="w-[70px] py-3 text-xs font-black uppercase tracking-wider text-slate-500">
              Year
            </TableHead>
            <TableHead className="w-[180px] py-3 pr-6" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.length === 0 && !hasSubfolders ? (
            <TableRow>
              <TableCell colSpan={6} className="py-20 text-center text-sm font-medium text-slate-400">
                No questions found.{' '}
                <button type="button" onClick={onCreateQuestion} className="font-bold text-indigo-500 hover:underline">
                  Create one now.
                </button>
              </TableCell>
            </TableRow>
          ) : (
            questions.map((q) => {
              const isExpanded = expandedQuestionIds.has(q.id);
              const isSelected = selectedQuestionIds.includes(q.id);
              const meta = (q.meta ?? null) as QuestionMetaShape | null;
              return (
                <React.Fragment key={q.id}>
                  <TableRow
                    className={cn(
                      'group border-b border-slate-50 transition-colors hover:bg-slate-50/50',
                      isSelected && 'bg-indigo-50/50 hover:bg-indigo-50/70',
                    )}
                  >
                    <TableCell className="py-4 pl-6 align-top">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => onToggleSelection(q.id, checked === true)}
                          aria-label={`Select question ${q.id}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[420px] py-4 pl-6">
                      <div className="space-y-1.5">
                        <div
                          className="line-clamp-2 text-sm font-medium leading-snug text-slate-800"
                          dangerouslySetInnerHTML={{
                            __html:
                              stripHtml(q.prompt).substring(0, 180) +
                              (stripHtml(q.prompt).length > 180 ? '...' : ''),
                          }}
                        />
                        {q.type === 'MCQ' && q.options && q.options.length > 0 && !isExpanded ? (
                          <div className="flex flex-wrap gap-3">
                            {q.options.slice(0, 4).map((opt) => (
                              <span
                                key={opt.id}
                                className={cn(
                                  'flex items-center gap-1 text-xs',
                                  opt.isCorrect ? 'font-bold text-emerald-600' : 'text-slate-400',
                                )}
                              >
                                {opt.isCorrect ? <CheckCircle2 className="h-3 w-3" /> : null}
                                <span>
                                  {opt.label}. {opt.text}
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {q.type === 'CQ' && meta?.parts && !isExpanded ? (
                          <div className="flex flex-wrap gap-2">
                            {meta.parts.slice(0, 4).map((part) => (
                              <span
                                key={part.label}
                                className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400"
                              >
                                ({part.label}) {part.marks}M
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {q.type === 'SHORT' && meta?.answer && !isExpanded ? (
                          <p className="line-clamp-1 text-xs italic text-slate-400">↳ {stripHtml(meta.answer)}</p>
                        ) : null}
                        {q.tags && q.tags.length > 0 ? (
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {q.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-slate-400"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        className={cn(
                          'border text-[10px] font-bold uppercase shadow-none',
                          getTypeBadgeClass(q.type),
                        )}
                      >
                        {q.type === 'MCQ'
                          ? q.mcqType === 'PASSAGE_CHILD'
                            ? 'Passage MCQ'
                            : 'Simple MCQ'
                          : q.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      {q.difficulty ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-bold uppercase',
                            getDifficultyBadgeClass(q.difficulty),
                          )}
                        >
                          {q.difficulty}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-sm font-medium text-slate-500">
                      {q.year ?? <span className="text-slate-300">—</span>}
                    </TableCell>
                    <TableCell className="py-4 pr-6">
                      <div
                        className={cn(
                          'flex items-center justify-end gap-1 transition-opacity',
                          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          onClick={() => onToggleExpand(q.id)}
                          title="Expand"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                          onClick={() => onMove([q.id])}
                          title="Move"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl text-slate-400 hover:bg-sky-50 hover:text-sky-600"
                          onClick={() => onCopy([q.id])}
                          title="Copy"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                          onClick={() => onEdit(q.id)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                          onClick={() => onDelete([q.id])}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded ? <QuestionExpandedRow question={q} meta={meta} /> : null}
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
      {questionsTotalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <p className="text-sm font-medium text-slate-500">
            Page {questionsPage} of {questionsTotalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={questionsPage <= 1 || loading}
              onClick={() => onPageChange(Math.max(1, questionsPage - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={questionsPage >= questionsTotalPages || loading}
              onClick={() => onPageChange(questionsPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
