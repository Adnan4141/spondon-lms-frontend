'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { StudentSidebar } from './StudentSidebar';
import { cn } from '@/lib/utils';
import { getExamStudentView } from '@/lib/api/exams';

const STUDENT_ROUTE_LABELS: Record<string, { title: string; subtitle?: string }> = {
  '/student': { title: 'Dashboard', subtitle: 'Welcome back to your student portal' },
  '/student/community': { title: 'Community', subtitle: 'Join discussions and share updates' },
  '/student/courses': { title: 'My Courses', subtitle: 'Track your enrolled learning paths' },
  '/student/all-courses': { title: 'All Courses', subtitle: 'Explore the full course catalog' },
  '/student/exams': { title: 'Exams', subtitle: 'Check upcoming and completed assessments' },
  '/student/books': { title: 'Books', subtitle: 'Manage your books and reading resources' },
  '/student/results': { title: 'Results', subtitle: 'Review your performance and outcomes' },
  '/student/routine': { title: 'Routine', subtitle: 'Follow your weekly class schedule' },
  '/student/payment': { title: 'Payments', subtitle: 'View invoices and payment history' },
  '/student/profile': { title: 'Profile', subtitle: 'Update your personal information' },
  '/student/doubts': { title: 'Q&A', subtitle: 'Ask questions and get support' },
};

function startCase(segment: string) {
  return segment
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function resolveStudentHeader(pathname: string | null) {
  if (!pathname) return { title: 'Dashboard', subtitle: 'Welcome back to your student portal' };
  if (STUDENT_ROUTE_LABELS[pathname]) return STUDENT_ROUTE_LABELS[pathname];

  const cleanPath = pathname.replace(/\/$/, '');
  const segments = cleanPath.split('/').filter(Boolean);
  const examId =
    segments[0] === 'student' && segments[1] === 'exams'
      ? segments[2]
      : segments[0] === 'student' && segments[1] === 'leaderboard'
        ? segments[2]
        : undefined;

  if (examId) {
    return {
      title: examId,
      subtitle: 'Exam session overview',
    };
  }

  const lastSegment = segments[segments.length - 1];

  if (!lastSegment || lastSegment === 'student') {
    return { title: 'Dashboard', subtitle: 'Welcome back to your student portal' };
  }

  return {
    title: startCase(lastSegment),
    subtitle: 'Student portal section',
  };
}

export function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [examHeaderTitle, setExamHeaderTitle] = useState<{ examId: string; title: string } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = window.localStorage.getItem('student-sidebar-collapsed');
    return stored === 'true';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('student-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    const id = window.setTimeout(() => setMobileOpen(false), 0);
    return () => window.clearTimeout(id);
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

  const examIdFromPath = useMemo(() => {
    const cleanPath = (pathname || '').replace(/\/$/, '');
    const segments = cleanPath.split('/').filter(Boolean);
    if (segments[0] !== 'student') return undefined;
    if (segments[1] === 'exams' || segments[1] === 'leaderboard') return segments[2];
    return undefined;
  }, [pathname]);

  useEffect(() => {
    if (!examIdFromPath) return;

    let cancelled = false;

    const run = async () => {
      try {
        const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user?.id) return;
        const res = await getExamStudentView(examIdFromPath, user.id);
        if (!cancelled && res.success && res.data?.title) {
          setExamHeaderTitle({ examId: examIdFromPath, title: res.data.title });
        }
      } catch {
        // Keep route-based fallback title when fetch fails.
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [examIdFromPath]);

  const headerContent = useMemo(() => resolveStudentHeader(pathname), [pathname]);
  const resolvedHeaderTitle =
    examIdFromPath && examHeaderTitle?.examId === examIdFromPath
      ? examHeaderTitle.title
      : headerContent.title;

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
          <div className="relative mx-auto flex h-16 max-w-full items-center justify-between px-4 sm:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 lg:hidden"
                aria-label="Open student sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                  {resolvedHeaderTitle}
                </p>
                <p className="truncate text-xs font-semibold text-slate-500 sm:text-sm">
                  {headerContent.subtitle}
                </p>
              </div>
            </div>
            <Link
              href="/student/profile"
              className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-indigo-600 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 sm:inline-flex"
            >
              Profile
            </Link>
          </div>
        </header>

        <main className="relative">
          <div className="mx-auto max-w-full px-3 py-6 sm:px-4 sm:py-8 lg:px-6 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
