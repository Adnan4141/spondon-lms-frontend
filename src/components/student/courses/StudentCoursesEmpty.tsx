import Link from 'next/link';
import { Compass, GraduationCap } from 'lucide-react';

export function StudentCoursesEmpty() {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <GraduationCap className="h-7 w-7 text-slate-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">No courses yet</h3>
      <p className="mx-auto mt-1 mb-6 max-w-sm text-sm text-slate-500">
        Explore the catalog and enroll in a course to start learning.
      </p>
      <Link
        href="/courses"
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
      >
        <Compass className="h-4 w-4" />
        Browse Courses
      </Link>
    </div>
  );
}
