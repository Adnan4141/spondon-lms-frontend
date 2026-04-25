'use client';

import { useEffect, useState } from 'react';
import { getExamLeaderboard } from '@/lib/api/exams';
import type { ExamLeaderboardRow } from '@/types/exam';
import { Trophy, Medal, Crown, Loader2, AlertCircle, User } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type LeaderboardCourseOption = { id: string; name: string };

interface ExamLeaderboardProps {
  examId: string;
  showLeaderboard?: boolean;
  /** Primary + linked courses for scope filter */
  courseOptions?: LeaderboardCourseOption[];
}

export function ExamLeaderboard({ examId, showLeaderboard, courseOptions }: ExamLeaderboardProps) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<ExamLeaderboardRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<string>('__all__');

  useEffect(() => {
    if (!showLeaderboard) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const res =
          scope === '__all__'
            ? await getExamLeaderboard(examId, { global: true })
            : await getExamLeaderboard(examId, { global: false, courseId: scope });
        if (res.success && res.data) {
          setEntries(res.data.rows);
        } else {
          setError(res.message || 'Leaderboard load failed');
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Leaderboard load failed');
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchData();
  }, [examId, showLeaderboard, scope]);

  const showPercentile = entries.some((r) => r.percentile != null);

  if (!showLeaderboard) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <Trophy className="mx-auto mb-2 h-8 w-8 text-slate-300" />
        <p className="text-sm font-bold text-slate-400">Leaderboard is disabled for this exam</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <AlertCircle className="mx-auto mb-2 h-6 w-6 text-rose-400" />
        <p className="text-sm font-bold text-rose-600">{error}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <Trophy className="mx-auto mb-2 h-8 w-8 text-slate-300" />
        <p className="text-sm font-bold text-slate-400">No participants yet</p>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-6 p-4">
      {courseOptions && courseOptions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scope</span>
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="h-10 w-[220px] rounded-xl border-slate-200">
              <SelectValue placeholder="Leaderboard scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All linked courses</SelectItem>
              {courseOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-4 py-6">
          {top3[1] && (
            <div className="flex flex-col items-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
                <Medal className="h-6 w-6 text-slate-500" />
              </div>
              <p className="max-w-[100px] truncate text-center text-sm font-black text-slate-700">
                {top3[1].fullName}
              </p>
              <p className="text-lg font-black text-slate-600">{top3[1].obtainedMarks ?? '—'}</p>
              {showPercentile && top3[1].percentile != null ? (
                <p className="text-[10px] font-bold uppercase text-slate-400">{top3[1].percentile}%ile</p>
              ) : null}
              <div className="mt-2 flex h-20 w-24 items-center justify-center rounded-t-xl bg-slate-200">
                <span className="text-2xl font-black text-slate-500">2</span>
              </div>
            </div>
          )}

          {top3[0] && (
            <div className="-mt-4 flex flex-col items-center">
              <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 ring-4 ring-amber-200">
                <Crown className="h-7 w-7 text-amber-500" />
              </div>
              <p className="max-w-[120px] truncate text-center text-base font-black text-slate-900">
                {top3[0].fullName}
              </p>
              <p className="text-xl font-black text-amber-600">{top3[0].obtainedMarks ?? '—'}</p>
              {showPercentile && top3[0].percentile != null ? (
                <p className="text-[10px] font-bold uppercase text-amber-700/80">{top3[0].percentile}%ile</p>
              ) : null}
              <div className="mt-2 flex h-28 w-28 items-center justify-center rounded-t-xl bg-amber-100">
                <span className="text-3xl font-black text-amber-500">1</span>
              </div>
            </div>
          )}

          {top3[2] && (
            <div className="flex flex-col items-center">
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-orange-100">
                <Medal className="h-5 w-5 text-orange-500" />
              </div>
              <p className="max-w-[100px] truncate text-center text-sm font-black text-slate-700">
                {top3[2].fullName}
              </p>
              <p className="text-lg font-black text-slate-600">{top3[2].obtainedMarks ?? '—'}</p>
              {showPercentile && top3[2].percentile != null ? (
                <p className="text-[10px] font-bold uppercase text-slate-400">{top3[2].percentile}%ile</p>
              ) : null}
              <div className="mt-2 flex h-14 w-24 items-center justify-center rounded-t-xl bg-orange-100">
                <span className="text-2xl font-black text-orange-500">3</span>
              </div>
            </div>
          )}
        </div>
      )}

      {rest.length > 0 && (
        <div className="space-y-1">
          {rest.map((entry) => (
            <div
              key={`${entry.rank}-${entry.studentUserId}`}
              className="flex items-center justify-between rounded-xl px-5 py-3 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-black text-slate-600">
                  {entry.rank}
                </span>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">{entry.fullName}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {showPercentile && entry.percentile != null ? (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    {entry.percentile}%ile
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Online</span>
                )}
                <span className="text-sm font-black text-slate-900">{entry.obtainedMarks ?? '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
