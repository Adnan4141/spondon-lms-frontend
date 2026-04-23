'use client';

/**
 * Exam leaderboard tab.
 *
 * Top 3 podium + full shadcn Table rankings + view toggles (Merit / Course /
 * Percentile). Uses GET /api/exams/:id/leaderboard.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Crown, Medal, Trophy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getExamLeaderboard } from '@/lib/api/exams';
import type { Exam, ExamLeaderboardRow } from '@/types/exam';

type ViewMode = 'merit' | 'course' | 'percentile';

export function LeaderboardTab({ exam }: { exam: Exam }) {
  const [rows, setRows] = useState<ExamLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('merit');

  const load = useCallback(async () => {
    setLoading(true);
    const opts =
      view === 'course' && exam.courseId
        ? { courseId: exam.courseId }
        : { global: true };
    const res = await getExamLeaderboard(exam.id, opts);
    if (res.success && res.data) setRows(res.data.rows);
    setLoading(false);
  }, [exam.id, exam.courseId, view]);

  useEffect(() => {
    load();
  }, [load]);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  const totalAttempted = rows.length;
  const averageScore = useMemo(() => {
    if (rows.length === 0) return 0;
    const valid = rows.filter((r) => r.obtainedMarks != null);
    if (valid.length === 0) return 0;
    return Math.round(
      (valid.reduce((s, r) => s + (r.obtainedMarks ?? 0), 0) / valid.length) * 100,
    ) / 100;
  }, [rows]);

  return (
    <div className="space-y-5">
      {/* View toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-md border bg-background p-1">
          {(['merit', 'course', 'percentile'] as ViewMode[]).map((v) => (
            <Button
              key={v}
              size="sm"
              variant={view === v ? 'default' : 'ghost'}
              onClick={() => setView(v)}
              className="capitalize"
            >
              {v === 'merit' ? 'All (merit)' : v === 'course' ? 'Course' : 'Percentile'}
            </Button>
          ))}
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>Total: {totalAttempted}</span>
          <span>Average: {averageScore}</span>
        </div>
      </div>

      {/* Podium */}
      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading leaderboard…
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No submissions yet.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { rank: 2, row: top3[1], color: '#C0C0C0', Icon: Medal },
              { rank: 1, row: top3[0], color: '#FFD700', Icon: Crown },
              { rank: 3, row: top3[2], color: '#CD7F32', Icon: Trophy },
            ].map(({ rank, row, color, Icon }) => (
              <PodiumCard
                key={rank}
                rank={rank}
                row={row}
                color={color}
                Icon={Icon}
                view={view}
              />
            ))}
          </div>

          {/* Full table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Full rankings</CardTitle>
              <CardDescription className="text-xs">
                {view === 'course' ? 'Scoped to this course' : 'Global merit'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-36">Reg. no.</TableHead>
                    <TableHead className="w-28 text-right">Score</TableHead>
                    {view === 'percentile' && (
                      <TableHead className="w-28 text-right">Percentile</TableHead>
                    )}
                    <TableHead className="w-36 text-right">Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rest.map((r) => (
                    <TableRow key={r.studentUserId}>
                      <TableCell>
                        <Badge variant="outline" className="tabular-nums">
                          #{r.rank}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{r.fullName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.registrationNumber ?? '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.obtainedMarks ?? '—'}
                        {r.totalMarks ? (
                          <span className="text-muted-foreground"> / {r.totalMarks}</span>
                        ) : null}
                      </TableCell>
                      {view === 'percentile' && (
                        <TableCell className="text-right tabular-nums">
                          {r.percentile != null ? `${r.percentile.toFixed(1)}%` : '—'}
                        </TableCell>
                      )}
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {r.submittedAt
                          ? new Date(r.submittedAt).toLocaleString()
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function PodiumCard({
  rank,
  row,
  color,
  Icon,
  view,
}: {
  rank: number;
  row?: ExamLeaderboardRow;
  color: string;
  Icon: React.ComponentType<{ className?: string }>;
  view: ViewMode;
}) {
  if (!row) {
    return (
      <Card className="opacity-60">
        <CardContent className="flex flex-col items-center gap-2 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
            #{rank}
          </div>
          <p className="text-sm text-muted-foreground">—</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card style={{ borderColor: color }} className="border-2">
      <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: color }}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <Badge variant="outline" className="tabular-nums">
          #{row.rank}
        </Badge>
        <p className="truncate text-sm font-semibold">{row.fullName}</p>
        <p className="text-[11px] text-muted-foreground">
          {row.registrationNumber ?? '—'}
        </p>
        <p className="text-lg font-bold tabular-nums">
          {row.obtainedMarks ?? '—'}
          {row.totalMarks ? (
            <span className="text-sm font-normal text-muted-foreground">
              {' '}
              / {row.totalMarks}
            </span>
          ) : null}
        </p>
        {view === 'percentile' && row.percentile != null && (
          <Badge variant="secondary">{row.percentile.toFixed(1)}%</Badge>
        )}
      </CardContent>
    </Card>
  );
}
