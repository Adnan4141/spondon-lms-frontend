'use client';

import { AdminToastProvider } from '@/features/admin/shared/AdminToastProvider';

/**
 * Minimal shell for teachers evaluating scripts on /admin/exam/[id]/results
 * (no full admin sidebar).
 */
export function ExamResultsTeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminToastProvider>
      <div className="min-h-screen bg-[#F4F6FB] font-sans text-slate-900">
        <header className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Spondon LMS · Teacher</p>
        </header>
        <main className="mx-auto w-full max-w-full min-w-0 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </AdminToastProvider>
  );
}
