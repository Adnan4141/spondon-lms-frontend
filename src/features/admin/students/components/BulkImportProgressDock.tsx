'use client';

import { useEffect, useRef } from 'react';
import { Loader2, X, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cancelBulkImportJob, getBulkImportJobStatus } from '@/lib/api/students';
import { cancelQuestionImportJob, getQuestionImportJobStatus } from '@/lib/api/question-bank';
import { useBulkImportJobsStore, type BulkImportJobUi } from '@/store/bulkImportJobsStore';
import { cn } from '@/lib/utils';

const POLL_MS = 1600;
export const BULK_STUDENT_IMPORT_COMPLETE_EVENT = 'bulk-student-import-complete';
export const BULK_QUESTION_IMPORT_COMPLETE_EVENT = 'bulk-question-import-complete';

function getJobLabel(job: BulkImportJobUi): string {
  return job.jobType === 'questions' ? 'Question import' : 'Student import';
}

async function getStatus(job: BulkImportJobUi) {
  if (job.jobType === 'questions') return getQuestionImportJobStatus(job.jobId);
  return getBulkImportJobStatus(job.jobId);
}

async function cancelJob(job: BulkImportJobUi) {
  if (job.jobType === 'questions') return cancelQuestionImportJob(job.jobId);
  return cancelBulkImportJob(job.jobId);
}

function JobCard({
  job,
  onDismiss,
  onCancel,
}: {
  job: BulkImportJobUi;
  onDismiss: () => void;
  onCancel: () => void;
}) {
  const pct =
    job.totalRows > 0 ? Math.min(100, Math.round((job.processedRows / job.totalRows) * 100)) : 0;
  const running = !job.finished && ['QUEUED', 'RUNNING'].includes(job.status);

  return (
    <div className="pointer-events-auto w-[min(100vw-2rem,22rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{getJobLabel(job)}</p>
          <p className="truncate text-sm font-bold text-slate-900">
            {job.originalName || (job.jobType === 'questions' ? 'Questions file' : 'Students file')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {running && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500"
              title="Cancel import"
              onClick={onCancel}
            >
              <Ban className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500"
            title="Dismiss"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {running && (
        <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-indigo-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Working in background…
        </div>
      )}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            job.finished ? 'bg-emerald-500' : 'bg-indigo-500',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-600">
        Processed {job.processedRows} / {job.totalRows}
        {job.status !== 'CANCELLED' && (
          <>
            {' · '}
            <span className="text-emerald-700">
              {job.jobType === 'questions' ? `${job.createdCount} question(s)` : `${job.createdCount} created`}
            </span>
            {job.jobType === 'questions' && job.passageCount > 0 && (
              <span className="text-sky-700">
                {' · '}
                {job.passageCount} passage(s)
              </span>
            )}
            {job.errorCount > 0 && (
              <span className="text-amber-700">
                {' · '}
                {job.errorCount} row error(s)
              </span>
            )}
          </>
        )}
      </p>
      {job.status === 'CANCELLED' && (
        <p className="mt-1 text-xs font-semibold text-slate-500">Cancelled</p>
      )}
      {job.finished && job.status === 'FAILED' && (
        <p className="mt-1 text-xs font-semibold text-rose-600">Import failed — check details in admin logs.</p>
      )}
    </div>
  );
}

export function BulkImportProgressDock() {
  const jobs = useBulkImportJobsStore((s) => s.jobs);
  const patchJob = useBulkImportJobsStore((s) => s.patchJob);
  const dismissJob = useBulkImportJobsStore((s) => s.dismissJob);
  const { toast } = useToast();
  const toastedFinished = useRef<Set<string>>(new Set());

  const jobKey = jobs.map((j) => j.jobId).join('|');

  useEffect(() => {
    if (!jobKey) return;

    let cancelled = false;

    const poll = async () => {
      const list = useBulkImportJobsStore.getState().jobs;
      for (const job of list) {
        if (cancelled) return;
        try {
          const res = await getStatus(job);
          if (!res.success || !res.data) continue;
          const d = res.data;
          const finished = d.finished === true;
          patchJob(job.jobId, {
            processedRows: d.processedRows,
            createdCount: d.createdCount,
            passageCount: 'passageCount' in d ? (d.passageCount ?? 0) : 0,
            errorCount: d.errorCount,
            status: d.status,
            finished,
            folderId: 'folderId' in d ? d.folderId : job.folderId,
          });

          if (finished && !toastedFinished.current.has(job.jobId)) {
            toastedFinished.current.add(job.jobId);
            if (typeof window !== 'undefined') {
              const eventName =
                job.jobType === 'questions'
                  ? BULK_QUESTION_IMPORT_COMPLETE_EVENT
                  : BULK_STUDENT_IMPORT_COMPLETE_EVENT;
              window.dispatchEvent(
                new CustomEvent(eventName, {
                  detail: {
                    jobId: job.jobId,
                    jobType: job.jobType,
                    createdCount: d.createdCount,
                    passageCount: 'passageCount' in d ? (d.passageCount ?? 0) : 0,
                    errorCount: d.errorCount,
                    status: d.status,
                    folderId: 'folderId' in d ? d.folderId : job.folderId,
                  },
                }),
              );
            }
            if (d.status === 'COMPLETED') {
              toast({
                title: 'Import finished',
                description:
                  job.jobType === 'questions'
                    ? `Created ${d.createdCount} question(s)${'passageCount' in d && d.passageCount ? ` and ${d.passageCount} passage(s)` : ''}.${d.errorCount > 0 ? ` ${d.errorCount} row(s) skipped.` : ''}`
                    : `Created ${d.createdCount} student(s). ${d.errorCount > 0 ? `${d.errorCount} row(s) skipped.` : ''}`,
                variant: d.errorCount > 0 ? 'default' : 'default',
              });
            } else if (d.status === 'FAILED') {
              toast({
                title: 'Import failed',
                description: d.failureReason || 'Something went wrong.',
                variant: 'destructive',
              });
            } else if (d.status === 'CANCELLED') {
              toast({
                title: 'Import cancelled',
                description: `Processed ${d.processedRows} / ${d.totalRows} before cancel.`,
              });
            }
          }
        } catch {
          // ignore transient errors while polling
        }
      }
    };

    void poll();
    const id = window.setInterval(() => void poll(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [jobKey, patchJob, toast]);

  const handleDismiss = (jobId: string) => {
    dismissJob(jobId);
    toastedFinished.current.delete(jobId);
  };

  const handleCancel = async (jobId: string) => {
    try {
      const job = useBulkImportJobsStore.getState().jobs.find((item) => item.jobId === jobId);
      if (!job) return;
      await cancelJob(job);
      patchJob(jobId, { status: 'CANCELLED', finished: true });
      toast({ title: 'Cancellation requested', description: 'Import will stop after the current row.' });
    } catch (e: unknown) {
      toast({
        title: 'Could not cancel',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      });
    }
  };

  if (!jobs.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-100 flex flex-col gap-3">
      {jobs.map((job) => (
        <JobCard
          key={job.jobId}
          job={job}
          onDismiss={() => handleDismiss(job.jobId)}
          onCancel={() => void handleCancel(job.jobId)}
        />
      ))}
    </div>
  );
}
