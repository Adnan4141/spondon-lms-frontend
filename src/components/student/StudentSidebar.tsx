'use client';

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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Dashboard', href: '/student', icon: LayoutDashboard },
  { title: 'My Courses', href: '/student/courses', icon: BookOpen },
  { title: 'All Courses', href: '/student/all-courses', icon: GraduationCap },
  { title: 'Books', href: '/student/books', icon: BookMarked },
  { title: 'Community', href: '/student/community', icon: MessageSquare },
  { title: 'Doubts', href: '/student/doubts', icon: HelpCircle },
  { title: 'Results', href: '/student/results', icon: Award },
  { title: 'Routine', href: '/student/routine', icon: Calendar },
  { title: 'Payment', href: '/student/payment', icon: CreditCard },
];

export function StudentSidebar() {
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
    <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-slate-200 shadow-lg">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <Link href="/student" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg font-black text-slate-900">Student Portal</span>
        </Link>
        <button onClick={handleLogout} className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors" title="Logout">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/student' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all',
                isActive ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-bold">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
