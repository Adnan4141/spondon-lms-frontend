'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getAcademicRecordSummary } from '@/lib/api/student-portal';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, ScrollText, TrendingUp, Award, BookOpen, BarChart3, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseSummary {
  courseId: string;
  course: { id: string; name: string; slug?: string } | null;
  totalExams: number;
  avgPercentage: number;
  bestPercentage: number;
  worstPercentage: number;
  source?: string;
}

interface AcademicRecord {
  id: string;
  recordType: string;
  score?: number | null;
  grade?: string | null;
  remarks?: string | null;
  courseId?: string | null;
  examId?: string | null;
  createdAt: string;
  course?: { id: string; name: string; slug?: string } | null;
}

export default function StudentAcademicRecordPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<CourseSummary[]>([]);
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [courseFilter, setCourseFilter] = useState<string>('all');

  useEffect(() => {
    const run = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setErr('Please log in');
        setLoading(false);
        return;
      }
      try {
        const user = JSON.parse(userStr);
        const res = await getAcademicRecordSummary(user.id);
        if (res.success && res.data) {
          setSummaries((res.data.computedSummaries ?? []) as CourseSummary[]);
          setRecords((res.data.records ?? []) as AcademicRecord[]);
        } else if (!res.success) {
          setErr(res.message || 'Could not load data');
        }
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'Load failed');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const overallStats = useMemo(() => {
    if (summaries.length === 0) return null;
    const totalExams = summaries.reduce((a, s) => a + s.totalExams, 0);
    const weightedAvg = summaries.reduce((a, s) => a + s.avgPercentage * s.totalExams, 0) / (totalExams || 1);
    const best = summaries.reduce((b, s) => (s.bestPercentage > b.bestPercentage ? s : b), summaries[0]);
    return { totalExams, avg: weightedAvg.toFixed(1), bestCourse: best.course?.name ?? best.courseId, bestPct: best.bestPercentage };
  }, [summaries]);

  const filteredSummaries = useMemo(() => {
    if (courseFilter === 'all') return summaries;
    return summaries.filter(s => s.courseId === courseFilter);
  }, [summaries, courseFilter]);

  const filteredRecords = useMemo(() => {
    if (courseFilter === 'all') return records;
    return records.filter(r => r.courseId === courseFilter);
  }, [records, courseFilter]);

  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    summaries.forEach(s => { if (s.course) map.set(s.courseId, s.course.name); });
    records.forEach(r => { if (r.course && r.courseId) map.set(r.courseId, r.course.name); });
    return Array.from(map.entries());
  }, [summaries, records]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-slate-500 font-bold animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-black text-slate-900">Academic Record</h1>
        <Card className="rounded-2xl border-rose-200 bg-rose-50">
          <CardContent className="flex items-center gap-4 p-8">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <p className="font-bold text-rose-800">{err}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasData = summaries.length > 0 || records.length > 0;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900">Academic Record</h1>
        <p className="mt-2 font-medium text-slate-500">
          Course-wise summary from online exams, linked course exams, and centrally approved results
        </p>
      </div>

      {!hasData ? (
        <Card className="rounded-[2rem] border-dashed border-slate-200 bg-slate-50/80">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <ScrollText className="mb-4 h-14 w-14 text-slate-300" />
            <p className="text-lg font-bold text-slate-600">No data yet</p>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Take online exams or wait for official results to be published to see averages and best scores here.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/student/exams"
                className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg hover:bg-indigo-700"
              >
                View Exams
              </Link>
              <Link
                href="/student/results"
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                Results Page
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall stats banner */}
          {overallStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-indigo-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Total Exams</span>
                </div>
                <p className="text-3xl font-black text-slate-900 tabular-nums">{overallStats.totalExams}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Avg %</span>
                </div>
                <p className="text-3xl font-black text-slate-900 tabular-nums">{overallStats.avg}%</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-amber-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Best Result</span>
                </div>
                <p className="text-3xl font-black text-slate-900 tabular-nums">{overallStats.bestPct}%</p>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-violet-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-violet-600">Best Course</span>
                </div>
                <p className="text-lg font-black text-slate-900 truncate">{overallStats.bestCourse}</p>
              </div>
            </div>
          )}

          {/* Course filter */}
          {courseOptions.length > 1 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1">
                <button
                  type="button"
                  onClick={() => setCourseFilter('all')}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                    courseFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  All
                </button>
                {courseOptions.map(([id, name]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCourseFilter(id)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-bold transition-all truncate max-w-32',
                      courseFilter === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Course summaries */}
          {filteredSummaries.length > 0 && (
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
                By Course
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredSummaries.map((s) => (
                  <Card key={s.courseId} className="overflow-hidden rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-black text-slate-900">{s.course?.name ?? s.courseId}</h3>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {s.totalExams} exam{s.totalExams !== 1 ? 's' : ''}{s.source ? ` · ${s.source}` : ''}
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                          <span className="text-lg font-black text-indigo-600">{s.avgPercentage}%</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>Avg {s.avgPercentage}%</span>
                          <span>Best {s.bestPercentage}%</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
                            style={{ width: `${Math.min(100, s.avgPercentage)}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-slate-50 py-2.5">
                          <p className="text-[10px] font-bold text-slate-400">Avg</p>
                          <p className="text-base font-black text-indigo-600">{s.avgPercentage}%</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 py-2.5">
                          <p className="text-[10px] font-bold text-emerald-600">Best</p>
                          <p className="text-base font-black text-emerald-800">{s.bestPercentage}%</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 py-2.5">
                          <p className="text-[10px] font-bold text-amber-700">Lowest</p>
                          <p className="text-base font-black text-amber-900">{s.worstPercentage}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Records list */}
          {filteredRecords.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-black text-slate-900">Saved Records</h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="max-h-[60vh] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <tr className="border-b border-slate-100">
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Course</th>
                        <th className="px-4 py-3 text-right">Marks</th>
                        <th className="px-4 py-3">Grade</th>
                        <th className="px-4 py-3">Remarks</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map((r) => (
                        <tr key={r.id} className="bg-white hover:bg-slate-50/80">
                          <td className="px-4 py-3">
                            <span className={cn(
                              'inline-flex rounded-lg px-2 py-0.5 text-[10px] font-black uppercase',
                              r.recordType === 'ONLINE_EXAM' ? 'bg-indigo-50 text-indigo-700' :
                              r.recordType === 'OFFLINE_EXAM' ? 'bg-amber-50 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            )}>
                              {r.recordType.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{r.course?.name ?? '—'}</td>
                          <td className="px-4 py-3 text-right font-black tabular-nums text-slate-900">
                            {r.score != null ? Number(r.score) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {r.grade ? (
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-xs font-black text-violet-700">
                                {r.grade}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{r.remarks ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs tabular-nums">
                            {new Date(r.createdAt).toLocaleDateString('bn-BD')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
