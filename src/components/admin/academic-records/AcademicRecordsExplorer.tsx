'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAcademicRecordSummary } from '@/lib/api/student-portal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Filter, Layers, TrendingUp } from 'lucide-react';
type SummaryRow = {
  courseId: string;
  course: { id: string; name: string; code: string } | null;
  totalExams: number;
  avgPercentage: number;
  bestPercentage: number;
  worstPercentage: number;
  source: string;
};

interface AcademicRecordsExplorerProps {
  studentUserId: string;
  /** Optional course ids/names from enrollments when summaries are still empty */
  enrollmentCourses?: { id: string; name: string }[];
}

export function AcademicRecordsExplorer({ studentUserId, enrollmentCourses }: AcademicRecordsExplorerProps) {
  const [courseFilter, setCourseFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<SummaryRow[]>([]);
  const [storedRecords, setStoredRecords] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!studentUserId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await getAcademicRecordSummary(
        studentUserId,
        courseFilter || undefined,
      );
      if (res.success && res.data) {
        setSummaries((res.data.computedSummaries as SummaryRow[]) ?? []);
        setStoredRecords((res.data.records as any[]) ?? []);
      } else {
        setSummaries([]);
        setStoredRecords([]);
        setErr(res.message || 'Could not load explorer data');
      }
    } catch (e: unknown) {
      setSummaries([]);
      setStoredRecords([]);
      setErr(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [studentUserId, courseFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const courseOptionsFromSummaries = summaries.map((s) => ({
    id: s.courseId,
    label: s.course?.name ?? s.courseId,
  }));
  const enrollmentOpts = (enrollmentCourses ?? []).filter(
    (e) => !courseOptionsFromSummaries.some((c) => c.id === e.id),
  );
  const courseOptions = [...courseOptionsFromSummaries, ...enrollmentOpts.map((e) => ({ id: e.id, label: e.name }))];

  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/30">
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 px-8 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Explorer</h2>
          <p className="mt-0.5 text-base font-bold text-indigo-600">Course performance & stored records</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <Select value={courseFilter || '__all__'} onValueChange={(v) => setCourseFilter(v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-11 w-[220px] rounded-2xl border-slate-200 bg-white font-semibold">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All courses</SelectItem>
              {courseOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          </div>
        ) : err ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{err}</p>
        ) : (
          <div className="space-y-10">
            {summaries.length === 0 ? (
              <p className="text-center text-sm font-medium text-slate-400">
                No computed summaries yet (no submitted online attempts or approved official results for this scope).
              </p>
            ) : (
              <div>
                <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Per-course summary
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {summaries.map((s) => (
                    <div
                      key={s.courseId}
                      className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/80 p-5 shadow-sm ring-1 ring-slate-100/80"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900">{s.course?.name ?? s.courseId}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {s.totalExams} exams · {s.source}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 border-indigo-200 bg-indigo-50 text-[10px] font-black text-indigo-800">
                          Avg {s.avgPercentage}%
                        </Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-xl bg-emerald-50/80 py-2">
                          <p className="text-[9px] font-black uppercase text-emerald-700">Best</p>
                          <p className="text-lg font-black text-emerald-900">{s.bestPercentage}%</p>
                        </div>
                        <div className="rounded-xl bg-amber-50/80 py-2">
                          <p className="text-[9px] font-black uppercase text-amber-800">Low</p>
                          <p className="text-lg font-black text-amber-950">{s.worstPercentage}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {storedRecords.length > 0 ? (
              <div>
                <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Layers className="h-3.5 w-3.5" />
                  Stored academic records (Prisma)
                </div>
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Course</th>
                        <th className="px-4 py-3">Branch</th>
                        <th className="px-4 py-3 text-right">Avg %</th>
                        <th className="px-4 py-3 text-right">Exams</th>
                        <th className="px-4 py-3 text-right">Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {storedRecords.map((r: any) => (
                        <tr key={r.id} className="bg-white hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {r.course?.name ?? r.courseId ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{r.branch?.name ?? r.branchId ?? '—'}</td>
                          <td className="px-4 py-3 text-right font-black tabular-nums text-indigo-700">
                            {r.avgPercentage != null ? Number(r.avgPercentage).toFixed(1) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600">{r.totalExams ?? '—'}</td>
                          <td className="px-4 py-3 text-right text-xs text-slate-400">
                            {r.lastUpdated ? new Date(r.lastUpdated).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
