'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getExamLeaderboard, type ExamLeaderboardPayload } from '@/lib/api/exams';
import { useExamWorkspace } from './layout/ExamWorkspaceShell';
import { ExamWorkspacePageHeader } from './layout/ExamWorkspacePageHeader';
import { examWorkspacePageClass } from './layout/examWorkspaceUi';
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
  const { exam, loadingExam } = useExamWorkspace();
  const [payload, setPayload] = useState<ExamLeaderboardPayload | null>(null);
  const [loadingLb, setLoadingLb] = useState(true);

  const load = useCallback(async () => {
    setLoadingLb(true);
    const lb = await getExamLeaderboard(examId);
    if (lb.success && lb.data) setPayload(lb.data);
    setLoadingLb(false);
  }, [examId]);

  useEffect(() => {
    if (!loadingExam && exam) void load();
    if (!loadingExam && !exam) setLoadingLb(false);
  }, [loadingExam, exam, load]);

  if (loadingExam || loadingLb) {
    return (
      <div className="flex justify-center py-16 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const rows = payload?.rows ?? [];
  const showPercentileCol = rows.some((r) => r.percentile != null);

  if (!exam) {
    return <p className="py-12 text-center text-sm text-slate-600">Exam not found.</p>;
  }

  return (
    <div className={examWorkspacePageClass}>
      <ExamWorkspacePageHeader
        title="Leaderboard"
        description={`Submitted attempts only · ${payload?.count ?? 0} row${payload?.count === 1 ? '' : 's'}`}
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-[#0D1B35]">Rankings</CardTitle>
          <CardDescription>
            {exam?.showPercentile ? 'Includes approximate percentile.' : 'Percentiles hidden for this exam.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full max-w-full overflow-x-auto p-0 sm:p-6">
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
