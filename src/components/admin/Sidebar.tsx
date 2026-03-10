'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Users,
  GraduationCap,
  FileText,
  Settings,
  LayoutDashboard,
  Calendar,
  CreditCard,
  BarChart3,
  CircleUserRound,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  HelpCircle,
  ClipboardList,
  Building2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    color: 'from-sky-500 to-cyan-400',
  },
  {
    title: 'Courses',
    href: '/admin/courses',
    icon: BookOpen,
    color: 'from-violet-500 to-fuchsia-500',
  },
  {
    title: 'Programs',
    href: '/admin/programs',
    icon: GraduationCap,
    color: 'from-pink-500 to-rose-500',
  },
  {
    title: 'Questions',
    href: '/admin/questions',
    icon: HelpCircle,
    color: 'from-amber-500 to-orange-500',
  },
  {
    title: 'Exams',
    href: '/admin/exams',
    icon: ClipboardList,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Students',
    href: '/admin/students',
    icon: Users,
    color: 'from-indigo-500 to-blue-500',
  },
  {
    title: 'Academic',
    href: '/admin/academic-records',
    icon: BarChart3,
    color: 'from-lime-500 to-green-500',
  },
  {
    title: 'Branches',
    href: '/admin/branches',
    icon: Building2,
    color: 'from-red-500 to-pink-500',
  },
  {
    title: 'Batches',
    href: '/admin/batches',
    icon: Calendar,
    color: 'from-cyan-500 to-sky-500',
  },
  {
    title: 'Enrollments',
    href: '/admin/enrollments',
    icon: FileText,
    color: 'from-purple-500 to-indigo-500',
  },
  {
    title: 'Invoices',
    href: '/admin/invoices',
    icon: CreditCard,
    color: 'from-yellow-500 to-amber-500',
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    color: 'from-teal-500 to-emerald-500',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    color: 'from-slate-500 to-gray-500',
  },
];

type SidebarProps = {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function Sidebar({
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        aria-hidden={!mobileOpen}
        onClick={onCloseMobile}
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-all duration-300 lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 border-r border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96))] text-white shadow-2xl backdrop-blur-xl',
          'transition-all duration-300 ease-out',
          'w-[19rem] lg:translate-x-0',
          collapsed ? 'lg:w-[5.25rem]' : 'lg:w-[19rem]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -left-10 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute top-1/3 -right-12 h-44 w-44 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-36 w-36 rounded-full bg-violet-500/20 blur-3xl" />
        </div>

        <div className="relative flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
            <div
              className={cn(
                'flex items-center gap-3 transition-all duration-300',
                collapsed && 'justify-center'
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-500 shadow-lg shadow-fuchsia-500/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>

              {!collapsed && (
                <div>
                  <h1 className="bg-gradient-to-r from-white via-fuchsia-200 to-cyan-200 bg-clip-text text-lg font-bold tracking-tight text-transparent">
                    Codezyne
                  </h1>
                  <p className="text-[11px] text-white/50">Admin Workspace</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white lg:inline-flex"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>

              <button
                type="button"
                onClick={onCloseMobile}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            {!collapsed && (
              <div className="mb-3 px-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
                  Business Panel
                </p>
              </div>
            )}

            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || pathname?.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    title={collapsed ? item.title : undefined}
                    className={cn(
                      'group relative flex items-center overflow-hidden rounded-2xl transition-all duration-300',
                      collapsed
                        ? 'justify-center px-2 py-3'
                        : 'gap-3 px-3 py-3',
                      isActive
                        ? 'bg-white/12 shadow-lg ring-1 ring-white/10'
                        : 'hover:bg-white/8'
                    )}
                  >
                    {isActive && (
                      <>
                        <div className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-gradient-to-b from-fuchsia-400 to-cyan-400" />
                        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 via-violet-500/10 to-cyan-500/10" />
                      </>
                    )}

                    <div
                      className={cn(
                        'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md',
                        item.color,
                        isActive
                          ? 'text-white shadow-white/10'
                          : 'text-white/90 group-hover:scale-105'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {!collapsed && (
                      <>
                        <div className="relative z-10 min-w-0 flex-1">
                          <p
                            className={cn(
                              'truncate text-sm font-medium transition-colors',
                              isActive ? 'text-white' : 'text-white/80 group-hover:text-white'
                            )}
                          >
                            {item.title}
                          </p>
                        </div>

                        <ChevronRight
                          className={cn(
                            'relative z-10 h-4 w-4 transition-all duration-300',
                            isActive
                              ? 'translate-x-0 text-white/80'
                              : 'translate-x-[-4px] text-white/0 group-hover:translate-x-0 group-hover:text-white/50'
                          )}
                        />
                      </>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-white/10 p-3">
            {collapsed ? (
              <div className="flex justify-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-inner">
                  <CircleUserRound className="h-5 w-5 text-white/70" />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-500 text-sm font-bold text-white shadow-lg">
                    HN
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      Harper Nelson
                    </p>
                    <p className="truncate text-xs text-white/55">Admin Manager</p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
                  System status: All services running
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}