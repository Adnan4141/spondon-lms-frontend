'use client';

import Link from 'next/link';

export default function TeacherQuestionsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-slate-900">Question Bank</h1>
      <Link href="/admin/questions" className="inline-block px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700">
        Manage Questions
      </Link>
    </div>
  );
}
