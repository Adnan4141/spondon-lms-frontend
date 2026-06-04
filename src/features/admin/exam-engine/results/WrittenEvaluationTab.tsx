'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getExamPdfDownloadUrl } from '@/lib/api/exams';
import type { WrittenAttemptDetail, WrittenAttemptRow } from './types';

type WrittenEvaluationTabProps = {
  attempts: WrittenAttemptRow[];
  activeAttempt: WrittenAttemptDetail | null;
  writtenBusy: boolean;
  marksDraft: Record<string, string>;
  canEvaluate: boolean;
  canFinalize: boolean;
  onOpenAttempt: (attemptId: string) => void;
  onMarksDraftChange: (answerId: string, value: string) => void;
  onSaveMark: (answerId: string, attemptId: string) => void;
  onFinalize: (attemptId: string) => void;
};

export function WrittenEvaluationTab({
  attempts,
  activeAttempt,
  writtenBusy,
  marksDraft,
  canEvaluate,
  canFinalize,
  onOpenAttempt,
  onMarksDraftChange,
  onSaveMark,
  onFinalize,
}: WrittenEvaluationTabProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-lg text-[#0D1B35]">Written evaluation</CardTitle>
        <CardDescription>Review uploaded handwritten pages, enter marks, then finalize the attempt score.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {attempts.length ? attempts.map((attempt) => (
            <button
              key={attempt.id}
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-violet-200 hover:bg-violet-50/30"
              onClick={() => onOpenAttempt(attempt.id)}
            >
              <p className="text-sm font-bold text-slate-900">{attempt.student?.fullName ?? 'Student'}</p>
              <p className="text-xs text-slate-500">{attempt.evaluationStatus} · {attempt.totalAwarded ?? 0} marks</p>
            </button>
          )) : (
            <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
              No written submissions yet.
            </p>
          )}
        </div>

        <div className="min-h-48 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          {writtenBusy ? (
            <div className="flex justify-center py-12 text-slate-500"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : activeAttempt ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-slate-900">{activeAttempt.student?.fullName}</p>
                  <p className="text-xs text-slate-500">{activeAttempt.exam?.title}</p>
                </div>
                {canFinalize ? (
                  <Button size="sm" onClick={() => onFinalize(activeAttempt.attempt.id)}>
                    Finalize evaluation
                  </Button>
                ) : null}
              </div>
              {(activeAttempt.questions || []).map((question, index) => {
                const answer = question.studentAnswer;
                const pages = answer?.writtenSubmission?.pages || [];
                const finalPdfUrl = answer?.writtenSubmission?.finalPdfUrl;
                return (
                  <div key={question.questionId} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Question {index + 1} · {Number(question.marks)} marks
                        </p>
                        <div className="prose prose-sm mt-2 max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: question.question?.prompt ?? '' }} />
                      </div>
                      {answer?.id && canEvaluate ? (
                        <div className="flex items-center gap-2">
                          <input
                            className="h-9 w-24 rounded-md border border-slate-200 px-2 text-sm"
                            type="number"
                            step="0.25"
                            placeholder="Marks"
                            value={marksDraft[answer.id] ?? ''}
                            onChange={(event) => onMarksDraftChange(answer.id, event.target.value)}
                          />
                          <Button size="sm" variant="outline" onClick={() => onSaveMark(answer.id, activeAttempt.attempt.id)}>
                            Save
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {finalPdfUrl ? (
                        <a className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700" href={getExamPdfDownloadUrl(finalPdfUrl)} target="_blank" rel="noopener noreferrer">
                          Combined PDF
                        </a>
                      ) : null}
                      {pages.map((page, pageIndex) => (
                        <a key={page.url} className="rounded-md bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700" href={getExamPdfDownloadUrl(page.url)} target="_blank" rel="noopener noreferrer">
                          Page {pageIndex + 1}
                        </a>
                      ))}
                      {!pages.length && !finalPdfUrl ? (
                        <span className="text-xs font-medium text-amber-700">No handwritten pages uploaded.</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-slate-500">Select a submission to evaluate.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
