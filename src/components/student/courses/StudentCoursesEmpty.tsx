import Link from 'next/link';
import { Compass, GraduationCap } from 'lucide-react';

export function StudentCoursesEmpty() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-6 py-16 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md border border-slate-100 transition-transform duration-300 hover:scale-105">
        <GraduationCap className="h-7 w-7 text-indigo-500" strokeWidth={2} />
      </div>
      <h3 className="text-lg font-bold text-slate-800">No courses yet</h3>
      <p className="mx-auto mt-1.5 mb-6.5 max-w-sm text-sm font-semibold text-slate-400">
        Explore the academic program catalog and enroll in a course to start your learning journey.
      </p>
      <Link
        href="/courses"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/10 transition-all duration-200 hover:shadow-indigo-500/25 active:scale-[0.98]"
      >
        <Compass className="h-4 w-4" />
        Browse Courses
      </Link>
    </div>
  );
}
