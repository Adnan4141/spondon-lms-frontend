'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentExamsList } from '@/lib/query/hooks/useStudentExamsList';
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
  PenLine,
  CalendarClock,
  Search,
  SlidersHorizontal,
  X,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isOfflineDeliveryExam } from '@/lib/exam-workflow';
import {
  centreQuestionPaperCopy,
  offlineInstructionsCta,
  offlineResultStatusLabel,
} from '@/features/student/exam-state';

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
      return 'bg-blue-50 text-blue-800 border-blue-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

function timeRemaining(endAt: string | null | undefined): string | null {
  if (!endAt) return null;
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

function latestAttempt(exam: Exam) {
  return exam.studentAttempts?.[exam.studentAttempts.length - 1];
}

function writtenStatusLabel(exam: Exam) {
  const attempt = latestAttempt(exam);
  if (exam.hasInProgress) return 'Upload in progress';
  if (!attempt) return 'Not started';
  if (attempt.obtainedMarks == null || attempt.totalMarks == null) {
    return 'Teacher evaluation pending';
  }
  return 'Evaluated';
}

function writtenPrimaryAction(exam: Exam) {
  const attempt = latestAttempt(exam);
  if (exam.hasInProgress) return 'Continue upload';
  if (!attempt) return 'Start upload';
  if (attempt.obtainedMarks == null || attempt.totalMarks == null) return 'View submission';
  return 'View result';
}

function resultStatusLabel(exam: Exam): string | null {
  return offlineResultStatusLabel(exam.resultStatus);
}

export function StudentExamsPageContent() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | undefined>();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      setAuthError('Please log in to view your exams');
      return;
    }
    try {
      const user = JSON.parse(userStr) as { id?: string };
      if (user?.id) setStudentId(user.id);
      else setAuthError('Please log in to view your exams');
    } catch {
      setAuthError('Please log in to view your exams');
    }
  }, []);

  const {
    data: exams = [],
    isLoading: examsLoading,
    error: queryError,
  } = useStudentExamsList(studentId);

  const loading = authError ? false : !studentId ? true : examsLoading;
  const error =
    authError ??
    (queryError instanceof Error ? queryError.message : queryError ? 'Failed to load exams' : null);

  // Unified exam items mapping
  const unifiedExams = exams.map((e) => {
    const isOffline = isOfflineDeliveryExam(e);
    const isWritten = !isOffline && (e.mode === 'WRITTEN' || e.mode === 'HYBRID');

    const attempt = latestAttempt(e);
    const attemptCount = e.studentAttempts?.length ?? 0;

    // Calculate countdown for upcoming
    let countdown: string | null = null;
    if (e.startAt) {
      const startDate = new Date(e.startAt);
      const diff = startDate.getTime() - Date.now();
      if (diff > 0) {
        const totalHours = Math.floor(diff / 3600000);
        countdown = totalHours >= 24
          ? `${Math.floor(totalHours / 24)} days left`
          : totalHours > 0
            ? `${totalHours} hours left`
            : `${Math.max(1, Math.floor((diff % 3600000) / 60000))} mins left`;
      }
    }

    const remaining = timeRemaining(e.endAt);

    // Classification
    const start = e.startAt ? new Date(e.startAt).getTime() : null;
    const isUpcoming = start ? start > Date.now() && attemptCount === 0 : false;
    
    // For online and written: completed means attempts exist and they cannot attempt further
    // For offline: completed means result is published or legacy result, or attempts exist
    const isCompleted = isOffline
      ? (e.resultStatus === 'PUBLISHED' || e.resultStatus === 'LEGACY_RESULT' || attemptCount > 0)
      : (!e.canAttempt && !e.hasInProgress && attemptCount > 0);

    const isActive = !isUpcoming && !isCompleted;

    return {
      exam: e,
      id: e.id,
      title: e.title,
      courseName: e.course?.name ?? 'General',
      type: e.type,
      mode: isOffline ? 'OFFLINE' : e.mode,
      startAt: e.startAt,
      endAt: e.endAt,
      durationMinutes: e.durationMinutes,
      allowedAttempts: e.allowedAttempts ?? 1,
      studentAttemptsCount: attemptCount,
      latestAttempt: attempt,
      isActive,
      isUpcoming,
      isCompleted,
      countdown,
      remaining,
      writtenStatus: isWritten ? writtenStatusLabel(e) : undefined,
      writtenAction: isWritten ? writtenPrimaryAction(e) : undefined,
      offlineResultStatus: isOffline ? resultStatusLabel(e) : null,
      canAttempt: !!e.canAttempt,
      hasInProgress: !!e.hasInProgress,
      showLeaderboard: !!e.showLeaderboard,
    };
  });

  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'completed' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  const uniqueCourses = Array.from(
    new Set(unifiedExams.map((item) => item.courseName).filter(Boolean))
  );
  const uniqueTypes = Array.from(
    new Set(unifiedExams.map((item) => item.type).filter(Boolean))
  );

  const filteredExams = unifiedExams.filter((item) => {
    // Tab filter
    if (activeTab === 'active' && !item.isActive) return false;
    if (activeTab === 'upcoming' && !item.isUpcoming) return false;
    if (activeTab === 'completed' && !item.isCompleted) return false;

    // Search query
    if (
      searchQuery &&
      !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.courseName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Mode filter
    if (selectedMode !== 'all') {
      if (selectedMode === 'WRITTEN') {
        if (item.mode !== 'WRITTEN' && item.mode !== 'HYBRID') return false;
      } else {
        if (item.mode !== selectedMode) return false;
      }
    }

    // Type filter
    if (selectedType !== 'all' && item.type !== selectedType) {
      return false;
    }

    // Course filter
    if (selectedCourse !== 'all' && item.courseName !== selectedCourse) {
      return false;
    }

    return true;
  });

  const totalExams = exams.length;
  const activeCount = unifiedExams.filter((item) => item.isActive).length;
  const upcomingCount = unifiedExams.filter((item) => item.isUpcoming).length;
  const completedCount = unifiedExams.filter((item) => item.isCompleted).length;

  // Average performance
  const examsWithScores = unifiedExams.filter((item) => {
    const la = item.latestAttempt;
    return la && la.obtainedMarks != null && la.totalMarks != null && la.totalMarks > 0;
  });
  const avgScore = examsWithScores.length > 0
    ? Math.round(
        (examsWithScores.reduce((acc, item) => {
          const la = item.latestAttempt!;
          return acc + (la.obtainedMarks! / la.totalMarks!);
        }, 0) / examsWithScores.length) * 100
      )
    : null;

  return (
    <div className={cn('mx-auto w-full max-w-full space-y-8 px-4 py-8 sm:px-6')}>
      {/* Banner / Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 text-white p-6 md:p-8 shadow-md border border-slate-850">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/20 text-xs font-semibold text-indigo-200">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              Student Portal
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              My Examination Dashboard
            </h1>
            <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed">
              Access and manage all your scheduled assessments, practice tests, written submissions, and view graded results.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-center min-w-[130px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Exams</span>
              <span className="text-2xl font-black mt-1 text-white">{totalExams}</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-center min-w-[130px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Active
              </span>
              <span className="text-2xl font-black mt-1 text-white">{activeCount}</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-center min-w-[130px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Upcoming</span>
              <span className="text-2xl font-black mt-1 text-white">{upcomingCount}</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-center min-w-[130px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Avg Performance</span>
              <span className="text-2xl font-black mt-1 text-white">
                {avgScore != null ? `${avgScore}%` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls: Search, Filters & Tabs */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200/60 shadow-inner">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by exam title or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Mode Select */}
            <div className="relative">
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="h-11 px-3.5 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-black uppercase tracking-wider text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="all">All Modes</option>
                <option value="ONLINE">Online</option>
                <option value="WRITTEN">Written / Hybrid</option>
                <option value="OFFLINE">Offline</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none border-l border-slate-200 pl-1.5 text-slate-400">
                ▼
              </div>
            </div>

            {/* Type Select */}
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="h-11 px-3.5 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-black uppercase tracking-wider text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none border-l border-slate-200 pl-1.5 text-slate-400">
                ▼
              </div>
            </div>

            {/* Course Select */}
            <div className="relative">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="h-11 px-3.5 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-black uppercase tracking-wider text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer max-w-[200px]"
              >
                <option value="all">All Courses</option>
                {uniqueCourses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none border-l border-slate-200 pl-1.5 text-slate-400">
                ▼
              </div>
            </div>

            {/* Reset Filters */}
            {(searchQuery || selectedMode !== 'all' || selectedType !== 'all' || selectedCourse !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedMode('all');
                  setSelectedType('all');
                  setSelectedCourse('all');
                }}
                className="h-11 px-4 rounded-xl border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50/50 text-xs font-black uppercase tracking-wider"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Tab Controls */}
        <div className="border-b border-slate-200">
          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-px">
            {(['active', 'upcoming', 'completed', 'all'] as const).map((tab) => {
              const label =
                tab === 'active'
                  ? 'Active / Available'
                  : tab === 'upcoming'
                    ? 'Upcoming'
                    : tab === 'completed'
                      ? 'Completed & Results'
                      : 'All Exams';
              
              const count =
                tab === 'active'
                  ? activeCount
                  : tab === 'upcoming'
                    ? upcomingCount
                    : tab === 'completed'
                      ? completedCount
                      : totalExams;

              const isSelected = activeTab === tab;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex items-center gap-2 pb-4 text-sm font-black uppercase tracking-wider border-b-2 transition-all relative shrink-0",
                    isSelected
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tab === 'active' && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                  {tab === 'upcoming' && <CalendarClock className="h-4 w-4" />}
                  {tab === 'completed' && <CheckCircle2 className="h-4 w-4" />}
                  <span>{label}</span>
                  <span className={cn(
                    "ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-black",
                    isSelected ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Exams Grid */}
      {filteredExams.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredExams.map((item) => {
            const { exam } = item;
            
            // Badge style classes
            const modeBadge =
              item.mode === 'ONLINE'
                ? { label: 'Online', bg: 'bg-cyan-50 text-cyan-800 border-cyan-205' }
                : item.mode === 'OFFLINE'
                  ? { label: 'Offline', bg: 'bg-orange-50 text-orange-850 border-orange-205' }
                  : { label: item.mode, bg: 'bg-violet-50 text-violet-850 border-violet-205' };

            const typeBadge = getTypeBadgeClass(item.type);

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (item.isCompleted) {
                    router.push(`/student/exams/${item.id}?view=result`);
                  } else {
                    router.push(`/student/exams/${item.id}`);
                  }
                }}
                className={cn(
                  "group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-300 cursor-pointer",
                  "hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-305"
                )}
              >
                <div>
                  {/* Badges row */}
                  <div className="flex flex-wrap gap-2 items-center mb-3">
                    <Badge variant="outline" className={cn("rounded-lg text-[9px] font-black uppercase px-2 py-0.5 shadow-2xs", modeBadge.bg)}>
                      {modeBadge.label}
                    </Badge>
                    <Badge variant="outline" className={cn("rounded-lg text-[9px] font-black uppercase px-2 py-0.5 shadow-2xs", typeBadge)}>
                      {item.type.replace(/_/g, ' ')}
                    </Badge>
                    {exam.examEngine && exam.examEngine !== 'REGULAR' && (
                      <Badge variant="outline" className={cn("rounded-lg text-[9px] font-black uppercase px-2 py-0.5 shadow-2xs", getEngineBadgeClass(exam.examEngine))}>
                        {exam.examEngine.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>

                  {/* Title & Course */}
                  <h3 className="text-base font-black text-slate-800 group-hover:text-indigo-600 transition-colors duration-200 line-clamp-2 min-h-[3rem] flex items-start">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mt-1 mb-4">
                    <BookOpen className="h-3.5 w-3.5 text-slate-350" />
                    <span>{item.courseName}</span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100 my-3" />

                  {/* Details depending on tab / status */}
                  <div className="space-y-2 mt-3">
                    {/* Time / Duration info */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500">
                      {item.durationMinutes ? (
                        <div className="flex items-center gap-1.5">
                          <Timer className="h-3.5 w-3.5 text-indigo-400" />
                          <span>{item.durationMinutes} min</span>
                        </div>
                      ) : null}
                      
                      {item.countdown ? (
                        <div className="flex items-center gap-1.5 text-indigo-650 bg-indigo-50/50 px-2 py-0.5 rounded-lg border border-indigo-100">
                          <CalendarClock className="h-3.5 w-3.5" />
                          <span>{item.countdown}</span>
                        </div>
                      ) : item.remaining ? (
                        <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50/50 px-2 py-0.5 rounded-lg border border-amber-100">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{item.remaining}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Status Box for Written / Offline / Completed */}
                    {item.mode === 'OFFLINE' ? (
                      <div className="rounded-xl bg-orange-50/40 border border-orange-100 p-3 mt-3 space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-orange-850 flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> Offline Venue Exam
                        </p>
                        <p className="text-[11px] font-bold leading-relaxed text-slate-650">
                          {centreQuestionPaperCopy()}
                        </p>
                        {item.offlineResultStatus && (
                          <div className="inline-block rounded-lg bg-orange-100/50 border border-orange-250 px-2.5 py-1 text-[10px] font-black text-orange-950 mt-1">
                            {item.offlineResultStatus}
                          </div>
                        )}
                      </div>
                    ) : item.mode === 'WRITTEN' || item.mode === 'HYBRID' ? (
                      <div className="rounded-xl bg-violet-50/40 border border-violet-100 p-3 mt-3 space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-violet-850 flex items-center gap-1">
                          <PenLine className="h-3 w-3" />
                          {item.mode === 'HYBRID' ? 'MCQ + Written Upload' : 'Written Submission'}
                        </p>
                        <p className="text-xs font-black text-slate-700">
                          {item.writtenStatus}
                        </p>
                      </div>
                    ) : null}

                    {/* Score display for Completed */}
                    {item.isCompleted && item.latestAttempt && (
                      <div className="rounded-xl bg-emerald-50/40 border border-emerald-100 p-3 mt-3 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-850 flex items-center gap-1">
                            <Trophy className="h-3 w-3" /> Obtained Score
                          </p>
                          <p className="text-xs font-black text-slate-700 mt-0.5">
                            Attempt {item.studentAttemptsCount} / {item.allowedAttempts}
                          </p>
                        </div>
                        {item.latestAttempt.obtainedMarks != null && item.latestAttempt.totalMarks != null ? (
                          <div className="text-right">
                            <span className="text-sm font-black text-emerald-700">
                              {item.latestAttempt.obtainedMarks} / {item.latestAttempt.totalMarks}
                            </span>
                            {item.latestAttempt.totalMarks > 0 && (
                              <p className="text-[10px] font-black text-slate-400">
                                {Math.round((item.latestAttempt.obtainedMarks / item.latestAttempt.totalMarks) * 100)}% Score
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2 py-0.5">
                            Grading Pending
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
                  {item.isUpcoming ? (
                    <Button
                      variant="outline"
                      className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] text-slate-500 border-slate-200 pointer-events-none"
                    >
                      <Clock className="h-3.5 w-3.5 mr-2" />
                      Starts in countdown
                    </Button>
                  ) : item.isCompleted ? (
                    <>
                      <Button
                        variant="outline"
                        className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] text-slate-750 border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/student/exams/${item.id}?view=result`);
                        }}
                      >
                        <FileText className="h-3.5 w-3.5 mr-2" />
                        {item.mode === 'WRITTEN' || item.mode === 'HYBRID' ? item.writtenAction : 'View Results'}
                      </Button>
                      
                      {item.studentAttemptsCount < item.allowedAttempts && (
                        <Button
                          className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm shadow-orange-100 transition-all duration-200 border-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/student/exams/${item.id}`);
                          }}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-2" />
                          Re-attempt
                        </Button>
                      )}
                    </>
                  ) : (
                    /* Active */
                    <>
                      {item.mode === 'OFFLINE' ? (
                        <Button
                          className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm shadow-orange-100 transition-all duration-200 border-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/student/exams/${item.id}`);
                          }}
                        >
                          <Building2 className="h-3.5 w-3.5 mr-2" />
                          {offlineInstructionsCta()}
                        </Button>
                      ) : item.mode === 'WRITTEN' || item.mode === 'HYBRID' ? (
                        <Button
                          className={cn(
                            "w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] text-white border-0 shadow-sm transition-all duration-200",
                            item.hasInProgress 
                              ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-100" 
                              : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-100"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/student/exams/${item.id}`);
                          }}
                        >
                          {item.hasInProgress ? (
                            <><RotateCcw className="h-3.5 w-3.5 mr-2" /> {item.writtenAction}</>
                          ) : (
                            <><PenLine className="h-3.5 w-3.5 mr-2" /> {item.writtenAction}</>
                          )}
                        </Button>
                      ) : (
                        /* ONLINE */
                        <Button
                          className={cn(
                            "w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] text-white border-0 shadow-sm transition-all duration-200",
                            item.hasInProgress 
                              ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-100" 
                              : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-100"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/student/exams/${item.id}`);
                          }}
                        >
                          {item.hasInProgress ? (
                            <><RotateCcw className="h-3.5 w-3.5 mr-2" /> Return to Exam</>
                          ) : (
                            <><Play className="h-3.5 w-3.5 mr-2" /> Start Exam</>
                          )}
                        </Button>
                      )}
                    </>
                  )}

                  {item.showLeaderboard && (
                    <Button
                      variant="outline"
                      className="w-full h-9 rounded-xl font-black uppercase tracking-widest text-[10px] border-slate-200 text-slate-705 hover:bg-slate-50 transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/student/leaderboard/${item.id}`);
                      }}
                    >
                      <Trophy className="h-3.5 w-3.5 mr-2 text-amber-500" />
                      Leaderboard
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-16 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
          <BookOpenCheck className="h-14 w-14 text-slate-300 mb-4" />
          <h3 className="text-base font-black text-slate-700 uppercase tracking-wider">No exams found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm font-semibold leading-relaxed">
            {searchQuery || selectedMode !== 'all' || selectedType !== 'all' || selectedCourse !== 'all'
              ? "We couldn't find any exams matching your current search or filter options. Try resetting them."
              : "You do not have any exams in this section yet."}
          </p>
          {(searchQuery || selectedMode !== 'all' || selectedType !== 'all' || selectedCourse !== 'all') && (
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedMode('all');
                setSelectedType('all');
                setSelectedCourse('all');
              }}
              className="mt-6 h-10 rounded-xl px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px]"
            >
              Reset Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
