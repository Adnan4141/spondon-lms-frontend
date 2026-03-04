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
    title: 'Questions',
    href: '/admin/questions',
    icon: HelpCircle,
  },
  {
    title: 'Exams',
    href: '/admin/exams',
    icon: ClipboardList,
  },
  {
    title: 'Students',
    href: '/admin/students',
    icon: Users,
  },
  {
    title: 'Academic',
    href: '/admin/academic-records',
    icon: BarChart3,
  },
  {
    title: 'Branches',
    href: '/admin/branches',
    icon: Building2,
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
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function Sidebar({ mobileOpen, onCloseMobile, collapsed, onToggleCollapse }: SidebarProps) {
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
          collapsed ? 'lg:w-[4.75rem]' : 'lg:w-[19rem]',
          'transition-transform duration-300 ease-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <div className="flex items-center gap-2">
         
                {!collapsed && <h1 className="text-lg font-semibold tracking-tight">Codezyne</h1>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="hidden h-8 w-8 items-center justify-center rounded-md border border-sidebar-border text-sidebar-foreground/70 hover:bg-sidebar-accent/40 lg:inline-flex"
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </button>
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
              {!collapsed && (
                <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
                  Business
                </p>
              )}
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
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground/85 hover:bg-sidebar-accent'
                    )}
                    title={collapsed ? item.title : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-sidebar-border p-3">
              {collapsed ? (
                <div className="flex items-center justify-center">
                  <CircleUserRound className="h-5 w-5 text-sidebar-foreground/65" />
                </div>
              ) : (
                <div className="rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-2 text-xs text-sidebar-foreground/75">
                  <p className="font-medium">Harper Nelson</p>
                  <p className="mt-0.5">Admin Manager</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
