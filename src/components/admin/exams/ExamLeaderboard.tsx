'use client';

import { useEffect, useState } from 'react';
import { getLeaderboard, type LeaderboardEntry } from '@/lib/api/exam-results';
import { Trophy, Medal, Crown, Loader2, AlertCircle, User } from 'lucide-react';

interface ExamLeaderboardProps {
  examId: string;
  showLeaderboard?: boolean;
}

export function ExamLeaderboard({ examId, showLeaderboard }: ExamLeaderboardProps) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!showLeaderboard) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const res = await getLeaderboard(examId);
        if (res.success && res.data) {
          setEntries(res.data.leaderboard);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Leaderboard load failed');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [examId, showLeaderboard]);

  if (!showLeaderboard) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <Trophy className="h-8 w-8 text-slate-300 mx-auto mb-2" />
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
        <AlertCircle className="h-6 w-6 text-rose-400 mx-auto mb-2" />
        <p className="text-sm font-bold text-rose-600">{error}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <Trophy className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-400">No participants yet</p>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-6">
      {/* Top 3 podium */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-4 py-6">
          {/* 2nd place */}
          {top3[1] && (
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 mb-2">
                <Medal className="h-6 w-6 text-slate-500" />
              </div>
              <p className="text-sm font-black text-slate-700 text-center max-w-[100px] truncate">{top3[1].studentName}</p>
              <p className="text-lg font-black text-slate-600">{top3[1].marks}</p>
              <div className="mt-2 h-20 w-24 rounded-t-xl bg-slate-200 flex items-center justify-center">
                <span className="text-2xl font-black text-slate-500">2</span>
              </div>
            </div>
          )}
          
          {/* 1st place */}
          {top3[0] && (
            <div className="flex flex-col items-center -mt-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 mb-2 ring-4 ring-amber-200">
                <Crown className="h-7 w-7 text-amber-500" />
              </div>
              <p className="text-base font-black text-slate-900 text-center max-w-[120px] truncate">{top3[0].studentName}</p>
              <p className="text-xl font-black text-amber-600">{top3[0].marks}</p>
              <div className="mt-2 h-28 w-28 rounded-t-xl bg-amber-100 flex items-center justify-center">
                <span className="text-3xl font-black text-amber-500">1</span>
              </div>
            </div>
          )}
          
          {/* 3rd place */}
          {top3[2] && (
            <div className="flex flex-col items-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 mb-2">
                <Medal className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-sm font-black text-slate-700 text-center max-w-[100px] truncate">{top3[2].studentName}</p>
              <p className="text-lg font-black text-slate-600">{top3[2].marks}</p>
              <div className="mt-2 h-14 w-24 rounded-t-xl bg-orange-100 flex items-center justify-center">
                <span className="text-2xl font-black text-orange-500">3</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rest of ranking */}
      {rest.length > 0 && (
        <div className="space-y-1">
          {rest.map((entry) => (
            <div
              key={`${entry.rank}-${entry.studentId}`}
              className="flex items-center justify-between px-5 py-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-black text-slate-600">
                  {entry.rank}
                </span>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">{entry.studentName}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{entry.source}</span>
                <span className="text-sm font-black text-slate-900">{entry.marks}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
