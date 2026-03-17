'use client';

import { StudentSidebar } from './StudentSidebar';

export function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <StudentSidebar />
      <main className="pl-72 min-h-screen">
        <div className="p-10 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
