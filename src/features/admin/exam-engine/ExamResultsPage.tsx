'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  finalizeWrittenEvaluation,
  getExamAnalytics,
  getExamById,
  getExamMeritListAll,
  getWrittenAttempt,
  listWrittenAttempts,
  saveWrittenEvaluation,
  type ExamAnalytics,
} from '@/lib/api/exams';
import {
  getExamResultBatchDetail,
  listExamResultBatches,
  postExamResultBulkExcel,
  postExamResultBulkManual,
  postExamResultSingle,
  type ResultBatchSummary,
} from '@/lib/api/exam-result-batches';
import { getBranches } from '@/lib/api/branches';
import { getActorUserIdFromStorage } from '@/lib/actor-user';
import type { Exam } from '@/types/exam';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { useExamWorkspaceOptional } from './layout/ExamWorkspaceShell';
import { ExamWorkspacePageHeader } from './layout/ExamWorkspacePageHeader';
import { cn } from '@/lib/utils';
import { examWorkspacePageClass } from './layout/examWorkspaceUi';
import { AnalyticsTab } from './results/AnalyticsTab';
import { MeritListTab } from './results/MeritListTab';
import { OfflineResultsTab } from './results/OfflineResultsTab';
import { OmrResultsTab } from './results/OmrResultsTab';
import { ResultSmsDrawer, type ResultSmsFocus } from './results/ResultSmsDrawer';
import { ResultsTabs, TabsContent } from './results/ResultsTabs';
import { UnavailableResultsTab } from './results/UnavailableResultsTab';
import { WrittenEvaluationTab } from './results/WrittenEvaluationTab';
import {
  getTabFromHash,
  parseBulkResultRows,
  supportsOfflineResults,
  supportsOmrScan,
  supportsWrittenEvaluation,
} from './results/resultFlowUtils';
import type { BranchOption, MeritRow, ResultsTabKey, WrittenAttemptDetail, WrittenAttemptRow } from './results/types';
import { useExamResultsPermissions } from './hooks/useExamResultsPermissions';

const HASH_TO_TAB: Record<string, ResultsTabKey> = {
  analytics: 'analytics',
  omr: 'omr',
  results: 'offline',
  offline: 'offline',
  evaluation: 'evaluation',
  merit: 'merit',
  'merit-print': 'merit',
};

function resolveTabFromHash(fallback: ResultsTabKey): ResultsTabKey {
  if (typeof window === 'undefined') return fallback;
  return HASH_TO_TAB[getTabFromHash(window.location.hash, fallback)] ?? fallback;
}

type ExamResultsPageProps = {
  examId: string;
  /** Teacher evaluators see a reduced shell (evaluation-focused). */
  teacherEvaluatorMode?: boolean;
};

export function ExamResultsPage({ examId, teacherEvaluatorMode = false }: ExamResultsPageProps) {
  const workspace = useExamWorkspaceOptional();
  const { can, isTeacherEvaluator, branchScope, isOrgWide } = useExamResultsPermissions();
  const evaluatorMode = teacherEvaluatorMode || isTeacherEvaluator;
  const [exam, setExam] = useState<Exam | null>(null);
  const [analytics, setAnalytics] = useState<ExamAnalytics | null>(null);
  const [meritRows, setMeritRows] = useState<MeritRow[]>([]);
  const [resultBatches, setResultBatches] = useState<ResultBatchSummary[]>([]);
  const [writtenAttempts, setWrittenAttempts] = useState<WrittenAttemptRow[]>([]);
  const [activeWrittenAttempt, setActiveWrittenAttempt] = useState<WrittenAttemptDetail | null>(null);
  const [writtenBusy, setWrittenBusy] = useState(false);
  const [marksDraft, setMarksDraft] = useState<Record<string, string>>({});
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchId, setBranchId] = useState('');
  const [singleRoll, setSingleRoll] = useState('');
  const [singleMarks, setSingleMarks] = useState('');
  const [singleTotal, setSingleTotal] = useState('');
  const [bulkRows, setBulkRows] = useState('');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [offlineBusy, setOfflineBusy] = useState(false);
  const [offlineErrors, setOfflineErrors] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ResultsTabKey>('analytics');
  const [smsFocus, setSmsFocus] = useState<ResultSmsFocus | null>(null);
  const toast = useAdminToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [examResponse, analyticsResponse, meritResponse, batchesResponse] = await Promise.all([
        getExamById(examId),
        getExamAnalytics(examId),
        getExamMeritListAll(examId),
        listExamResultBatches(examId),
      ]);
      const nextExam = examResponse.success && examResponse.data ? examResponse.data : null;
      setExam(nextExam);
      setAnalytics(analyticsResponse.success && analyticsResponse.data ? analyticsResponse.data : null);
      setMeritRows(meritResponse.success && meritResponse.data?.rows ? meritResponse.data.rows as MeritRow[] : []);
      setResultBatches(batchesResponse.success && batchesResponse.data ? batchesResponse.data : []);

      if (supportsWrittenEvaluation(nextExam)) {
        const writtenResponse = await listWrittenAttempts(examId);
        setWrittenAttempts(writtenResponse.success && writtenResponse.data ? writtenResponse.data as WrittenAttemptRow[] : []);
      } else {
        setWrittenAttempts([]);
        setActiveWrittenAttempt(null);
        setMarksDraft({});
      }
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (evaluatorMode) return;
    getBranches().then((response) => {
      if (response.success && response.data) {
        setBranches(response.data.map((branch) => ({ id: branch.id, name: branch.name })));
      }
    });
  }, [evaluatorMode]);

  useEffect(() => {
    if (branchScope) setBranchId(branchScope);
  }, [branchScope]);

  const isOfflineResultFlow = supportsOfflineResults(exam);
  const isWrittenEvalFlow = supportsWrittenEvaluation(exam);
  const omrScanEnabled = supportsOmrScan(exam);
  const selectedBranchId = branchId || exam?.branchId || '';

  const tabAvailability = useMemo<Record<ResultsTabKey, boolean>>(() => {
    if (evaluatorMode) {
      return {
        analytics: false,
        omr: false,
        offline: false,
        evaluation: isWrittenEvalFlow && can('exam.results.written.evaluate'),
        merit: false,
      };
    }
    return {
      analytics:
        can('exam.results.view')
        && Boolean((analytics && analytics.totalAttempts > 0) || meritRows.length || resultBatches.length),
      omr: omrScanEnabled && can('exam.results.omr.review'),
      offline: isOfflineResultFlow && can('exam.results.offline.enter'),
      evaluation: isWrittenEvalFlow && can('exam.results.written.evaluate'),
      merit: can('exam.results.merit.export'),
    };
  }, [
    analytics,
    can,
    evaluatorMode,
    isOfflineResultFlow,
    isWrittenEvalFlow,
    meritRows.length,
    omrScanEnabled,
    resultBatches.length,
  ]);

  useEffect(() => {
    if (loading) return;
    const fallback: ResultsTabKey = evaluatorMode
      ? (tabAvailability.evaluation ? 'evaluation' : 'merit')
      : tabAvailability.analytics
        ? 'analytics'
        : tabAvailability.omr
          ? 'omr'
          : tabAvailability.offline
            ? 'offline'
            : tabAvailability.evaluation
              ? 'evaluation'
              : 'merit';
    setActiveTab(resolveTabFromHash(fallback));
  }, [evaluatorMode, isOfflineResultFlow, isWrittenEvalFlow, loading, tabAvailability]);

  const changeTab = (nextTab: ResultsTabKey) => {
    setActiveTab(nextTab);
    const hash = nextTab === 'offline' ? 'results' : nextTab;
    window.history.replaceState(null, '', `#${hash}`);
  };

  const submitSingleOffline = async () => {
    if (!singleRoll.trim() || !singleMarks.trim()) {
      toast({ title: 'Roll and marks required', variant: 'destructive' });
      return;
    }
    setOfflineBusy(true);
    setOfflineErrors([]);
    try {
      const response = await postExamResultSingle(examId, {
        rollNo: singleRoll.trim(),
        marksObtained: Number(singleMarks),
        totalMarks: singleTotal ? Number(singleTotal) : undefined,
        branchId: selectedBranchId || undefined,
      });
      if (!response.success) throw new Error(response.message || 'Single result failed');
      toast({ title: 'Result row queued', description: 'Result SMS preview is ready; messages will be sent after approval.' });
      setSingleRoll('');
      setSingleMarks('');
      await load();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Result entry failed', variant: 'destructive' });
    } finally {
      setOfflineBusy(false);
    }
  };

  const submitBulkOffline = async () => {
    const rows = parseBulkResultRows(bulkRows);
    if (!rows.length) {
      toast({ title: 'Paste at least one row', variant: 'destructive' });
      return;
    }
    setOfflineBusy(true);
    setOfflineErrors([]);
    try {
      const response = await postExamResultBulkManual(examId, rows, selectedBranchId || undefined);
      if (!response.success) throw new Error(response.message || 'Bulk result failed');
      setOfflineErrors((response.data?.errors || []) as Array<Record<string, unknown>>);
      toast({ title: `Bulk rows queued: ${response.data?.inserted ?? 0}`, description: 'Result SMS will send after approval when enabled.' });
      await load();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Bulk import failed', variant: 'destructive' });
    } finally {
      setOfflineBusy(false);
    }
  };

  const submitExcelOffline = async () => {
    if (!excelFile) {
      toast({ title: 'Select an Excel file', variant: 'destructive' });
      return;
    }
    setOfflineBusy(true);
    setOfflineErrors([]);
    try {
      const response = await postExamResultBulkExcel(examId, excelFile, selectedBranchId || undefined);
      if (!response.success) throw new Error(response.message || 'Excel import failed');
      setOfflineErrors((response.data?.errors || []) as Array<Record<string, unknown>>);
      toast({ title: `Excel rows queued: ${response.data?.inserted ?? 0}`, description: 'Result SMS will send after approval when enabled.' });
      setExcelFile(null);
      await load();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Excel import failed', variant: 'destructive' });
    } finally {
      setOfflineBusy(false);
    }
  };

  const openWrittenAttempt = async (attemptId: string) => {
    setWrittenBusy(true);
    try {
      const response = await getWrittenAttempt(examId, attemptId);
      if (!response.success || !response.data) throw new Error(response.message || 'Could not load attempt');
      setActiveWrittenAttempt(response.data as WrittenAttemptDetail);
      const nextMarks: Record<string, string> = {};
      for (const question of response.data.questions || []) {
        if (question.studentAnswer?.obtainedMarks != null) {
          nextMarks[question.studentAnswer.id] = String(question.studentAnswer.obtainedMarks);
        }
      }
      setMarksDraft(nextMarks);
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Could not load attempt', variant: 'destructive' });
    } finally {
      setWrittenBusy(false);
    }
  };

  const saveWrittenMark = async (answerId: string, attemptId: string) => {
    const teacherUserId = getActorUserIdFromStorage();
    if (!teacherUserId) {
      toast({ title: 'Sign in required', variant: 'destructive' });
      return;
    }
    const marksAwarded = Number(marksDraft[answerId] || 0);
    const response = await saveWrittenEvaluation({ attemptId, answerId, marksAwarded, teacherUserId });
    if (!response.success) {
      toast({ title: response.message || 'Mark save failed', variant: 'destructive' });
      return;
    }
    toast({ title: 'Mark saved' });
    await openWrittenAttempt(attemptId);
  };

  const finalizeWritten = async (attemptId: string) => {
    const response = await finalizeWrittenEvaluation(examId, attemptId);
    if (!response.success) {
      toast({ title: response.message || 'Finalize failed', variant: 'destructive' });
      return;
    }
    toast({ title: 'Evaluation finalized' });
    await load();
    await openWrittenAttempt(attemptId);
  };

  const openResultSmsWorkspace = async (batch: ResultBatchSummary) => {
    try {
      const response = await getExamResultBatchDetail(examId, batch.id);
      if (!response.success || !response.data) throw new Error(response.message || 'Could not load result batch');
      const detail = response.data as {
        results?: Array<{
          id?: string;
          rollNo?: string;
          marks?: string | number;
          totalMarks?: string | number;
          percentage?: string | number;
          student?: { id?: string; fullName?: string; mobile?: string };
        }>;
      };
      const sorted = [...(detail.results || [])].sort((a, b) => Number(b.marks || 0) - Number(a.marks || 0));
      const recipients = sorted.map((row, index) => ({
        id: row.student?.id,
        name: row.student?.fullName,
        phone: row.student?.mobile || '',
        branchId: batch.branchId,
        variables: {
          name: row.student?.fullName || '',
          roll: row.rollNo || '',
          marks: Number(row.marks || 0),
          total: Number(row.totalMarks || 0),
          grade: `${Number(row.marks || 0)}/${Number(row.totalMarks || 0)}`,
          rank: index + 1,
          exam: exam?.title || 'exam',
          institute: 'Spondon LMS',
        },
      })).filter((recipient) => recipient.phone);
      setSmsFocus({
        batchId: batch.id,
        branchId: batch.branchId,
        label: `${exam?.title || 'Result'} — ${recipients.length} students`,
        recipients,
      });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Could not open result SMS', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pageTitle = evaluatorMode ? 'Script evaluation' : 'Results';
  const pageDescription = evaluatorMode
    ? 'Review student submissions and enter marks for written questions.'
    : 'Aggregated performance, result entry, OMR review, evaluation, and merit publishing.';

  if (workspace && (workspace.loadingExam || (!workspace.exam && !workspace.loadingExam))) {
    if (workspace.loadingExam) {
      return (
        <div className="flex justify-center py-16 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }
    if (!workspace.exam) {
      return <p className="py-12 text-center text-sm text-slate-600">Exam not found.</p>;
    }
  }

  return (
    <div className={cn(examWorkspacePageClass, 'print:max-w-none')}>
      <ExamWorkspacePageHeader title={pageTitle} description={pageDescription} />

      <ResultsTabs activeTab={activeTab} onTabChange={changeTab} availability={tabAvailability}>
        <TabsContent value="analytics" className="mt-0">
          <AnalyticsTab stats={analytics} />
        </TabsContent>

        <TabsContent value="omr" className="mt-0">
          {omrScanEnabled ? (
            <OmrResultsTab
              examId={examId}
              branchId={branchId || selectedBranchId || null}
              examBranchId={exam?.branchId}
              branches={branches}
              showBranchPicker={isOrgWide && !exam?.branchId}
              onBranchIdChange={setBranchId}
              onFinalized={() => void load()}
            />
          ) : (
            <UnavailableResultsTab message="OMR scan review is not configured for this exam." />
          )}
        </TabsContent>

        <TabsContent value="offline" className="mt-0">
          {isOfflineResultFlow ? (
            <OfflineResultsTab
              examId={examId}
              branches={branches}
              branchId={branchId}
              examBranchId={exam?.branchId}
              selectedBranchId={selectedBranchId}
              singleRoll={singleRoll}
              singleMarks={singleMarks}
              singleTotal={singleTotal}
              bulkRows={bulkRows}
              excelFile={excelFile}
              offlineBusy={offlineBusy}
              offlineErrors={offlineErrors}
              resultBatches={resultBatches}
              canEnter={can('exam.results.offline.enter')}
              canApproveBranch={can('exam.results.offline.approve_branch')}
              canApproveCentral={can('exam.results.offline.approve_central')}
              canReject={can('exam.results.offline.reject')}
              canDelete={can('exam.results.offline.delete')}
              canSendSms={can('exam.results.sms.send')}
              onBranchIdChange={setBranchId}
              onSingleRollChange={setSingleRoll}
              onSingleMarksChange={setSingleMarks}
              onSingleTotalChange={setSingleTotal}
              onBulkRowsChange={setBulkRows}
              onExcelFileChange={setExcelFile}
              onSubmitSingle={() => void submitSingleOffline()}
              onSubmitBulk={() => void submitBulkOffline()}
              onSubmitExcel={() => void submitExcelOffline()}
              onOpenSmsWorkspace={(batch) => void openResultSmsWorkspace(batch)}
              onBatchUpdated={() => void load()}
            />
          ) : (
            <UnavailableResultsTab message="Offline result entry is not required for this exam." />
          )}
        </TabsContent>

        <TabsContent value="evaluation" className="mt-0">
          {isWrittenEvalFlow ? (
            <WrittenEvaluationTab
              attempts={writtenAttempts}
              activeAttempt={activeWrittenAttempt}
              writtenBusy={writtenBusy}
              marksDraft={marksDraft}
              canEvaluate={can('exam.results.written.evaluate')}
              canFinalize={can('exam.results.written.finalize')}
              onOpenAttempt={(attemptId) => void openWrittenAttempt(attemptId)}
              onMarksDraftChange={(answerId, value) => setMarksDraft((previous) => ({ ...previous, [answerId]: value }))}
              onSaveMark={(answerId, attemptId) => void saveWrittenMark(answerId, attemptId)}
              onFinalize={(attemptId) => void finalizeWritten(attemptId)}
            />
          ) : (
            <UnavailableResultsTab message="Written evaluation is not required for this exam." />
          )}
        </TabsContent>

        <TabsContent value="merit" className="mt-0">
          <MeritListTab meritRows={meritRows} canExport={can('exam.results.merit.export')} />
        </TabsContent>
      </ResultsTabs>

      {smsFocus ? (
        <ResultSmsDrawer
          examId={examId}
          branches={branches}
          smsFocus={smsFocus}
          onClose={() => setSmsFocus(null)}
          onSuccess={() => {
            setSmsFocus(null);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
