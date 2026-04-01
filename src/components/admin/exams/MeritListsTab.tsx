'use client';

import { useCallback, useEffect, useState } from 'react';
import { getExamMeritListAll, getExamMeritListOffline, getExamMeritListOnline } from '@/lib/api/exams';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type Row = Record<string, unknown>;

export function MeritListsTab({ examId }: { examId: string }) {
  const [tab, setTab] = useState('online');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res =
        tab === 'online'
          ? await getExamMeritListOnline(examId)
          : tab === 'offline'
            ? await getExamMeritListOffline(examId)
            : await getExamMeritListAll(examId);
      if (res.success && res.data?.rows) setRows(res.data.rows);
      else {
        setRows([]);
        setErr(res.message || 'Could not load merit list');
      }
    } catch (e: unknown) {
      setRows([]);
      setErr(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [examId, tab]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 via-white to-indigo-50/40 p-5 shadow-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-violet-100">
          <Sparkles className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Merit lists</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Online ranks use submitted attempts. Offline uses centrally approved batch results. Combined picks the best
            percentage per student.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="h-11 w-full justify-start gap-1 rounded-xl bg-slate-100/80 p-1 sm:w-auto">
          <TabsTrigger
            value="online"
            className="rounded-lg px-4 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Online
          </TabsTrigger>
          <TabsTrigger
            value="offline"
            className="rounded-lg px-4 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Offline
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="rounded-lg px-4 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Combined
          </TabsTrigger>
        </TabsList>

        {(['online', 'offline', 'all'] as const).map((k) => (
          <TabsContent key={k} value={k} className="mt-4 outline-none">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-9 w-9 animate-spin text-violet-600" />
              </div>
            ) : err ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{err}</p>
            ) : rows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
                No rows for this view yet.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
                <div className="max-h-[min(60vh,520px)] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-[1] bg-slate-50 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <tr className="border-b border-slate-100">
                        <th className="px-4 py-3">Rank</th>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Roll</th>
                        <th className="px-4 py-3 text-right">%</th>
                        <th className="px-4 py-3 text-right">Marks</th>
                        {k === 'all' ? <th className="px-4 py-3">Source</th> : null}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((r, i) => (
                        <tr key={`${r.studentUserId}-${i}`} className="bg-white hover:bg-slate-50/80">
                          <td className="px-4 py-2.5 font-black text-violet-700 tabular-nums">{String(r.rank ?? '')}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-800">{String(r.fullName ?? '')}</td>
                          <td className="px-4 py-2.5 text-slate-600">{String(r.rollNo ?? '—')}</td>
                          <td className="px-4 py-2.5 text-right font-bold tabular-nums text-slate-900">
                            {r.percentage != null ? Number(r.percentage).toFixed(1) : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                            {r.marks != null ? String(r.marks) : '—'} / {r.totalMarks != null ? String(r.totalMarks) : '—'}
                          </td>
                          {k === 'all' ? (
                            <td className="px-4 py-2.5">
                              <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                                {Array.isArray(r.sources) ? r.sources.join(' + ') : '—'}
                              </span>
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
