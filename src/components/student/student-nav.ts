import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  GraduationCap,
  Calendar,
  HelpCircle,
  BookOpenCheck,
  Award,
  BookMarked,
  CreditCard,
  UserCircle,
} from 'lucide-react';

export type StudentNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  color: string;
  bg: string;
};

export type StudentNavSection = {
  label: string;
  items: StudentNavItem[];
};

export const STUDENT_NAV_SECTIONS: StudentNavSection[] = [
  {
    label: 'Home',
    items: [
      {
        title: 'Dashboard',
        href: '/student',
        icon: LayoutDashboard,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      },
      {
        title: 'Community',
        href: '/student/community',
        icon: MessageSquare,
        color: 'text-cyan-600',
        bg: 'bg-cyan-50',
      },
    ],
  },
  {
    label: 'Learning',
    items: [
      {
        title: 'My Courses',
        href: '/student/courses',
        icon: BookOpen,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
      },
      {
        title: 'Browse Courses',
        href: '/student/all-courses',
        icon: GraduationCap,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
      },
      {
        title: 'Routine',
        href: '/student/routine',
        icon: Calendar,
        color: 'text-teal-600',
        bg: 'bg-teal-50',
      },
      {
        title: 'Q&A',
        href: '/student/doubts',
        icon: HelpCircle,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
      },
    ],
  },
  {
    label: 'Assessment',
    items: [
      {
        title: 'Exams',
        href: '/student/exams',
        icon: BookOpenCheck,
        color: 'text-sky-600',
        bg: 'bg-sky-50',
      },
      {
        title: 'Results',
        href: '/student/results',
        icon: Award,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
      },
    ],
  },
  {
    label: 'Resources',
    items: [
      {
        title: 'Books',
        href: '/student/books',
        icon: BookMarked,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        title: 'Fees & Payments',
        href: '/student/payment',
        icon: CreditCard,
        color: 'text-green-600',
        bg: 'bg-green-50',
      },
      {
        title: 'Profile',
        href: '/student/profile',
        icon: UserCircle,
        color: 'text-slate-600',
        bg: 'bg-slate-100',
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
