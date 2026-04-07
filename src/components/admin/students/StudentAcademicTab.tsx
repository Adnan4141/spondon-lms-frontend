'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentResults, getAcademicRecordSummary } from '@/lib/api/student-portal';
import type { OnlineExamAttempt, OfflineExamResult, OfficialExamResult } from '@/types/academic';
import { AcademicRecordsExplorer } from '@/components/admin/academic-records/AcademicRecordsExplorer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import {
  Loader2,
  TrendingUp,
  Trophy,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentAcademicTabProps {
  studentId: string;
  enrollmentCourses?: { id: string; name: string }[];
}

type SummaryRow = {
  courseId: string;
  course: { id: string; name: string; code: string } | null;
  totalExams: number;
  avgPercentage: number;
  bestPercentage: number;
  worstPercentage: number;
  source: string;
};

// Custom tooltip for the trend chart
function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl text-sm">
      <p className="font-black text-slate-700 truncate max-w-45">{label}</p>
      <p className="mt-1 font-black text-indigo-600">{Number(payload[0]?.value ?? 0).toFixed(1)}%</p>
    </div>
  );
}

export function StudentAcademicTab({ studentId, enrollmentCourses }: StudentAcademicTabProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineAttempts, setOnlineAttempts] = useState<OnlineExamAttempt[]>([]);
  const [offlineResults, setOfflineResults] = useState<OfflineExamResult[]>([]);
  const [officialResults, setOfficialResults] = useState<OfficialExamResult[]>([]);
  const [summaries, setSummaries] = useState<SummaryRow[]>([]);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const [resultsRes, summaryRes] = await Promise.all([
        getStudentResults(studentId),
        getAcademicRecordSummary(studentId),
      ]);
      if (resultsRes.success && resultsRes.data) {
        setOnlineAttempts(resultsRes.data.onlineAttempts ?? []);
        setOfflineResults(resultsRes.data.offlineResults ?? []);
        setOfficialResults(resultsRes.data.officialExamResults ?? []);
      }
      if (summaryRes.success && summaryRes.data) {
        setSummaries((summaryRes.data.computedSummaries as SummaryRow[]) ?? []);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load academic data');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  // Compute aggregate stats from online attempts + official results
  const stats = useMemo(() => {
    const allPcts: number[] = [];

    for (const a of onlineAttempts) {
      if (a.obtainedMarks != null && a.totalMarks && Number(a.totalMarks) > 0) {
        allPcts.push((Number(a.obtainedMarks) / Number(a.totalMarks)) * 100);
      }
    }
    for (const r of officialResults) {
      if (r.percentage != null) allPcts.push(Number(r.percentage));
    }
    // Merge from course summaries if no direct attempts
    if (allPcts.length === 0 && summaries.length > 0) {
      for (const s of summaries) {
        if (s.avgPercentage) allPcts.push(s.avgPercentage);
      }
    }

    const totalExams = onlineAttempts.length + officialResults.length;
    const avgPct = allPcts.length > 0 ? allPcts.reduce((a, b) => a + b, 0) / allPcts.length : null;
    const bestPct = allPcts.length > 0 ? Math.max(...allPcts) : null;
    const isAtRisk = avgPct !== null && avgPct < 40;

    return { totalExams, avgPct, bestPct, isAtRisk, allPcts };
  }, [onlineAttempts, officialResults, summaries]);

  // Build trend data from online attempts (sorted by date)
  const trendData = useMemo(() => {
    return onlineAttempts
      .filter(
        (a) => a.submittedAt && a.obtainedMarks != null && a.totalMarks && Number(a.totalMarks) > 0,
      )
      .sort((a, b) => new Date(a.submittedAt!).getTime() - new Date(b.submittedAt!).getTime())
      .map((a) => ({
        name:
          (a.exam?.title ?? a.examId).length > 20
            ? (a.exam?.title ?? a.examId).slice(0, 18) + '…'
            : (a.exam?.title ?? a.examId),
        pct: Math.round(((Number(a.obtainedMarks) / Number(a.totalMarks)) * 100) * 10) / 10,
      }));
  }, [onlineAttempts]);

  // Merit positions from offline results
  const meritPositions = useMemo(
    () => offlineResults.filter((r) => r.meritPosition != null),
    [offlineResults],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Academic Records</h3>
          <p className="mt-0.5 text-base font-black text-indigo-600">পারফরম্যান্স সারসংক্ষেপ</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 gap-2 rounded-xl border-indigo-200 bg-indigo-50 text-xs font-black text-indigo-700 hover:bg-indigo-100"
          onClick={() => router.push(`/admin/academic-records?studentId=${studentId}`)}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Full Report
        </Button>
      </div>

      {/* At-risk banner */}
      {stats.isAtRisk && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-black text-amber-900">At-risk student</p>
            <p className="mt-0.5 text-xs font-semibold text-amber-800">
              Average score is{' '}
              <span className="font-black">{stats.avgPct !== null ? stats.avgPct.toFixed(1) : '—'}%</span> — below
              the 40% passing threshold. Consider intervention.
            </p>
          </div>
        </div>
      )}

      {/* Stat cards (bento) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Total Exams',
            value: stats.totalExams || '—',
            icon: BookOpen,
            tone: 'indigo',
          },
          {
            label: 'Average %',
            value: stats.avgPct !== null ? `${stats.avgPct.toFixed(1)}%` : '—',
            icon: Activity,
            tone: stats.isAtRisk ? 'amber' : 'emerald',
          },
          {
            label: 'Best Score',
            value: stats.bestPct !== null ? `${stats.bestPct.toFixed(1)}%` : '—',
            icon: Trophy,
            tone: 'violet',
          },
          {
            label: 'Status',
            value: stats.avgPct === null ? 'No data' : stats.isAtRisk ? 'At risk' : 'On track',
            icon: stats.isAtRisk ? AlertTriangle : CheckCircle2,
            tone: stats.isAtRisk ? 'rose' : 'emerald',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 transition hover:border-slate-200 hover:bg-white"
          >
            <stat.icon
              className={cn(
                'mb-3 h-5 w-5',
                stat.tone === 'indigo' && 'text-indigo-600',
                stat.tone === 'violet' && 'text-violet-600',
                stat.tone === 'emerald' && 'text-emerald-600',
                stat.tone === 'rose' && 'text-rose-600',
                stat.tone === 'amber' && 'text-amber-600',
              )}
            />
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className="mt-1 text-lg font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Trend line chart */}
      {trendData.length >= 2 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <TrendingUp className="h-3.5 w-3.5" />
            Exam score trend
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<TrendTooltip />} />
              <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
              <Line
                type="monotone"
                dataKey="pct"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#4f46e5', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-2 text-[10px] font-semibold text-slate-400">
            <span className="inline-block h-0.5 w-6 align-middle bg-amber-400 mr-1 rounded" />
            40% passing threshold
          </p>
        </div>
      ) : null}

      {/* Merit positions table (from offline results) */}
      {meritPositions.length > 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Merit positions</span>
          </div>
          <div className="divide-y divide-slate-50">
            {meritPositions.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-700">{r.examId}</p>
                  {r.subject && (
                    <p className="text-[10px] font-semibold text-slate-400">{r.subject}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-black text-indigo-600">Roll {r.rollNo}</span>
                  <Badge
                    variant="outline"
                    className="rounded-lg border-amber-200 bg-amber-50 text-[10px] font-black text-amber-800"
                  >
                    #{r.meritPosition}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Course performance explorer */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <BarChart3 className="h-3.5 w-3.5" />
          Course performance explorer
        </div>
        <AcademicRecordsExplorer
          studentUserId={studentId}
          enrollmentCourses={enrollmentCourses}
        />
      </div>

      {/* Footer link */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-2 rounded-xl text-xs font-black text-indigo-600 hover:bg-indigo-50"
          onClick={() => router.push(`/admin/academic-records?studentId=${studentId}`)}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open full analysis page
        </Button>
      </div>
    </div>
  );
}
