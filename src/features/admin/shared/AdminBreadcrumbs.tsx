'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAdminSession } from './admin-session';

const SEGMENT_MAP: Record<string, string> = {
  admin: 'Admin',
  reports: 'Analytics',
  'academic-records': 'Academic Records',
  enrollments: 'Enrollments',
  batches: 'Batches',
  courses: 'Courses',
  exams: 'Exams',
  students: 'Students',
  settings: 'Settings',
  branches: 'Branches',
  programs: 'Programs',
  books: 'Books',
  questions: 'Question Bank',
  mcq: 'MCQ',
  combined: 'Combined MCQ',
  cq: 'CQ',
  short: 'Short Questions',
  branch: 'Branch dashboard',
  teachers: 'Teachers',
  'monthly-billing': 'Monthly billing',
  inventory: 'Inventory',
  'exam-results': 'Exam Results',
  testimonials: 'Reviews',
  partners: 'Partners',
  institutes: 'Institutes',
  invoices: 'Invoices',
  sms: 'SMS Console',
  'attendance-sheet': 'Attendance Sheet',
  results: 'Results',
  approvals: 'Approvals',
  landing: 'Landing',
  faq: 'FAQ',
  accounting: 'Accounting',
  community: 'Community',
};

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const { user } = useAdminSession();

  const breadcrumbs = useMemo(() => {
    if (!pathname) return [{ label: 'Admin', active: true }];

    const segments = pathname.split('/').filter(Boolean);

    if (segments.length <= 1) {
      const second = user?.role === 'BRANCH_ADMIN' ? 'Branch' : 'Analytics';
      return [
        { label: 'Admin', active: false },
        { label: second, active: true },
      ];
    }

    return segments.map((segment, index) => {
      const label =
        SEGMENT_MAP[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      return { label, active: index === segments.length - 1 };
    });
  }, [pathname, user?.role]);

  return (
    <div className="flex items-center gap-2 text-slate-400">
      {breadcrumbs.map((crumb, idx) => (
        <div key={`${crumb.label}-${idx}`} className="flex items-center gap-2">
          <span
            className={cn(
              'text-base font-bold uppercase tracking-widest transition-colors duration-200',
              crumb.active ? 'text-indigo-600' : 'text-slate-400',
            )}
          >
            {crumb.label}
          </span>
          {idx < breadcrumbs.length - 1 && (
            <span className="text-slate-200">/</span>
          )}
        </div>
      ))}
    </div>
  );
}
