'use client';

import Link from 'next/link';

export default function StudentAllCoursesPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-slate-900">All Courses</h1>
      <p className="text-slate-500">Browse available courses. Redirecting to main courses page.</p>
      <Link href="/courses" className="inline-block px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700">
        View Courses
      </Link>
    </div>
  );
}
