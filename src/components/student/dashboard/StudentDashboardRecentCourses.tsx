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
    <div className="lg:col-span-2 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">সাম্প্রতিক কাজ</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/student/exams"
            className="text-sm font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
          >
            পরীক্ষা <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/student/courses"
            className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            কোর্স <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="p-10 rounded-3xl bg-white border border-slate-100 text-center">
            <p className="font-bold text-slate-500">কোর্স লোড হচ্ছে…</p>
          </div>
        ) : courseCount === 0 ? (
          <div className="p-10 rounded-3xl bg-white border border-slate-100 text-center">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="font-bold text-slate-600">কোনো কোর্সে ভর্তি হননি</p>
            <Link
              href="/student/all-courses"
              className="inline-block mt-4 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700"
            >
              কোর্স দেখুন
            </Link>
          </div>
        ) : (
          courses.map((row) => {
            const cid = row.course?.id ?? row.courseId;
            const name = row.course?.name ?? 'কোর্স';
            const code = row.course?.slug;
            return (
              <Link
                key={row.id}
                href={`/student/courses/${cid}`}
                className="group flex items-center gap-4 p-5 rounded-3xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300"
              >
                <div className="h-16 w-16 rounded-2xl bg-slate-100 shrink-0 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-900 truncate">{name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    {code ? <span className="font-mono text-xs text-slate-400">{code}</span> : null}
                    {code ? <span className="h-1 w-1 rounded-full bg-slate-300" /> : null}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> চলমান
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="text-emerald-600 font-bold">চালিয়ে যান</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-indigo-600 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
