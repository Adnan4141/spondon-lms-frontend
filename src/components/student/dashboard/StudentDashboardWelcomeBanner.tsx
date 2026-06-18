import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { StudentChangePasswordDialog } from '@/components/student/StudentChangePasswordDialog';

type Props = {
  userName: string;
};

export function StudentDashboardWelcomeBanner({ userName }: Props) {
  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-10 text-white shadow-2xl shadow-indigo-200">
      <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">Welcome back, {userName}</h1>
          <p className="max-w-md text-lg font-medium text-indigo-100">
            View your courses, take exams, and stay on track with your routine.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/student/courses"
              className="rounded-2xl bg-white px-6 py-3 text-sm font-bold text-indigo-600 shadow-lg transition-colors hover:bg-indigo-50"
            >
              My Courses
            </Link>
            <Link
              href="/student/exams"
              className="rounded-2xl border border-white/25 bg-white/15 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              View Exams
            </Link>
            <Link
              href="/student/books#my-books"
              className="rounded-2xl border border-white/25 bg-white/15 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              My Books
            </Link>
            <Link
              href="/student/routine"
              className="rounded-2xl border border-indigo-400/30 bg-indigo-500/30 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-indigo-500/40"
            >
              View Routine
            </Link>
            <StudentChangePasswordDialog />
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="relative flex h-48 w-48 items-center justify-center">
            <div className="absolute inset-0 animate-pulse rounded-full bg-white/10" />
            <div className="absolute inset-4 animate-ping rounded-full bg-white/10" />
            <GraduationCap className="relative z-10 h-24 w-24 text-white" />
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 h-64 w-64 translate-x-12 -translate-y-12 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-12 translate-y-12 rounded-full bg-indigo-400/20 blur-3xl" />
    </div>
  );
}
