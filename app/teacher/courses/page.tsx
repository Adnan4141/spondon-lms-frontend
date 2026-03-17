'use client';

import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';

export default function TeacherCoursesPage() {
  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">My Lessons</h1>
        <p className="text-slate-500 text-lg font-medium">View and update what you teach your students.</p>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center max-w-2xl">
        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-8">
          <BookOpen className="h-10 w-10 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to manage your lessons?</h2>
        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
          You can add new content, update current lessons, and organize your teaching materials in the main manager.
        </p>
        <Link 
          href="/admin/courses" 
          className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
        >
          Open Lesson Manager
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
