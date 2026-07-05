'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, LogOut, X } from 'lucide-react';
import { SpondonLogo } from '@/components/common/SpondonLogo';
import {
  SidebarCollapseRow,
  SidebarExpandFooterButton,
} from '@/components/layout/SidebarDockToggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useTeacherSession } from './useTeacherSession';
import { useTeacherDoubtBadgeCount } from '@/features/teacher/doubts/useTeacherDoubts';
import {
  TEACHER_NAV_SECTIONS,
  TEACHER_SIDEBAR_THEME,
  isTeacherNavItemActive,
  type TeacherNavItem,
} from './teacher-nav';

function NavIconTile({
  item,
  isActive,
  size = 'md',
}: {
  item: TeacherNavItem;
  isActive: boolean;
  size?: 'md' | 'sm';
}) {
  const Icon = item.icon;
  const dim = size === 'md' ? 'h-10 w-10 rounded-xl' : 'h-9 w-9 rounded-lg';

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center transition-all duration-300',
        dim,
        isActive
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
          : cn('ring-1', item.iconBg, item.iconRing),
        isActive ? 'scale-102' : 'group-hover:scale-105',
      )}
    >
      <Icon
        className={cn(
          size === 'md' ? 'h-[19px] w-[19px]' : 'h-[17px] w-[17px]',
          isActive ? 'text-white' : item.iconColor,
        )}
        strokeWidth={2.3}
      />
    </div>
  );
}

function NavItemLink({
  item,
  isActive,
  collapsed,
  onCloseMobile,
  badgeCount,
}: {
  item: TeacherNavItem;
  isActive: boolean;
  collapsed: boolean;
  onCloseMobile: () => void;
  badgeCount?: number;
}) {
  const link = (
    <Link
      href={item.href}
      onClick={onCloseMobile}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group relative flex items-center rounded-2xl border transition-all duration-250',
        TEACHER_SIDEBAR_THEME.focus,
        collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
        isActive
          ? 'border-indigo-100/50 bg-indigo-50/70 font-bold text-indigo-700 shadow-sm'
          : 'border-transparent font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900',
      )}
    >
      {isActive && !collapsed ? (
        <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600" />
      ) : null}

      <NavIconTile item={item} isActive={isActive} size={collapsed ? 'sm' : 'md'} />
      {badgeCount && badgeCount > 0 ? (
        <span
          className={cn(
            'absolute flex items-center justify-center rounded-full bg-rose-500 font-bold text-white',
            collapsed ? 'top-1 right-1 h-4 min-w-4 px-1 text-[9px]' : 'hidden',
          )}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      ) : null}

      {!collapsed && (
        <>
          <div className="min-w-0 flex-1">
            <span
              className={cn(
                'block truncate text-[13.5px] tracking-tight transition-colors',
                isActive ? 'font-black text-indigo-900' : 'font-extrabold text-slate-600 group-hover:text-slate-900',
              )}
            >
              {item.title}
            </span>
          </div>
          {badgeCount && badgeCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          ) : isActive ? (
            <ChevronRight className="h-4 w-4 shrink-0 text-indigo-500" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
          )}
        </>
      )}

      {isActive && collapsed ? (
        <span className="absolute -right-0.5 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-indigo-600" />
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

type TeacherSidebarProps = {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function TeacherSidebar({
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapse,
}: TeacherSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, initials, logout } = useTeacherSession();
  const { data: openDoubtCount = 0 } = useTeacherDoubtBadgeCount(user?.id);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <div
        aria-hidden={!mobileOpen}
        onClick={onCloseMobile}
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/55 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/60 bg-gradient-to-b from-white via-slate-50/30 to-violet-50/10 shadow-[4px_0_24px_rgba(15,23,42,0.04)] transition-all duration-300 ease-in-out',
          collapsed ? 'w-22' : 'w-70',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="relative shrink-0 border-b border-slate-200/50 px-4.5 pt-5.5 pb-4">
          <Link
            href="/teacher"
            onClick={onCloseMobile}
            className={cn('group flex items-center gap-3', collapsed && 'justify-center')}
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md shadow-violet-100/50 ring-1 ring-violet-100/55 transition-transform duration-300 group-hover:scale-[1.04]">
              <SpondonLogo size={42} className="h-full w-full object-contain p-1.5" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <span className="truncate text-[17px] font-black tracking-tight text-slate-900">
                  Spondon
                </span>
                <span className="mt-0.5 inline-flex items-center rounded-full border border-violet-100 bg-violet-50/80 px-2.5 py-0.5 text-[8.5px] font-bold uppercase tracking-widest text-violet-700">
                  Teacher
                </span>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            className="absolute top-4.5 right-3.5 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-slate-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative flex-1 space-y-5 overflow-y-auto px-3.5 py-5 no-scrollbar">
          {TEACHER_NAV_SECTIONS.map((section, sectionIndex) => (
            <div key={section.label}>
              {sectionIndex > 0 ? (
                <div
                  className={cn(
                    'mb-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent',
                    collapsed ? 'mx-2' : 'mx-3.5',
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
                    isActive={isTeacherNavItemActive(pathname, item.href)}
                    collapsed={collapsed}
                    onCloseMobile={onCloseMobile}
                    badgeCount={item.badgeKey === 'openDoubts' ? openDoubtCount : undefined}
                  />
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="relative border-t border-slate-200/50 bg-white/60 p-3.5 backdrop-blur-md">
          {!collapsed ? (
            <div className="space-y-2.5">
              {user ? (
                <Link
                  href="/teacher/profile"
                  onClick={onCloseMobile}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5"
                >
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-md shadow-violet-500/20">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {user.fullName || 'Teacher'}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                      {user.mobile || 'View profile'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-500" />
                </Link>
              ) : null}

              <button
                type="button"
                onClick={handleLogout}
                className={cn(
                  'group flex w-full items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-sm font-bold text-slate-500 transition-all hover:border-rose-100 hover:bg-rose-50/50 hover:text-rose-600',
                  TEACHER_SIDEBAR_THEME.focus,
                )}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-400 shadow-sm transition-all group-hover:bg-rose-100 group-hover:text-rose-500">
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
                      href="/teacher/profile"
                      onClick={onCloseMobile}
                      className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white shadow-md shadow-violet-500/20"
                    >
                      {initials}
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
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
