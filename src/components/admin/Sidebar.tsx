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
  Sparkles,
  X,
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Courses',
    href: '/admin/courses',
    icon: BookOpen,
  },
  {
    title: 'Programs',
    href: '/admin/programs',
    icon: GraduationCap,
  },
  {
    title: 'Students',
    href: '/admin/students',
    icon: Users,
  },
  {
    title: 'Batches',
    href: '/admin/batches',
    icon: Calendar,
  },
  {
    title: 'Enrollments',
    href: '/admin/enrollments',
    icon: FileText,
  },
  {
    title: 'Invoices',
    href: '/admin/invoices',
    icon: CreditCard,
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

type SidebarProps = {
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        aria-hidden={!mobileOpen}
        onClick={onCloseMobile}
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 border-r border-sidebar-border/60 bg-sidebar/90 text-sidebar-foreground backdrop-blur-xl',
          'transition-transform duration-300 ease-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center justify-between border-b border-sidebar-border/60 px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/60">Spondon</p>
              <h1 className="text-xl font-bold tracking-tight">LMS Admin</h1>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sidebar-border/60 text-sidebar-foreground/70 hover:bg-sidebar-accent/40 lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 pt-5">
            <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4" />
                Operations Center
              </div>
              <p className="mt-1 text-xs text-sidebar-foreground/70">
                Centralized view of your branches, courses, and performance.
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-black/10'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg border text-current transition-colors',
                      isActive
                        ? 'border-sidebar-primary-foreground/20 bg-sidebar-primary-foreground/10'
                        : 'border-sidebar-border/70 bg-sidebar-accent/30 group-hover:border-sidebar-border'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border/60 p-4">
            <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/30 p-3 text-xs text-sidebar-foreground/75">
              <p className="font-medium">Admin Panel</p>
              <p className="mt-1">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
