'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  Command,
  LogOut,
  Mail,
  Menu,
  Phone,
  Search,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sidebar } from './Sidebar';
import { GlobalModal } from './GlobalModal';
import { cn } from '@/lib/utils';
import { AdminToastProvider } from './AdminToastProvider';
import { clearAuthStorage, useAdminSession } from './admin-session';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, initials, roleLabel } = useAdminSession();

  const breadcrumbs = useMemo(() => {
    if (!pathname) return [{ label: 'Admin', active: true }];

    const segments = pathname.split('/').filter(Boolean);

    if (segments.length <= 1) {
      const second =
        user?.role === 'BRANCH_ADMIN'
          ? 'Branch'
          : 'Analytics';
      return [
        { label: 'Admin', active: false },
        { label: second, active: true },
      ];
    }

    const segmentMap: Record<string, string> = {
      admin: 'Admin',
      reports: 'Analytics',
      'academic-records': 'Academic Records',
      enrollments: 'Enrollments',
      batches: 'Batches',
      courses: 'Courses',
      exams: 'Exams',
      students: 'Students',
      settings: 'Settings',
      branches: 'Branches',
      programs: 'Programs',
      books: 'Books',
      questions: 'Question Bank',
      mcq: 'MCQ',
      combined: 'Combined MCQ',
      cq: 'CQ',
      short: 'Short Questions',
      branch: 'Branch dashboard',
      teachers: 'Teachers',
      'monthly-billing': 'Monthly billing',
      inventory: 'Inventory',
      'exam-results': 'Exam Results',
      testimonials: 'Reviews',
      partners: 'Partners',
      institutes: 'Institutes',
      invoices: 'Invoices',
      sms: 'SMS Console',
      'attendance-sheet': 'Attendance Sheet',
      results: 'Results',
      approvals: 'Approvals',
      landing: 'Landing',
      faq: 'FAQ',
    };

    return segments.map((segment, index) => {
      const label =
        segmentMap[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      return {
        label,
        active: index === segments.length - 1,
      };
    });
  }, [pathname, user?.role]);

  const displayName = user?.fullName?.trim() || 'Signed in';
  const avatarUrl =
    user?.profileImage?.trim() &&
    resolveAttachmentUrl(user.profileImage.trim(), API_ORIGIN);

  const handleLogout = () => {
    clearAuthStorage();
    router.push('/login');
  };

  return (
    <AdminToastProvider>
      <div className="relative min-h-screen bg-[#FDFDFF] font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
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
            sidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'
          )}
        >
          <header className="sticky top-0 z-40">
            <div className="absolute inset-0 border-b border-slate-200/50 bg-white/60 backdrop-blur-xl" />

            <div className="relative mx-auto flex h-20 max-w-[1600px] items-center justify-between px-6 lg:px-10">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div className="hidden sm:block">
                  <div className="flex items-center gap-2 text-slate-400">
                    {breadcrumbs.map((crumb, idx) => (
                      <div key={`${crumb.label}-${idx}`} className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-base font-bold uppercase tracking-widest transition-colors duration-200',
                            crumb.active ? 'text-indigo-600' : 'text-slate-400'
                          )}
                        >
                          {crumb.label}
                        </span>
                        {idx < breadcrumbs.length - 1 && <span className="text-slate-200">/</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mx-8 hidden max-w-md flex-1 md:flex">
                <div className="group relative w-full">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
                  <input
                    type="text"
                    placeholder="Quick Search… (⌘K)"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-100/30 pl-11 pr-12 text-base font-medium outline-none ring-indigo-500/10 transition-all focus:border-indigo-500/40 focus:bg-white focus:ring-4"
                  />
                  <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 shadow-sm">
                    <Command className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400">K</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-5">
                <button
                  type="button"
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-indigo-600"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2.5 top-2.5 h-2 w-2 animate-bounce rounded-full bg-rose-500 ring-2 ring-white" />
                </button>

                <div className="hidden h-8 w-px bg-slate-200 sm:block" />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
                    >
                      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-sm font-bold text-white shadow-sm transition-transform group-hover:rotate-6">
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold">{initials}</span>
                        )}
                      </div>
                      <div className="hidden text-left sm:block">
                        <p className="text-base font-bold leading-none text-slate-800">{displayName}</p>
                        <p className="mt-1 text-[9px] font-black uppercase tracking-tight text-indigo-500">
                          {roleLabel}
                        </p>
                      </div>
                      <ChevronDown className="h-3 w-3 text-slate-400 transition-colors group-hover:text-indigo-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl">
                    <DropdownMenuLabel className="font-normal">
                      <p className="text-sm font-bold text-slate-900">{displayName}</p>
                      <p className="text-xs font-medium text-slate-500">{roleLabel}</p>
                    </DropdownMenuLabel>
                    {(user?.email || user?.mobile) && (
                      <>
                        <DropdownMenuSeparator />
                        {user?.email ? (
                          <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        ) : null}
                        {user?.mobile ? (
                          <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span>{user.mobile}</span>
                          </div>
                        ) : null}
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="relative">
            <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10 lg:py-12">
              <div className="group relative">
                <div className="absolute -inset-1 rounded-[40px] bg-gradient-to-r from-indigo-500 to-purple-600 opacity-[0.03] blur-xl transition-opacity group-hover:opacity-[0.05]" />
                <div className="relative min-h-[600px] rounded-[36px] border border-white bg-white/70 p-8 shadow-2xl shadow-slate-200/50 backdrop-blur-md">
                  {children}
                </div>
              </div>
            </div>
          </main>

          <GlobalModal />
        </div>
      </div>
    </AdminToastProvider>
  );
}
