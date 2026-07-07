'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  Trophy,
  BarChart3,
  LayoutList,
  FileScan,
  BookOpenCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  regenerateExamPdf,
  regenerateSolveSheet,
  getExamPdfDownloadUrl,
  getSolveSheetDownloadUrl,
  generateOmrPdfBatch,
  getExamOperationsSummary,
  type OmrPdfBatchResponse,
} from '@/lib/api/exams';
import { assessWizardPublishReadiness } from '@/lib/exam-readiness';
import type { ExamBlueprintPreset } from '@/lib/api/exams';
import type { ExamStatus } from '@/types/exam';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { ConfirmationModal } from '@/features/admin/shared';
import { useModalStore } from '@/store/modalStore';
import type { ExamWizardState } from '../../types';
import type { ExamPortal } from '../../exam-portal-paths';
import {
  examBasePath,
  examLeaderboardPath,
  examPapersPath,
  examResultsPath,
} from '../../exam-portal-paths';
import { PaperPreview } from '../components/PaperPreview';
import { ExamPdfPreviewDialog } from '../../components/ExamPdfPreviewDialog';
import { PresetSaveActions } from '../components/PresetSaveActions';
import { ExamScheduleCard } from '../components/ExamScheduleCard';
import { OfflineOmrWorkflowCard } from '../components/OfflineOmrWorkflowCard';
import {
  Step6LaunchPanel,
  buildLaunchChecklist,
  resolveLaunchPhase,
  type LaunchPhase,
} from '../components/Step6LaunchPanel';
import { Step6CollapsibleSection } from '../components/Step6CollapsibleSection';
import type { WizardFormAction } from '../examWizardReducer';
import { resolveWizardBranchIdForApi } from '../constants';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
  step: number;
  saveAction: null | 'draft' | 'finalize';
  onSaveDraft: () => void;
  onFinalize: () => void;
  examId?: string;
  serverExam: {
    status: ExamStatus;
    pdfUrl?: string | null;
    solveSheetUrl?: string | null;
    setCount?: number;
  } | null;
  onPublish: () => void | Promise<void>;
  onRefreshMeta: () => void | Promise<void>;
  presets: ExamBlueprintPreset[];
  appliedPresetId: string | null;
  presetBusy: boolean;
  onSavePreset: (name: string, isDefault: boolean) => void | Promise<void>;
  onUpdatePreset: (presetId: string, isDefault: boolean) => void | Promise<void>;
  deliveryMode: 'ONLINE' | 'OFFLINE';
  portal?: ExamPortal;
};

function formatScheduleLine(startAt?: Date, endAt?: Date): string {
  if (!startAt && !endAt) return 'No fixed window — open when published';
  const fmt = (d: Date) =>
    d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  if (startAt && endAt) return `${fmt(startAt)} → ${fmt(endAt)}`;
  if (startAt) return `From ${fmt(startAt)}`;
  return `Until ${fmt(endAt!)}`;
}

export function Step6PreviewPublish({
  state,
  dispatch,
  step,
  saveAction,
  onSaveDraft,
  onFinalize,
  examId,
  serverExam,
  onPublish,
  onRefreshMeta,
  presets,
  appliedPresetId,
  deliveryMode,
  presetBusy,
  onSavePreset,
  onUpdatePreset,
  portal = 'admin',
}: Props) {
  const toast = useAdminToast();
  const { openModal } = useModalStore();
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [masterPdfBusy, setMasterPdfBusy] = useState(false);
  const [solveSheetBusy, setSolveSheetBusy] = useState(false);
  const [omrSheetBusy, setOmrSheetBusy] = useState(false);
  const [omrSetLabel, setOmrSetLabel] = useState('A');
  const [latestOmrBatch, setLatestOmrBatch] = useState<OmrPdfBatchResponse | null>(null);
  const [hasOmrSheets, setHasOmrSheets] = useState(false);
  const [hasOmrUploads, setHasOmrUploads] = useState(false);

  const omrEnabled = state.resultInputModes.includes('OMR_SCAN');
  const nSets = Math.min(26, Math.max(1, Number(state.nSets) || 1));
  const showOmrSetPicker = omrEnabled && nSets > 1;
  const status = serverExam?.status ?? null;
  const isDraft = status === 'DRAFT';
  const isPublished = status === 'PUBLISHED';

  const examBase = examId ? examBasePath(portal, examId) : null;

  useEffect(() => {
    if (!examId) {
      setHasOmrSheets(false);
      setHasOmrUploads(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const response = await getExamOperationsSummary(examId);
      if (cancelled || !response.success || !response.data) return;
      setHasOmrSheets(response.data.setup.hasOmrPdf);
      setHasOmrUploads(response.data.omr.batchTotal > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [examId, latestOmrBatch]);

  const publishReadiness = assessWizardPublishReadiness(state, {
    setCount: serverExam?.setCount,
    pdfUrl: serverExam?.pdfUrl,
    solveSheetUrl: serverExam?.solveSheetUrl,
  });

  const phase = resolveLaunchPhase({
    examId,
    status,
    setCount: serverExam?.setCount,
    pdfUrl: serverExam?.pdfUrl,
    publishOk: publishReadiness.ok,
  });

  const checklist = useMemo(
    () =>
      buildLaunchChecklist({
        examId,
        status,
        setCount: serverExam?.setCount,
        pdfUrl: serverExam?.pdfUrl,
        omrEnabled,
        isPublished,
      }),
    [examId, isPublished, omrEnabled, serverExam?.pdfUrl, serverExam?.setCount, status],
  );

  const regenerateMaster = useCallback(async () => {
    if (!examId) return false;
    setMasterPdfBusy(true);
    try {
      const r = await regenerateExamPdf(examId, 2);
      if (!r.success || !r.data?.pdfUrl) {
        toast({
          title: 'PDF failed',
          description: r.message ?? 'Ensure sets have questions.',
          variant: 'destructive',
        });
        return false;
      }
      toast({ title: 'Master PDF generated' });
      await onRefreshMeta();
      return true;
    } finally {
      setMasterPdfBusy(false);
    }
  }, [examId, onRefreshMeta, toast]);

  const openMasterPreview = () => {
    if (!serverExam?.pdfUrl) {
      toast({ title: 'No PDF yet', description: 'Generate the question paper first.', variant: 'destructive' });
      return;
    }
    setPdfPreviewOpen(true);
  };

  const downloadMaster = () => {
    const url = serverExam?.pdfUrl;
    if (!url) {
      toast({ title: 'No PDF', variant: 'destructive' });
      return;
    }
    window.open(getExamPdfDownloadUrl(url), '_blank', 'noopener,noreferrer');
  };

  const regenerateSolve = async () => {
    if (!examId) return;
    setSolveSheetBusy(true);
    try {
      const r = await regenerateSolveSheet(examId);
      if (!r.success || !r.data?.solveSheetUrl) {
        toast({
          title: 'Solve sheet failed',
          description: r.message ?? 'Generate the question paper first.',
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Solve sheet generated' });
      await onRefreshMeta();
    } finally {
      setSolveSheetBusy(false);
    }
  };

  const downloadSolveSheet = () => {
    if (!examId) {
      toast({ title: 'No solve sheet', description: 'Save the exam first.', variant: 'destructive' });
      return;
    }
    window.open(getSolveSheetDownloadUrl(examId), '_blank', 'noopener,noreferrer');
  };

  const showSolveEnabled = state.showSolve && state.solveVisibility !== 'HIDDEN';

  const omrMcqTotal =
    state.productType === 'MULTI'
      ? state.subjects.reduce(
          (sum, subject) => sum + Number(subject.mcqSingleCount || 0) + Number(subject.mcqPassageCount || 0),
          0,
        )
      : state.sections
          .filter((section) => section.type === 'MCQ')
          .reduce((sum, section) => sum + Number(section.count || 0), 0);

  const omrCountMismatch = Boolean(
    omrEnabled && state.omrConfig && omrMcqTotal && omrMcqTotal !== state.omrConfig.questionCount,
  );

  const generateOmrSheets = async () => {
    if (!examId) return;
    if (omrCountMismatch) {
      toast({
        title: 'OMR count mismatch',
        description: `OMR sheet expects ${state.omrConfig?.questionCount} questions, but MCQ sections total ${omrMcqTotal}.`,
        variant: 'destructive',
      });
      return;
    }
    setOmrSheetBusy(true);
    try {
      const r = await generateOmrPdfBatch(examId, {
        branchId: resolveWizardBranchIdForApi(state.branchId),
        setLabel: omrSetLabel,
      });
      if (!r.success || !r.data?.pdfUrl) {
        toast({
          title: 'OMR sheets failed',
          description: r.message ?? 'Ensure students are enrolled and a branch is selected.',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Hall OMR sheets ready',
        description: `${r.data.studentCount} pages generated. Scan uploads live in Results → OMR.`,
      });
      setLatestOmrBatch(r.data);
      window.open(getExamPdfDownloadUrl(r.data.pdfUrl), '_blank', 'noopener,noreferrer');
      await onRefreshMeta();
    } finally {
      setOmrSheetBusy(false);
    }
  };

  const confirmPublish = useCallback(() => {
    const title = state.title.trim() || 'Untitled exam';
    const scheduleLine = formatScheduleLine(state.startAt, state.endAt);
    openModal({
      title: 'Publish exam',
      description: 'Students will be able to attempt when schedule and enrollment allow.',
      className: 'sm:max-w-lg',
      content: (
        <ConfirmationModal
          title="Publish to students?"
          description={`${title}\n${serverExam?.setCount ?? 0} set(s) · ${state.durationMinutes} min · ${deliveryMode.toLowerCase()}\n${scheduleLine}`}
          confirmLabel="Yes, publish"
          onConfirm={async () => {
            await onPublish();
          }}
        />
      ),
    });
  }, [deliveryMode, onPublish, openModal, serverExam?.setCount, state.durationMinutes, state.endAt, state.startAt, state.title]);

  const handlePrimary = useCallback(() => {
    switch (phase) {
      case 'generate_paper':
        onFinalize();
        break;
      case 'generate_pdf':
        void regenerateMaster();
        break;
      case 'ready_to_publish':
        confirmPublish();
        break;
      default:
        break;
    }
  }, [confirmPublish, onFinalize, phase, regenerateMaster]);

  const primaryBusy = saveAction === 'finalize' || masterPdfBusy;
  const secondaryBusy = saveAction === 'draft';
  const publishBlocker = publishReadiness.blockers[0];

  return (
    <div className="space-y-4">
      <PaperPreview state={state} step={step} deliveryMode={deliveryMode} />

      {isDraft && examId && publishReadiness.warnings.length > 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <ul className="list-disc space-y-0.5 pl-4">
            {publishReadiness.warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Step6LaunchPanel
        phase={phase}
        checklist={checklist}
        primaryBusy={primaryBusy}
        secondaryBusy={secondaryBusy}
        publishBlocker={publishBlocker}
        onPrimary={handlePrimary}
        onSaveSettings={onSaveDraft}
        overviewHref={examBase ?? undefined}
      />

      {isPublished ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex flex-wrap items-center gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={saveAction !== null}
              onClick={onFinalize}
            >
              {saveAction === 'finalize' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Re-generate question paper
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saveAction !== null}
              onClick={onSaveDraft}
            >
              {saveAction === 'draft' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save settings changes
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <ExamScheduleCard state={state} dispatch={dispatch} />

      {omrEnabled && examId ? (
        <OfflineOmrWorkflowCard
          state={state}
          examId={examId}
          hasMasterPdf={Boolean(serverExam?.pdfUrl)}
          deliveryMode={deliveryMode}
          hasOmrSheets={hasOmrSheets || Boolean(latestOmrBatch)}
          hasOmrUploads={hasOmrUploads}
        />
      ) : null}

      {state.examType === 'TALENT_HUNT' && examId ? (
        <Step6CollapsibleSection title="Talent hunt stages" summary="Configure after publish on overview">
          <Button asChild size="sm" variant="outline">
            <Link href={examBase!}>Open talent hunt setup</Link>
          </Button>
        </Step6CollapsibleSection>
      ) : null}

      <Step6CollapsibleSection title="Save as preset" summary="Reuse this configuration for future exams">
        <PresetSaveActions
          key={appliedPresetId ?? 'new-preset'}
          presets={presets}
          appliedPresetId={appliedPresetId}
          busy={presetBusy}
          onSaveNew={onSavePreset}
          onUpdate={onUpdatePreset}
        />
      </Step6CollapsibleSection>

      {examId ? (
        <Step6CollapsibleSection
          title="Print & downloads"
          summary={
            serverExam?.pdfUrl
              ? 'Master PDF ready — preview, download, or regenerate'
              : 'Generate the question paper first'
          }
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href={examBase!}>
                  <LayoutList className="h-4 w-4" /> Overview
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href={examPapersPath(portal, examId)}>
                  <ExternalLink className="h-4 w-4" /> PDF hub
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href={examLeaderboardPath(portal, examId)}>
                  <Trophy className="h-4 w-4" /> Leaderboard
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href={examResultsPath(portal, examId)}>
                  <BarChart3 className="h-4 w-4" /> Results
                </Link>
              </Button>
              <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={openMasterPreview}>
                <ExternalLink className="h-4 w-4" /> Preview master PDF
              </Button>
              <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={downloadMaster}>
                <Download className="h-4 w-4" /> Download master
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={masterPdfBusy}
                onClick={() => void regenerateMaster()}
              >
                {masterPdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Regenerate PDF
              </Button>
            </div>

            {showSolveEnabled ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={solveSheetBusy}
                  onClick={() => void regenerateSolve()}
                >
                  {solveSheetBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpenCheck className="h-4 w-4" />}
                  {serverExam?.solveSheetUrl ? 'Regenerate solve sheet' : 'Generate solve sheet'}
                </Button>
                {serverExam?.solveSheetUrl ? (
                  <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={downloadSolveSheet}>
                    <Download className="h-4 w-4" /> Download solve sheet
                  </Button>
                ) : null}
              </div>
            ) : null}

            {omrEnabled ? (
              <div className="space-y-2 rounded-lg border border-[#C8A96E]/30 bg-[#FBF4E6]/40 p-3">
                <p className="text-xs font-medium text-slate-600">
                  Print per-student OMR sheets for hall distribution. Upload scans from Results → OMR.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {showOmrSetPicker ? (
                    <select
                      value={omrSetLabel}
                      onChange={(event) => setOmrSetLabel(event.target.value)}
                      className="h-9 rounded-md border border-[#C8A96E] bg-white px-2 text-sm font-semibold text-[#7A6035]"
                      aria-label="OMR set label"
                    >
                      {'ABCDEFGHIJ'.slice(0, nSets).split('').map((label) => (
                        <option key={label} value={label}>
                          SET {label}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 border-[#C8A96E] text-[#7A6035] hover:bg-[#FBF4E6]"
                    disabled={omrSheetBusy || omrCountMismatch}
                    onClick={() => void generateOmrSheets()}
                  >
                    {omrSheetBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileScan className="h-4 w-4" />}
                    Print hall OMR sheets
                  </Button>
                </div>
              </div>
            ) : null}

            {omrCountMismatch ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                OMR sheet expects {state.omrConfig?.questionCount} questions, but MCQ sections total {omrMcqTotal}.
                Update Step 1 or Step 2 first.
              </div>
            ) : null}

            {showSolveEnabled && !serverExam?.solveSheetUrl ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                Solve sheet is enabled but not generated yet.
              </div>
            ) : null}

            {latestOmrBatch ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                <p className="font-bold">
                  OMR batch: {latestOmrBatch.questionCount}Q · {latestOmrBatch.studentCount} students · SET{' '}
                  {omrSetLabel}
                </p>
              </div>
            ) : null}
          </div>
        </Step6CollapsibleSection>
      ) : (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Save settings once to unlock print & download tools.
        </p>
      )}

      <ExamPdfPreviewDialog
        open={pdfPreviewOpen}
        onOpenChange={setPdfPreviewOpen}
        title={`${state.title.trim() || 'Exam'} — master paper`}
        pdfUrl={serverExam?.pdfUrl}
      />
    </div>
  );
}
