'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import {
  BookOpen,
  Calendar,
  ClipboardList,
  Clock,
  FileQuestion,
  GraduationCap,
  LayoutGrid,
  Loader2,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react';
import { API_ORIGIN } from '@/lib/api';
import { useTeacherDashboard } from '@/lib/query/hooks/useTeacherDashboard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTeacherSession } from '@/components/teacher/useTeacherSession';

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

export function TeacherDashboardContent() {
  const { user, authChecked } = useTeacherSession();
  const { data, isLoading, isFetching, refetch, error } = useTeacherDashboard(user?.id);

  const loading = !authChecked || isLoading || (isFetching && !data);
  const courses = data?.courses ?? [];
  const doubts = data?.doubts ?? [];
  const routine = data?.routine ?? [];
  const studentCount = data?.studentCount ?? 0;
  const examStats = data?.examStats ?? { draft: 0, published: 0 };

  const today = new Date().getDay();
  const todaysClasses = routine
    .filter((slot) => slot.dayOfWeek === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const displayName = user?.fullName?.trim() || 'Teacher';
  const photoUrl = user?.profileImage || null;

  if (!authChecked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <div className="mb-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50">
          <GraduationCap className="h-12 w-12 text-slate-300" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Welcome back!</h2>
        <p className="mt-2 max-w-xs font-medium text-slate-500">
          Sign in to your teacher account to manage your workspace.
        </p>
        <Button asChild className="mt-8 h-12 rounded-2xl bg-slate-900 px-8 font-bold text-white hover:bg-indigo-600">
          <Link href="/login">Go to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-lg font-black text-slate-500">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl.startsWith('/') ? `${API_ORIGIN}${photoUrl}` : photoUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              displayName.slice(0, 1)
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-600">Teacher portal</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Hi, {displayName.split(' ')[0]}
            </h1>
            <p className="text-sm font-medium text-slate-500">
              {loading ? 'Loading…' : `${courses.length} courses · ${studentCount} students`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void refetch()}
            disabled={loading}
            className="gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button asChild variant="outline">
            <Link href="/teacher/students">
              <Users className="mr-2 h-4 w-4" />
              Class list
            </Link>
          </Button>
          <Button asChild>
            <Link href="/teacher/doubts">
              <MessageCircle className="mr-2 h-4 w-4" />
              Pending doubts
            </Link>
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          Failed to load dashboard data. Try refreshing.
        </div>
      ) : null}

      <Card className="rounded-xl border-violet-100 bg-gradient-to-r from-violet-50/80 to-white shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Assessment center</p>
            <p className="mt-1 text-lg font-black text-slate-900">
              {loading ? '…' : `${examStats.published} published · ${examStats.draft} drafts`}
            </p>
            <p className="mt-1 text-sm text-slate-500">Build question sets and manage exams.</p>
          </div>
          <Button asChild className="shrink-0 bg-violet-600 hover:bg-violet-700">
            <Link href="/teacher/exams">
              <ClipboardList className="mr-2 h-4 w-4" />
              Exams
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Assigned courses', value: loading ? '—' : String(courses.length), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total students', value: loading ? '—' : String(studentCount), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/teacher/students' },
          { label: 'Pending doubts', value: loading ? '—' : String(doubts.length), icon: MessageCircle, color: 'text-rose-600', bg: 'bg-rose-50', link: '/teacher/doubts' },
          { label: "Today's classes", value: loading ? '—' : String(todaysClasses.length), icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50', link: '/teacher/routine' },
        ].map((card) => {
          const inner = (
            <>
              <div className={cn('mb-3 flex h-11 w-11 items-center justify-center rounded-lg', card.bg, card.color)}>
                <card.icon className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{card.value}</p>
            </>
          );

          if (card.link) {
            return (
              <Link
                key={card.label}
                href={card.link}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
              >
                {inner}
              </Link>
            );
          }

          return (
            <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              {inner}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          <Card className="rounded-xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900">Today&apos;s routine</h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {format(new Date(), 'EEEE, MMM do')}
                  </span>
                  <Button asChild variant="ghost" size="sm" className="text-indigo-600">
                    <Link href="/teacher/routine">View all</Link>
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-50" />
                  ))
                ) : todaysClasses.length > 0 ? (
                  todaysClasses.map((slot) => (
                    <div
                      key={slot.id}
                      className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/40 p-4 transition-all hover:border-indigo-100 hover:bg-white hover:shadow-sm"
                    >
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm">
                        <span className="text-xs font-black">{slot.startTime.split(':')[0]}</span>
                        <span className="text-[10px] font-bold opacity-60">:{slot.startTime.split(':')[1]}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex rounded-lg bg-indigo-50 px-2 py-0.5 text-[9px] font-black uppercase text-indigo-600">
                            {slot.mode}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {slot.branch?.name}
                          </span>
                        </div>
                        <h4 className="mt-1 truncate font-bold text-slate-900">{slot.course?.name}</h4>
                        <p className="truncate text-xs font-medium text-slate-500">{slot.batch?.name}</p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/teacher/courses/${slot.courseId}`}>Open</Link>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <Clock className="mx-auto mb-3 h-8 w-8 text-slate-200" />
                    <p className="text-sm font-semibold text-slate-400">No classes today</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black text-slate-900">Quick links</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {tools.map((tool) => (
                  <Link
                    key={tool.title}
                    href={tool.href}
                    className={cn(
                      'group rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md',
                      tool.accent,
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tool.iconBg)}>
                        <tool.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600">{tool.title}</h3>
                        <p className="mt-0.5 text-xs text-slate-500">{tool.desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="rounded-xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900">Recent doubts</h2>
                </div>
                <Link href="/teacher/doubts" className="text-xs font-bold text-indigo-600 hover:underline">
                  All
                </Link>
              </div>
              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-50" />
                  ))
                ) : doubts.length > 0 ? (
                  doubts.slice(0, 5).map((doubt) => (
                    <Link
                      key={doubt.id}
                      href={`/teacher/doubts/${doubt.id}`}
                      className="block rounded-xl border border-slate-100 p-3 transition-all hover:border-indigo-100 hover:bg-indigo-50/30"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                        {doubt.course?.name || 'Doubt'}
                      </p>
                      <h4 className="mt-0.5 truncate text-sm font-bold text-slate-900">{doubt.title}</h4>
                      <div className="mt-1 flex items-center justify-between text-[10px] font-medium text-slate-400">
                        <span>{doubt.student?.fullName || 'Student'}</span>
                        <span>{format(new Date(doubt.createdAt), 'MMM d')}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <Sparkles className="mx-auto mb-3 h-8 w-8 text-slate-200" />
                    <p className="text-xs font-semibold text-slate-400">Inbox is clear</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
