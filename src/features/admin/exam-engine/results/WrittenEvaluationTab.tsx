'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getExamPdfDownloadUrl } from '@/lib/api/exams';
import { confirmAction } from '@/features/admin/shared/confirm-action';
import { cn } from '@/lib/utils';
import type { WrittenAttemptDetail, WrittenAttemptRow } from './types';
import { WrittenScriptViewer } from './WrittenScriptViewer';
import {
  ATTEMPT_STATUS_META,
  type AttemptDisplayStatus,
  countAttemptsByStatus,
  getAttemptDisplayStatus,
  getFirstPreviewUrlForQuestion,
  hasUnsavedMarksChanges,
  isMarkInvalid,
  isMarkingComplete,
  isReadyToFinalize,
  marksDraftKey,
  readCqParts,
} from './writtenEvaluationUtils';

type SaveMarkOptions = { silent?: boolean };

type WrittenEvaluationTabProps = {
  attempts: WrittenAttemptRow[];
  activeAttempt: WrittenAttemptDetail | null;
  writtenBusy: boolean;
  bulkFinalizeBusy?: boolean;
  saveAllBusy?: boolean;
  marksDraft: Record<string, string>;
  savedMarksBaseline: Record<string, string>;
  canEvaluate: boolean;
  canFinalize: boolean;
  onOpenAttempt: (attemptId: string) => void;
  onMarksDraftChange: (draftKey: string, value: string) => void;
  onSaveMark: (answerId: string, attemptId: string, subPartKey?: string, options?: SaveMarkOptions) => void;
  onSaveAllMarks?: (attemptId: string) => void;
  onFinalize: (attemptId: string) => void;
  onBulkFinalize?: () => void;
};

const STATUS_FILTERS: Array<{ key: AttemptDisplayStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'ready', label: 'Ready' },
  { key: 'finalized', label: 'Finalized' },
];

function tryAutoSaveMark(
  draftKey: string,
  value: string,
  maxMarks: number,
  baseline: Record<string, string>,
  answerId: string,
  attemptId: string,
  subPartKey: string | undefined,
  onSaveMark: WrittenEvaluationTabProps['onSaveMark'],
) {
  if (isMarkInvalid(value, maxMarks)) return;
  if (value.trim() === '') return;
  if (value === (baseline[draftKey] ?? '')) return;
  onSaveMark(answerId, attemptId, subPartKey, { silent: true });
}

export function WrittenEvaluationTab({
  attempts,
  activeAttempt,
  writtenBusy,
  bulkFinalizeBusy = false,
  saveAllBusy = false,
  marksDraft,
  savedMarksBaseline,
  canEvaluate,
  canFinalize,
  onOpenAttempt,
  onMarksDraftChange,
  onSaveMark,
  onSaveAllMarks,
  onFinalize,
  onBulkFinalize,
}: WrittenEvaluationTabProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AttemptDisplayStatus | 'all'>('all');
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const statusCounts = useMemo(() => countAttemptsByStatus(attempts), [attempts]);
  const evaluatedCount = statusCounts.ready + statusCounts.finalized;
  const progressPercent = attempts.length
    ? Math.round((statusCounts.finalized / attempts.length) * 100)
    : 0;

  const finalizeCandidates = useMemo(
    () => attempts.filter((attempt) => isReadyToFinalize(attempt)),
    [attempts],
  );

  const filteredAttempts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return attempts.filter((attempt) => {
      if (statusFilter !== 'all' && getAttemptDisplayStatus(attempt) !== statusFilter) return false;
      if (!query) return true;
      return (attempt.student?.fullName ?? 'Student').toLowerCase().includes(query);
    });
  }, [attempts, searchQuery, statusFilter]);

  const pageOptions = useMemo(() => {
    if (!activeAttempt) return [] as Array<{ key: string; label: string; url: string; questionId: string }>;
    const options: Array<{ key: string; label: string; url: string; questionId: string }> = [];
    for (const [questionIndex, question] of (activeAttempt.questions || []).entries()) {
      const answer = question.studentAnswer;
      const questionNo = questionIndex + 1;
      const finalPdfUrl = answer?.writtenSubmission?.finalPdfUrl;
      if (finalPdfUrl) {
        options.push({
          key: `final-${question.questionId}`,
          label: `Q${questionNo} · Combined PDF`,
          url: getExamPdfDownloadUrl(finalPdfUrl),
          questionId: question.questionId,
        });
      }
      for (const [index, page] of (answer?.writtenSubmission?.pages || []).entries()) {
        options.push({
          key: `${question.questionId}-${page.url}`,
          label: `Q${questionNo} · Page ${index + 1}`,
          url: getExamPdfDownloadUrl(page.url),
          questionId: question.questionId,
        });
      }
    }
    return options;
  }, [activeAttempt]);

  const activePreviewUrl = previewUrl ?? pageOptions[0]?.url ?? null;
  const activeAttemptId = activeAttempt?.attempt.id ?? null;

  const hasInvalidMarks = useMemo(() => {
    if (!activeAttempt) return false;
    for (const question of activeAttempt.questions || []) {
      const answer = question.studentAnswer;
      if (!answer?.id) continue;
      const parts = readCqParts(question.question?.meta);
      if (parts.length) {
        for (const part of parts) {
          const draftKey = marksDraftKey(answer.id, part.label);
          if (isMarkInvalid(marksDraft[draftKey] ?? '', Number(part.marks ?? question.marks))) {
            return true;
          }
        }
      } else if (isMarkInvalid(marksDraft[answer.id] ?? '', Number(question.marks))) {
        return true;
      }
    }
    return false;
  }, [activeAttempt, marksDraft]);

  const hasUnsavedChanges = hasUnsavedMarksChanges(marksDraft, savedMarksBaseline);
  const markingComplete = isMarkingComplete(activeAttempt);
  const canFinalizeAttempt = markingComplete && !hasUnsavedChanges && !hasInvalidMarks;

  const finalizeDisabledReason = useMemo(() => {
    if (hasInvalidMarks) return 'Fix invalid marks before finalizing.';
    if (hasUnsavedChanges) return 'Save all unsaved marks before finalizing.';
    if (!markingComplete) return 'Enter and save marks for every question before finalizing.';
    return null;
  }, [hasInvalidMarks, hasUnsavedChanges, markingComplete]);

  const openAttemptWithGuard = async (attemptId: string) => {
    if (activeAttemptId && attemptId !== activeAttemptId && hasUnsavedChanges) {
      const proceed = await confirmAction({
        title: 'Unsaved marks',
        description: 'You have unsaved marks. Switch student without saving?',
        confirmLabel: 'Switch',
        variant: 'warning',
      });
      if (!proceed) return;
    }
    setPreviewUrl(null);
    onOpenAttempt(attemptId);
  };

  const jumpToQuestionScript = (questionIndex: number) => {
    if (!activeAttempt) return;
    const question = activeAttempt.questions?.[questionIndex];
    if (!question) return;
    const rawUrl = getFirstPreviewUrlForQuestion(question);
    if (!rawUrl) return;
    setPreviewUrl(getExamPdfDownloadUrl(rawUrl));
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (
          activeAttempt
          && canEvaluate
          && onSaveAllMarks
          && !saveAllBusy
          && !hasInvalidMarks
        ) {
          onSaveAllMarks(activeAttempt.attempt.id);
        }
        return;
      }

      if (!filteredAttempts.length || !activeAttemptId) return;
      const activeIndex = filteredAttempts.findIndex((attempt) => attempt.id === activeAttemptId);
      if (activeIndex < 0) return;

      if (event.key === 'ArrowDown' && activeIndex < filteredAttempts.length - 1) {
        event.preventDefault();
        openAttemptWithGuard(filteredAttempts[activeIndex + 1].id);
      } else if (event.key === 'ArrowUp' && activeIndex > 0) {
        event.preventDefault();
        openAttemptWithGuard(filteredAttempts[activeIndex - 1].id);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const markingPanel = activeAttempt ? (
    <div className="space-y-4">
      {(activeAttempt.questions || []).map((question, index) => {
        const answer = question.studentAnswer;
        const parts = readCqParts(question.question?.meta);
        const hasScript = Boolean(getFirstPreviewUrlForQuestion(question));
        return (
          <div key={question.questionId} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Question {index + 1} · {Number(question.marks)} marks
                </p>
                <div className="prose prose-sm mt-2 max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: question.question?.prompt ?? '' }} />
              </div>
              {hasScript ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => jumpToQuestionScript(index)}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  View script
                </Button>
              ) : null}
            </div>

            {parts.length > 0 && answer?.id && canEvaluate ? (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                {parts.map((part) => {
                  const draftKey = marksDraftKey(answer.id, part.label);
                  const maxMarks = Number(part.marks ?? question.marks);
                  const invalid = isMarkInvalid(marksDraft[draftKey] ?? '', maxMarks);
                  const saved = (answer.evaluations || []).find((ev) => ev.subPartKey === part.label)?.marksAwarded;
                  return (
                    <div key={part.label} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-700">
                          Part {part.label} · {maxMarks} marks
                        </p>
                        {part.prompt ? (
                          <p className="text-xs text-slate-500">{part.prompt}</p>
                        ) : null}
                        {saved != null ? (
                          <p className="text-[10px] font-bold text-emerald-700">Saved: {saved}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          className={cn(
                            'h-9 w-24 rounded-md border px-2 text-sm',
                            invalid
                              ? 'border-rose-300 bg-rose-50 text-rose-900'
                              : 'border-slate-200',
                          )}
                          type="number"
                          min={0}
                          max={maxMarks}
                          step="0.25"
                          placeholder="Marks"
                          value={marksDraft[draftKey] ?? ''}
                          onChange={(event) => onMarksDraftChange(draftKey, event.target.value)}
                          onBlur={(event) => tryAutoSaveMark(
                            draftKey,
                            event.target.value,
                            maxMarks,
                            savedMarksBaseline,
                            answer.id,
                            activeAttempt.attempt.id,
                            part.label,
                            onSaveMark,
                          )}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={invalid}
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
                {(() => {
                  const maxMarks = Number(question.marks);
                  const invalid = isMarkInvalid(marksDraft[answer.id] ?? '', maxMarks);
                  return (
                    <>
                      <input
                        className={cn(
                          'h-9 w-24 rounded-md border px-2 text-sm',
                          invalid
                            ? 'border-rose-300 bg-rose-50 text-rose-900'
                            : 'border-slate-200',
                        )}
                        type="number"
                        min={0}
                        max={maxMarks}
                        step="0.25"
                        placeholder="Marks"
                        value={marksDraft[answer.id] ?? ''}
                        onChange={(event) => onMarksDraftChange(answer.id, event.target.value)}
                        onBlur={(event) => tryAutoSaveMark(
                          answer.id,
                          event.target.value,
                          maxMarks,
                          savedMarksBaseline,
                          answer.id,
                          activeAttempt.attempt.id,
                          undefined,
                          onSaveMark,
                        )}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={invalid}
                        onClick={() => onSaveMark(answer.id, activeAttempt.attempt.id)}
                      >
                        Save
                      </Button>
                    </>
                  );
                })()}
              </div>
            ) : null}

            {!answer?.writtenSubmission?.pages?.length && !answer?.writtenSubmission?.finalPdfUrl ? (
              <p className="mt-3 text-xs font-medium text-amber-700">No handwritten pages uploaded.</p>
            ) : null}
          </div>
        );
      })}
    </div>
  ) : null;

  return (
    <TooltipProvider>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <CardTitle className="font-serif text-lg text-[#0D1B35]">Written evaluation</CardTitle>
                <CardDescription>
                  Review scripts, enter marks, save (auto-save on blur), then finalize. Shortcuts: ↑↓ students, ←→ pages, Ctrl+S save all.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-bold text-slate-500">
                <span className="rounded-full bg-slate-100 px-2.5 py-1">1. Review script</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">2. Enter marks</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">3. Save</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">4. Finalize</span>
              </div>
              {attempts.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-600">
                    <span>
                      <span className="font-black text-slate-900">{statusCounts.finalized}</span>
                      {' / '}
                      {attempts.length} finalized
                    </span>
                    <span>{evaluatedCount} marked</span>
                    <span>{statusCounts.ready} ready to finalize</span>
                  </div>
                  <div className="h-2 max-w-md overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
            {canFinalize && onBulkFinalize && finalizeCandidates.length > 1 ? (
              <Button
                size="sm"
                variant="outline"
                disabled={bulkFinalizeBusy}
                onClick={() => setBulkConfirmOpen(true)}
              >
                {bulkFinalizeBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Finalize all ready ({finalizeCandidates.length})
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setStatusFilter(filter.key)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors',
                    statusFilter === filter.key
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700',
                  )}
                >
                  {filter.label}
                  {filter.key !== 'all' ? ` (${statusCounts[filter.key]})` : ''}
                </button>
              ))}
            </div>

            {attempts.length > 1 ? (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search student..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                />
              </div>
            ) : null}

            <div className="max-h-[min(720px,78vh)] space-y-2 overflow-y-auto pr-1">
              {filteredAttempts.length ? filteredAttempts.map((attempt) => {
                const status = getAttemptDisplayStatus(attempt);
                const statusMeta = ATTEMPT_STATUS_META[status];
                const isActive = activeAttemptId === attempt.id;
                return (
                  <button
                    key={attempt.id}
                    type="button"
                    className={cn(
                      'w-full rounded-lg border p-3 text-left transition-colors',
                      isActive
                        ? 'border-violet-400 bg-violet-50 shadow-sm ring-1 ring-violet-200'
                        : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/30',
                    )}
                    onClick={() => openAttemptWithGuard(attempt.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900">{attempt.student?.fullName ?? 'Student'}</p>
                      <Badge variant="outline" className={cn('shrink-0 text-[10px] font-black uppercase', statusMeta.className)}>
                        {statusMeta.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {attempt.totalAwarded ?? 0} marks entered
                      {attempt.obtainedMarks != null ? ` · Final: ${attempt.obtainedMarks}` : ''}
                    </p>
                  </button>
                );
              }) : (
                <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
                  {searchQuery.trim() || statusFilter !== 'all'
                    ? 'No students match your filters.'
                    : 'No written submissions yet.'}
                </p>
              )}
            </div>
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
                    {hasUnsavedChanges ? (
                      <p className="mt-1 text-xs font-bold text-amber-700">Unsaved marks — save before switching or finalizing.</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canEvaluate && onSaveAllMarks ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={saveAllBusy || hasInvalidMarks || !hasUnsavedChanges}
                        onClick={() => onSaveAllMarks(activeAttempt.attempt.id)}
                      >
                        {saveAllBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save all marks
                      </Button>
                    ) : null}
                    {canFinalize ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0}>
                            <Button
                              size="sm"
                              disabled={!canFinalizeAttempt}
                              onClick={() => onFinalize(activeAttempt.attempt.id)}
                            >
                              Finalize evaluation
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {finalizeDisabledReason ? (
                          <TooltipContent>{finalizeDisabledReason}</TooltipContent>
                        ) : null}
                      </Tooltip>
                    ) : null}
                  </div>
                </div>

                {hasInvalidMarks ? (
                  <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
                    One or more marks exceed the maximum allowed. Fix them before saving.
                  </p>
                ) : null}

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="min-h-[420px] xl:sticky xl:top-4 xl:self-start">
                    <WrittenScriptViewer
                      pageOptions={pageOptions}
                      activePreviewUrl={activePreviewUrl}
                      onPreviewUrlChange={setPreviewUrl}
                    />
                  </div>

                  <div className="max-h-[min(720px,78vh)] space-y-4 overflow-y-auto rounded-lg border border-slate-200 bg-white/80 p-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Marking panel</p>
                    {markingPanel}
                  </div>
                </div>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-slate-500">Select a submission to evaluate.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize {finalizeCandidates.length} submissions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will finalize all submissions that are marked and ready. Students will move to the result approval flow.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
            {finalizeCandidates.map((attempt) => (
              <li key={attempt.id} className="font-medium text-slate-800">
                {attempt.student?.fullName ?? attempt.id}
              </li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setBulkConfirmOpen(false);
                onBulkFinalize?.();
              }}
            >
              Finalize all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
