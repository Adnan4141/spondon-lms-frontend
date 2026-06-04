'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, ExternalLink, FileText, Loader2, RefreshCw, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  generateSetPdf,
  getExamBundleZipUrl,
  getExamOperationsSummary,
  getExamPdfDownloadUrl,
  regenerateExamPdf,
} from '@/lib/api/exams';
import type { ExamSet } from '@/types/exam';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { useExamWorkspace } from './layout/ExamWorkspaceShell';
import { ExamWorkspacePageHeader } from './layout/ExamWorkspacePageHeader';
import { DisabledReason, examWorkspacePageClass } from './layout/examWorkspaceUi';
import { ExamPdfPreviewDialog } from './components/ExamPdfPreviewDialog';

export function ExamPapersPage({ examId }: { examId: string }) {
  const { exam, loadingExam, refreshExam } = useExamWorkspace();
  const toast = useAdminToast();
  const [hasSets, setHasSets] = useState(false);
  const [supportsOmr, setSupportsOmr] = useState(false);
  const [loadingOps, setLoadingOps] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [setPdfBusyId, setSetPdfBusyId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const loadOps = useCallback(async () => {
    setLoadingOps(true);
    const ops = await getExamOperationsSummary(examId);
    setHasSets(Boolean(ops.success && ops.data?.setup.hasSets));
    setSupportsOmr(Boolean(ops.success && ops.data?.omr.enabled));
    setLoadingOps(false);
  }, [examId]);

  useEffect(() => {
    if (!loadingExam && exam) void loadOps();
    if (!loadingExam && !exam) setLoadingOps(false);
  }, [loadingExam, exam, loadOps]);

  const sets = useMemo<ExamSet[]>(() => exam?.sets ?? [], [exam?.sets]);
  const canGeneratePdf = hasSets;

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
      toast({ title: 'Master PDF ready' });
      await refreshExam();
    } finally {
      setPdfBusy(false);
    }
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

  if (loadingExam || loadingOps) {
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
        title="Papers & PDFs"
        description="Master question paper, per-set PDFs, and links to OMR printing on the Results tab."
      />

      {supportsOmr ? (
        <Card className="border-blue-200 bg-blue-50/40 shadow-sm">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-2 text-sm text-blue-900">
              <ScanLine className="h-4 w-4" />
              OMR hall sheets are generated from Setup step 6 or the Results → OMR scans tab.
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/exam/${examId}/results#omr`}>Open OMR scans</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="font-serif text-lg text-[#0D1B35]">Master paper</CardTitle>
            <CardDescription>One combined PDF for printing at the exam centre.</CardDescription>
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
        <CardContent>
          {!exam.pdfUrl ? (
            <p className="text-sm text-amber-800">
              No master PDF yet. After sets exist with questions, use Regenerate master or finalize from the wizard.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-[#0D1B35]">Question sets</CardTitle>
          <CardDescription>Per-set PDFs (generated on demand, opens in a new tab).</CardDescription>
        </CardHeader>
        <CardContent>
          {sets.length === 0 ? (
            <p className="text-sm text-slate-500">No sets generated. Finalize from the wizard or generate from subjects.</p>
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
