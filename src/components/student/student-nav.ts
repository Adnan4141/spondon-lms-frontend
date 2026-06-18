import type { LucideIcon } from 'lucide-react';
import {
  UsersRound,
  Library,
  Compass,
  CalendarDays,
  ClipboardCheck,
  Trophy,
  BookCopy,
  Wallet,
} from 'lucide-react';

export type StudentNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Gradient classes for the icon tile */
  iconGradient: string;
  iconShadow: string;
  /** Text color on inactive icon tile */
  iconColor: string;
};

export type StudentNavSection = {
  label: string;
  items: StudentNavItem[];
};

export const STUDENT_SIDEBAR_THEME = {
  shell:
    'border-r border-slate-200/80 bg-gradient-to-b from-white via-slate-50/40 to-indigo-50/20',
  navIdle: 'text-slate-600',
  navHover: 'hover:bg-white/90 hover:shadow-sm hover:shadow-slate-200/50 hover:border-slate-200/60',
  navActive:
    'bg-white border-indigo-200/80 text-indigo-950 shadow-md shadow-indigo-100/60',
  focus:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
} as const;

export const STUDENT_NAV_SECTIONS: StudentNavSection[] = [
  {
    label: 'Home',
    items: [
      {
        title: 'Community',
        href: '/student/community',
        icon: UsersRound,
        iconGradient: 'from-sky-500 to-blue-600',
        iconShadow: 'shadow-sky-200/60',
        iconColor: 'text-white',
      },
    ],
  },
  {
    label: 'Learning',
    items: [
      {
        title: 'My Courses',
        href: '/student/courses',
        icon: Library,
        iconGradient: 'from-indigo-500 to-violet-600',
        iconShadow: 'shadow-indigo-200/60',
        iconColor: 'text-white',
      },
      {
        title: 'Browse Courses',
        href: '/student/all-courses',
        icon: Compass,
        iconGradient: 'from-violet-500 to-purple-600',
        iconShadow: 'shadow-violet-200/60',
        iconColor: 'text-white',
      },
      {
        title: 'Routine',
        href: '/student/routine',
        icon: CalendarDays,
        iconGradient: 'from-teal-500 to-emerald-600',
        iconShadow: 'shadow-teal-200/60',
        iconColor: 'text-white',
      },
    ],
  },
  {
    label: 'Assessment',
    items: [
      {
        title: 'Exams',
        href: '/student/exams',
        icon: ClipboardCheck,
        iconGradient: 'from-blue-500 to-indigo-600',
        iconShadow: 'shadow-blue-200/60',
        iconColor: 'text-white',
      },
      {
        title: 'Results',
        href: '/student/results',
        icon: Trophy,
        iconGradient: 'from-amber-500 to-orange-500',
        iconShadow: 'shadow-amber-200/60',
        iconColor: 'text-white',
      },
    ],
  },
  {
    label: 'Resources',
    items: [
      {
        title: 'Books',
        href: '/student/books',
        icon: BookCopy,
        iconGradient: 'from-rose-500 to-pink-600',
        iconShadow: 'shadow-rose-200/60',
        iconColor: 'text-white',
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        title: 'Fees & Payments',
        href: '/student/payment',
        icon: Wallet,
        iconGradient: 'from-slate-600 to-slate-800',
        iconShadow: 'shadow-slate-300/50',
        iconColor: 'text-white',
      },
    ],
  },
];

export function isStudentNavItemActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const clean = pathname.replace(/\/$/, '') || '/';
  const target = href.replace(/\/$/, '') || '/';
  if (target === '/student') return clean === '/student';
  return clean === target || clean.startsWith(`${target}/`);
}
