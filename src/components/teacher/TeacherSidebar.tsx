'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  HelpCircle,
  Users,
  FileQuestion,
  LogOut,
  GraduationCap,
  X,
} from 'lucide-react';
import { SpondonLogo } from '@/components/common/SpondonLogo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const menuItems = [
  { title: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
  { title: 'My lessons', href: '/teacher/courses', icon: BookOpen },
  { title: 'Tests', href: '/teacher/exams', icon: ClipboardList },
  { title: 'Questions', href: '/teacher/questions', icon: FileQuestion },
  { title: 'My students', href: '/teacher/students', icon: Users },
  { title: 'Doubts', href: '/teacher/doubts', icon: HelpCircle },
];

type TeacherSidebarProps = {
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function TeacherSidebar({ mobileOpen, onCloseMobile }: TeacherSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

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
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-5">
          <Link href="/teacher" className="flex min-w-0 items-center gap-3 group" onClick={onCloseMobile}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-lg shadow-indigo-100 transition-transform group-hover:scale-105 group-hover:rotate-3">
              <SpondonLogo size={44} className="h-full w-full object-contain p-1.5" />
            </div>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl lg:hidden"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== '/teacher' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-bold transition-all duration-200',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200/40'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl',
                    isActive ? 'bg-white/15' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  <Icon className={cn('h-5 w-5', isActive && 'text-white')} />
                </span>
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] font-bold text-rose-600 transition-colors hover:bg-rose-50"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
