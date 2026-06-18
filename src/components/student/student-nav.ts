import type { LucideIcon } from 'lucide-react';
import {
  UsersRound,
  Library,
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
  /** Subtle icon tile styling (professional) */
  iconBg: string;
  iconRing: string;
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
  navHover:
    'hover:bg-white/90 hover:shadow-sm hover:shadow-slate-200/50 hover:border-slate-200/60',
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
        iconBg: 'bg-sky-50',
        iconRing: 'ring-sky-100',
        iconColor: 'text-sky-700',
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
        iconBg: 'bg-indigo-50',
        iconRing: 'ring-indigo-100',
        iconColor: 'text-indigo-700',
      },
      {
        title: 'Routine',
        href: '/student/routine',
        icon: CalendarDays,
        iconBg: 'bg-emerald-50',
        iconRing: 'ring-emerald-100',
        iconColor: 'text-emerald-700',
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
        iconBg: 'bg-blue-50',
        iconRing: 'ring-blue-100',
        iconColor: 'text-blue-700',
      },
      {
        title: 'Results',
        href: '/student/results',
        icon: Trophy,
        iconBg: 'bg-amber-50',
        iconRing: 'ring-amber-100',
        iconColor: 'text-amber-800',
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
        iconBg: 'bg-rose-50',
        iconRing: 'ring-rose-100',
        iconColor: 'text-rose-700',
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
        iconBg: 'bg-slate-100',
        iconRing: 'ring-slate-200',
        iconColor: 'text-slate-700',
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
