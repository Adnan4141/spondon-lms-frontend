'use client';

import Link from 'next/link';

export default function TeacherStudentsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-slate-900">Students</h1>
      <Link href="/admin/students" className="inline-block px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700">
        View Students
      </Link>
    </div>
  );
}
