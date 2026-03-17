'use client';

import { TeacherSidebar } from './TeacherSidebar';

export function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TeacherSidebar />
      <main className="pl-72 min-h-screen">
        <div className="p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
