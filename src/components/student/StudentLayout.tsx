'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { StudentSidebar } from './StudentSidebar';
import { cn } from '@/lib/utils';

export function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('student-sidebar-collapsed');
    if (stored === 'true') {
      setSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('student-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prev || '';
    }
    return () => {
      document.body.style.overflow = prev || '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <StudentSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />
      <div
        className={cn(
          'relative min-h-screen transition-all duration-500 ease-in-out',
          sidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'
        )}
      >
        <header className="sticky top-0 z-40">
          <div className="absolute inset-0 border-b border-slate-200/50 bg-white/60 backdrop-blur-xl" />
          <div className="relative mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 lg:hidden"
                aria-label="Open student sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  শিক্ষার্থী পোর্টাল
                </p>
                <p className="truncate text-base font-bold text-slate-800">Spondon LMS</p>
              </div>
            </div>
            <Link
              href="/student/profile"
              className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-indigo-600 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 sm:inline-flex"
            >
              প্রোফাইল
            </Link>
          </div>
        </header>

        <main className="relative">
          <div className="mx-auto max-w-[1600px] px-3 py-6 sm:px-4 sm:py-8 lg:px-6 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
