'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Command,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { GlobalModal } from './GlobalModal';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent<string>).detail;
      if (msg) {
        toast({ description: msg, variant: 'destructive' });
      }
    };
    window.addEventListener('api-error', handler);
    return () => window.removeEventListener('api-error', handler);
  }, [toast]);

  const getBreadcrumbs = () => {
    if (!pathname) return [{ label: 'Admin', active: true }];

    const segments = pathname.split('/').filter(Boolean);

    // If it's just /admin or /, show Admin / Analytics
    if (segments.length <= 1) {
      return [
        { label: 'Admin', active: false },
        { label: 'Analytics', active: true }
      ];
    }

    const segmentMap: Record<string, string> = {
      'admin': 'Admin',
      'reports': 'Analytics',
      'academic-records': 'Academic Records',
      'enrollments': 'Enrollments',
      'batches': 'Batches',
      'courses': 'Courses',
      'exams': 'Exams',
      'students': 'Students',
      'settings': 'Settings',
      'branches': 'Branches',
      'programs': 'Programs',
      'books': 'Books',
      'questions': 'Question Bank',
      'mcq': 'MCQ',
      'combined': 'Combined MCQ',
      'cq': 'CQ',
      'short': 'Short Questions',
      'branch': 'Branch dashboard',
      'teachers': 'Teachers',
      'monthly-billing': 'Monthly billing',
      'inventory': 'Inventory',
      'exam-results': 'Exam Results',
      'testimonials': 'Reviews',
      'partners': 'Partners',
      'institutes': 'Institutes',
      'invoices': 'Invoices',
      'sms': 'SMS Console',
      'attendance-sheet': 'Attendance Sheet',
      results: 'Results',
      approvals: 'Approvals',
    };

    return segments.map((segment, index) => {
      let label = segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

      return {
        label,
        active: index === segments.length - 1
      };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="relative min-h-screen bg-[#FDFDFF] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-50/50 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-rose-50/50 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.15]" />
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
          sidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'
        )}
      >
        <header className="sticky top-0 z-40">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-xl border-b border-slate-200/50" />

          <div className="relative mx-auto flex h-20 max-w-[1600px] items-center justify-between px-6 lg:px-10">
            {/* Left: Mobile Toggle & Context */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:border-slate-300 lg:hidden shadow-sm"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden sm:block">
                <div className="flex items-center gap-2 text-slate-400">
                  {breadcrumbs.map((crumb, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={cn(
                        "text-base font-bold uppercase tracking-widest transition-colors duration-200",
                        crumb.active ? "text-indigo-600" : "text-slate-400"
                      )}>
                        {crumb.label}
                      </span>
                      {idx < breadcrumbs.length - 1 && (
                        <span className="text-slate-200">/</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Center: Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Quick Search... (cmd + k)"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-100/30 pl-11 pr-12 text-base font-medium outline-none ring-indigo-500/10 transition-all focus:bg-white focus:ring-4 focus:border-indigo-500/40"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 shadow-sm">
                  <Command className="h-3 w-3 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400">K</span>
                </div>
              </div>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-3 sm:gap-5">
              <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-indigo-600 shadow-sm">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white animate-bounce" />
              </button>

              <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />

              <button className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-2xl border border-slate-200 bg-white transition-all hover:border-indigo-200 hover:shadow-md group shadow-sm">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-base font-bold shadow-sm group-hover:rotate-6 transition-transform">
                  AD
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-base font-bold text-slate-800 leading-none">Adnan Hussain</p>
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-tight mt-1">Super Admin</p>
                </div>
                <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </button>
            </div>
          </div>
        </header>

        <main className="relative">
          <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10 lg:py-12">


            {/* Main Content Area - Glassmorphic Container */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[40px] opacity-[0.03] blur-xl group-hover:opacity-[0.05] transition-opacity" />
              <div className="relative rounded-[36px] border border-white bg-white/70 backdrop-blur-md p-8 shadow-2xl shadow-slate-200/50 min-h-[600px]">
                {children}
              </div>
            </div>
          </div>
        </main>

        <GlobalModal />
      </div>
      <Toaster />
    </div>
  );
}