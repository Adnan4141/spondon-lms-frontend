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
import { getExamById, getExamAnalytics, getExamMeritListAll, type ExamAnalytics } from '@/lib/api/exams';
import type { Exam } from '@/types/exam';
import { ExamEngineSubnav } from './components/ExamEngineSubnav';

type MeritRow = Record<string, unknown>;

export function ExamResultsPage({ examId }: { examId: string }) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [analytics, setAnalytics] = useState<ExamAnalytics | null>(null);
  const [meritRows, setMeritRows] = useState<MeritRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ex, an, merit] = await Promise.all([
        getExamById(examId),
        getExamAnalytics(examId),
        getExamMeritListAll(examId),
      ]);
      if (ex.success && ex.data) setExam(ex.data);
      if (an.success && an.data) setAnalytics(an.data);
      if (merit.success && merit.data?.rows) setMeritRows(merit.data.rows as MeritRow[]);
      else setMeritRows([]);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const stats = analytics;

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
