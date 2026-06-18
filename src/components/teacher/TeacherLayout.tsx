'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { PortalQueryProvider } from '@/components/providers/PortalQueryProvider';
import { TeacherSidebar } from './TeacherSidebar';
import { Button } from '@/components/ui/button';

export function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <PortalQueryProvider>
      <div className="min-h-screen bg-slate-100 text-slate-900">
      <TeacherSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl border-slate-200"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Spondon LMS</p>
          <p className="truncate text-sm font-black text-slate-900">Teacher</p>
        </div>
      </header>
      <main className="min-h-[calc(100dvh-52px)] lg:min-h-screen lg:pl-72">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">{children}</div>
      </main>
      </div>
    </PortalQueryProvider>
  );
}
