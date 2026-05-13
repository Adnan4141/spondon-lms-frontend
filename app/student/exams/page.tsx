'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentExams } from '@/lib/api/exams';
import type { Exam, ExamEngineType } from '@/types/exam';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpenCheck,
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trophy,
  FileText,
  Timer,
  Building2,
  Download,
  PenLine,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function getTypeBadgeClass(type: string) {
  switch (type) {
    case 'PRACTICE': return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'SCHEDULED': return 'bg-violet-50 text-violet-700 border-violet-100';
    case 'MODEL': return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'TALENT_HUNT': return 'bg-pink-50 text-pink-700 border-pink-100';
    case 'UNIVERSITY': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

function getEngineBadgeClass(engine?: ExamEngineType) {
  switch (engine) {
    case 'COMPETITIVE':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'MULTI_SUBJECT':
      return 'bg-cyan-50 text-cyan-800 border-cyan-200';
    case 'UNIVERSITY_SPECIAL':
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    case 'TALENT_HUNT':
      return 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200';
    case 'OMR_BOOK':
      return 'bg-teal-50 text-teal-800 border-teal-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

function timeRemaining(endAt: string | null | undefined, lang: 'bn' | 'en' = 'bn'): string | null {
  if (!endAt) return null;
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return lang === 'en' ? 'Ended' : 'শেষ হয়েছে';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

function latestAttempt(exam: Exam) {
  return exam.studentAttempts?.[exam.studentAttempts.length - 1];
}

function writtenStatusLabel(exam: Exam, lang: 'bn' | 'en') {
  const attempt = latestAttempt(exam);
  if (exam.hasInProgress) return lang === 'en' ? 'Upload in progress' : 'আপলোড চলছে';
  if (!attempt) return lang === 'en' ? 'Not started' : 'শুরু হয়নি';
  if (attempt.obtainedMarks == null || attempt.totalMarks == null) {
    return lang === 'en' ? 'Teacher evaluation pending' : 'শিক্ষক মূল্যায়ন বাকি';
  }
  return lang === 'en' ? 'Evaluated' : 'মূল্যায়ন সম্পন্ন';
}

function writtenPrimaryAction(exam: Exam, lang: 'bn' | 'en') {
  const attempt = latestAttempt(exam);
  if (exam.hasInProgress) return lang === 'en' ? 'Continue upload' : 'আপলোড চালিয়ে যান';
  if (!attempt) return lang === 'en' ? 'Start upload' : 'আপলোড শুরু করুন';
  if (attempt.obtainedMarks == null || attempt.totalMarks == null) return lang === 'en' ? 'View submission' : 'সাবমিশন দেখুন';
  return lang === 'en' ? 'View result' : 'ফলাফল দেখুন';
}

export default function StudentExamsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setError('পরীক্ষা দেখতে লগইন করুন');
        setLoading(false);
        return;
      }
      try {
        const user = JSON.parse(userStr);
        const res = await getStudentExams(user.id);
        if (res.success && res.data) setExams(res.data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'পরীক্ষা লোড ব্যর্থ');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const hallExams = exams.filter((e) => e.mode === 'OFFLINE');
  const writtenExams = exams.filter((e) => e.mode === 'WRITTEN' || e.mode === 'HYBRID');
  const availableWritten = writtenExams.filter((e) => e.canAttempt || e.hasInProgress);
  const completedWritten = writtenExams.filter(
    (e) => !e.canAttempt && !e.hasInProgress && (e.studentAttempts?.length ?? 0) > 0,
  );
  const availableOnline = exams.filter(
    (e) => e.mode === 'ONLINE' && (e.canAttempt || e.hasInProgress),
  );
  const completedOnline = exams.filter(
    (e) =>
      e.mode === 'ONLINE' &&
      !e.canAttempt &&
      !e.hasInProgress &&
      (e.studentAttempts?.length ?? 0) > 0,
  );

  const upcomingExams = exams.filter((e) => {
    if (!e.startAt) return false;
    const start = new Date(e.startAt).getTime();
    if (start <= Date.now()) return false;
    if ((e.studentAttempts?.length ?? 0) > 0) return false;
    return true;
  }).sort((a, b) => new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime());

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-slate-500 font-bold animate-pulse">পরীক্ষা লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">পরীক্ষা</h1>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-rose-400 mx-auto mb-4" />
          <p className="text-lg font-bold text-rose-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">পরীক্ষা</h1>
          <p className="text-slate-500 font-medium mt-1">আপনার সকল পরীক্ষা এখানে</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-black text-slate-500 shadow-sm">
          <BookOpenCheck className="h-4 w-4 text-indigo-500" />
          মোট {exams.length} টি পরীক্ষা
        </div>
      </div>

      {/* Upcoming scheduled exams */}
      {upcomingExams.length > 0 && (
        <section className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-6">
          <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-700 mb-4 flex items-center gap-2">
            <CalendarClock className="h-3.5 w-3.5" /> আসন্ন পরীক্ষা
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingExams.map((exam) => {
              const startDate = new Date(exam.startAt!);
              const diff = Math.max(0, startDate.getTime() - Date.now());
              const totalHours = Math.floor(diff / 3600000);
              const countdown = totalHours >= 24
                ? `${Math.floor(totalHours / 24)} দিন বাকি`
                : totalHours > 0
                  ? `${totalHours} ঘণ্টা বাকি`
                  : `${Math.max(1, Math.floor((diff % 3600000) / 60000))} মিনিট বাকি`;
              return (
                <div
                  key={exam.id}
                  className="group rounded-xl border border-indigo-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer"
                  onClick={() => router.push(`/student/exams/${exam.id}`)}
                >
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline" className={cn('rounded-lg text-[9px] font-black uppercase px-2 py-0.5', getTypeBadgeClass(exam.type))}>
                      {exam.type.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className="rounded-lg text-[9px] font-black uppercase px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-200">
                      {exam.mode}
                    </Badge>
                  </div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-1 line-clamp-1">
                    {exam.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mb-3">{exam.course?.name}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-indigo-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {startDate.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-indigo-100 px-2.5 py-1 text-[10px] font-black text-indigo-800">
                      <Clock className="h-3 w-3" />
                      {countdown}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Offline / hall exams (PDF + centre instructions) */}
      {hallExams.length > 0 && (
        <section>
          <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-700 mb-4 flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" /> হল পরীক্ষা / Offline hall exams
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hallExams.map((exam) => {
              const lang: 'bn' | 'en' = exam.language === 'en' ? 'en' : 'bn';
              const remaining = timeRemaining(exam.endAt, lang);
              return (
                <div
                  key={exam.id}
                  className="group relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer"
                  onClick={() => router.push(`/student/exams/${exam.id}`)}
                >
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="outline" className={cn('rounded-lg text-[9px] font-black uppercase px-2 py-0.5', getTypeBadgeClass(exam.type))}>
                      {exam.type.replace('_', ' ')}
                    </Badge>
                    {exam.examEngine && exam.examEngine !== 'REGULAR' ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-lg text-[9px] font-black uppercase px-2 py-0.5',
                          getEngineBadgeClass(exam.examEngine),
                        )}
                      >
                        {exam.examEngine.replace(/_/g, ' ')}
                      </Badge>
                    ) : null}
                    <Badge variant="outline" className="rounded-lg text-[9px] font-black uppercase px-2 py-0.5 bg-orange-50 text-orange-800 border-orange-200">
                      OFFLINE
                    </Badge>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-800 transition-colors mb-2">
                    {exam.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-600 mb-1">{exam.course?.name}</p>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-3">
                    {exam.durationMinutes ? (
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" /> {exam.durationMinutes} {lang === 'en' ? 'min' : 'মিনিট'}
                      </span>
                    ) : null}
                    {remaining ? (
                      <span className="flex items-center gap-1 text-amber-700">
                        <Clock className="h-3 w-3" /> {remaining}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 pt-4 border-t border-amber-200/80 flex flex-col gap-2">
                    <Button
                      className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/student/exams/${exam.id}`);
                      }}
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />
                      {lang === 'en' ? 'Instructions & PDF' : 'নির্দেশনা ও PDF'}
                    </Button>
                    {exam.showLeaderboard ? (
                      <Button
                        variant="outline"
                        className="w-full h-9 rounded-xl font-black uppercase tracking-widest text-[10px] border-amber-300 text-amber-900 hover:bg-amber-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/student/leaderboard/${exam.id}`);
                        }}
                      >
                        <Trophy className="h-3.5 w-3.5 mr-2" />
                        {lang === 'en' ? 'Leaderboard' : 'লিডারবোর্ড'}
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Written exams — available */}
      {availableWritten.length > 0 && (
        <section>
          <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-violet-600 mb-4 flex items-center gap-2">
            <PenLine className="h-3.5 w-3.5" /> লিখিত পরীক্ষা — চলমান / নতুন
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableWritten.map((exam) => {
              const lang: 'bn' | 'en' = exam.language === 'en' ? 'en' : 'bn';
              const remaining = timeRemaining(exam.endAt, lang);
              return (
                <div
                  key={exam.id}
                  className="group relative overflow-hidden rounded-2xl border border-violet-200 bg-violet-50/30 p-6 shadow-sm hover:shadow-md hover:border-violet-300 transition-all cursor-pointer"
                  onClick={() => router.push(`/student/exams/${exam.id}`)}
                >
                  {exam.hasInProgress && (
                    <div className="absolute top-3 right-3">
                      <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="outline" className={cn('rounded-lg text-[9px] font-black uppercase px-2 py-0.5', getTypeBadgeClass(exam.type))}>
                      {exam.type.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className="rounded-lg text-[9px] font-black uppercase px-2 py-0.5 bg-violet-50 text-violet-700 border-violet-200">
                      {exam.mode === 'HYBRID' ? 'HYBRID' : 'WRITTEN'}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-violet-700 transition-colors mb-2">
                    {exam.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mb-1">{exam.course?.name}</p>
                  <div className="mt-3 rounded-xl border border-violet-200 bg-white/80 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-700">
                      {exam.mode === 'HYBRID'
                        ? lang === 'en'
                          ? 'MCQ + handwritten upload'
                          : 'MCQ + হাতে লেখা আপলোড'
                        : lang === 'en'
                          ? 'Camera/PDF written upload'
                          : 'ক্যামেরা/PDF লিখিত আপলোড'}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-600">{writtenStatusLabel(exam, lang)}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-400 mt-3">
                    {exam.durationMinutes && (
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" /> {exam.durationMinutes} {lang === 'en' ? 'minutes' : 'মিনিট'}
                      </span>
                    )}
                    {remaining && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Clock className="h-3 w-3" /> {remaining}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-violet-200/80 flex flex-col gap-2">
                    <Button
                      className={cn(
                        'w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all',
                        exam.hasInProgress
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-violet-600 hover:bg-violet-700 text-white'
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/student/exams/${exam.id}`);
                      }}
                    >
                      {exam.hasInProgress ? (
                        <><RotateCcw className="h-3.5 w-3.5 mr-2" /> {writtenPrimaryAction(exam, lang)}</>
                      ) : (
                        <><PenLine className="h-3.5 w-3.5 mr-2" /> {writtenPrimaryAction(exam, lang)}</>
                      )}
                    </Button>
                    {exam.showLeaderboard ? (
                      <Button
                        variant="outline"
                        className="w-full h-9 rounded-xl font-black uppercase tracking-widest text-[10px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/student/leaderboard/${exam.id}`);
                        }}
                      >
                        <Trophy className="h-3.5 w-3.5 mr-2" />
                        {lang === 'en' ? 'Leaderboard' : 'লিডারবোর্ড'}
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Written — completed */}
      {completedWritten.length > 0 && (
        <section>
          <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" /> সম্পন্ন লিখিত পরীক্ষা
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedWritten.map((exam) => {
              const lang: 'bn' | 'en' = exam.language === 'en' ? 'en' : 'bn';
              const lastAttempt = latestAttempt(exam);
              const totalM = lastAttempt?.totalMarks ?? 0;
              const obtainedM = lastAttempt?.obtainedMarks ?? 0;
              const percentage = totalM > 0 && obtainedM != null
                ? Math.round((obtainedM / totalM) * 100)
                : null;
              const attemptCount = exam.studentAttempts?.length ?? 0;
              const canRetry = attemptCount < (exam.allowedAttempts ?? 1);
              return (
                <div
                  key={exam.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => router.push(`/student/exams/${exam.id}?view=result`)}
                >
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={cn('rounded-lg text-[9px] font-black uppercase px-2 py-0.5', getTypeBadgeClass(exam.type))}>
                        {exam.type.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="rounded-lg text-[9px] font-black uppercase px-2 py-0.5 bg-violet-50 text-violet-700 border-violet-200">
                        {exam.mode === 'HYBRID' ? 'HYBRID' : 'WRITTEN'}
                      </Badge>
                    </div>
                    {percentage != null ? (
                      <span className={cn(
                        'text-sm font-black',
                        percentage >= 80 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-600' : 'text-rose-600'
                      )}>
                        {percentage}%
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600">মূল্যায়ন বাকি</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-violet-600 transition-colors mb-1">
                    {exam.title}
                  </h3>
                  <p className="text-sm text-slate-500">{exam.course?.name ?? ''}</p>
                  <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-700">
                      {exam.mode === 'HYBRID'
                        ? lang === 'en'
                          ? 'Hybrid submission'
                          : 'হাইব্রিড সাবমিশন'
                        : lang === 'en'
                          ? 'Written upload submission'
                          : 'লিখিত আপলোড সাবমিশন'}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-600">{writtenStatusLabel(exam, lang)}</p>
                  </div>

                  {lastAttempt && (
                    <div className="flex items-center gap-3 mt-3 text-xs font-medium text-slate-400">
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-amber-500" />
                        {obtainedM}/{totalM}
                      </span>
                      <span className="text-slate-300">
                        {lang === 'en' ? `Attempt ${attemptCount}/${exam.allowedAttempts ?? 1}` : `চেষ্টা ${attemptCount}/${exam.allowedAttempts ?? 1}`}
                      </span>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      className="w-full h-9 rounded-xl font-bold text-xs text-slate-600 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/student/exams/${exam.id}?view=result`);
                      }}
                    >
                      <FileText className="h-3.5 w-3.5 mr-2" /> {writtenPrimaryAction(exam, lang)}
                    </Button>
                    {canRetry && (
                      <Button
                        className="w-full h-9 rounded-xl font-black uppercase tracking-widest text-[10px] bg-violet-600 hover:bg-violet-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/student/exams/${exam.id}`);
                        }}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-2" /> {lang === 'en' ? 'Re-attempt' : 'পুনরায় চেষ্টা'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Online — in-progress or available */}
      {availableOnline.length > 0 && (
        <section>
          <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-4 flex items-center gap-2">
            <Play className="h-3.5 w-3.5" /> অনলাইন — চলমান / নতুন
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableOnline.map((exam) => {
              const lang: 'bn' | 'en' = exam.language === 'en' ? 'en' : 'bn';
              const remaining = timeRemaining(exam.endAt, lang);
              return (
                <div
                  key={exam.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
                  onClick={() => router.push(`/student/exams/${exam.id}`)}
                >
                  {exam.hasInProgress && (
                    <div className="absolute top-3 right-3">
                      <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="outline" className={cn("rounded-lg text-[9px] font-black uppercase px-2 py-0.5", getTypeBadgeClass(exam.type))}>
                      {exam.type.replace('_', ' ')}
                    </Badge>
                    {exam.examEngine && exam.examEngine !== 'REGULAR' ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-lg text-[9px] font-black uppercase px-2 py-0.5',
                          getEngineBadgeClass(exam.examEngine),
                        )}
                      >
                        {exam.examEngine.replace(/_/g, ' ')}
                      </Badge>
                    ) : null}
                    <Badge variant="outline" className="rounded-lg text-[9px] font-black uppercase px-2 py-0.5 bg-cyan-50 text-cyan-700 border-cyan-100">
                      ONLINE
                    </Badge>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">
                    {exam.title}
                  </h3>

                  <p className="text-sm font-medium text-slate-500 mb-1">
                    {exam.course?.name}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-medium text-slate-400 mt-3">
                    {exam.durationMinutes && (
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" /> {exam.durationMinutes} {lang === 'en' ? 'minutes' : 'মিনিট'}
                      </span>
                    )}
                    {remaining && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Clock className="h-3 w-3" /> {remaining}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                    <Button
                      className={cn(
                        "w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all",
                        exam.hasInProgress
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/student/exams/${exam.id}`);
                      }}
                    >
                      {exam.hasInProgress ? (
                        <><RotateCcw className="h-3.5 w-3.5 mr-2" /> {lang === 'en' ? 'Return to exam' : 'পরীক্ষায় ফিরুন'}</>
                      ) : (
                        <><Play className="h-3.5 w-3.5 mr-2" /> {lang === 'en' ? 'Start exam' : 'পরীক্ষা শুরু করুন'}</>
                      )}
                    </Button>
                    {exam.showLeaderboard ? (
                      <Button
                        variant="outline"
                        className="w-full h-9 rounded-xl font-black uppercase tracking-widest text-[10px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/student/leaderboard/${exam.id}`);
                        }}
                      >
                        <Trophy className="h-3.5 w-3.5 mr-2" />
                        {lang === 'en' ? 'Leaderboard' : 'লিডারবোর্ড'}
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Online — completed */}
      {completedOnline.length > 0 && (
        <section>
          <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" /> সম্পন্ন অনলাইন পরীক্ষা
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedOnline.map((exam) => {
              const lang: 'bn' | 'en' = exam.language === 'en' ? 'en' : 'bn';
              const lastAttempt = exam.studentAttempts?.[exam.studentAttempts.length - 1];
              const totalM = lastAttempt?.totalMarks ?? 0;
              const obtainedM = lastAttempt?.obtainedMarks ?? 0;
              const percentage = totalM > 0 && obtainedM != null
                ? Math.round((obtainedM / totalM) * 100)
                : null;
              const attemptCount = exam.studentAttempts?.length ?? 0;
              const canRetry = attemptCount < (exam.allowedAttempts ?? 1);
              return (
                <div
                  key={exam.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => router.push(`/student/exams/${exam.id}?view=result`)}
                >
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={cn("rounded-lg text-[9px] font-black uppercase px-2 py-0.5", getTypeBadgeClass(exam.type))}>
                      {exam.type.replace('_', ' ')}
                    </Badge>
                    {exam.examEngine && exam.examEngine !== 'REGULAR' ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-lg text-[9px] font-black uppercase px-2 py-0.5',
                          getEngineBadgeClass(exam.examEngine),
                        )}
                      >
                        {exam.examEngine.replace(/_/g, ' ')}
                      </Badge>
                    ) : null}
                    </div>
                    {percentage != null && (
                      <span className={cn(
                        "text-sm font-black",
                        percentage >= 80 ? "text-emerald-600" : percentage >= 50 ? "text-amber-600" : "text-rose-600"
                      )}>
                        {percentage}%
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors mb-1">
                    {exam.title}
                  </h3>
                  <p className="text-sm text-slate-500">{exam.course?.name ?? ''}</p>

                  {lastAttempt && (
                    <div className="flex items-center gap-3 mt-3 text-xs font-medium text-slate-400">
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-amber-500" />
                        {obtainedM}/{totalM}
                      </span>
                      {lastAttempt.submittedAt && (
                        <span>{new Date(lastAttempt.submittedAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD')}</span>
                      )}
                      <span className="text-slate-300">
                        {lang === 'en' ? `Attempt ${attemptCount}/${exam.allowedAttempts ?? 1}` : `চেষ্টা ${attemptCount}/${exam.allowedAttempts ?? 1}`}
                      </span>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      className="w-full h-9 rounded-xl font-bold text-xs text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/student/exams/${exam.id}?view=result`);
                      }}
                    >
                      <FileText className="h-3.5 w-3.5 mr-2" /> {lang === 'en' ? 'View results' : 'ফলাফল দেখুন'}
                    </Button>
                    {canRetry && (
                      <Button
                        className="w-full h-9 rounded-xl font-black uppercase tracking-widest text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/student/exams/${exam.id}`);
                        }}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-2" /> {lang === 'en' ? 'Re-attempt' : 'পুনরায় চেষ্টা'}
                      </Button>
                    )}
                    {exam.showLeaderboard ? (
                      <Button
                        variant="outline"
                        className="w-full h-9 rounded-xl font-bold text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/student/leaderboard/${exam.id}`);
                        }}
                      >
                        <Trophy className="h-3.5 w-3.5 mr-2" /> {lang === 'en' ? 'Leaderboard' : 'লিডারবোর্ড'}
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {exams.length === 0 && (
        <div className="flex flex-col items-center justify-center p-20 rounded-3xl border border-dashed border-slate-200 bg-slate-50">
          <BookOpenCheck className="h-16 w-16 text-slate-300 mb-4" />
          <p className="text-lg font-bold text-slate-400">এখনো কোনো পরীক্ষা নেই</p>
          <p className="text-sm text-slate-400 mt-1">কোর্সে ভর্তি হলে পরীক্ষা দেখতে পাবেন</p>
        </div>
      )}
    </div>
  );
}
