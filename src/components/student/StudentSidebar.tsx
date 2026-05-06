'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  MessageSquare,
  HelpCircle,
  Award,
  Calendar,
  CreditCard,
  BookMarked,
  LogOut,
  ChevronRight,
  BookOpenCheck,
  UserCircle,
  ScrollText,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SidebarCollapseRow,
  SidebarExpandFooterButton,
} from '@/components/layout/SidebarDockToggle';

const menuItems = [
  { title: 'হোম', href: '/student', icon: LayoutDashboard },
  { title: 'প্রোফাইল', href: '/student/profile', icon: UserCircle },
  { title: 'আমার কোর্স', href: '/student/courses', icon: BookOpen },
  { title: 'সকল কোর্স', href: '/student/all-courses', icon: GraduationCap },
  { title: 'পরীক্ষা', href: '/student/exams', icon: BookOpenCheck },
  { title: 'বই', href: '/student/books', icon: BookMarked },
  { title: 'কমিউনিটি', href: '/student/community', icon: MessageSquare },
  { title: 'প্রশ্ন', href: '/student/doubts', icon: HelpCircle },
  { title: 'ফলাফল', href: '/student/results', icon: Award },
  { title: 'একাডেমিক রেকর্ড', href: '/student/academic-record', icon: ScrollText },
  { title: 'রুটিন', href: '/student/routine', icon: Calendar },
  { title: 'পেমেন্ট', href: '/student/payment', icon: CreditCard },
];

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
  const [user, setUser] = useState<{ fullName?: string; mobile?: string; role?: string } | null>(null);

  useEffect(() => {
    const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch {}
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      document.cookie = 'auth_token=; path=/; max-age=0';
      document.cookie = 'user_role=; path=/; max-age=0';
      router.push('/login');
    }
  };

  return (
    <>
      {/* Mobile overlay — drawer below lg; matches admin */}
      <div
        aria-hidden={!mobileOpen}
        onClick={onCloseMobile}
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white shadow-2xl transition-all duration-300 ease-in-out',
          collapsed ? 'w-24' : 'w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 lg:opacity-20">
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-indigo-50 blur-3xl" />
          <div className="absolute top-1/2 -right-24 h-64 w-64 rounded-full bg-violet-50 blur-3xl" />
        </div>

        <div className="relative flex h-20 shrink-0 items-center gap-3 border-b border-slate-100/80 px-6">
          <Link href="/student" onClick={onCloseMobile} className="flex min-w-0 flex-1 items-center gap-3 group">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 transition-transform duration-300 group-hover:scale-105">
              <GraduationCap className="h-6 w-6" />
            </div>
            {!collapsed && (
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-lg font-black leading-none tracking-tight text-slate-900">Spondon</span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-indigo-600">LMS Portal</span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={onCloseMobile}
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors hover:text-slate-600 lg:ml-0 lg:hidden"
            aria-label="Close student sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="relative flex-1 space-y-1.5 overflow-y-auto px-4 py-6 custom-scrollbar">
          {!collapsed && (
            <div className="px-4 mb-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">মেনু</p>
            </div>
          )}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/student' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  'group relative flex items-center rounded-2xl transition-all duration-300 overflow-hidden',
                  collapsed ? 'justify-center px-3 py-3' : 'gap-3.5 px-4 py-3.5',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                {isActive && !collapsed ? (
                  <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600" />
                ) : null}
                <div
                  className={cn(
                    'rounded-xl transition-colors duration-300',
                    collapsed ? 'p-2.5' : 'p-2',
                    isActive ? 'bg-white shadow-sm text-indigo-600' : 'bg-transparent group-hover:bg-white group-hover:shadow-sm'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {!collapsed && <span className="font-bold text-[15px] tracking-tight">{item.title}</span>}
                {!collapsed && isActive ? <ChevronRight className="ml-auto h-4 w-4 opacity-50" /> : null}

                {collapsed && (
                  <div className="absolute left-full ml-3 hidden group-hover:block z-50">
                    <div className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white shadow-xl">
                      {item.title}
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="relative border-t border-slate-100/80 bg-slate-50/50 p-4">
          {!collapsed ? (
            <div className="space-y-4">
              {user ? (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-sm">
                    {(user.fullName || 'S')
                      .split(' ')
                      .map((name) => name[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'S'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-slate-800">{user.fullName || 'শিক্ষার্থী'}</p>
                    <p className="truncate text-[10px] font-bold text-slate-400">{user.mobile || '—'}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">{user.role || 'STUDENT'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="shrink-0 text-slate-300 transition-colors hover:text-rose-500"
                    title="লগ আউট"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-slate-500 font-bold transition-all duration-300 hover:bg-rose-50 hover:text-rose-600"
                >
                  <div className="rounded-xl p-2 group-hover:bg-white group-hover:shadow-sm">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <span className="text-[15px]">লগ আউট</span>
                </button>
              )}

              <SidebarCollapseRow onToggleCollapse={onToggleCollapse} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <SidebarExpandFooterButton onToggleCollapse={onToggleCollapse} />
              {user ? (
                <div className="h-10 w-10 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                  {(user.fullName || 'S')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'S'}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:text-rose-500"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
