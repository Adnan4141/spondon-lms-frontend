'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getExamStudentView, getExamLeaderboard } from '@/lib/api/exams';
import type { ExamLeaderboardRow } from '@/types/exam';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Trophy, ChevronLeft, AlertCircle } from 'lucide-react';

export default function StudentExamLeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [showLb, setShowLb] = useState(false);
  const [showPct, setShowPct] = useState(false);
  const [linkedNames, setLinkedNames] = useState<{ id: string; name: string }[]>([]);
  const [scope, setScope] = useState<string>('__all__');
  const [rows, setRows] = useState<ExamLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      setErr('লগইন প্রয়োজন');
      setLoading(false);
      return;
    }
    const user = JSON.parse(userStr);
    setUserId(user.id);
  }, []);

  useEffect(() => {
    if (!userId || !examId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const meta = await getExamStudentView(examId, userId);
        if (cancelled) return;
        if (!meta.success || !meta.data) {
          setErr(meta.message || 'পরীক্ষা খুঁজে পাওয়া যায়নি');
          return;
        }
        setTitle(meta.data.title);
        setShowLb(!!meta.data.showLeaderboard);
        setShowPct(!!meta.data.showPercentile || meta.data.examEngine === 'COMPETITIVE');
        const opts: { id: string; name: string }[] = [
          { id: meta.data.courseId, name: meta.data.course?.name ?? 'প্রাথমিক কোর্স' },
        ];
        const seen = new Set(opts.map((o) => o.id));
        for (const ec of meta.data.examCourses || []) {
          if (!seen.has(ec.courseId)) {
            seen.add(ec.courseId);
            opts.push({ id: ec.courseId, name: ec.course?.name ?? ec.courseId });
          }
        }
        setLinkedNames(opts);
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'লোড ব্যর্থ');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, examId]);

  useEffect(() => {
    if (!showLb || !examId) return;
    let cancelled = false;
    (async () => {
      try {
        const res =
          scope === '__all__'
            ? await getExamLeaderboard(examId, { global: true })
            : await getExamLeaderboard(examId, { global: false, courseId: scope });
        if (cancelled) return;
        if (res.success && res.data) setRows(res.data.rows);
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [examId, showLb, scope]);

  const rankSelf = useMemo(() => rows.find((r) => r.studentUserId === userId), [rows, userId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-12">
        <Button variant="outline" className="rounded-xl" onClick={() => router.push('/student/exams')}>
          <ChevronLeft className="mr-2 h-4 w-4" /> পরীক্ষায় ফিরুন
        </Button>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-rose-400" />
          <p className="font-bold text-rose-700">{err}</p>
        </div>
      </div>
    );
  }

  if (!showLb) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-12">
        <Button variant="outline" className="rounded-xl" onClick={() => router.push(`/student/exams/${examId}`)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> ফিরুন
        </Button>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-bold text-slate-600">এই পরীক্ষার জন্য লিডারবোর্ড চালু নেই</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button variant="ghost" className="rounded-xl" onClick={() => router.push(`/student/exams/${examId}`)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> ফিরুন
        </Button>
        {linkedNames.length > 0 ? (
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="h-10 w-[220px] rounded-xl">
              <SelectValue placeholder="বিভাগ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">সব কোর্স</SelectItem>
              {linkedNames.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      <div className="text-center">
        <Trophy className="mx-auto mb-3 h-12 w-12 text-amber-500" />
        <h1 className="text-2xl font-black text-slate-900">{title}</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">লিডারবোর্ড</p>
      </div>

      {rankSelf ? (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">আপনার অবস্থান</p>
          <p className="mt-2 text-3xl font-black text-indigo-900">#{rankSelf.rank}</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            নম্বর: {rankSelf.obtainedMarks ?? '—'}
            {showPct && rankSelf.percentile != null ? ` · শতাংশাইল ${rankSelf.percentile}` : ''}
          </p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">নাম</th>
              <th className="px-4 py-3 text-right">নম্বর</th>
              {showPct ? <th className="px-4 py-3 text-right">%ile</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr
                key={r.studentUserId + r.rank}
                className={r.studentUserId === userId ? 'bg-indigo-50/50' : ''}
              >
                <td className="px-4 py-3 font-black text-slate-700">{r.rank}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{r.fullName}</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold">{r.obtainedMarks ?? '—'}</td>
                {showPct ? (
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {r.percentile != null ? r.percentile : '—'}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">এখনও কেউ জমা দেয়নি</p>
        ) : null}
      </div>
    </div>
  );
}
