'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ExamResultsStats } from './types';

export function AnalyticsTab({ stats }: { stats: ExamResultsStats }) {
  if (!stats || stats.totalAttempts <= 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-500">
          No analytics yet. Publish online attempts or approve offline result batches first.
        </CardContent>
      </Card>
    );
  }

  const sourceLabel =
    stats.dataSource === 'offline'
      ? 'Based on centrally approved offline result batches.'
      : 'Based on submitted online exam attempts.';

  return (
    <div className="space-y-5">
      {stats.dataSource ? (
        <p className="text-xs font-medium text-slate-500">{sourceLabel}</p>
      ) : null}
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

      {stats.scoreDistribution?.length ? (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg text-[#0D1B35]">Score distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {stats.scoreDistribution.map((bucket) => (
              <div
                key={bucket.range}
                className="min-w-[100px] flex-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-center"
              >
                <div className="text-xs text-slate-500">{bucket.range}</div>
                <div className="text-lg font-semibold text-[#0D1B35]">{bucket.count}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {stats.perQuestionAccuracy?.length ? (
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
                {stats.perQuestionAccuracy.map((question) => (
                  <TableRow key={question.questionId}>
                    <TableCell>{question.type}</TableCell>
                    <TableCell className="max-w-md truncate text-slate-600">{question.text || question.questionId}</TableCell>
                    <TableCell className="text-right font-medium">{question.accuracy}%</TableCell>
                    <TableCell className="text-right text-slate-600">
                      {question.correctCount} / {question.totalAnswered}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
