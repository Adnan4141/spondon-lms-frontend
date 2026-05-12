'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, type ComponentType } from 'react';
import {
  SidebarCollapseRow,
  SidebarExpandFooterButton,
} from '@/components/layout/SidebarDockToggle';
import { cn } from '@/lib/utils';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { clearAuthStorage, useAdminSession } from './admin-session';
import {
  BookOpen,
  Users,
  GraduationCap,
  MessageSquare,
  Settings,
  LayoutDashboard,
  Calendar,
  CreditCard,
  BarChart3,
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
  Package,
  ShieldCheck,
  Wallet,
  LayoutTemplate,
  Settings2,
  Info,
  Lock,
  UsersRound,
  ShoppingCart,
  Truck,
  History,
} from 'lucide-react';

type MenuItem = {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bg: string;
};

type MenuSection = { label: string; items: MenuItem[] };

function buildMenuSections(role: string | null): MenuSection[] {
  const isBranchAdmin = role === 'BRANCH_ADMIN';
  const isAccounts = role === 'ACCOUNTS';
  const isModerator = role === 'MODERATOR';

  // ----- Overview -----
  const overviewItems: MenuItem[] = isBranchAdmin
    ? [
        { title: 'Branch dashboard', href: '/admin/branch', icon: Building2, color: 'text-sky-600', bg: 'bg-sky-50' },
      ]
    : [
        { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, color: 'text-blue-500', bg: 'bg-blue-50' },
      ];

  // ----- Student section -----
  const allStudentItems: MenuItem[] = [
    { title: 'Students', href: '/admin/students', icon: Users, color: 'text-violet-500', bg: 'bg-violet-50' },

  ];
  const studentItems: MenuItem[] = isAccounts
    ? allStudentItems.filter((i) => ['/admin/enrollments', '/admin/invoices'].includes(i.href))
    : isModerator
    ? []
    : allStudentItems;

  // ----- Course section -----
  const courseItems: MenuItem[] = [
    { title: 'Programs', href: '/admin/programs', icon: GraduationCap, color: 'text-rose-500', bg: 'bg-rose-50' },
    { title: 'Courses', href: '/admin/courses', icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { title: 'Batches', href: '/admin/batches', icon: Calendar, color: 'text-sky-500', bg: 'bg-sky-50' },
    { title: 'Routine', href: '/admin/routine', icon: CalendarRange, color: 'text-teal-500', bg: 'bg-teal-50' },
    { title: 'Attendance Sheet', href: '/admin/attendance-sheet', icon: ClipboardList, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];
  const visibleCourseItems = isBranchAdmin
    ? courseItems.filter((item) => item.href === '/admin/batches')
    : courseItems;
  const showCourse = !isAccounts && visibleCourseItems.length > 0;

  // ----- Question System -----
  const questionItems: MenuItem[] = [
    { title: 'Questions', href: '/admin/questions', icon: HelpCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];
  const showQuestions = !isAccounts && !isBranchAdmin;

  // ----- Exam -----
  const examItems: MenuItem[] = [
    { title: 'Exam', href: '/admin/exam', icon: ClipboardList, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];
  const showExam = !isAccounts && !isBranchAdmin;

  // ----- Communities -----
  const communityItems: MenuItem[] = [
    { title: 'Communities', href: '/admin/communities', icon: UsersRound, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  ];
  const showCommunities = role === 'SUPER_ADMIN' || isModerator;

  // ----- Books -----
  const allBookItems: MenuItem[] = [
    { title: 'Books', href: '/admin/books', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Offline Sales', href: '/admin/books/offline-sales', icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Online Orders', href: '/admin/books/orders', icon: Truck, color: 'text-sky-600', bg: 'bg-sky-50' },
    { title: 'Stock & Distribution', href: '/admin/books/stock', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];
  const bookItems: MenuItem[] = isModerator
    ? []
    : isBranchAdmin
      ? allBookItems.filter((item) => ['/admin/books/offline-sales', '/admin/books/stock'].includes(item.href))
      : allBookItems;

  // ----- Management -----
  const managementItems: MenuItem[] = [
    { title: 'Teachers', href: '/admin/teachers', icon: Presentation, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { title: 'Partners', href: '/admin/partners', icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Branches', href: '/admin/branches', icon: Building2, color: 'text-red-500', bg: 'bg-red-50' },
    { title: 'Institutes', href: '/admin/institutes', icon: School, color: 'text-rose-500', bg: 'bg-rose-50' },
    { title: 'Reviews', href: '/admin/testimonials', icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ].filter((item) => {
    if (isBranchAdmin) return false;
    if (isModerator) return item.href === '/admin/teachers';
    if (isAccounts) return false;
    return true;
  });

  // ----- User Management (SUPER_ADMIN only) -----
  const userMgmtItems: MenuItem[] = [
    { title: 'User Management', href: '/admin/users', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Audit History', href: '/admin/audit', icon: History, color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  // ----- Administrative -----
  const allAdminItems: MenuItem[] = [
    { title: 'Monthly billing', href: '/admin/monthly-billing', icon: CalendarRange, color: 'text-violet-600', bg: 'bg-violet-50' },
    { title: 'Payouts', href: '/admin/payouts', icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'SMS Console', href: '/admin/sms', icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'Reports', href: '/admin/reports', icon: BarChart3, color: 'text-teal-500', bg: 'bg-teal-50' },
    { title: 'Accounting', href: '/admin/accounting', icon: Wallet, color: 'text-sky-600', bg: 'bg-sky-50' },
    { title: 'Settings', href: '/admin/settings', icon: Settings, color: 'text-slate-500', bg: 'bg-slate-50' },
  ];

  const financeItems: MenuItem[] = isAccounts
    ? allAdminItems.filter((item) => ['/admin/reports', '/admin/accounting'].includes(item.href))
    : isBranchAdmin
      ? allAdminItems.filter((item) => ['/admin/reports', '/admin/sms'].includes(item.href))
      : isModerator
        ? []
        : allAdminItems.filter((item) => ['/admin/reports', '/admin/accounting'].includes(item.href));

  const adminItems: MenuItem[] = isAccounts
    ? allAdminItems.filter((i) =>
        ['/admin/monthly-billing', '/admin/payouts', '/admin/books'].includes(i.href),
      )
    : isBranchAdmin
    ? []
    : isModerator
    ? []
    : allAdminItems.filter((item) => !['/admin/reports', '/admin/accounting'].includes(item.href));

  // ----- Assemble sections, skipping empty ones -----
  const sections: MenuSection[] = [
    { label: 'Overview', items: overviewItems },
  ];

  if (studentItems.length > 0) sections.push({ label: 'Student', items: studentItems });
  if (showCourse) sections.push({ label: 'Course', items: visibleCourseItems });
  if (showQuestions) sections.push({ label: 'Question System', items: questionItems });
  if (showExam) sections.push({ label: 'Exam', items: examItems });
  if (showCommunities) sections.push({ label: 'Community', items: communityItems });
  if (bookItems.length > 0) sections.push({ label: 'Books', items: bookItems });
  if (managementItems.length > 0) sections.push({ label: 'Management', items: managementItems });
  if (role === 'SUPER_ADMIN') {
    sections.push({ label: 'System', items: userMgmtItems });
  }
  if (financeItems.length > 0) sections.push({ label: 'Finance', items: financeItems });
  if (adminItems.length > 0) sections.push({ label: 'Administrative', items: adminItems });

  // ----- Landing CMS (SUPER_ADMIN + BRANCH_ADMIN) -----
  if (role === 'SUPER_ADMIN') {
    sections.push({
      label: 'Website',
      items: [
        { title: 'CMS', href: '/admin/landing', icon: LayoutTemplate, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
        { title: 'Trust Features', href: '/admin/trust-features', icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { title: 'Site Settings', href: '/admin/site-settings', icon: Settings2, color: 'text-violet-600', bg: 'bg-violet-50' },
        { title: 'About Us CMS', href: '/admin/about-us', icon: Info, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { title: 'FAQ', href: '/admin/faq', icon: HelpCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
        { title: 'Privacy Policy', href: '/admin/privacy-policy', icon: Lock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      ],
    });
  }

  return sections;
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
  const { user, initials, roleLabel } = useAdminSession();
  const role = user?.role ?? null;

  const menuSections = useMemo(() => buildMenuSections(role), [role]);
  const homeHref = role === 'BRANCH_ADMIN' ? '/admin/branch' : '/admin';

  const displayName = user?.fullName?.trim() || 'User';
  const avatarUrl =
    user?.profileImage?.trim() &&
    resolveAttachmentUrl(user.profileImage.trim(), API_ORIGIN);

  const handleLogout = () => {
    clearAuthStorage();
    router.push('/login');
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
        <div className="relative flex h-20 items-center gap-3 border-b border-slate-100/80 px-6">
          <Link href={homeHref} className="group flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200 transition-transform group-hover:scale-105 group-hover:rotate-3">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-xl font-black leading-none tracking-tight text-slate-900">Codezyne</span>
                <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-500/80">
                  Learning Management System
                </span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={onCloseMobile}
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors hover:text-slate-600 lg:ml-0 lg:hidden"
            aria-label="Close admin sidebar"
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
                    item.href === '/admin' || item.href === '/admin/books'
                      ? pathname === item.href
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
                  <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-sm">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-slate-800 truncate">{displayName}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{roleLabel}</p>
                </div>
                <button onClick={handleLogout} className="text-slate-300 hover:text-rose-500 transition-colors" title="Logout">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

              <SidebarCollapseRow onToggleCollapse={onToggleCollapse} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <SidebarExpandFooterButton onToggleCollapse={onToggleCollapse} />
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-lg">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
