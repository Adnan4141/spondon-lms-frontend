'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, ExternalLink, Loader2, RefreshCw, Trophy, BarChart3, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { regenerateExamPdf, getExamPdfDownloadUrl } from '@/lib/api/exams';
import type { ExamStatus } from '@/types/exam';
import { useToast } from '@/hooks/use-toast';
import type { ExamWizardState } from '../../types';
import { PaperPreview } from '../components/PaperPreview';
import { ExamPdfPreviewDialog } from '../../components/ExamPdfPreviewDialog';

type Props = {
  state: ExamWizardState;
  step: number;
  saveAction: null | 'draft' | 'finalize';
  onSaveDraft: () => void;
  onFinalize: () => void;
  examId?: string;
  serverExam: { status: ExamStatus; pdfUrl?: string | null } | null;
  onPublish: () => void | Promise<void>;
  onRefreshMeta: () => void | Promise<void>;
};

export function Step6PreviewPublish({
  state,
  step,
  saveAction,
  onSaveDraft,
  onFinalize,
  examId,
  serverExam,
  onPublish,
  onRefreshMeta,
}: Props) {
  const { toast } = useToast();
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [masterPdfBusy, setMasterPdfBusy] = useState(false);

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

  return (
    <div className="space-y-4">
      <PaperPreview state={state} step={step} />

      {examId ? (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-[#0D1B35]">Exam outputs</CardTitle>
            <CardDescription>View details, PDFs, rankings, and analytics on dedicated pages.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={`/admin/exam/${examId}/details`}>
                <LayoutList className="h-4 w-4" /> Details
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={`/admin/exam/${examId}/pdf`}>
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={masterPdfBusy}
              onClick={() => void regenerateMaster()}
            >
              {masterPdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Regenerate master PDF
            </Button>
            {serverExam?.status === 'DRAFT' ? (
              <Button
                type="button"
                size="sm"
                className="gap-2 bg-emerald-800 text-white hover:bg-emerald-900"
                onClick={() => void onPublish()}
              >
                Publish exam
              </Button>
            ) : (
              <span className="self-center text-xs text-slate-500">Status: {serverExam?.status ?? '—'}</span>
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Save this exam once to unlock details, PDF downloads, leaderboard, and results links.
        </p>
      )}

      <Card className="border-slate-200 bg-[#FBF4E6]/40 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-[#0D1B35]">Preview & publish</CardTitle>
          <CardDescription>
            Save draft stores sections and folder rules. Finalize also generates sets from the bank using your
            exclusions / pins.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
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
            Save draft only
          </Button>
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
            Save & generate sets
          </Button>
        </CardContent>
      </Card>

      <ExamPdfPreviewDialog
        open={pdfPreviewOpen}
        onOpenChange={setPdfPreviewOpen}
        title={`${state.title.trim() || 'Exam'} — master paper`}
        pdfUrl={serverExam?.pdfUrl}
      />
    </div>
  );
}
