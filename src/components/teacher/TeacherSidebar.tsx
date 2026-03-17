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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Home', href: '/teacher', icon: LayoutDashboard },
  { title: 'My Lessons', href: '/teacher/courses', icon: BookOpen },
  { title: 'Tests', href: '/teacher/exams', icon: ClipboardList },
  { title: 'Question List', href: '/teacher/questions', icon: FileQuestion },
  { title: 'My Students', href: '/teacher/students', icon: Users },
  { title: 'Help Students', href: '/teacher/doubts', icon: HelpCircle },
];

export function TeacherSidebar() {
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
    <aside className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-white border-r border-slate-100 shadow-[20px_0_40px_rgba(0,0,0,0.02)]">
      <div className="p-8 mb-4 flex items-center justify-between">
        <Link href="/teacher" className="flex items-center gap-3 group">
          <div className="h-11 w-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 transition-transform group-hover:scale-105 duration-300">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">Teacher Hub</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/teacher' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold text-[15px]',
                isActive 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400")} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto border-t border-slate-50">
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-rose-500 hover:bg-rose-50 font-bold transition-all duration-300"
        >
          <LogOut className="h-5 w-5" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
