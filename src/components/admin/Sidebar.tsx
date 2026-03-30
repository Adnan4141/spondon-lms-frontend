'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Users,
  GraduationCap,
  FileText,
  MessageSquare,
  Settings,
  LayoutDashboard,
  Calendar,
  CreditCard,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  HelpCircle,
  ClipboardList,
  Building2,
  ChevronRight,
  LogOut,
  Award,
  School,
  CalendarRange,
  Presentation,
  Globe,
} from 'lucide-react';

type MenuItem = {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bg: string;
};

function buildMenuSections(role: string | null): { label: string; items: MenuItem[] }[] {
  const isBranchAdmin = role === 'BRANCH_ADMIN';

  const overviewItems: MenuItem[] = isBranchAdmin
    ? [
        {
          title: 'Branch dashboard',
          href: '/admin/branch',
          icon: Building2,
          color: 'text-sky-600',
          bg: 'bg-sky-50',
        },
        {
          title: 'All modules',
          href: '/admin',
          icon: LayoutDashboard,
          color: 'text-blue-500',
          bg: 'bg-blue-50',
        },
      ]
    : [
        {
          title: 'Dashboard',
          href: '/admin',
          icon: LayoutDashboard,
          color: 'text-blue-500',
          bg: 'bg-blue-50',
        },
      ];

  const managementItems: MenuItem[] = [
    { title: 'Teachers', href: '/admin/teachers', icon: Presentation, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { title: 'Partners', href: '/admin/partners', icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Reviews', href: '/admin/testimonials', icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Questions', href: '/admin/questions', icon: HelpCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
    { title: 'Exams', href: '/admin/exams', icon: ClipboardList, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'Exam Results', href: '/admin/exam-results', icon: Award, color: 'text-amber-500', bg: 'bg-amber-50' },
    { title: 'Books', href: '/admin/books', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Students', href: '/admin/students', icon: Users, color: 'text-violet-500', bg: 'bg-violet-50' },
    { title: 'Branches', href: '/admin/branches', icon: Building2, color: 'text-red-500', bg: 'bg-red-50' },
    { title: 'Institutes', href: '/admin/institutes', icon: School, color: 'text-rose-500', bg: 'bg-rose-50' },
  ].filter((item) => !(isBranchAdmin && item.href === '/admin/branches'));

  return [
    { label: 'Overview', items: overviewItems },
    {
      label: 'Academic',
      items: [
        { title: 'Courses', href: '/admin/courses', icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { title: 'Programs', href: '/admin/programs', icon: GraduationCap, color: 'text-rose-500', bg: 'bg-rose-50' },
        { title: 'Batches', href: '/admin/batches', icon: Calendar, color: 'text-sky-500', bg: 'bg-sky-50' },
        {
          title: 'Attendance Sheet',
          href: '/admin/academic-records/attendance-sheet',
          icon: ClipboardList,
          color: 'text-emerald-500',
          bg: 'bg-emerald-50',
        },
        { title: 'Academic', href: '/admin/academic-records', icon: BarChart3, color: 'text-lime-500', bg: 'bg-lime-50' },
      ],
    },
    { label: 'Management', items: managementItems },
    {
      label: 'Administrative',
      items: [
        { title: 'Enrollments', href: '/admin/enrollments', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        {
          title: 'Monthly billing',
          href: '/admin/monthly-billing',
          icon: CalendarRange,
          color: 'text-violet-600',
          bg: 'bg-violet-50',
        },
        { title: 'Invoices', href: '/admin/invoices', icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-50' },
        { title: 'SMS Console', href: '/admin/sms', icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { title: 'Reports', href: '/admin/reports', icon: BarChart3, color: 'text-teal-500', bg: 'bg-teal-50' },
        { title: 'Settings', href: '/admin/settings', icon: Settings, color: 'text-slate-500', bg: 'bg-slate-50' },
      ],
    },
  ];
}

type SidebarProps = {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function Sidebar({ mobileOpen, onCloseMobile, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      const u = raw ? (JSON.parse(raw) as { role?: string }) : null;
      setRole(u?.role ?? null);
    } catch {
      setRole(null);
    }
  }, []);

  const menuSections = useMemo(() => buildMenuSections(role), [role]);
  const homeHref = role === 'BRANCH_ADMIN' ? '/admin/branch' : '/admin';

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
      {/* Mobile Overlay */}
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
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 shadow-2xl transition-all duration-300 ease-in-out',
          collapsed ? 'w-24' : 'w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-indigo-50 blur-3xl" />
          <div className="absolute top-1/2 -right-24 h-64 w-64 rounded-full bg-rose-50 blur-3xl" />
        </div>

        {/* Header / Logo Section */}
        <div className="relative flex h-20 items-center px-6 border-b border-slate-100/80">
          <Link href={homeHref} className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200 transition-transform group-hover:scale-105 group-hover:rotate-3">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-slate-900 leading-none">Codezyne</span>
                <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-500/80">Learning Management System</span>
              </div>
            )}
          </Link>
          
          <button
            onClick={onCloseMobile}
            className="ml-auto lg:hidden h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="relative flex-1 overflow-y-auto py-6 px-4 space-y-8 no-scrollbar">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              {!collapsed && (
                <h3 className="px-4 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-3">
                  {section.label}
                </h3>
              )}
              
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname === item.href || (pathname?.startsWith(`${item.href}/`) ?? false);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={cn(
                        'group relative flex items-center transition-all duration-300 rounded-2xl',
                        collapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3',
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      )}
                    >
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300',
                        isActive 
                          ? 'bg-white/20' 
                          : cn(item.bg, item.color, 'group-hover:scale-110')
                      )}>
                        <Icon className={cn('h-5 w-5', isActive ? 'text-white' : '')} />
                      </div>

                      {!collapsed && (
                        <>
                          <span className="flex-1 text-base font-bold tracking-tight">
                            {item.title}
                          </span>
                          {isActive && (
                            <ChevronRight className="h-4 w-4 opacity-70" />
                          )}
                        </>
                      )}

                      {/* Tooltip for collapsed mode */}
                      {collapsed && (
                        <div className="absolute left-full ml-3 hidden group-hover:block z-50">
                          <div className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
                            {item.title}
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer Section */}
        <div className="relative p-4 border-t border-slate-100/80 bg-slate-50/50">
          {!collapsed ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md group">
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                    AD
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-slate-800 truncate">Adnan Hussain</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Super Admin</p>
                </div>
                <button onClick={handleLogout} className="text-slate-300 hover:text-rose-500 transition-colors" title="Logout">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between px-2">
                <button 
                  onClick={onToggleCollapse}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Live</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <button 
                onClick={onToggleCollapse}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </button>
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                AD
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
