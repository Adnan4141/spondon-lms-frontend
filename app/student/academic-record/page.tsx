'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAcademicRecordSummary } from '@/lib/api/student-portal';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, ScrollText, TrendingUp } from 'lucide-react';

export default function StudentAcademicRecordPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<
    Array<{
      courseId: string;
      course: { id: string; name: string; code: string } | null;
      totalExams: number;
      avgPercentage: number;
      bestPercentage: number;
      worstPercentage: number;
    }>
  >([]);
  const [records, setRecords] = useState<unknown[]>([]);

  useEffect(() => {
    const run = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setErr('লগইন করুন');
        setLoading(false);
        return;
      }
      try {
        const user = JSON.parse(userStr);
        const res = await getAcademicRecordSummary(user.id);
        if (res.success && res.data) {
          setSummaries(res.data.computedSummaries ?? []);
          setRecords(res.data.records ?? []);
        } else if (!res.success) {
          setErr(res.message || 'ডেটা লোড করা যায়নি');
        }
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'লোড ব্যর্থ');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-black text-slate-900">একাডেমিক রেকর্ড</h1>
        <Card className="rounded-2xl border-rose-200 bg-rose-50">
          <CardContent className="flex items-center gap-4 p-8">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <p className="font-bold text-rose-800">{err}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-slate-900">একাডেমিক রেকর্ড</h1>
        <p className="mt-2 font-medium text-slate-500">
          অনলাইন পরীক্ষা, লিংক করা কোর্সের পরীক্ষা ও কেন্দ্রীয়ভাবে অনুমোদিত ফল থেকে কোর্সভিত্তিক সারাংশ
        </p>
      </div>

      {summaries.length === 0 && records.length === 0 ? (
        <Card className="rounded-[2rem] border-dashed border-slate-200 bg-slate-50/80">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <ScrollText className="mb-4 h-14 w-14 text-slate-300" />
            <p className="text-lg font-bold text-slate-600">এখনও কোনো ডেটা নেই</p>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              অনলাইন পরীক্ষা দিন বা অফিসিয়াল ফল প্রকাশিত হলে এখানে গড় ও সেরা ফল দেখা যাবে।
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/student/exams"
                className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg hover:bg-indigo-700"
              >
                পরীক্ষা দেখুন
              </Link>
              <Link
                href="/student/results"
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                ফলাফল পেজ
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {summaries.length > 0 ? (
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
                কোর্স অনুযায়ী
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {summaries.map((s) => (
                  <Card
                    key={s.courseId}
                    className="overflow-hidden rounded-2xl border-slate-100 shadow-sm"
                  >
                    <CardContent className="p-6">
                      <h3 className="text-lg font-black text-slate-900">
                        {s.course?.name ?? s.courseId}
                      </h3>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {s.totalExams} টি পরীক্ষা
                      </p>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-slate-50 py-3">
                          <p className="text-[10px] font-bold text-slate-400">গড়</p>
                          <p className="text-lg font-black text-indigo-600">{s.avgPercentage}%</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 py-3">
                          <p className="text-[10px] font-bold text-emerald-600">সেরা</p>
                          <p className="text-lg font-black text-emerald-800">{s.bestPercentage}%</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 py-3">
                          <p className="text-[10px] font-bold text-amber-700">সর্বনিম্ন</p>
                          <p className="text-lg font-black text-amber-900">{s.worstPercentage}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {records.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-xl font-black text-slate-900">সংরক্ষিত রেকর্ড</h2>
              <ul className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
                {records.map((r: any, i: number) => (
                  <li key={r.id ?? i} className="border-b border-slate-100 py-3 last:border-0">
                    <p className="font-bold text-slate-800">{r.recordType ?? 'Record'}</p>
                    {r.course && <p className="text-sm text-slate-500">{r.course.name}</p>}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
