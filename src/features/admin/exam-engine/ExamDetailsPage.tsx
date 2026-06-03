'use client';

import { useCallback, useEffect, useMemo, useState, type ElementType, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  ScanLine,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  deleteExam,
  getExamById,
  getExamSections,
  generateSetPdf,
  regenerateExamPdf,
  getExamPdfDownloadUrl,
  getAnswerSheetTemplateUrl,
  getExamBundleZipUrl,
  getExamOperationsSummary,
  type ExamOperationsSummary,
  type ExamSection,
} from '@/lib/api/exams';
import {
  postExamResultBulkExcel,
  postExamResultBulkManual,
  postExamResultSingle,
} from '@/lib/api/exam-result-batches';
import { getBranches } from '@/lib/api/branches';
import type { Exam, ExamSet } from '@/types/exam';
import { ConfirmationModal } from '@/features/admin/shared';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { useModalStore } from '@/store/modalStore';
import { ExamEngineSubnav } from './components/ExamEngineSubnav';
import { ExamPdfPreviewDialog } from './components/ExamPdfPreviewDialog';

function sectionMarks(s: ExamSection): number {
  return (s.questionCount || 0) * Number(s.marksPerQuestion ?? 1);
}

function StatTile({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'slate' | 'emerald' | 'amber' | 'rose' | 'blue' }) {
  const tones = {
    slate: 'border-slate-200 bg-white text-slate-950',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
  };
  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function ReadinessRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-slate-100 bg-white px-3 py-2 text-sm">
      <CheckCircle2 className={`mt-0.5 h-4 w-4 ${ok ? 'text-emerald-600' : 'text-amber-600'}`} />
      <div>
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function WorkflowCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ElementType;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-start gap-3">
        <span className="rounded-md border border-slate-200 bg-white p-2 text-slate-700">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="font-semibold text-slate-950">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function downloadOfflineResultTemplate() {
  const csv = 'rollNo,name,marks,totalMarks,comments\nREG-001,Student Name,82,100,Good\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'offline-result-template.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function DisabledReason({ children }: { children: string }) {
  return <span className="ml-1 text-[11px] font-semibold text-slate-400">({children})</span>;
}

export function ExamDetailsPage({ examId }: { examId: string }) {
  const router = useRouter();
  const { openModal } = useModalStore();
  const toast = useAdminToast();
  const [exam, setExam] = useState<Exam | null>(null);
  const [sections, setSections] = useState<ExamSection[]>([]);
  const [operations, setOperations] = useState<ExamOperationsSummary | null>(null);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchId, setBranchId] = useState('');
  const [singleRoll, setSingleRoll] = useState('');
  const [singleMarks, setSingleMarks] = useState('');
  const [singleTotal, setSingleTotal] = useState('');
  const [bulkRows, setBulkRows] = useState('');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [offlineBusy, setOfflineBusy] = useState(false);
  const [offlineErrors, setOfflineErrors] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [setPdfBusyId, setSetPdfBusyId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ex, sec, ops] = await Promise.all([getExamById(examId), getExamSections(examId), getExamOperationsSummary(examId)]);
      if (ex.success && ex.data) setExam(ex.data);
      else setExam(null);
      if (sec.success && sec.data) setSections(sec.data);
      else setSections([]);
      if (ops.success && ops.data) setOperations(ops.data);
      else setOperations(null);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    getBranches({ all: true }).then((response) => {
      if (response.success && response.data) {
        setBranches(response.data.map((branch) => ({ id: branch.id, name: branch.name })));
      }
    });
  }, []);

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

  const openMasterPreview = () => {
    if (!exam?.pdfUrl) {
      toast({ title: 'No master PDF', description: 'Generate a master PDF first.', variant: 'destructive' });
      return;
    }
    setPreviewTitle(`${exam.title} — master paper`);
    setPreviewUrl(exam.pdfUrl);
    setPreviewOpen(true);
  };

  const downloadUrl = (url: string, filename: string) => {
    const full = getExamPdfDownloadUrl(url);
    const a = document.createElement('a');
    a.href = full;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const regenerateMaster = async () => {
    setPdfBusy(true);
    try {
      const r = await regenerateExamPdf(examId, 2);
      if (!r.success || !r.data?.pdfUrl) {
        toast({ title: 'PDF failed', description: r.message ?? 'Could not generate.', variant: 'destructive' });
        return;
      }
      setExam((e) => (e ? { ...e, pdfUrl: r.data!.pdfUrl } : e));
      toast({ title: 'Master PDF ready' });
    } finally {
      setPdfBusy(false);
    }
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

  const generateSet = async (setId: string, name: string) => {
    setSetPdfBusyId(setId);
    try {
      const r = await generateSetPdf(examId, setId, 2);
      if (!r.success || !r.data?.pdfUrl) {
        toast({ title: 'Set PDF failed', description: r.message ?? 'Could not generate.', variant: 'destructive' });
        return;
      }
      const full = getExamPdfDownloadUrl(r.data.pdfUrl);
      window.open(full, '_blank', 'noopener,noreferrer');
      toast({ title: 'Set PDF opened', description: `Set ${name} — check the new browser tab.` });
    } finally {
      setSetPdfBusyId(null);
    }
  };

  const selectedBranchId = branchId || exam?.branchId || '';
  const branchRequired = Boolean(operations?.offlineResults.enabled && !exam?.branchId);
  const canEditExam = exam?.status !== 'CLOSED';
  const canGeneratePdf = Boolean(operations?.setup.hasSets);
  const canOpenResults = Boolean(operations && !(exam?.status === 'DRAFT' && !operations.setup.hasSets));
  const canOpenLeaderboard = Boolean(exam?.showLeaderboard && exam?.status !== 'DRAFT');
  const canDeleteExam = Boolean(exam && !(exam.status === 'PUBLISHED' && (exam.attempts?.length || operations?.attempts.total || 0) > 0));
  const canUseOfflineResults = Boolean(operations?.offlineResults.enabled);
  const canUseWrittenEvaluation = Boolean(operations?.written.enabled && operations.written.totalAttempts > 0);
  const canUseOmrReview = Boolean(operations?.omr.enabled);
  const canReviewBatches = Boolean(operations?.offlineResults.batchTotal);
  const offlineImportDisabled = offlineBusy || !canUseOfflineResults || !canGeneratePdf || (branchRequired && !selectedBranchId);
  const recommendedDisabled = Boolean(
    operations
      && (
        (operations.recommendedAction.key === 'EDIT_WIZARD' && !canEditExam)
        || (operations.recommendedAction.key === 'GENERATE_PDF' && !canGeneratePdf)
        || (operations.recommendedAction.key === 'IMPORT_RESULTS' && !canUseOfflineResults)
        || (operations.recommendedAction.key === 'EVALUATE_SCRIPTS' && !canUseWrittenEvaluation)
        || (operations.recommendedAction.key === 'REVIEW_APPROVALS' && !canReviewBatches)
        || (operations.recommendedAction.key === 'SEND_RESULT_SMS' && !canReviewBatches)
      )
  );

  const parseBulkRows = () => bulkRows
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rollNo, marksObtained, totalMarks, ...commentParts] = line.split(/[,\t]/).map((value) => value.trim());
      return {
        rollNo,
        marksObtained: Number(marksObtained || 0),
        totalMarks: totalMarks ? Number(totalMarks) : undefined,
        comments: commentParts.join(' ').trim() || undefined,
      };
    })
    .filter((row) => row.rollNo);

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
      setSingleRoll('');
      setSingleMarks('');
      setSingleTotal('');
      toast({ title: 'Single result queued', description: 'It is waiting in the approval queue.' });
      await load();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Result entry failed', variant: 'destructive' });
    } finally {
      setOfflineBusy(false);
    }
  };

  const submitBulkOffline = async () => {
    const rows = parseBulkRows();
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
      toast({ title: `Bulk rows queued: ${response.data?.inserted ?? 0}` });
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
      setExcelFile(null);
      toast({ title: `Excel rows queued: ${response.data?.inserted ?? 0}` });
      await load();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Excel import failed', variant: 'destructive' });
    } finally {
      setOfflineBusy(false);
    }
  };

  if (loading) {
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
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" asChild className="w-fit gap-1 text-slate-600">
          <Link href="/admin/exam">
            <ChevronLeft className="h-4 w-4" /> All exams
          </Link>
        </Button>
        <ExamEngineSubnav examId={examId} />
      </div>

      <div>
        <h1 className="font-serif text-2xl font-normal tracking-tight text-[#0D1B35] md:text-3xl">{exam.title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {exam.course?.name ?? 'Course'} ·{' '}
          {exam.branch?.name ?? (exam.branchId == null ? 'All branches' : 'Branch')} · {exam.mode} ·{' '}
          {exam.durationMinutes ?? '—'}{' '}
          min · <Badge variant="secondary">{exam.status}</Badge>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {canEditExam ? (
          <Button asChild className="bg-[#0D1B35] text-[#E2C98A] hover:bg-[#1E2F55]">
            <Link href={`/admin/exam/${examId}`}>Edit in wizard</Link>
          </Button>
        ) : (
          <Button disabled className="bg-slate-200 text-slate-500">
            Edit in wizard <DisabledReason>closed</DisabledReason>
          </Button>
        )}
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
            <Link href={`/admin/exam/${examId}/results`}>Results & analytics</Link>
          </Button>
        ) : (
          <Button variant="outline" disabled>
            Results & analytics <DisabledReason>generate sets first</DisabledReason>
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

      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {['overview', 'workflow', 'exam-pdfs', 'results', 'evaluation'].map((id) => (
          <a key={id} href={`#${id}`} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50">
            {id === 'exam-pdfs' ? 'PDFs' : id[0].toUpperCase() + id.slice(1)}
          </a>
        ))}
      </div>

      {operations ? (
        <Card id="overview" className="scroll-mt-24 border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="font-serif text-lg text-[#0D1B35]">Command center</CardTitle>
              <CardDescription>Setup health, result flow, evaluation progress, and the next best action.</CardDescription>
            </div>
            {recommendedDisabled ? (
              <Button disabled className="bg-slate-200 text-slate-500">
                {operations.recommendedAction.label} <DisabledReason>not ready</DisabledReason>
              </Button>
            ) : (
              <Button asChild className={operations.recommendedAction.severity === 'success' ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'bg-[#0D1B35] text-[#E2C98A] hover:bg-[#1E2F55]'}>
                <Link href={operations.recommendedAction.href}>{operations.recommendedAction.label}</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="Mode" value={exam.mode} tone="blue" />
              <StatTile label="Sets / Questions" value={`${operations.setup.setCount} / ${operations.setup.generatedQuestionCount}`} />
              <StatTile label="Result batches" value={operations.offlineResults.batchTotal} tone={operations.offlineResults.batchTotal ? 'emerald' : 'amber'} />
              <StatTile label="Pending approvals" value={operations.offlineResults.byApprovalStatus.PENDING + operations.offlineResults.byApprovalStatus.APPROVED_BY_BRANCH} tone={operations.offlineResults.byApprovalStatus.PENDING ? 'amber' : 'slate'} />
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
                  detail={operations.setup.hasPdf ? 'Ready for download and preview.' : 'Generate the master paper before offline printing.'}
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
        <Card id="workflow" className="scroll-mt-24 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-[#0D1B35]">Workflow</CardTitle>
            <CardDescription>Quick operational actions for this exam. Deep review stays on Results.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div id="results" className="scroll-mt-24">
            <WorkflowCard icon={FileSpreadsheet} title="Offline result entry" description="Single result, pasted rows, or Excel upload using ResultBatch approval flow.">
              {!canUseOfflineResults || !canGeneratePdf ? (
                <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                  {!canUseOfflineResults
                    ? 'Offline result entry is not enabled for this exam mode.'
                    : 'Generate question sets/PDF before importing offline results.'}
                </div>
              ) : null}
              {branchRequired ? (
                <div className="mb-3 max-w-sm space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Branch for new batch</label>
                  <select
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    value={branchId}
                    onChange={(event) => setBranchId(event.target.value)}
                  >
                    <option value="">Select branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="grid gap-3 xl:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase text-slate-500">Single</p>
                  <input disabled={!canUseOfflineResults || !canGeneratePdf} className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm disabled:bg-slate-100 disabled:text-slate-400" placeholder="Roll / registration" value={singleRoll} onChange={(event) => setSingleRoll(event.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <input disabled={!canUseOfflineResults || !canGeneratePdf} className="h-9 rounded-md border border-slate-200 px-2 text-sm disabled:bg-slate-100 disabled:text-slate-400" placeholder="Marks" type="number" value={singleMarks} onChange={(event) => setSingleMarks(event.target.value)} />
                    <input disabled={!canUseOfflineResults || !canGeneratePdf} className="h-9 rounded-md border border-slate-200 px-2 text-sm disabled:bg-slate-100 disabled:text-slate-400" placeholder="Total" type="number" value={singleTotal} onChange={(event) => setSingleTotal(event.target.value)} />
                  </div>
                  <Button type="button" size="sm" disabled={offlineImportDisabled} onClick={() => void submitSingleOffline()}>
                    Queue single {offlineImportDisabled && !offlineBusy ? <DisabledReason>not ready</DisabledReason> : null}
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase text-slate-500">Bulk rows</p>
                  <textarea disabled={!canUseOfflineResults || !canGeneratePdf} className="h-[104px] w-full rounded-md border border-slate-200 px-2 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400" placeholder={'REG-001, 82, 100, Good\nREG-002, 74, 100'} value={bulkRows} onChange={(event) => setBulkRows(event.target.value)} />
                  <Button type="button" size="sm" variant="outline" disabled={offlineImportDisabled} onClick={() => void submitBulkOffline()}>
                    Validate & queue {offlineImportDisabled && !offlineBusy ? <DisabledReason>not ready</DisabledReason> : null}
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase text-slate-500">Excel</p>
                  <input disabled={!canUseOfflineResults || !canGeneratePdf} className="block w-full text-xs disabled:text-slate-400 file:mr-2 file:rounded-md file:border-0 file:bg-slate-900 file:px-2 file:py-1.5 file:text-xs file:font-semibold file:text-white disabled:file:bg-slate-300" type="file" accept=".xlsx,.xls" onChange={(event) => setExcelFile(event.target.files?.[0] ?? null)} />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" disabled={offlineImportDisabled || !excelFile} onClick={() => void submitExcelOffline()}>
                      <Upload className="mr-1 h-3.5 w-3.5" /> Upload
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={downloadOfflineResultTemplate}>
                      <Download className="mr-1 h-3.5 w-3.5" /> Template
                    </Button>
                  </div>
                </div>
              </div>
              {offlineErrors.length ? (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                  <p className="font-bold">Validation warnings</p>
                  {offlineErrors.slice(0, 6).map((error, index) => <p key={index}>{JSON.stringify(error)}</p>)}
                </div>
              ) : null}
            </WorkflowCard>
            </div>

            <div id="evaluation" className="scroll-mt-24">
            <WorkflowCard icon={ClipboardCheck} title="Written evaluation" description="Review scripts and finalize marks on the Results page.">
              <div className="grid grid-cols-3 gap-2">
                <StatTile label="Pending" value={operations.written.pending} tone={operations.written.pending ? 'amber' : 'slate'} />
                <StatTile label="Partial" value={operations.written.partial} tone={operations.written.partial ? 'amber' : 'slate'} />
                <StatTile label="Evaluated" value={operations.written.evaluated} tone={operations.written.evaluated ? 'emerald' : 'slate'} />
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
            </div>

            <WorkflowCard icon={ScanLine} title="OMR scan" description="Track scan review and finalization readiness.">
              <div className="grid grid-cols-3 gap-2">
                <StatTile label="Processed" value={operations.omr.scansByStatus.PROCESSED} tone="emerald" />
                <StatTile label="Review" value={operations.omr.reviewNeeded} tone={operations.omr.reviewNeeded ? 'amber' : 'slate'} />
                <StatTile label="Ready batches" value={operations.omr.finalizeReadyBatches} tone={operations.omr.finalizeReadyBatches ? 'blue' : 'slate'} />
              </div>
              {canUseOmrReview ? (
                <Button asChild className="mt-3" size="sm" variant="outline">
                  <Link href={`/admin/exam/${examId}/results`}>Open OMR review</Link>
                </Button>
              ) : (
                <Button disabled className="mt-3" size="sm" variant="outline">
                  Open OMR review <DisabledReason>not enabled</DisabledReason>
                </Button>
              )}
            </WorkflowCard>

            <WorkflowCard icon={MessageSquare} title="Approval & SMS" description="Results become SMS-ready only after approval.">
              <div className="grid grid-cols-3 gap-2">
                <StatTile label="Pending" value={operations.offlineResults.byApprovalStatus.PENDING} tone={operations.offlineResults.byApprovalStatus.PENDING ? 'amber' : 'slate'} />
                <StatTile label="Central" value={operations.offlineResults.byApprovalStatus.APPROVED_BY_BRANCH} tone={operations.offlineResults.byApprovalStatus.APPROVED_BY_BRANCH ? 'blue' : 'slate'} />
                <StatTile label="SMS-ready" value={operations.offlineResults.smsReadyBatches} tone={operations.offlineResults.smsReadyBatches ? 'emerald' : 'slate'} />
              </div>
              {canReviewBatches ? (
                <Button asChild className="mt-3" size="sm" variant="outline">
                  <Link href={`/admin/exam/${examId}/results`}>Review batches</Link>
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

      <Card id="exam-pdfs" className="border-slate-200 shadow-sm scroll-mt-24">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="font-serif text-lg text-[#0D1B35]">PDFs</CardTitle>
            <CardDescription>Master paper and per-set PDFs (generated on demand).</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={pdfBusy || !canGeneratePdf} onClick={() => void regenerateMaster()}>
              {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-1">Regenerate master</span>
              {!canGeneratePdf ? <DisabledReason>no sets</DisabledReason> : null}
            </Button>
            {canGeneratePdf ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={getExamBundleZipUrl(examId)}>
                  <Download className="h-4 w-4" />
                  <span className="ml-1">Bundle ZIP</span>
                </a>
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" disabled>
                <Download className="h-4 w-4" />
                <span className="ml-1">Bundle ZIP</span>
                <DisabledReason>no sets</DisabledReason>
              </Button>
            )}
            {exam.mode === 'OFFLINE' || exam.mode === 'WRITTEN' || exam.mode === 'HYBRID' ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={getAnswerSheetTemplateUrl(examId)} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4" />
                  <span className="ml-1">Answer template</span>
                </a>
              </Button>
            ) : null}
            {exam.pdfUrl ? (
              <>
                <Button type="button" size="sm" variant="secondary" onClick={openMasterPreview}>
                  <ExternalLink className="h-4 w-4" />
                  <span className="ml-1">Preview</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#0D1B35] text-[#E2C98A]"
                  onClick={() => downloadUrl(exam.pdfUrl!, `${exam.title}-master.pdf`)}
                >
                  <Download className="h-4 w-4" />
                  <span className="ml-1">Download</span>
                </Button>
              </>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!exam.pdfUrl ? (
            <p className="text-sm text-amber-800">
              No master PDF yet. After sets exist with questions, use &quot;Regenerate master&quot; (or finalize from the
              wizard).
            </p>
          ) : null}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Question sets</p>
            {sets.length === 0 ? (
              <p className="text-sm text-slate-500">No sets generated. Finalize from wizard or generate from subjects.</p>
            ) : (
              <ul className="space-y-2">
                {sets.map((st) => (
                  <li
                    key={st.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <FileText className="h-4 w-4 text-slate-400" />
                      Set {st.name}
                      <span className="font-normal text-slate-500">({st.questions?.length ?? 0} Q)</span>
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={setPdfBusyId === st.id || !(st.questions?.length)}
                      title="Generates if needed, then opens this set’s PDF in a new tab"
                      onClick={() => void generateSet(st.id, st.name)}
                    >
                      {setPdfBusyId === st.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : !(st.questions?.length) ? (
                        <>Open PDF <DisabledReason>empty set</DisabledReason></>
                      ) : (
                        <>
                          <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open PDF
                        </>
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <ExamPdfPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={previewTitle}
        pdfUrl={previewUrl}
      />
    </div>
  );
}
