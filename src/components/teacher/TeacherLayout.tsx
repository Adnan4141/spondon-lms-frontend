'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { PortalQueryProvider } from '@/components/providers/PortalQueryProvider';
import { GlobalModal } from '@/features/admin/shared/GlobalModal';
import { isTeacherExamFullBleedRoute } from '@/features/admin/exam-engine/exam-portal-paths';
import { TeacherSidebar } from './TeacherSidebar';
import { cn } from '@/lib/utils';
import { getCourseById } from '@/lib/api/courses';
import { resolveTeacherHeader } from './teacher-nav';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

export function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toasts, removeToast } = useToast();
  const isExamFullBleed = isTeacherExamFullBleedRoute(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('teacher-sidebar-collapsed') === 'true';
  });
  const [courseHeaderTitle, setCourseHeaderTitle] = useState<{
    courseId: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('teacher-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    const id = window.setTimeout(() => setMobileOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = mobileOpen ? 'hidden' : prev || '';
    return () => {
      document.body.style.overflow = prev || '';
    };
  }, [mobileOpen]);

  const courseIdFromPath = useMemo(() => {
    const cleanPath = (pathname || '').replace(/\/$/, '');
    const segments = cleanPath.split('/').filter(Boolean);
    if (segments[0] === 'teacher' && segments[1] === 'courses' && segments.length === 3) {
      return segments[2];
    }
    return undefined;
  }, [pathname]);

  useEffect(() => {
    if (!courseIdFromPath) {
      setCourseHeaderTitle(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const res = await getCourseById(courseIdFromPath);
        if (!cancelled && res.success && res.data?.name) {
          setCourseHeaderTitle({ courseId: courseIdFromPath, title: res.data.name });
        }
      } catch {
        // Keep route-based fallback title when fetch fails.
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [courseIdFromPath]);

  const headerContent = useMemo(() => resolveTeacherHeader(pathname), [pathname]);

  const resolvedHeaderTitle =
    courseIdFromPath && courseHeaderTitle?.courseId === courseIdFromPath
      ? courseHeaderTitle.title
      : headerContent.title;

  const resolvedHeaderSubtitle =
    courseIdFromPath && courseHeaderTitle?.courseId === courseIdFromPath
      ? 'Manage lessons and content'
      : headerContent.subtitle;

  return (
    <PortalQueryProvider>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
        <TeacherSidebar
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />
        <div
          className={cn(
            'relative min-h-screen transition-all duration-500 ease-in-out',
            sidebarCollapsed ? 'lg:pl-[5.5rem]' : 'lg:pl-[17.5rem]',
          )}
        >
          {!isExamFullBleed ? (
            <header className="sticky top-0 z-40">
              <div className="absolute inset-0 border-b border-slate-200/50 bg-white/60 backdrop-blur-xl" />
              <div className="relative mx-auto flex h-16 max-w-full items-center justify-between px-4 sm:px-6 lg:px-10">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 lg:hidden"
                    aria-label="Open teacher sidebar"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                      {resolvedHeaderTitle}
                    </p>
                    <p className="truncate text-xs font-semibold text-slate-500 sm:text-sm">
                      {resolvedHeaderSubtitle}
                    </p>
                  </div>
                </div>
              </div>
            </header>
          ) : null}

          <main className="relative">
            {isExamFullBleed ? (
              <div className="w-full min-w-0 max-w-full">{children}</div>
            ) : (
              <div className="mx-auto max-w-full px-3 py-6 sm:px-4 sm:py-8 lg:px-6 lg:py-10">
                {children}
              </div>
            )}
          </main>
        </div>
        <GlobalModal />
        <Toaster toasts={toasts} removeToast={removeToast} />
      </div>
    </PortalQueryProvider>
  );
}
