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
import {
  Loader2,
  Trophy,
  ChevronLeft,
  AlertCircle,
  Award,
  Crown,
  Users,
  Target,
  Percent,
  Sparkles,
  Medal,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const pageShell = 'mx-auto w-full max-w-full px-4 sm:px-6 lg:px-8 py-6';

function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '??';
  
  const colors = [
    'bg-indigo-500 text-indigo-50',
    'bg-emerald-500 text-emerald-50',
    'bg-violet-500 text-violet-50',
    'bg-amber-500 text-amber-50',
    'bg-rose-500 text-rose-50',
    'bg-cyan-500 text-cyan-50',
  ];
  const colorIndex = (name?.length ?? 0) % colors.length;
  
  return (
    <div className={cn("flex items-center justify-center rounded-full font-bold text-xs shrink-0 select-none shadow-sm", colors[colorIndex], className)}>
      {initials}
    </div>
  );
}

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
      setErr('Login required');
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
          setErr(meta.message || 'Exam not found');
          return;
        }
        setTitle(meta.data.title);
        setShowLb(!!meta.data.showLeaderboard);
        setShowPct(!!meta.data.showPercentile || meta.data.examEngine === 'COMPETITIVE');
        const opts: { id: string; name: string }[] = [
          { id: meta.data.courseId, name: meta.data.course?.name ?? 'Default Course' },
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
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Load failed');
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
      <div className={cn(pageShell, 'flex min-h-[60vh] items-center justify-center')}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Leaderboard...</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className={cn(pageShell, 'space-y-6')}>
        <div className="mx-auto max-w-lg w-full space-y-6">
          <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => router.push('/student/exams')}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Exams
          </Button>
          <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-8 text-center shadow-xs">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-rose-500 animate-bounce" />
            <p className="text-sm font-bold text-rose-800 uppercase tracking-wider mb-1">An Error Occurred</p>
            <p className="text-sm font-medium text-rose-600">{err}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!showLb) {
    return (
      <div className={cn(pageShell, 'space-y-6')}>
        <div className="mx-auto max-w-lg w-full space-y-6">
          <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => router.push(`/student/exams/${examId}`)}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-8 text-center shadow-xs">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-base font-bold text-slate-700">Leaderboard is disabled</p>
            <p className="text-xs text-slate-400 mt-1">The leaderboard ranking is not enabled for this exam.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(pageShell, 'space-y-8')}>
      {/* Top Banner and Navigation */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 p-6 sm:p-8 text-white shadow-lg border border-indigo-950">
        <div className="absolute right-0 top-0 h-40 w-40 bg-indigo-500/10 blur-3xl rounded-full" />
        <div className="absolute left-1/3 bottom-0 h-40 w-40 bg-pink-500/10 blur-3xl rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <Button
              variant="outline"
              className="rounded-xl bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/30 text-white font-bold uppercase tracking-wider text-xs h-9 transition-all"
              onClick={() => router.push(`/student/exams/${examId}`)}
            >
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Back to Exam
            </Button>
            
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-[10px] font-black text-amber-300 uppercase tracking-widest shadow-inner">
                <Sparkles className="h-3 w-3 animate-pulse" />
                Leaderboard Rankings
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">{title}</h1>
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                Performance metrics compared across all enrolled students
              </p>
            </div>
          </div>

          {linkedNames.length > 0 && (
            <div className="flex flex-col gap-1.5 bg-white/5 border border-white/10 p-3 rounded-2xl shrink-0 backdrop-blur-xs min-w-[240px]">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200">Filter by course:</span>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger className="h-9 w-full rounded-xl bg-indigo-950/80 border-indigo-700/50 text-white text-xs font-bold uppercase tracking-wider hover:bg-indigo-950/100 transition animate-fade-in">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent className="bg-indigo-950 border-indigo-850 text-white">
                  <SelectItem value="__all__" className="text-xs font-bold uppercase hover:bg-indigo-900 focus:bg-indigo-900 text-white focus:text-white">All Courses</SelectItem>
                  {linkedNames.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase hover:bg-indigo-900 focus:bg-indigo-900 text-white focus:text-white">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Visual Podium for Top 3 */}
      {rows.length > 0 && (
        <div className="max-w-full mx-auto py-10 px-4 sm:px-8 bg-gradient-to-b from-slate-50 to-white rounded-3xl border border-slate-200/60 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <div className="grid grid-cols-3 gap-2 sm:gap-8 items-end max-w-2xl mx-auto pt-6">
            {/* 2nd Place */}
            {rows[1] ? (
              <div className="flex flex-col items-center flex-1 transition hover:-translate-y-1 duration-300">
                <div className="relative flex flex-col items-center">
                  <Avatar name={rows[1].fullName} className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-slate-350 shadow-md ring-4 ring-slate-100/50" />
                  <div className="absolute -top-3 -right-2 bg-slate-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm">
                    2
                  </div>
                </div>
                <div className="text-center mt-3 max-w-[80px] sm:max-w-none">
                  <p className="text-xs sm:text-sm font-black text-slate-800 line-clamp-1">{rows[1].fullName}</p>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-505 mt-0.5 bg-slate-100 px-2 py-0.5 rounded-full inline-block">{rows[1].obtainedMarks} Marks</p>
                </div>
                {/* Podium bar */}
                <div className="w-20 sm:w-32 bg-gradient-to-t from-slate-200 via-slate-100 to-slate-50 border border-slate-300 border-b-0 rounded-t-3xl h-24 mt-4 flex flex-col items-center justify-start pt-3 shadow-xs">
                  <span className="text-2xl sm:text-3xl font-black text-slate-400">2nd</span>
                  <Medal className="h-5 w-5 text-slate-450 mt-1" />
                </div>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* 1st Place */}
            {rows[0] ? (
              <div className="flex flex-col items-center flex-1 z-10 transition hover:-translate-y-2.5 duration-350 -mt-6">
                <div className="relative flex flex-col items-center">
                  <div className="absolute -top-7 text-amber-500 animate-bounce">
                    <Crown className="h-7 w-7 fill-amber-400 stroke-amber-600" />
                  </div>
                  <Avatar name={rows[0].fullName} className="h-20 w-20 sm:h-26 sm:w-26 border-4 border-amber-400 shadow-xl ring-4 ring-amber-100/50" />
                  <div className="absolute -top-3 -right-2 bg-amber-500 text-white rounded-full h-7 w-7 flex items-center justify-center text-[11px] font-black border-2 border-white shadow-md">
                    1
                  </div>
                </div>
                <div className="text-center mt-3 max-w-[80px] sm:max-w-none">
                  <p className="text-sm sm:text-base font-black text-slate-900 line-clamp-1">{rows[0].fullName}</p>
                  <p className="text-xs font-black text-amber-700 mt-0.5 bg-amber-50 border border-amber-200/50 px-2.5 py-0.5 rounded-full inline-block shadow-2xs">{rows[0].obtainedMarks} Marks</p>
                </div>
                {/* Podium bar */}
                <div className="w-24 sm:w-36 bg-gradient-to-t from-amber-100/90 via-amber-50/50 to-amber-50/10 border-2 border-amber-200 border-b-0 rounded-t-3xl h-36 mt-4 flex flex-col items-center justify-start pt-4 shadow-sm relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 rounded-t-3xl pointer-events-none" />
                  <span className="text-3xl sm:text-4xl font-black text-amber-500">1st</span>
                  <Trophy className="h-6 w-6 text-amber-600 fill-amber-100 mt-1 animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* 3rd Place */}
            {rows[2] ? (
              <div className="flex flex-col items-center flex-1 transition hover:-translate-y-1 duration-300">
                <div className="relative flex flex-col items-center">
                  <Avatar name={rows[2].fullName} className="h-14 w-14 sm:h-18 sm:w-18 border-4 border-amber-700/60 shadow-md ring-4 ring-amber-50/50" />
                  <div className="absolute -top-3 -right-2 bg-amber-700 text-white rounded-full h-6 w-6 flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm">
                    3
                  </div>
                </div>
                <div className="text-center mt-3 max-w-[80px] sm:max-w-none">
                  <p className="text-xs sm:text-sm font-black text-slate-800 line-clamp-1">{rows[2].fullName}</p>
                  <p className="text-[10px] sm:text-xs font-bold text-amber-700 mt-0.5 bg-amber-50/60 px-2 py-0.5 rounded-full inline-block">{rows[2].obtainedMarks} Marks</p>
                </div>
                {/* Podium bar */}
                <div className="w-20 sm:w-32 bg-gradient-to-t from-amber-900/10 via-amber-800/5 to-amber-500/0 border border-amber-700/20 border-b-0 rounded-t-3xl h-18 mt-4 flex flex-col items-center justify-start pt-2 shadow-xs">
                  <span className="text-xl sm:text-2xl font-black text-amber-800">3rd</span>
                  <Medal className="h-5 w-5 text-amber-705 mt-0.5" />
                </div>
              </div>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      )}

      {/* Your Rank Widget Block */}
      {rankSelf && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-full mx-auto">
          {/* Your Rank Card */}
          <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-200/50 rounded-3xl p-5 flex flex-col items-center justify-center text-center shadow-2xs relative overflow-hidden transition hover:shadow-xs">
            <div className="absolute -right-4 -bottom-4 opacity-5 text-indigo-900 pointer-events-none">
              <Trophy className="h-20 w-20" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-105/50 px-2.5 py-1 rounded-full">Your Rank</span>
            <span className="text-4xl font-black mt-3 text-indigo-900">#{rankSelf.rank}</span>
          </div>

          {/* Obtained Marks Card */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-200/50 rounded-3xl p-5 flex flex-col items-center justify-center text-center shadow-2xs relative overflow-hidden transition hover:shadow-xs">
            <div className="absolute -right-4 -bottom-4 opacity-5 text-emerald-900 pointer-events-none">
              <Target className="h-20 w-20" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100/50 px-2.5 py-1 rounded-full">Obtained Marks</span>
            <span className="text-4xl font-black mt-3 text-emerald-700">{rankSelf.obtainedMarks ?? '—'}</span>
          </div>

          {/* Percentile Card */}
          {showPct && rankSelf.percentile != null ? (
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-200/50 rounded-3xl p-5 flex flex-col items-center justify-center text-center shadow-2xs relative overflow-hidden transition hover:shadow-xs">
              <div className="absolute -right-4 -bottom-4 opacity-5 text-amber-900 pointer-events-none">
                <Percent className="h-20 w-20" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-100/50 px-2.5 py-1 rounded-full">Percentile</span>
              <span className="text-4xl font-black mt-3 text-amber-850">{rankSelf.percentile}%</span>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-500/10 to-slate-500/5 border border-slate-200/50 rounded-3xl p-5 flex flex-col items-center justify-center text-center shadow-2xs relative overflow-hidden transition hover:shadow-xs">
              <div className="absolute -right-4 -bottom-4 opacity-5 text-slate-500 pointer-events-none">
                <Users className="h-20 w-20" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">Total Ranked</span>
              <span className="text-4xl font-black mt-3 text-slate-800">{rows.length}</span>
            </div>
          )}

          {/* Performance Card */}
          {showPct && rankSelf.percentile != null ? (
            <div className="bg-gradient-to-br from-slate-500/10 to-slate-500/5 border border-slate-200/50 rounded-3xl p-5 flex flex-col items-center justify-center text-center shadow-2xs relative overflow-hidden transition hover:shadow-xs">
              <div className="absolute -right-4 -bottom-4 opacity-5 text-slate-500 pointer-events-none">
                <Users className="h-20 w-20" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">Total Ranked</span>
              <span className="text-4xl font-black mt-3 text-slate-800">{rows.length}</span>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-200/50 rounded-3xl p-5 flex flex-col items-center justify-center text-center shadow-2xs relative overflow-hidden transition hover:shadow-xs">
              <div className="absolute -right-4 -bottom-4 opacity-5 text-violet-900 pointer-events-none">
                <Award className="h-20 w-20" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-700 bg-violet-100/50 px-2.5 py-1 rounded-full">Performance</span>
              <span className="text-base font-black mt-4 text-violet-800 uppercase tracking-wider bg-white border border-violet-100 px-4.5 py-1 rounded-full shadow-2xs">
                Ranked
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Leaderboard Rankings Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden max-w-full mx-auto">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">Complete Leaderboard</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-150 shadow-2xs">
            {rows.length} Student{rows.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead className="bg-slate-50/50 text-left text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-150">
              <tr>
                <th className="px-6 py-4 text-center w-24">Rank</th>
                <th className="px-6 py-4">Participant</th>
                <th className="px-6 py-4 text-right">Obtained Marks</th>
                {showPct && <th className="px-6 py-4 text-right">Percentile</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const isCurrentUser = r.studentUserId === userId;
                const rankNum = r.rank;
                
                let rankBadge = (
                  <span className="text-slate-550 font-black">{rankNum}</span>
                );

                if (rankNum === 1) {
                  rankBadge = (
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-100 text-amber-805 font-black text-xs ring-2 ring-amber-300 shadow-2xs animate-pulse">
                      👑
                    </span>
                  );
                } else if (rankNum === 2) {
                  rankBadge = (
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 text-slate-805 font-black text-xs ring-2 ring-slate-350 shadow-2xs">
                      🥈
                    </span>
                  );
                } else if (rankNum === 3) {
                  rankBadge = (
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-50 text-amber-905 font-black text-xs ring-2 ring-amber-205 shadow-2xs">
                      🥉
                    </span>
                  );
                }

                return (
                  <tr
                    key={r.studentUserId + r.rank}
                    className={cn(
                      "transition-colors duration-150",
                      isCurrentUser 
                        ? 'bg-indigo-50/50 hover:bg-indigo-50/70 border-l-4 border-l-indigo-650' 
                        : 'hover:bg-slate-50/50'
                    )}
                  >
                    <td className="px-6 py-4 text-center font-black">{rankBadge}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.fullName} className="h-9 w-9 text-xs" />
                        <div>
                          <span className={cn(
                            "text-slate-800 block text-xs font-black", 
                            isCurrentUser && "text-indigo-900"
                          )}>
                            {r.fullName}
                          </span>
                          {isCurrentUser && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-indigo-655 tracking-wider">
                              <Sparkles className="h-2 w-2 text-indigo-500" /> You
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-xs font-black text-slate-850">
                      {r.obtainedMarks ?? '—'}
                    </td>
                    {showPct && (
                      <td className="px-6 py-4 text-right tabular-nums text-xs font-bold text-slate-500">
                        {r.percentile != null ? `${r.percentile}%` : '—'}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Trophy className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-sm font-black text-slate-600 uppercase tracking-wider">No Submissions Found</p>
            <p className="text-xs text-slate-450 mt-1">There are no submission rankings recorded for this exam yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
