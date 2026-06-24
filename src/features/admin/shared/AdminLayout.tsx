'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { GlobalModal } from './GlobalModal';
import { AdminHeader } from './AdminHeader';
import { cn } from '@/lib/utils';
import { AdminToastProvider } from './AdminToastProvider';
import { useBulkImportJobsStore } from '@/store/bulkImportJobsStore';

const BulkImportProgressDock = dynamic(
  () =>
    import('@/features/admin/students/components/BulkImportProgressDock').then(
      (m) => m.BulkImportProgressDock,
    ),
  { ssr: false },
);

function BulkImportDockGate() {
  const jobs = useBulkImportJobsStore((state) => state.jobs);
  if (jobs.length === 0) return null;
  return <BulkImportProgressDock />;
}

function isExamFullBleedRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === '/admin/exam/new') return true;
  return pathname.startsWith('/admin/exam/') && pathname !== '/admin/exam';
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuditPage = pathname === '/admin/audit';
  const isExamFullBleed = isExamFullBleedRoute(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('admin-sidebar-collapsed');
    if (stored === 'true') setSidebarCollapsed(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('admin-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <AdminToastProvider>
      <div className="relative min-h-screen bg-[#FDFDFF] font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
        {/* Background decorators */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] animate-pulse rounded-full bg-indigo-50/50 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-rose-50/50 blur-[120px]" />
          <div className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.15]" />
        </div>

        <Sidebar
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />

        <div
          className={cn(
            'relative min-h-screen transition-all duration-500 ease-in-out',
            sidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72',
          )}
        >
          <AdminHeader onMenuOpen={() => setMobileOpen(true)} />

          <main className="relative">
            {isAuditPage ? (
              <div className="w-full min-w-0 px-3 py-4 sm:px-4 sm:py-5 lg:px-5 lg:py-6">
                {children}
              </div>
            ) : isExamFullBleed ? (
              <div className="w-full min-w-0 max-w-full">{children}</div>
            ) : (
              <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10 lg:py-12">
                <div className="group relative">
                  <div className="absolute -inset-1 rounded-[40px] bg-gradient-to-r from-indigo-500 to-purple-600 opacity-[0.03] blur-xl transition-opacity group-hover:opacity-[0.05]" />
                  <div className="relative min-h-[600px] rounded-[36px] border border-white bg-white/70 p-8 shadow-2xl shadow-slate-200/50 backdrop-blur-md">
                    {children}
                  </div>
                </div>
              </div>
            )}
          </main>

          <GlobalModal />
          <BulkImportDockGate />
        </div>
      </div>
    </AdminToastProvider>
  );
}
