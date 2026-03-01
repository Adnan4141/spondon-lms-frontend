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
  ShoppingCart,
  SquareStack,
  Map,
  CircleDollarSign,
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

const railItems = [
  CircleUserRound,
  LayoutDashboard,
  ShoppingCart,
  SquareStack,
  Map,
  Users,
  BookOpen,
  CircleDollarSign,
  Settings,
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
          'fixed inset-y-0 left-0 z-50 w-[19rem] border-r border-sidebar-border bg-sidebar text-sidebar-foreground',
          'transition-transform duration-300 ease-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full">
          <div className="hidden w-14 flex-col items-center border-r border-sidebar-border bg-sidebar-accent/35 py-4 lg:flex">
            {railItems.map((Icon, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  'mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors',
                  index === 1 ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'hover:bg-sidebar-accent'
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <div className="flex items-center gap-2">
                <CircleUserRound className="h-4 w-4 text-primary" />
                <h1 className="text-lg font-semibold tracking-tight">Flup</h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">‹</span>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-sidebar-border text-sidebar-foreground/70 hover:bg-sidebar-accent/40 lg:hidden"
                  aria-label="Close sidebar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
                Marketing
              </p>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      'group relative flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground/85 hover:bg-sidebar-accent'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-sidebar-border p-3">
              <div className="rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-2 text-xs text-sidebar-foreground/75">
                <p className="font-medium">Harper Nelson</p>
                <p className="mt-0.5">Admin Manager</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
