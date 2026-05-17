'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  finalizeWrittenEvaluation,
  getExamAnalytics,
  getExamById,
  getExamMeritListAll,
  getExamPdfDownloadUrl,
  getWrittenAttempt,
  listWrittenAttempts,
  saveWrittenEvaluation,
  type ExamAnalytics,
} from '@/lib/api/exams';
import {
  listExamResultBatches,
  postExamResultBulkExcel,
  postExamResultBulkManual,
  postExamResultSingle,
  type ResultBatchSummary,
} from '@/lib/api/exam-result-batches';
import { getBranches } from '@/lib/api/branches';
import { getActorUserIdFromStorage } from '@/lib/actor-user';
import type { Exam } from '@/types/exam';
import { ExamEngineSubnav } from './components/ExamEngineSubnav';
import { OmrScanReviewPanel } from './components/OmrScanReviewPanel';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';

type MeritRow = Record<string, unknown>;
type WrittenAttemptRow = {
  id: string;
  student?: { fullName?: string };
  evaluationStatus?: string;
  totalAwarded?: number;
};
type WrittenAttemptQuestion = {
  questionId: string;
  marks: number;
  question?: { prompt?: string };
  studentAnswer?: {
    id: string;
    obtainedMarks?: number | null;
    writtenSubmission?: {
      pages?: { url: string }[];
      finalPdfUrl?: string | null;
    } | null;
  } | null;
};
type WrittenAttemptDetail = {
  attempt: { id: string };
  student?: { fullName?: string };
  exam?: { title?: string };
  questions?: WrittenAttemptQuestion[];
};

export function ExamResultsPage({ examId }: { examId: string }) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [analytics, setAnalytics] = useState<ExamAnalytics | null>(null);
  const [meritRows, setMeritRows] = useState<MeritRow[]>([]);
  const [resultBatches, setResultBatches] = useState<ResultBatchSummary[]>([]);
  const [writtenAttempts, setWrittenAttempts] = useState<WrittenAttemptRow[]>([]);
  const [activeWrittenAttempt, setActiveWrittenAttempt] = useState<WrittenAttemptDetail | null>(null);
  const [writtenBusy, setWrittenBusy] = useState(false);
  const [marksDraft, setMarksDraft] = useState<Record<string, string>>({});
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
  const toast = useAdminToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ex, an, merit, batches, written] = await Promise.all([
        getExamById(examId),
        getExamAnalytics(examId),
        getExamMeritListAll(examId),
        listExamResultBatches(examId),
        listWrittenAttempts(examId).catch(() => ({ success: false, data: [] })),
      ]);
      if (ex.success && ex.data) setExam(ex.data);
      if (an.success && an.data) setAnalytics(an.data);
      if (merit.success && merit.data?.rows) setMeritRows(merit.data.rows as MeritRow[]);
      else setMeritRows([]);
      if (batches.success && batches.data) setResultBatches(batches.data);
      if (written.success && written.data) setWrittenAttempts(written.data as WrittenAttemptRow[]);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    getBranches().then((r) => {
      if (r.success && r.data) setBranches(r.data.map((b) => ({ id: b.id, name: b.name })));
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const stats = analytics;
  const isOfflineResultFlow = exam?.mode === 'OFFLINE' || exam?.settings?.examWorkflow?.method === 'OFFLINE_RESULT';
  const isWrittenEvalFlow = exam?.mode === 'WRITTEN' || exam?.mode === 'HYBRID';
  const omrScanEnabled = (exam?.resultInputModes ?? []).includes('OMR_SCAN');
  const selectedBranchId = branchId || exam?.branchId || '';

  const parseBulkRows = () => bulkRows
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rollNo, marksObtained, totalMarks, ...commentParts] = line.split(/[,\t]/).map((x) => x.trim());
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
      const r = await postExamResultSingle(examId, {
        rollNo: singleRoll.trim(),
        marksObtained: Number(singleMarks),
        totalMarks: singleTotal ? Number(singleTotal) : undefined,
        branchId: selectedBranchId || undefined,
      });
      if (!r.success) throw new Error(r.message || 'Single result failed');
      toast({ title: 'Result row queued' });
      setSingleRoll('');
      setSingleMarks('');
      await load();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Result entry failed', variant: 'destructive' });
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
      const r = await postExamResultBulkManual(examId, rows, selectedBranchId || undefined);
      if (!r.success) throw new Error(r.message || 'Bulk result failed');
      setOfflineErrors((r.data?.errors || []) as Array<Record<string, unknown>>);
      toast({ title: `Bulk rows queued: ${r.data?.inserted ?? 0}` });
      await load();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Bulk import failed', variant: 'destructive' });
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
      const r = await postExamResultBulkExcel(examId, excelFile, selectedBranchId || undefined);
      if (!r.success) throw new Error(r.message || 'Excel import failed');
      setOfflineErrors((r.data?.errors || []) as Array<Record<string, unknown>>);
      toast({ title: `Excel rows queued: ${r.data?.inserted ?? 0}` });
      setExcelFile(null);
      await load();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Excel import failed', variant: 'destructive' });
    } finally {
      setOfflineBusy(false);
    }
  };

  const openWrittenAttempt = async (attemptId: string) => {
    setWrittenBusy(true);
    try {
      const r = await getWrittenAttempt(examId, attemptId);
      if (!r.success || !r.data) throw new Error(r.message || 'Could not load attempt');
      setActiveWrittenAttempt(r.data as WrittenAttemptDetail);
      const nextMarks: Record<string, string> = {};
      for (const q of r.data.questions || []) {
        if (q.studentAnswer?.obtainedMarks != null) nextMarks[q.studentAnswer.id] = String(q.studentAnswer.obtainedMarks);
      }
      setMarksDraft(nextMarks);
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Could not load attempt', variant: 'destructive' });
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
    const r = await saveWrittenEvaluation({ attemptId, answerId, marksAwarded, teacherUserId });
    if (!r.success) {
      toast({ title: r.message || 'Mark save failed', variant: 'destructive' });
      return;
    }
    toast({ title: 'Mark saved' });
    await openWrittenAttempt(attemptId);
  };

  const finalizeWritten = async (attemptId: string) => {
    const r = await finalizeWrittenEvaluation(examId, attemptId);
    if (!r.success) {
      toast({ title: r.message || 'Finalize failed', variant: 'destructive' });
      return;
    }
    toast({ title: 'Evaluation finalized' });
    await load();
    await openWrittenAttempt(attemptId);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 print:max-w-none">
      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" asChild className="w-fit gap-1 text-slate-600">
          <Link href="/admin/exam">
            <ChevronLeft className="h-4 w-4" /> All exams
          </Link>
        </Button>
        <ExamEngineSubnav examId={examId} />
      </div>

      <div>
        <h1 className="font-serif text-2xl font-normal tracking-tight text-[#0D1B35] md:text-3xl">
          Results{exam ? ` — ${exam.title}` : ''}
        </h1>
        <p className="mt-1 text-sm text-slate-600">Aggregated performance from submitted attempts.</p>
      </div>

      {stats && stats.totalAttempts > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average</CardDescription>
              <CardTitle className="text-2xl text-[#0D1B35]">{stats.average}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Highest</CardDescription>
              <CardTitle className="text-2xl text-emerald-700">{stats.highest}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Lowest</CardDescription>
              <CardTitle className="text-2xl text-rose-700">{stats.lowest}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pass rate</CardDescription>
              <CardTitle className="text-2xl text-[#0D1B35]">{stats.passFail.passRate}%</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500">
              Pass {stats.passFail.pass} · Fail {stats.passFail.fail}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-slate-500">
            No analytics yet — students need to submit attempts first.
          </CardContent>
        </Card>
      )}

      {omrScanEnabled ? (
        <OmrScanReviewPanel
          examId={examId}
          branchId={selectedBranchId || null}
          onFinalized={() => void load()}
        />
      ) : null}

      {isOfflineResultFlow ? (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-[#0D1B35]">Offline result entry</CardTitle>
            <CardDescription>
              Teachers can input checked script marks one by one, paste bulk rows, or upload Excel. Rows enter the
              approval queue before students see results.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!exam?.branchId ? (
              <div className="max-w-sm space-y-2">
                <label className="text-xs font-semibold text-slate-600">Branch for this result batch</label>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                >
                  <option value="">Select branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-sm font-bold text-slate-900">Single result</p>
                <div className="mt-3 space-y-2">
                  <input
                    className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                    placeholder="Roll / registration / mobile"
                    value={singleRoll}
                    onChange={(e) => setSingleRoll(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="h-10 rounded-md border border-slate-200 px-3 text-sm"
                      placeholder="Marks"
                      type="number"
                      value={singleMarks}
                      onChange={(e) => setSingleMarks(e.target.value)}
                    />
                    <input
                      className="h-10 rounded-md border border-slate-200 px-3 text-sm"
                      placeholder="Total"
                      type="number"
                      value={singleTotal}
                      onChange={(e) => setSingleTotal(e.target.value)}
                    />
                  </div>
                  <Button type="button" size="sm" disabled={offlineBusy || (!selectedBranchId && !exam?.branchId)} onClick={() => void submitSingleOffline()}>
                    Queue single result
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-sm font-bold text-slate-900">Bulk manual rows</p>
                <p className="mt-1 text-[11px] text-slate-500">One row each: roll, marks, total, comments</p>
                <textarea
                  className="mt-3 h-32 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  placeholder={'REG-001, 82, 100, Good\nREG-002, 74, 100'}
                  value={bulkRows}
                  onChange={(e) => setBulkRows(e.target.value)}
                />
                <Button type="button" size="sm" disabled={offlineBusy || (!selectedBranchId && !exam?.branchId)} onClick={() => void submitBulkOffline()}>
                  Validate & queue bulk
                </Button>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-sm font-bold text-slate-900">Excel import</p>
                <p className="mt-1 text-[11px] text-slate-500">Columns: roll, name, marks, total, comments</p>
                <input
                  className="mt-3 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setExcelFile(e.target.files?.[0] ?? null)}
                />
                <Button className="mt-3" type="button" size="sm" disabled={offlineBusy || !excelFile || (!selectedBranchId && !exam?.branchId)} onClick={() => void submitExcelOffline()}>
                  Upload Excel
                </Button>
              </div>
            </div>

            {offlineErrors.length ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-bold text-amber-900">Validation warnings</p>
                <div className="mt-2 max-h-36 overflow-auto text-xs text-amber-900">
                  {offlineErrors.slice(0, 20).map((e, i) => (
                    <p key={i}>{JSON.stringify(e)}</p>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Input mode</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded by</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultBatches.length ? resultBatches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.inputMode}</TableCell>
                      <TableCell>{b.totalRecords}</TableCell>
                      <TableCell>{b.approvalStatus}</TableCell>
                      <TableCell>{b.uploaderUser?.fullName ?? '—'}</TableCell>
                      <TableCell>{new Date(b.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                        No result batches queued yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isWrittenEvalFlow ? (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-[#0D1B35]">Written evaluation</CardTitle>
            <CardDescription>Review uploaded handwritten pages, enter marks, then finalize the attempt score.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <div className="space-y-2">
              {writtenAttempts.length ? writtenAttempts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-violet-200 hover:bg-violet-50/30"
                  onClick={() => void openWrittenAttempt(a.id)}
                >
                  <p className="text-sm font-bold text-slate-900">{a.student?.fullName ?? 'Student'}</p>
                  <p className="text-xs text-slate-500">{a.evaluationStatus} · {a.totalAwarded ?? 0} marks</p>
                </button>
              )) : (
                <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
                  No written submissions yet.
                </p>
              )}
            </div>

            <div className="min-h-48 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              {writtenBusy ? (
                <div className="flex justify-center py-12 text-slate-500"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : activeWrittenAttempt ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-slate-900">{activeWrittenAttempt.student?.fullName}</p>
                      <p className="text-xs text-slate-500">{activeWrittenAttempt.exam?.title}</p>
                    </div>
                    <Button size="sm" onClick={() => void finalizeWritten(activeWrittenAttempt.attempt.id)}>
                      Finalize evaluation
                    </Button>
                  </div>
                  {(activeWrittenAttempt.questions || []).map((q, index) => {
                    const ans = q.studentAnswer;
                    const pages = ans?.writtenSubmission?.pages || [];
                    const finalPdfUrl = ans?.writtenSubmission?.finalPdfUrl;
                    return (
                      <div key={q.questionId} className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Question {index + 1} · {Number(q.marks)} marks</p>
                            <div className="prose prose-sm mt-2 max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: q.question?.prompt ?? '' }} />
                          </div>
                          {ans?.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                className="h-9 w-24 rounded-md border border-slate-200 px-2 text-sm"
                                type="number"
                                step="0.25"
                                placeholder="Marks"
                                value={marksDraft[ans.id] ?? ''}
                                onChange={(e) => setMarksDraft((prev) => ({ ...prev, [ans.id]: e.target.value }))}
                              />
                              <Button size="sm" variant="outline" onClick={() => void saveWrittenMark(ans.id, activeWrittenAttempt.attempt.id)}>
                                Save
                              </Button>
                            </div>
                          ) : null}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {finalPdfUrl ? (
                            <a className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700" href={getExamPdfDownloadUrl(finalPdfUrl)} target="_blank" rel="noopener noreferrer">
                              Combined PDF
                            </a>
                          ) : null}
                          {pages.map((p, pageIndex) => (
                            <a key={p.url} className="rounded-md bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700" href={getExamPdfDownloadUrl(p.url)} target="_blank" rel="noopener noreferrer">
                              Page {pageIndex + 1}
                            </a>
                          ))}
                          {!pages.length && !finalPdfUrl ? (
                            <span className="text-xs font-medium text-amber-700">No handwritten pages uploaded.</span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-slate-500">Select a submission to evaluate.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {stats && stats.scoreDistribution?.length ? (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-[#0D1B35]">Score distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {stats.scoreDistribution.map((b) => (
              <div
                key={b.range}
                className="min-w-[100px] flex-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-center"
              >
                <div className="text-xs text-slate-500">{b.range}</div>
                <div className="text-lg font-semibold text-[#0D1B35]">{b.count}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {stats && stats.perQuestionAccuracy?.length ? (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-[#0D1B35]">Question accuracy</CardTitle>
            <CardDescription>How often each question was answered correctly.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Snippet</TableHead>
                  <TableHead className="text-right">Accuracy</TableHead>
                  <TableHead className="text-right">Correct / total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.perQuestionAccuracy.map((q) => (
                  <TableRow key={q.questionId}>
                    <TableCell>{q.type}</TableCell>
                    <TableCell className="max-w-md truncate text-slate-600">{q.text || q.questionId}</TableCell>
                    <TableCell className="text-right font-medium">{q.accuracy}%</TableCell>
                    <TableCell className="text-right text-slate-600">
                      {q.correctCount} / {q.totalAnswered}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Card id="merit-print" className="border-slate-200 shadow-sm scroll-mt-24">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="font-serif text-lg text-[#0D1B35]">Merit list (combined)</CardTitle>
            <CardDescription>Online attempts and approved offline results · printable.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" className="print:hidden" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" />
            Print
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {meritRows.length === 0 ? (
            <p className="text-center text-sm text-slate-500">No merit rows yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Roll</TableHead>
                  <TableHead className="text-right">Marks</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meritRows.map((row, i) => (
                  <TableRow key={String(row.studentUserId ?? i)}>
                    <TableCell>{String(row.rank ?? i + 1)}</TableCell>
                    <TableCell>{String(row.fullName ?? '—')}</TableCell>
                    <TableCell className="text-slate-600">{String(row.rollNo ?? '—')}</TableCell>
                    <TableCell className="text-right">
                      {String(row.marks ?? '—')} / {String(row.totalMarks ?? '—')}
                    </TableCell>
                    <TableCell className="text-right">{String(row.percentage ?? '—')}</TableCell>
                    <TableCell className="text-slate-600">{String(row.source ?? '—')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
