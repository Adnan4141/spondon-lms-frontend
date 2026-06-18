import Link from 'next/link';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';
import type { MyCourseRow } from './types';

type Props = {
  loading: boolean;
  courseCount: number;
  courses: MyCourseRow[];
};

export function StudentDashboardRecentCourses({ loading, courseCount, courses }: Props) {
  return (
    <div className="space-y-6 lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Recent Activity</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/student/exams"
            className="flex items-center gap-1 text-sm font-bold text-sky-600 hover:text-sky-800"
          >
            Exams <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/student/courses"
            className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700"
          >
            Courses <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center">
            <p className="font-bold text-slate-500">Loading courses...</p>
          </div>
        ) : courseCount === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="font-bold text-slate-600">You are not enrolled in any courses yet</p>
            <Link
              href="/student/all-courses"
              className="mt-4 inline-block rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          courses.map((row) => {
            const cid = row.course?.slug ?? row.course?.id ?? row.courseId;
            const name = row.course?.name ?? 'Course';
            const code = row.course?.slug;
            const rowClass =
              'group flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50';
            const inner = (
              <>
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-black text-slate-900">{name}</h4>
                  <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                    {code ? <span className="font-mono text-xs text-slate-400">{code}</span> : null}
                    {code ? <span className="h-1 w-1 rounded-full bg-slate-300" /> : null}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> In progress
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="font-bold text-emerald-600">Continue</span>
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all group-hover:border-indigo-600 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </>
            );
            if (!cid) {
              return (
                <Link key={row.id} href="/student/courses" className={rowClass}>
                  {inner}
                </Link>
              );
            }
            return (
              <Link key={row.id} href={`/student/courses/${cid}`} className={rowClass}>
                {inner}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
