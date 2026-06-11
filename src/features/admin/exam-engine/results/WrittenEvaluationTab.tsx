'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getExamPdfDownloadUrl } from '@/lib/api/exams';
import type { CqPartMeta, WrittenAttemptDetail, WrittenAttemptRow } from './types';

type WrittenEvaluationTabProps = {
  attempts: WrittenAttemptRow[];
  activeAttempt: WrittenAttemptDetail | null;
  writtenBusy: boolean;
  bulkFinalizeBusy?: boolean;
  marksDraft: Record<string, string>;
  canEvaluate: boolean;
  canFinalize: boolean;
  onOpenAttempt: (attemptId: string) => void;
  onMarksDraftChange: (draftKey: string, value: string) => void;
  onSaveMark: (answerId: string, attemptId: string, subPartKey?: string) => void;
  onFinalize: (attemptId: string) => void;
  onBulkFinalize?: () => void;
};

function marksDraftKey(answerId: string, subPartKey?: string) {
  return subPartKey ? `${answerId}:${subPartKey}` : answerId;
}

function readCqParts(meta: unknown): CqPartMeta[] {
  if (!meta || typeof meta !== 'object') return [];
  const parts = (meta as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) return [];
  return parts.filter(
    (part): part is CqPartMeta =>
      Boolean(part && typeof part === 'object' && typeof (part as CqPartMeta).label === 'string'),
  );
}

function isPdfUrl(url: string): boolean {
  return /\.pdf($|\?)/i.test(url);
}

export function WrittenEvaluationTab({
  attempts,
  activeAttempt,
  writtenBusy,
  bulkFinalizeBusy = false,
  marksDraft,
  canEvaluate,
  canFinalize,
  onOpenAttempt,
  onMarksDraftChange,
  onSaveMark,
  onFinalize,
  onBulkFinalize,
}: WrittenEvaluationTabProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const finalizeCandidates = useMemo(
    () => attempts.filter((attempt) => attempt.evaluationStatus !== 'PENDING' && attempt.obtainedMarks == null),
    [attempts],
  );

  const pageOptions = useMemo(() => {
    if (!activeAttempt) return [] as Array<{ key: string; label: string; url: string }>;
    const options: Array<{ key: string; label: string; url: string }> = [];
    for (const question of activeAttempt.questions || []) {
      const answer = question.studentAnswer;
      const finalPdfUrl = answer?.writtenSubmission?.finalPdfUrl;
      if (finalPdfUrl) {
        options.push({
          key: `final-${question.questionId}`,
          label: `Q${options.length + 1} combined PDF`,
          url: getExamPdfDownloadUrl(finalPdfUrl),
        });
      }
      for (const [index, page] of (answer?.writtenSubmission?.pages || []).entries()) {
        options.push({
          key: `${question.questionId}-${page.url}`,
          label: `Q${options.length + 1} page ${index + 1}`,
          url: getExamPdfDownloadUrl(page.url),
        });
      }
    }
    return options;
  }, [activeAttempt]);

  const activePreviewUrl = previewUrl ?? pageOptions[0]?.url ?? null;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-serif text-lg text-[#0D1B35]">Written evaluation</CardTitle>
            <CardDescription>Review uploaded handwritten pages, enter marks per CQ part or whole question, then finalize.</CardDescription>
          </div>
          {canFinalize && onBulkFinalize && finalizeCandidates.length > 1 ? (
            <Button
              size="sm"
              variant="outline"
              disabled={bulkFinalizeBusy}
              onClick={onBulkFinalize}
            >
              {bulkFinalizeBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Finalize all ready ({finalizeCandidates.length})
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {attempts.length ? attempts.map((attempt) => (
            <button
              key={attempt.id}
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-violet-200 hover:bg-violet-50/30"
              onClick={() => {
                setPreviewUrl(null);
                onOpenAttempt(attempt.id);
              }}
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

              {pageOptions.length > 0 ? (
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Handwritten pages</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pageOptions.map((page) => (
                      <button
                        key={page.key}
                        type="button"
                        className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                          activePreviewUrl === page.url
                            ? 'bg-violet-600 text-white'
                            : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                        }`}
                        onClick={() => setPreviewUrl(page.url)}
                      >
                        {page.label}
                      </button>
                    ))}
                  </div>
                  {activePreviewUrl ? (
                    <div className="mt-3 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                      {isPdfUrl(activePreviewUrl) ? (
                        <iframe
                          title="Handwritten submission preview"
                          src={activePreviewUrl}
                          className="h-[min(420px,55vh)] w-full bg-white"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={activePreviewUrl}
                          alt="Handwritten submission page"
                          className="mx-auto max-h-[min(420px,55vh)] w-full object-contain"
                        />
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {(activeAttempt.questions || []).map((question, index) => {
                const answer = question.studentAnswer;
                const parts = readCqParts(question.question?.meta);
                return (
                  <div key={question.questionId} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Question {index + 1} · {Number(question.marks)} marks
                        </p>
                        <div className="prose prose-sm mt-2 max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: question.question?.prompt ?? '' }} />
                      </div>
                    </div>

                    {parts.length > 0 && answer?.id && canEvaluate ? (
                      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                        {parts.map((part) => {
                          const draftKey = marksDraftKey(answer.id, part.label);
                          return (
                            <div key={part.label} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-700">
                                  Part {part.label} · {Number(part.marks ?? 0)} marks
                                </p>
                                {part.prompt ? (
                                  <p className="text-xs text-slate-500">{part.prompt}</p>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  className="h-9 w-24 rounded-md border border-slate-200 px-2 text-sm"
                                  type="number"
                                  step="0.25"
                                  placeholder="Marks"
                                  value={marksDraft[draftKey] ?? ''}
                                  onChange={(event) => onMarksDraftChange(draftKey, event.target.value)}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onSaveMark(answer.id, activeAttempt.attempt.id, part.label)}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : answer?.id && canEvaluate ? (
                      <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
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

                    {!answer?.writtenSubmission?.pages?.length && !answer?.writtenSubmission?.finalPdfUrl ? (
                      <p className="mt-3 text-xs font-medium text-amber-700">No handwritten pages uploaded.</p>
                    ) : null}
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
