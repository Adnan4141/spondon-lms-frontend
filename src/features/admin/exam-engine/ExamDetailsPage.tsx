'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Download, ExternalLink, FileText, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getExamById,
  getExamSections,
  generateSetPdf,
  regenerateExamPdf,
  getExamPdfDownloadUrl,
  type ExamSection,
} from '@/lib/api/exams';
import type { Exam, ExamSet } from '@/types/exam';
import { useToast } from '@/hooks/use-toast';
import { ExamEngineSubnav } from './components/ExamEngineSubnav';
import { ExamPdfPreviewDialog } from './components/ExamPdfPreviewDialog';

function sectionMarks(s: ExamSection): number {
  return (s.questionCount || 0) * Number(s.marksPerQuestion ?? 1);
}

export function ExamDetailsPage({ examId }: { examId: string }) {
  const { toast } = useToast();
  const [exam, setExam] = useState<Exam | null>(null);
  const [sections, setSections] = useState<ExamSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [setPdfBusyId, setSetPdfBusyId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ex, sec] = await Promise.all([getExamById(examId), getExamSections(examId)]);
      if (ex.success && ex.data) setExam(ex.data);
      else setExam(null);
      if (sec.success && sec.data) setSections(sec.data);
      else setSections([]);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    void load();
  }, [load]);

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
          {exam.course?.name ?? 'Course'} · {exam.branch?.name ?? 'Branch'} · {exam.mode} · {exam.durationMinutes ?? '—'}{' '}
          min · <Badge variant="secondary">{exam.status}</Badge>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild className="bg-[#0D1B35] text-[#E2C98A] hover:bg-[#1E2F55]">
          <Link href={`/admin/exam/${examId}`}>Edit in wizard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/admin/exam/${examId}/leaderboard`}>Leaderboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/admin/exam/${examId}/results`}>Results & analytics</Link>
        </Button>
      </div>

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
            <Button type="button" variant="outline" size="sm" disabled={pdfBusy} onClick={() => void regenerateMaster()}>
              {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-1">Regenerate master</span>
            </Button>
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
                      disabled={setPdfBusyId === st.id}
                      title="Generates if needed, then opens this set’s PDF in a new tab"
                      onClick={() => void generateSet(st.id, st.name)}
                    >
                      {setPdfBusyId === st.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
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
