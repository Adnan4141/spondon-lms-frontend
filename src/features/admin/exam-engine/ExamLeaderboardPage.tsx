'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
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
import { getExamById, getExamLeaderboard, type ExamLeaderboardPayload } from '@/lib/api/exams';
import type { Exam } from '@/types/exam';
import { ExamEngineSubnav } from './components/ExamEngineSubnav';

function formatTime(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

export function ExamLeaderboardPage({ examId }: { examId: string }) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [payload, setPayload] = useState<ExamLeaderboardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ex, lb] = await Promise.all([getExamById(examId), getExamLeaderboard(examId)]);
      if (ex.success && ex.data) setExam(ex.data);
      if (lb.success && lb.data) setPayload(lb.data);
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

  const rows = payload?.rows ?? [];
  const showPercentileCol = rows.some((r) => r.percentile != null);

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
        <h1 className="font-serif text-2xl font-normal tracking-tight text-[#0D1B35] md:text-3xl">
          Leaderboard{exam ? ` — ${exam.title}` : ''}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Submitted attempts only · {payload?.count ?? 0} row{payload?.count === 1 ? '' : 's'}
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-[#0D1B35]">Rankings</CardTitle>
          <CardDescription>
            {exam?.showPercentile ? 'Includes approximate percentile.' : 'Percentiles hidden for this exam.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 sm:p-6">
          {rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">No submitted attempts yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Reg. no.</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  {showPercentileCol ? <TableHead className="text-right">Pct.</TableHead> : null}
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={`${r.studentUserId}-${r.rank}`}>
                    <TableCell className="font-semibold">{r.rank}</TableCell>
                    <TableCell>{r.fullName}</TableCell>
                    <TableCell className="text-slate-600">{r.registrationNumber ?? '—'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {r.obtainedMarks ?? '—'}
                      {r.totalMarks != null ? ` / ${r.totalMarks}` : ''}
                    </TableCell>
                    {showPercentileCol ? (
                      <TableCell className="text-right text-slate-600">
                        {r.percentile != null ? `${r.percentile}%` : '—'}
                      </TableCell>
                    ) : null}
                    <TableCell className="text-slate-600">{formatTime(r.submittedAt)}</TableCell>
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
