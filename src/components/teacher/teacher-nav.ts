import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileQuestion,
  Users,
  HelpCircle,
  UserCircle,
} from 'lucide-react';

export type TeacherNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  iconBg: string;
  iconRing: string;
  iconColor: string;
  badgeKey?: 'openDoubts';
};

export type TeacherNavSection = {
  label: string;
  items: TeacherNavItem[];
};

export const TEACHER_SIDEBAR_THEME = {
  shell:
    'border-r border-slate-200/80 bg-gradient-to-b from-white via-slate-50/40 to-violet-50/20',
  focus:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
} as const;

export const TEACHER_ROUTE_LABELS: Record<string, { title: string; subtitle?: string }> = {
  '/teacher': { title: 'Dashboard', subtitle: 'Your teaching workspace at a glance' },
  '/teacher/courses': { title: 'My Lessons', subtitle: 'Courses you teach or collaborate on' },
  '/teacher/routine': { title: 'Routine', subtitle: 'Your weekly class schedule' },
  '/teacher/students': { title: 'My Students', subtitle: 'Students enrolled in your courses' },
  '/teacher/exams': { title: 'Exams', subtitle: 'Create and manage assessments' },
  '/teacher/exam/new': { title: 'Create Exam', subtitle: 'Set up a new assessment' },
  '/teacher/questions': { title: 'Question Bank', subtitle: 'Prepare and organize questions' },
  '/teacher/doubts': { title: 'Doubts', subtitle: 'Answer student questions' },
  '/teacher/profile': { title: 'Profile', subtitle: 'Update your account information' },
};

export const TEACHER_NAV_SECTIONS: TeacherNavSection[] = [
  {
    label: 'Home',
    items: [
      {
        title: 'Dashboard',
        href: '/teacher',
        icon: LayoutDashboard,
        iconBg: 'bg-indigo-50',
        iconRing: 'ring-indigo-100',
        iconColor: 'text-indigo-700',
      },
    ],
  },
  {
    label: 'Teaching',
    items: [
      {
        title: 'My Lessons',
        href: '/teacher/courses',
        icon: BookOpen,
        iconBg: 'bg-sky-50',
        iconRing: 'ring-sky-100',
        iconColor: 'text-sky-700',
      },
      {
        title: 'Routine',
        href: '/teacher/routine',
        icon: CalendarDays,
        iconBg: 'bg-emerald-50',
        iconRing: 'ring-emerald-100',
        iconColor: 'text-emerald-700',
      },
      {
        title: 'My Students',
        href: '/teacher/students',
        icon: Users,
        iconBg: 'bg-violet-50',
        iconRing: 'ring-violet-100',
        iconColor: 'text-violet-700',
      },
    ],
  },
  {
    label: 'Assessment',
    items: [
      {
        title: 'Exams',
        href: '/teacher/exams',
        icon: ClipboardList,
        iconBg: 'bg-blue-50',
        iconRing: 'ring-blue-100',
        iconColor: 'text-blue-700',
      },
      {
        title: 'Question Bank',
        href: '/teacher/questions',
        icon: FileQuestion,
        iconBg: 'bg-amber-50',
        iconRing: 'ring-amber-100',
        iconColor: 'text-amber-800',
      },
    ],
  },
  {
    label: 'Support',
    items: [
      {
        title: 'Doubts',
        href: '/teacher/doubts',
        icon: HelpCircle,
        iconBg: 'bg-rose-50',
        iconRing: 'ring-rose-100',
        iconColor: 'text-rose-700',
        badgeKey: 'openDoubts',
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        title: 'Profile',
        href: '/teacher/profile',
        icon: UserCircle,
        iconBg: 'bg-slate-100',
        iconRing: 'ring-slate-200',
        iconColor: 'text-slate-700',
      },
    ],
  },
];

export function isTeacherNavItemActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const clean = pathname.replace(/\/$/, '') || '/';
  const target = href.replace(/\/$/, '') || '/';
  if (target === '/teacher') return clean === '/teacher';
  return clean === target || clean.startsWith(`${target}/`);
}

function startCase(segment: string) {
  return segment
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function resolveTeacherHeader(pathname: string | null) {
  if (!pathname) return TEACHER_ROUTE_LABELS['/teacher'];
  const clean = pathname.replace(/\/$/, '');
  if (TEACHER_ROUTE_LABELS[clean]) return TEACHER_ROUTE_LABELS[clean];

  const segments = clean.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  if (segments[0] === 'teacher' && segments[1] === 'courses' && segments.length === 3) {
    return { title: 'Course', subtitle: 'Manage lessons and content' };
  }
  if (segments[0] === 'teacher' && segments[1] === 'doubts' && segments.length === 3) {
    return { title: 'Doubt Thread', subtitle: 'Reply to student question' };
  }

  if (!lastSegment || lastSegment === 'teacher') {
    return TEACHER_ROUTE_LABELS['/teacher'];
  }

  return {
    title: startCase(lastSegment),
    subtitle: 'Teacher portal',
  };
}
