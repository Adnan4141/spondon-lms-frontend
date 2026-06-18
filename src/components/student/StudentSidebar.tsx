'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ChevronRight, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SpondonLogo } from '@/components/common/SpondonLogo';
import {
  SidebarCollapseRow,
  SidebarExpandFooterButton,
} from '@/components/layout/SidebarDockToggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  STUDENT_NAV_SECTIONS,
  STUDENT_SIDEBAR_THEME,
  isStudentNavItemActive,
  type StudentNavItem,
} from './student-nav';

function NavIconTile({
  item,
  isActive,
  size = 'md',
}: {
  item: StudentNavItem;
  isActive: boolean;
  size?: 'md' | 'sm';
}) {
  const Icon = item.icon;
  const dim = size === 'md' ? 'h-10 w-10 rounded-xl' : 'h-9 w-9 rounded-lg';

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center ring-1 transition-all duration-300',
        dim,
        item.iconBg,
        item.iconRing,
        isActive ? 'scale-[1.02] shadow-sm shadow-slate-200/60' : 'group-hover:scale-[1.03]'
      )}
    >
      <Icon
        className={cn(
          size === 'md' ? 'h-[19px] w-[19px]' : 'h-[17px] w-[17px]',
          item.iconColor
        )}
        strokeWidth={2.1}
      />
      {isActive ? (
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white bg-indigo-500" />
      ) : null}
    </div>
  );
}

function NavItemLink({
  item,
  isActive,
  collapsed,
  onCloseMobile,
}: {
  item: StudentNavItem;
  isActive: boolean;
  collapsed: boolean;
  onCloseMobile: () => void;
}) {
  const link = (
    <Link
      href={item.href}
      onClick={onCloseMobile}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group relative flex items-center rounded-2xl border border-transparent transition-all duration-250',
        STUDENT_SIDEBAR_THEME.focus,
        collapsed ? 'justify-center p-2' : 'gap-3 px-2.5 py-2',
        isActive
          ? cn(STUDENT_SIDEBAR_THEME.navActive, 'border')
          : cn(STUDENT_SIDEBAR_THEME.navIdle, STUDENT_SIDEBAR_THEME.navHover, 'border')
      )}
    >
      {isActive && !collapsed ? (
        <span className="absolute top-1/2 left-0 h-7 w-1 -translate-y-1/2 rounded-r-full bg-linear-to-b from-indigo-500 to-violet-600" />
      ) : null}

      <NavIconTile item={item} isActive={isActive} size={collapsed ? 'sm' : 'md'} />

      {!collapsed && (
        <>
          <div className="min-w-0 flex-1">
            <span
              className={cn(
                'block truncate text-[14px] tracking-tight',
                isActive ? 'font-bold text-indigo-950' : 'font-semibold text-slate-700'
              )}
            >
              {item.title}
            </span>
          </div>
          {isActive ? (
            <ChevronRight className="h-4 w-4 shrink-0 text-indigo-400" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </>
      )}

      {isActive && collapsed ? (
        <span className="absolute -right-0.5 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-indigo-500" />
      ) : null}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={10}
        className="border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-2xl"
      >
        {item.title}
      </TooltipContent>
    </Tooltip>
  );
}

export function StudentSidebar({
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapse,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user] = useState<{ fullName?: string; mobile?: string; role?: string } | null>(() => {
    const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (u) {
      try {
        return JSON.parse(u);
      } catch {}
    }
    return null;
  });

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      document.cookie = 'auth_token=; path=/; max-age=0';
      document.cookie = 'user_role=; path=/; max-age=0';
      router.push('/login');
    }
  };

  const initials =
    (user?.fullName || 'S')
      .split(' ')
      .map((name) => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'S';

  return (
    <>
      <div
        aria-hidden={!mobileOpen}
        onClick={onCloseMobile}
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/55 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col shadow-[4px_0_24px_rgba(15,23,42,0.06)] transition-all duration-300 ease-in-out',
          STUDENT_SIDEBAR_THEME.shell,
          collapsed ? 'w-22' : 'w-70',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-16 -left-20 h-52 w-52 rounded-full bg-indigo-200/25 blur-3xl" />
          <div className="absolute right-0 bottom-32 h-44 w-44 rounded-full bg-violet-200/20 blur-3xl" />
        </div>

        {/* Brand */}
        <div className="relative shrink-0 border-b border-slate-200/70 px-4 pt-5 pb-4">
          <Link
            href="/student/community"
            onClick={onCloseMobile}
            className={cn('group flex items-center gap-3', collapsed && 'justify-center')}
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white bg-white shadow-lg shadow-indigo-100/80 ring-1 ring-indigo-100/60 transition-transform duration-300 group-hover:scale-[1.04]">
              <SpondonLogo size={42} className="h-full w-full object-contain p-1.5" />
              <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 to-violet-500/10" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[17px] font-black tracking-tight text-slate-900">
                    Spondon
                  </span>
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-400" strokeWidth={2.5} />
                </div>
                <span className="mt-0.5 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-600 ring-1 ring-indigo-100">
                  Student
                </span>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            className="absolute top-4 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-slate-500 shadow-sm ring-1 ring-slate-200/80 transition-colors hover:text-slate-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <div className="relative flex-1 space-y-5 overflow-y-auto px-3 py-4 custom-scrollbar">
          {STUDENT_NAV_SECTIONS.map((section, sectionIndex) => (
            <div key={section.label}>
              {sectionIndex > 0 ? (
                <div
                  className={cn(
                    'mb-4 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent',
                    collapsed ? 'mx-2' : 'mx-3'
                  )}
                />
              ) : null}
              {!collapsed && (
                <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  {section.label}
                </p>
              )}
              <nav className="space-y-1" aria-label={section.label}>
                {section.items.map((item) => (
                  <NavItemLink
                    key={item.href}
                    item={item}
                    isActive={isStudentNavItemActive(pathname, item.href)}
                    collapsed={collapsed}
                    onCloseMobile={onCloseMobile}
                  />
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="relative border-t border-slate-200/70 bg-white/60 p-3 backdrop-blur-md">
          {!collapsed ? (
            <div className="space-y-2.5">
              {user ? (
                <Link
                  href="/student/profile"
                  onClick={onCloseMobile}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-100/40"
                >
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-200/50">
                    {initials}
                    <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {user.fullName || 'Student'}
                    </p>
                    <p className="truncate text-[11px] font-medium text-slate-500">
                      {user.mobile || 'View profile'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:translate-x-0.5 group-hover:text-indigo-500" />
                </Link>
              ) : null}

              <button
                type="button"
                onClick={handleLogout}
                className={cn(
                  'group flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 text-sm font-semibold text-slate-500 transition-all hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600',
                  STUDENT_SIDEBAR_THEME.focus
                )}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400 transition-all group-hover:bg-rose-100 group-hover:text-rose-500">
                  <LogOut className="h-4 w-4" strokeWidth={2.25} />
                </span>
                Log out
              </button>

              <SidebarCollapseRow onToggleCollapse={onToggleCollapse} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5">
              <SidebarExpandFooterButton onToggleCollapse={onToggleCollapse} />
              {user ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/student/profile"
                      onClick={onCloseMobile}
                      className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-md"
                    >
                      {initials}
                      <span className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border-2 border-white bg-emerald-400" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{user.fullName || 'Profile'}</TooltipContent>
                </Tooltip>
              ) : null}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                    aria-label="Log out"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={2.25} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Log out</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
