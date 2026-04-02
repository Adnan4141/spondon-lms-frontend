'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getCourses } from '@/lib/api/courses';
import { API_ORIGIN } from '@/lib/api';
import { getDoubtThreads, DoubtThread } from '@/lib/api/doubts';
import { getRoutineSlots, RoutineSlot } from '@/lib/api/routine';
import { getEnrollments } from '@/lib/api/enrollments';
import { getExams } from '@/lib/api/exams';
import { updateUser } from '@/lib/api/users';
import type { Course } from '@/types/course';
import {
  BookOpen,
  Calendar,
  ClipboardList,
  Clock,
  FileQuestion,
  GraduationCap,
  MessageCircle,
  Sparkles,
  Users,
  TrendingUp,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

export default function TeacherDashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoModal, setPhotoModal] = useState(false);
  const [photoInput, setPhotoInput] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [doubts, setDoubts] = useState<DoubtThread[]>([]);
  const [routine, setRoutine] = useState<RoutineSlot[]>([]);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [examStats, setExamStats] = useState<{ draft: number; published: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!raw) return;
      const u = JSON.parse(raw) as { id?: string; role?: string; fullName?: string; profileImage?: string };
      setUserId(u?.id ?? null);
      setDisplayName(u?.fullName?.trim() || 'Teacher');
      setPhotoUrl(u?.profileImage || null);
    } catch {
      setUserId(null);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [courseRes, doubtRes, routineRes, studentRes, examRes] = await Promise.all([
        getCourses({ teacherUserId: userId, limit: 100 }),
        getDoubtThreads({ teacherUserId: userId, status: 'OPEN' }),
        getRoutineSlots({ teacherUserId: userId, isActive: true }),
        getEnrollments({ teacherUserId: userId, limit: 1 }),
        getExams({ teacherUserId: userId, limit: 500 }),
      ]);

      if (courseRes.success && courseRes.data) setCourses(courseRes.data);
      if (doubtRes.success && doubtRes.data) setDoubts(doubtRes.data);
      if (routineRes.success && routineRes.data) setRoutine(routineRes.data);
      if (studentRes.success && studentRes.pagination) setStudentCount(studentRes.pagination.total);
      if (examRes.success && examRes.data) {
        const list = examRes.data;
        setExamStats({
          draft: list.filter((e) => e.status === 'DRAFT').length,
          published: list.filter((e) => e.status === 'PUBLISHED').length,
        });
      } else {
        setExamStats(null);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tools = [
    {
      title: 'Course manager',
      desc: 'Lessons, content & segments.',
      href: '/teacher/courses',
      icon: BookOpen,
      accent: 'from-blue-500/10 to-indigo-500/5 border-blue-100',
      iconBg: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Assessment center',
      desc: 'Create and grade tests.',
      href: '/teacher/exams',
      icon: ClipboardList,
      accent: 'from-violet-500/10 to-purple-500/5 border-violet-100',
      iconBg: 'bg-violet-100 text-violet-600',
    },
    {
      title: 'Question bank',
      desc: 'Prepare new resources.',
      href: '/teacher/questions',
      icon: FileQuestion,
      accent: 'from-amber-500/10 to-orange-500/5 border-amber-100',
      iconBg: 'bg-amber-100 text-amber-700',
    },
    {
      title: 'Student support',
      desc: 'Resolve doubts & inquiries.',
      href: '/teacher/doubts',
      icon: MessageCircle,
      accent: 'from-rose-500/10 to-pink-500/5 border-rose-100',
      iconBg: 'bg-rose-100 text-rose-600',
    },
  ];

  const today = new Date().getDay();
  const todaysClasses = routine.filter(slot => slot.dayOfWeek === today).sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (!userId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white/50 p-12 text-center backdrop-blur-sm">
        <div className="mb-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50">
          <GraduationCap className="h-12 w-12 text-slate-300" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Welcome back!</h2>
        <p className="mt-2 max-w-xs font-medium text-slate-500">Sign in to your professional teacher account to manage your workspace.</p>
        <Button asChild className="mt-8 h-12 rounded-2xl bg-slate-900 px-8 font-black uppercase tracking-widest text-[11px] text-white shadow-xl shadow-slate-200 transition-all hover:bg-indigo-600">
          <Link href="/login">Go to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-12 pb-20">
      <header className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
            <Sparkles className="h-3 w-3" />
            Premium instructor portal
          </div>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center text-xl font-black text-slate-500">
              {photoUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl.startsWith('/') ? `${API_ORIGIN}${photoUrl}` : photoUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                </>
              ) : (
                displayName.slice(0, 1)
              )}
              </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                Hi, {displayName.split(' ')[0]} <span className="inline-block animate-bounce-slow">👋</span>
              </h1>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => { setPhotoInput(photoUrl || ''); setPhotoModal(true); }}>
                Update photo
              </Button>
            </div>
          </div>
          <p className="text-lg font-medium text-slate-500">
            You have <strong className="text-slate-900">{loading ? '…' : courses.length} active courses</strong> and <strong className="text-slate-900">{studentCount} enrolled students</strong>.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="h-12 rounded-2xl border-slate-200 bg-white px-6 font-black uppercase tracking-widest text-[10px] text-slate-600 shadow-sm transition-all hover:bg-slate-50">
             <Link href="/teacher/students">
               <Users className="mr-2 h-4 w-4" />
               Class list
             </Link>
          </Button>
          <Button asChild className="h-12 rounded-2xl bg-indigo-600 px-6 font-black uppercase tracking-widest text-[10px] text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-95">
             <Link href="/teacher/doubts">
               <MessageCircle className="mr-2 h-4 w-4" />
               Pending doubts
             </Link>
          </Button>
        </div>
      </header>

      <section className="flex flex-col gap-4 rounded-[2rem] border border-violet-100 bg-gradient-to-r from-violet-50/80 to-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">Assessment center</p>
          <p className="mt-1 text-lg font-black text-slate-900">
            {loading
              ? '…'
              : examStats
                ? `${examStats.published} published · ${examStats.draft} drafts`
                : 'No exam data'}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-500">Build question sets from a plan and manage exams in one place.</p>
        </div>
        <Button
          asChild
          className="h-12 shrink-0 rounded-2xl bg-violet-600 px-8 font-black uppercase tracking-widest text-[10px] text-white shadow-lg shadow-violet-100 hover:bg-violet-700"
        >
          <Link href="/teacher/exams">
            <ClipboardList className="mr-2 h-4 w-4" />
            Exams
          </Link>
        </Button>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Assigned courses', value: loading ? '—' : String(courses.length), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total students', value: loading ? '—' : String(studentCount), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/teacher/students' },
          { label: 'Pending doubts', value: loading ? '—' : String(doubts.length), icon: MessageCircle, color: 'text-rose-600', bg: 'bg-rose-50', link: '/teacher/doubts' },
          { label: 'Today\'s classes', value: loading ? '—' : String(todaysClasses.length), icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map((card) => (
          card.link ? (
            <Link
              key={card.label}
              href={card.link}
              className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1"
            >
              <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110", card.bg, card.color)}>
                <card.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
              <p className="mt-1 text-3xl font-black text-slate-900">{card.value}</p>
            </Link>
          ) : (
            <div
              key={card.label}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-2xl", card.bg, card.color)}>
                <card.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
              <p className="mt-1 text-3xl font-black text-slate-900">{card.value}</p>
            </div>
          )
        ))}
      </section>

      <div className="grid gap-10 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-8">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Today&apos;s routine</h2>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{format(new Date(), 'EEEE, MMM do')}</span>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-3xl bg-slate-50 animate-pulse" />
                ))
              ) : todaysClasses.length > 0 ? (
                todaysClasses.map((slot) => (
                  <div key={slot.id} className="group flex items-center gap-6 rounded-3xl border border-slate-100 bg-slate-50/30 p-5 transition-all hover:bg-white hover:border-indigo-100 hover:shadow-lg">
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                      <span className="text-xs font-black">{slot.startTime.split(':')[0]}</span>
                      <span className="text-[10px] font-bold opacity-60">:{slot.startTime.split(':')[1]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex rounded-lg bg-indigo-50 px-2 py-0.5 text-[9px] font-black uppercase text-indigo-600">
                          {slot.mode}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{slot.branch?.name}</span>
                      </div>
                      <h4 className="mt-1 truncate text-lg font-black text-slate-900">{slot.course?.name}</h4>
                      <p className="truncate text-xs font-bold text-slate-500">
                        {slot.batch?.name} {slot.room ? `• Room: ${slot.room}` : ''}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-indigo-600 hover:bg-indigo-50" asChild>
                      <Link href={`/teacher/courses/${slot.courseId}`}>Course hub</Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-4 rounded-full bg-slate-50 p-4">
                    <Clock className="h-8 w-8 text-slate-200" />
                  </div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No classes today</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Enjoy your free time or prepare lessons!</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
             <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Control center</h2>
              </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {tools.map((tool) => (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className={cn(
                    'group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300',
                    'hover:-translate-y-1 hover:shadow-xl',
                    tool.accent
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-110',
                        tool.iconBg
                      )}
                    >
                      <tool.icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{tool.title}</h3>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500 line-clamp-2">{tool.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Recent doubts</h2>
              </div>
              <Link href="/teacher/doubts" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline">All</Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl bg-slate-50 animate-pulse" />
                ))
              ) : doubts.length > 0 ? (
                doubts.slice(0, 5).map((doubt) => (
                  <Link
                    key={doubt.id}
                    href={`/teacher/doubts/${doubt.id}`}
                    className="group block rounded-2xl border border-slate-100 bg-slate-50/20 p-4 transition-all hover:bg-white hover:border-indigo-100 hover:shadow-md"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{doubt.courseId || 'Doubt'}</p>
                    <h4 className="mt-1 truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{doubt.title}</h4>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">{(doubt as unknown as { student?: { fullName?: string } }).student?.fullName || 'Student'}</span>
                      <span className="text-[10px] font-bold text-slate-400">{format(new Date(doubt.createdAt), 'MMM d')}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-4 rounded-full bg-slate-50 p-4 text-slate-200">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inbox is clear</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm overflow-hidden relative">
            <div className="relative z-10">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 leading-tight">Growth & analytics</h3>
              <p className="mt-2 text-sm font-medium text-slate-500">Track your teaching progress and student engagement scores coming soon.</p>
            </div>
            <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-indigo-50/50" />
          </div>
        </section>
      </div>
    </div>

    <Dialog open={photoModal} onOpenChange={setPhotoModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update profile photo</DialogTitle>
          <DialogDescription>Use a public image URL.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={photoInput} onChange={(e) => setPhotoInput(e.target.value)} placeholder="https://…" />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setPhotoModal(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!userId) return;
              try {
                await updateUser(userId, { profileImage: photoInput || null });
                setPhotoUrl(photoInput || null);
                setPhotoModal(false);
              } catch (err) {
                console.error(err);
              }
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
