'use client';

import Link from 'next/link';

export default function TeacherCoursesPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-slate-900">My Courses</h1>
      <p className="text-slate-500">Manage your assigned courses. Use admin panel for full course management.</p>
      <Link href="/admin/courses" className="inline-block px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700">
        Manage Courses
      </Link>
    </div>
  );
}
