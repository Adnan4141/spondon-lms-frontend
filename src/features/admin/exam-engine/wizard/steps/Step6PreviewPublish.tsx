'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Download, ExternalLink, Loader2, RefreshCw, Trophy, BarChart3, LayoutList, FileScan, BookOpenCheck } from 'lucide-react';
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
import type { ExamWizardState } from '../../types';
import { PaperPreview } from '../components/PaperPreview';
import { ExamPdfPreviewDialog } from '../../components/ExamPdfPreviewDialog';
import { PresetSaveActions } from '../components/PresetSaveActions';
import { ExamScheduleCard } from '../components/ExamScheduleCard';
import { OfflineOmrWorkflowCard } from '../components/OfflineOmrWorkflowCard';
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
};

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
}: Props) {
  const toast = useAdminToast();
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
  const status = serverExam?.status ?? null;
  const isDraft = status === 'DRAFT';
  const isPublished = status === 'PUBLISHED';
  const isClosed = status === 'CLOSED';

  const publishReadiness = assessWizardPublishReadiness(state, {
    setCount: serverExam?.setCount,
    pdfUrl: serverExam?.pdfUrl,
    solveSheetUrl: serverExam?.solveSheetUrl,
  });

  const regenerateMaster = async () => {
    if (!examId) return;
    setMasterPdfBusy(true);
    try {
      const r = await regenerateExamPdf(examId, 2);
      if (!r.success || !r.data?.pdfUrl) {
        toast({ title: 'PDF failed', description: r.message ?? 'Ensure sets have questions.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Master PDF generated' });
      await onRefreshMeta();
    } finally {
      setMasterPdfBusy(false);
    }
  };

  const openMasterPreview = () => {
    const url = serverExam?.pdfUrl;
    if (!url) {
      toast({ title: 'No PDF yet', description: 'Generate a master PDF first.', variant: 'destructive' });
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
          description: r.message ?? 'Ensure question sets are generated first.',
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

  const omrMcqTotal = state.productType === 'MULTI'
    ? state.subjects.reduce((sum, subject) => sum + Number(subject.mcqSingleCount || 0) + Number(subject.mcqPassageCount || 0), 0)
    : state.sections
      .filter((section) => section.type === 'MCQ')
      .reduce((sum, section) => sum + Number(section.count || 0), 0);
  const omrCountMismatch = Boolean(
    omrEnabled
    && state.omrConfig
    && omrMcqTotal
    && omrMcqTotal !== state.omrConfig.questionCount,
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
          description: r.message ?? 'Make sure students are enrolled in the exam course and a branch is selected.',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Hall OMR sheets ready',
        description: `${r.data.studentCount} per-student OMR pages generated. Print on plain A4 (no scaling). Scan uploads in Results → OMR review.`,
      });
      setLatestOmrBatch(r.data);
      window.open(getExamPdfDownloadUrl(r.data.pdfUrl), '_blank', 'noopener,noreferrer');
      await onRefreshMeta();
    } finally {
      setOmrSheetBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaperPreview state={state} step={step} deliveryMode={deliveryMode} />

      <Card className="border-slate-200 bg-[#FBF4E6]/40 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-[#0D1B35]">Prepare & publish</CardTitle>
          <CardDescription>
            Save draft stores sections and folder rules. Pull questions from the bank before publishing.
            For offline OMR exams, regenerate the question paper PDF and print hall OMR sheets in Exam outputs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDraft && examId && !publishReadiness.ok ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
              <p className="font-bold">Resolve before publishing:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {publishReadiness.blockers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {isDraft && examId && publishReadiness.warnings.length > 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <ul className="list-disc space-y-0.5 pl-4">
                {publishReadiness.warnings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {isPublished ? (
            <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
              This exam is already published. Students can access it if schedule and enrollment allow.
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              type="button"
              className="bg-gradient-to-br from-[#0D1B35] to-[#1E2F55] text-[#E2C98A] hover:opacity-95"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFinalize();
              }}
              disabled={saveAction !== null}
            >
              {saveAction === 'finalize' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save & pull questions from bank
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSaveDraft();
              }}
              disabled={saveAction !== null}
            >
              {saveAction === 'draft' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {examId ? 'Save changes' : 'Save draft only'}
            </Button>
            {isDraft && examId ? (
              <Button
                type="button"
                className="gap-2 bg-emerald-800 text-white hover:bg-emerald-900"
                disabled={!publishReadiness.ok}
                onClick={() => void onPublish()}
              >
                Publish exam
              </Button>
            ) : null}
            {isPublished ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Published
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  disabled={saveAction !== null}
                  onClick={onSaveDraft}
                >
                  {saveAction === 'draft' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save published changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={saveAction !== null}
                  onClick={onFinalize}
                >
                  {saveAction === 'finalize' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Re-pull questions from bank
                </Button>
              </>
            ) : null}
            {isClosed ? (
              <>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                  Closed
                </span>
                <Button type="button" size="sm" className="gap-2" disabled>
                  Publish exam
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <ExamScheduleCard state={state} dispatch={dispatch} />

      {state.examType === 'TALENT_HUNT' && examId ? (
        <Card className="border-fuchsia-200 bg-fuchsia-50/40 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base text-fuchsia-950">Talent hunt stages</CardTitle>
            <CardDescription>
              Configure elimination stages, cutoffs, and prizes on the exam overview page after publish.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant="outline" className="border-fuchsia-300 text-fuchsia-900 hover:bg-fuchsia-100">
              <Link href={`/admin/exam/${examId}`}>Open talent hunt setup</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <OfflineOmrWorkflowCard
        state={state}
        examId={examId}
        hasMasterPdf={Boolean(serverExam?.pdfUrl)}
        deliveryMode={deliveryMode}
        hasOmrSheets={hasOmrSheets || Boolean(latestOmrBatch)}
        hasOmrUploads={hasOmrUploads}
      />

      <PresetSaveActions
        key={appliedPresetId ?? 'new-preset'}
        presets={presets}
        appliedPresetId={appliedPresetId}
        busy={presetBusy}
        onSaveNew={onSavePreset}
        onUpdate={onUpdatePreset}
      />

      {examId ? (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-[#0D1B35]">Exam outputs</CardTitle>
            <CardDescription>View details, PDFs, rankings, and analytics on dedicated pages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href={`/admin/exam/${examId}`}>
                  <LayoutList className="h-4 w-4" /> Details
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href={`/admin/exam/${examId}/papers`}>
                  <ExternalLink className="h-4 w-4" /> PDF hub
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href={`/admin/exam/${examId}/leaderboard`}>
                  <Trophy className="h-4 w-4" /> Leaderboard
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href={`/admin/exam/${examId}/results`}>
                  <BarChart3 className="h-4 w-4" /> Results
                </Link>
              </Button>
              <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={() => void openMasterPreview()}>
                <ExternalLink className="h-4 w-4" /> Preview master PDF
              </Button>
              <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={downloadMaster}>
                <Download className="h-4 w-4" /> Download master
              </Button>
              {showSolveEnabled ? (
                <>
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
                </>
              ) : null}
              {omrEnabled ? (
                <div className="flex w-full flex-col gap-2 sm:w-auto">
                  <p className="text-xs font-medium text-slate-600">
                    Written/CQ: students may use any paper. MCQ (when OMR scan is on): print hall OMR sheets below, then scan in Results.
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
                        <option key={label} value={label}>SET {label}</option>
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
                    Print hall OMR sheets (scan in Results)
                  </Button>
                  </div>
                </div>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={masterPdfBusy}
                onClick={() => void regenerateMaster()}
              >
                {masterPdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Regenerate question paper PDF
              </Button>
              {isPublished ? (
                <Button asChild variant="secondary" size="sm" className="gap-2">
                  <Link href={`/student/exams/${examId}`}>
                    <ExternalLink className="h-4 w-4" /> View student exam
                  </Link>
                </Button>
              ) : null}
              {!status ? (
                <span className="self-center text-xs text-slate-500">Status: —</span>
              ) : null}
            </div>
            {omrCountMismatch ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                OMR sheet expects {state.omrConfig?.questionCount} questions, but MCQ sections total {omrMcqTotal}. Update Step 1 or Step 2 before generating OMR sheets.
              </div>
            ) : null}
            {showSolveEnabled && examId && !serverExam?.solveSheetUrl ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                Solve sheet is enabled for students but not generated yet. Pull questions from the bank, then generate the solve sheet above.
              </div>
            ) : null}
            {latestOmrBatch ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                <p className="font-bold">
                  OMR batch ready: {latestOmrBatch.questionCount}Q / {latestOmrBatch.optionCount} options · {latestOmrBatch.columns} columns · {latestOmrBatch.studentCount} students
                </p>
                <p className="mt-1">Layout: {latestOmrBatch.layoutVersion ?? 'spondon_public_dynamic_v1'} · SET {omrSetLabel}</p>
                {latestOmrBatch.warnings?.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {latestOmrBatch.warnings.slice(0, 6).map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Save this exam once to unlock details, PDF downloads, leaderboard, and results links.
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
