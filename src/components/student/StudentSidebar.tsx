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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'হোম', href: '/student', icon: LayoutDashboard },
  { title: 'আমার কোর্স', href: '/student/courses', icon: BookOpen },
  { title: 'সকল কোর্স', href: '/student/all-courses', icon: GraduationCap },
  { title: 'পরীক্ষা', href: '/student/exams', icon: BookOpenCheck },
  { title: 'বই', href: '/student/books', icon: BookMarked },
  { title: 'কমিউনিটি', href: '/student/community', icon: MessageSquare },
  { title: 'প্রশ্ন', href: '/student/doubts', icon: HelpCircle },
  { title: 'ফলাফল', href: '/student/results', icon: Award },
  { title: 'রুটিন', href: '/student/routine', icon: Calendar },
  { title: 'পেমেন্ট', href: '/student/payment', icon: CreditCard },
];

export function StudentSidebar() {
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
    <aside className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="p-8 pb-6 flex items-center justify-between">
        <Link href="/student" className="flex items-center gap-3.5 group">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform duration-300">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-slate-900 leading-none">Spondon</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mt-1">LMS Portal</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className="px-4 mb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">মেনু</p>
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/student' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden',
                isActive 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
              )}
              <div className={cn(
                "p-2 rounded-xl transition-colors duration-300",
                isActive ? "bg-white shadow-sm text-indigo-600" : "bg-transparent group-hover:bg-white group-hover:shadow-sm"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-bold text-[15px] tracking-tight">{item.title}</span>
              {isActive && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100/80 bg-slate-50/50">
        <div className="space-y-4">
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                {(user.fullName || 'S')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-slate-800 truncate">{user.fullName || 'শিক্ষার্থী'}</p>
                <p className="text-[10px] font-bold text-slate-400 truncate">{user.mobile || '—'}</p>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{user.role || 'STUDENT'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-300 hover:text-rose-500 transition-colors shrink-0"
                title="লগ আউট"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
          {!user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-500 font-bold hover:text-rose-600 hover:bg-rose-50 transition-all duration-300 group"
            >
              <div className="p-2 rounded-xl group-hover:bg-white group-hover:shadow-sm">
                <LogOut className="h-5 w-5" />
              </div>
              <span className="text-[15px]">লগ আউট</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
