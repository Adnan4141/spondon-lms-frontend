'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  FileSpreadsheet,
  Loader2,
  MessageSquare,
  ScanLine,
  Trash2,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  deleteExam,
  updateExam,
  getExamSections,
  getExamOperationsSummary,
  getExamAuditTrail,
  type ExamOperationsSummary,
  type ExamAuditTrailRow,
  type ExamSection,
} from '@/lib/api/exams';
import { actionLabel, changeSummary } from '@/features/admin/audit/audit-utils';
import type { ExamSet } from '@/types/exam';
import { ConfirmationModal } from '@/features/admin/shared';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { useModalStore } from '@/store/modalStore';
import {
  DisabledReason,
  ReadinessRow,
  sectionMarks,
  StatTile,
  WorkflowCard,
} from './layout/examWorkspaceUi';
import { useExamWorkspace } from './layout/ExamWorkspaceShell';
import { ExamWorkspacePageHeader } from './layout/ExamWorkspacePageHeader';
import { examWorkspacePageClass } from './layout/examWorkspaceUi';

export function ExamOverviewPage({ examId }: { examId: string }) {
  const router = useRouter();
  const { openModal } = useModalStore();
  const toast = useAdminToast();
  const { exam, loadingExam, refreshExam } = useExamWorkspace();
  const [sections, setSections] = useState<ExamSection[]>([]);
  const [operations, setOperations] = useState<ExamOperationsSummary | null>(null);
  const [auditRows, setAuditRows] = useState<ExamAuditTrailRow[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(true);

  const loadExtras = useCallback(async () => {
    if (!examId) return;
    setLoadingExtra(true);
    const [sec, ops, audit] = await Promise.allSettled([
      getExamSections(examId),
      getExamOperationsSummary(examId),
      getExamAuditTrail(examId),
    ]);
    if (sec.status === 'fulfilled' && sec.value.success && sec.value.data) setSections(sec.value.data);
    else setSections([]);
    if (ops.status === 'fulfilled' && ops.value.success && ops.value.data) setOperations(ops.value.data);
    else setOperations(null);
    if (audit.status === 'fulfilled' && audit.value.success && audit.value.data) setAuditRows(audit.value.data);
    else setAuditRows([]);
    setLoadingExtra(false);
  }, [examId]);

  useEffect(() => {
    if (!loadingExam && exam) void loadExtras();
    if (!loadingExam && !exam) setLoadingExtra(false);
  }, [loadingExam, exam, loadExtras]);

  const wizard = exam?.settings?.examWizard as Record<string, unknown> | undefined;
  const shuffleLabel = typeof wizard?.shuffle === 'string' ? wizard.shuffle : '—';
  const setNaming = typeof wizard?.setNaming === 'string' ? wizard.setNaming : '—';

  const blueprintTotalQs = useMemo(
    () => sections.reduce((a, s) => a + (s.questionCount || 0), 0),
    [sections],
  );
  const blueprintTotalMarks = useMemo(() => sections.reduce((a, s) => a + sectionMarks(s), 0), [sections]);

  const sets = useMemo<ExamSet[]>(() => exam?.sets ?? [], [exam?.sets]);
  const generatedTotalQs = useMemo(
    () => sets.reduce((a, st) => a + (st.questions?.length ?? 0), 0),
    [sets],
  );

  const openCloseExam = () => {
    if (!exam) return;
    const title = exam.title;
    openModal({
      title: 'Close exam',
      description: 'Students will no longer be able to start new attempts. Existing results are kept.',
      className: 'sm:max-w-lg',
      content: (
        <ConfirmationModal
          title="Close this exam?"
          description={`“${title}” will be marked CLOSED. You can still enter results and view analytics.`}
          confirmLabel="Close exam"
          variant="danger"
          onConfirm={async () => {
            try {
              const response = await updateExam(examId, { status: 'CLOSED' });
              if (!response.success) {
                toast({
                  title: 'Close failed',
                  description: response.message ?? 'Could not close this exam.',
                  variant: 'destructive',
                });
                return;
              }
              toast({ title: 'Exam closed' });
              await refreshExam();
              await loadExtras();
            } catch (error) {
              toast({
                title: 'Close failed',
                description: error instanceof Error ? error.message : 'Could not close this exam.',
                variant: 'destructive',
              });
            }
          }}
        />
      ),
    });
  };

  const openDeleteExam = () => {
    if (!exam) return;
    const title = exam.title;
    openModal({
      title: 'Delete exam',
      description: 'This removes the exam and related sections, sets, attempts, and PDFs.',
      className: 'sm:max-w-lg',
      content: (
        <ConfirmationModal
          title="Delete this exam?"
          description={`“${title}” (${exam.status}) will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete exam"
          variant="danger"
          onConfirm={async () => {
            try {
              const r = await deleteExam(examId);
              if (r.success) {
                toast({ title: 'Exam deleted', description: `“${title}” was removed.` });
                await refreshExam();
                router.push('/admin/exam');
              } else {
                toast({
                  title: 'Delete failed',
                  description: r.message ?? 'Could not delete this exam.',
                  variant: 'destructive',
                });
              }
            } catch (err) {
              toast({
                title: 'Delete failed',
                description: err instanceof Error ? err.message : 'Could not delete this exam.',
                variant: 'destructive',
              });
            }
          }}
        />
      ),
    });
  };

  const canEditExam = exam?.status !== 'CLOSED';
  const canGeneratePdf = Boolean(operations?.setup.hasSets);
  const canOpenResults = Boolean(operations && !(exam?.status === 'DRAFT' && !operations.setup.hasSets));
  const canOpenLeaderboard = Boolean(exam?.showLeaderboard && exam?.status !== 'DRAFT');
  const canDeleteExam = Boolean(
    exam && !(exam.status === 'PUBLISHED' && (exam.attempts?.length || operations?.attempts.total || 0) > 0),
  );
  const canUseOfflineResults = Boolean(operations?.offlineResults.enabled);
  const canUseWrittenEvaluation = Boolean(operations?.written.enabled && operations.written.totalAttempts > 0);
  const canUseOmrReview = Boolean(operations?.omr.enabled);
  const canReviewBatches = Boolean(operations?.offlineResults.batchTotal);
  const recommendedDisabled = Boolean(
    operations
      && (
        (operations.recommendedAction.key === 'EDIT_WIZARD' && !canEditExam)
        || (operations.recommendedAction.key === 'GENERATE_PDF' && !canGeneratePdf)
        || (operations.recommendedAction.key === 'IMPORT_RESULTS' && !canUseOfflineResults)
        || (operations.recommendedAction.key === 'EVALUATE_SCRIPTS' && !canUseWrittenEvaluation)
        || (operations.recommendedAction.key === 'REVIEW_APPROVALS' && !canReviewBatches)
        || (operations.recommendedAction.key === 'SEND_RESULT_SMS' && !canReviewBatches)
      ),
  );

  if (loadingExam || loadingExtra) {
    return (
      <div className="flex justify-center py-16 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!exam) {
    return <p className="py-12 text-center text-sm text-slate-600">Exam not found.</p>;
  }

  return (
    <div className={examWorkspacePageClass}>
      <ExamWorkspacePageHeader
        title="Overview"
        description={`${exam.branch?.name ?? (exam.branchId == null ? 'All branches' : 'Branch')} · ${exam.durationMinutes ?? '—'} min`}
        actions={
          exam.status === 'PUBLISHED' ? (
            <Button type="button" size="sm" variant="outline" onClick={openCloseExam}>
              <Ban className="mr-1 h-3.5 w-3.5" />
              Close exam
            </Button>
          ) : null
        }
      />

      {operations?.omr.enabled && operations.omr.reviewNeeded > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>{operations.omr.reviewNeeded}</strong> OMR scan
          {operations.omr.reviewNeeded === 1 ? '' : 's'} need review (set/branch mismatch or low confidence).{' '}
          <Link href={`/admin/exam/${examId}/results#omr`} className="font-semibold underline">
            Open OMR review
          </Link>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canEditExam ? (
          <Button asChild className="bg-[#0D1B35] text-[#E2C98A] hover:bg-[#1E2F55]">
            <Link href={`/admin/exam/${examId}/setup`}>Edit in wizard</Link>
          </Button>
        ) : (
          <Button disabled className="bg-slate-200 text-slate-500">
            Edit in wizard <DisabledReason>closed</DisabledReason>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href={`/admin/exam/${examId}/papers`}>Papers & PDFs</Link>
        </Button>
        {canOpenLeaderboard ? (
          <Button variant="outline" asChild>
            <Link href={`/admin/exam/${examId}/leaderboard`}>Leaderboard</Link>
          </Button>
        ) : (
          <Button variant="outline" disabled>
            Leaderboard <DisabledReason>{exam.status === 'DRAFT' ? 'draft' : 'off'}</DisabledReason>
          </Button>
        )}
        {canOpenResults ? (
          <Button variant="outline" asChild>
            <Link href={`/admin/exam/${examId}/results`}>Results workspace</Link>
          </Button>
        ) : (
          <Button variant="outline" disabled>
            Results workspace <DisabledReason>generate sets first</DisabledReason>
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={!canDeleteExam}
          className="border-rose-200 text-rose-700 hover:bg-rose-50"
          onClick={() => openDeleteExam()}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete exam
          {!canDeleteExam ? <DisabledReason>has attempts</DisabledReason> : null}
        </Button>
      </div>

      {operations ? (
        <Card className="scroll-mt-24 border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="font-serif text-lg text-[#0D1B35]">Readiness</CardTitle>
              <CardDescription>Setup health, result flow, and the next recommended action.</CardDescription>
            </div>
            {recommendedDisabled ? (
              <Button disabled className="bg-slate-200 text-slate-500">
                {operations.recommendedAction.label} <DisabledReason>not ready</DisabledReason>
              </Button>
            ) : (
              <Button
                asChild
                className={
                  operations.recommendedAction.severity === 'success'
                    ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                    : 'bg-[#0D1B35] text-[#E2C98A] hover:bg-[#1E2F55]'
                }
              >
                <Link href={operations.recommendedAction.href}>{operations.recommendedAction.label}</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="Mode" value={exam.mode} tone="blue" />
              <StatTile label="Sets / Questions" value={`${operations.setup.setCount} / ${operations.setup.generatedQuestionCount}`} />
              <StatTile label="Result batches" value={operations.offlineResults.batchTotal} tone={operations.offlineResults.batchTotal ? 'emerald' : 'amber'} />
              <StatTile
                label="Pending approvals"
                value={operations.offlineResults.byApprovalStatus.PENDING + operations.offlineResults.byApprovalStatus.APPROVED_BY_BRANCH}
                tone={operations.offlineResults.byApprovalStatus.PENDING ? 'amber' : 'slate'}
              />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-2">
                <ReadinessRow
                  ok={operations.setup.hasSections}
                  label="Blueprint"
                  detail={`${operations.setup.blueprintQuestionCount} target questions · ${operations.setup.blueprintTotalMarks || 0} marks`}
                />
                <ReadinessRow
                  ok={operations.setup.hasSets}
                  label="Generated question sets"
                  detail={`${operations.setup.generatedQuestionCount} generated questions · ${operations.setup.generatedTotalMarks || 0} marks`}
                />
                <ReadinessRow
                  ok={operations.setup.hasPdf}
                  label="Master PDF"
                  detail={operations.setup.hasPdf ? 'Ready on Papers tab.' : 'Generate the master paper on Papers tab.'}
                />
              </div>
              <div className="space-y-2">
                <ReadinessRow
                  ok={!operations.omr.enabled || operations.setup.hasOmrPdf}
                  label="OMR readiness"
                  detail={operations.omr.enabled ? `${operations.omr.batchTotal} scan batches · ${operations.omr.reviewNeeded} need review` : 'OMR scan is not enabled for this exam.'}
                />
                <ReadinessRow
                  ok={!operations.offlineResults.enabled || operations.offlineResults.batchTotal > 0}
                  label="Offline result entry"
                  detail={operations.offlineResults.enabled ? `${operations.offlineResults.batchTotal} result batches queued.` : 'Offline manual result flow is not enabled.'}
                />
                <ReadinessRow
                  ok={!operations.written.enabled || operations.written.pending + operations.written.partial === 0}
                  label="Written evaluation"
                  detail={operations.written.enabled ? `${operations.written.evaluated} evaluated · ${operations.written.pending} pending · ${operations.written.partial} partial` : 'Written evaluation is not required.'}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {operations ? (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-[#0D1B35]">Workflow shortcuts</CardTitle>
            <CardDescription>Full tools live on Results and Papers tabs — no duplicate entry forms here.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <WorkflowCard icon={FileSpreadsheet} title="Offline results" description="Single, bulk, Excel import, and batch approval.">
              <div className="grid grid-cols-3 gap-2">
                <StatTile label="Batches" value={operations.offlineResults.batchTotal} tone={operations.offlineResults.batchTotal ? 'emerald' : 'slate'} />
                <StatTile label="Pending" value={operations.offlineResults.byApprovalStatus.PENDING} tone="amber" />
                <StatTile label="SMS-ready" value={operations.offlineResults.smsReadyBatches} tone="emerald" />
              </div>
              {canUseOfflineResults && canOpenResults ? (
                <Button asChild className="mt-3" size="sm">
                  <Link href={`/admin/exam/${examId}/results#offline`}>Open offline results</Link>
                </Button>
              ) : (
                <Button disabled className="mt-3" size="sm">
                  Open offline results <DisabledReason>{canUseOfflineResults ? 'open results tab' : 'not enabled'}</DisabledReason>
                </Button>
              )}
            </WorkflowCard>

            <WorkflowCard icon={ClipboardCheck} title="Written evaluation" description="Review scripts and enter marks.">
              <div className="grid grid-cols-3 gap-2">
                <StatTile label="Pending" value={operations.written.pending} tone={operations.written.pending ? 'amber' : 'slate'} />
                <StatTile label="Partial" value={operations.written.partial} tone="amber" />
                <StatTile label="Evaluated" value={operations.written.evaluated} tone="emerald" />
              </div>
              {canUseWrittenEvaluation ? (
                <Button asChild className="mt-3" size="sm" variant="outline">
                  <Link href={`/admin/exam/${examId}/results#evaluation`}>Open evaluation</Link>
                </Button>
              ) : (
                <Button disabled className="mt-3" size="sm" variant="outline">
                  Open evaluation <DisabledReason>{operations.written.enabled ? 'no submissions' : 'not written'}</DisabledReason>
                </Button>
              )}
            </WorkflowCard>

            <WorkflowCard icon={ScanLine} title="OMR scans" description="Upload, review, and finalize into result batches.">
              <div className="grid grid-cols-3 gap-2">
                <StatTile label="Processed" value={operations.omr.scansByStatus.PROCESSED} tone="emerald" />
                <StatTile label="Review" value={operations.omr.reviewNeeded} tone={operations.omr.reviewNeeded ? 'amber' : 'slate'} />
                <StatTile label="Ready batches" value={operations.omr.finalizeReadyBatches} tone="blue" />
              </div>
              {canUseOmrReview ? (
                <Button asChild className="mt-3" size="sm" variant="outline">
                  <Link href={`/admin/exam/${examId}/results#omr`}>Open OMR review</Link>
                </Button>
              ) : (
                <Button disabled className="mt-3" size="sm" variant="outline">
                  Open OMR review <DisabledReason>not enabled</DisabledReason>
                </Button>
              )}
            </WorkflowCard>

            <WorkflowCard icon={MessageSquare} title="Approval & SMS" description="Approve batches before SMS.">
              <div className="grid grid-cols-3 gap-2">
                <StatTile label="Pending" value={operations.offlineResults.byApprovalStatus.PENDING} tone="amber" />
                <StatTile label="Central queue" value={operations.offlineResults.byApprovalStatus.APPROVED_BY_BRANCH} tone="blue" />
                <StatTile label="SMS-ready" value={operations.offlineResults.smsReadyBatches} tone="emerald" />
              </div>
              {canReviewBatches ? (
                <Button asChild className="mt-3" size="sm" variant="outline">
                  <Link href={`/admin/exam/${examId}/results#offline`}>Review batches</Link>
                </Button>
              ) : (
                <Button disabled className="mt-3" size="sm" variant="outline">
                  Review batches <DisabledReason>no batches</DisabledReason>
                </Button>
              )}
            </WorkflowCard>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-[#0D1B35]">Summary</CardTitle>
          <CardDescription>Blueprint (sections) vs generated question sets.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4 text-sm">
            <p className="font-semibold text-slate-900">Section blueprint</p>
            <p className="mt-2 text-slate-600">
              Total questions (targets): <span className="font-medium text-slate-900">{blueprintTotalQs}</span>
            </p>
            <p className="text-slate-600">
              Approx. marks from blueprint:{' '}
              <span className="font-medium text-slate-900">{blueprintTotalMarks || '—'}</span>
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4 text-sm">
            <p className="font-semibold text-slate-900">Generated sets</p>
            <p className="mt-2 text-slate-600">
              Sets: <span className="font-medium text-slate-900">{sets.length || exam.totalSets || 0}</span>
            </p>
            <p className="text-slate-600">
              Questions in sets: <span className="font-medium text-slate-900">{generatedTotalQs}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-[#0D1B35]">Sections</CardTitle>
          <CardDescription>Configured blocks for this exam paper.</CardDescription>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <p className="text-sm text-slate-500">No sections saved yet. Use the wizard to add sections.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
              {sections.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-900">
                    {s.name}{' '}
                    <span className="text-slate-500">
                      ({s.type}) · {s.questionCount} Q × {s.marksPerQuestion}m
                    </span>
                  </span>
                  <Badge variant="outline">{sectionMarks(s)} marks</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-[#0D1B35]">Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <p>
            <span className="text-slate-500">Shuffle (wizard):</span> {shuffleLabel}
          </p>
          <p>
            <span className="text-slate-500">Set naming:</span> {setNaming}
          </p>
          <p>
            <span className="text-slate-500">Leaderboard:</span> {exam.showLeaderboard ? 'On' : 'Off'}
          </p>
          <p>
            <span className="text-slate-500">Percentile:</span> {exam.showPercentile ? 'On' : 'Off'}
          </p>
          <p>
            <span className="text-slate-500">Total sets (config):</span> {exam.totalSets ?? '—'}
          </p>
        </CardContent>
      </Card>

      <Card className="scroll-mt-24 border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-[#0D1B35]">Audit timeline</CardTitle>
          <CardDescription>OMR scan and written evaluation actions for this exam.</CardDescription>
        </CardHeader>
        <CardContent>
          {auditRows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
              No audit events recorded for this exam yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-white">
              {auditRows.slice(0, 30).map((row) => {
                const summary = changeSummary(row as Parameters<typeof changeSummary>[0]);
                return (
                  <li key={row.id} className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{summary ?? actionLabel(row.action)}</p>
                      <p className="text-xs text-slate-500">
                        {row.actor?.fullName ?? row.actorUserId} · {row.actor?.role ?? 'Actor'}
                        {row.ip ? ` · ${row.ip}` : ''}
                      </p>
                    </div>
                    <time className="text-xs font-medium text-slate-400">
                      {new Date(row.createdAt).toLocaleString()}
                    </time>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
