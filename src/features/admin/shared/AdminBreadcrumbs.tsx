'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { getExamById } from '@/lib/api/exams';
import { useAdminSession } from './admin-session';

const SEGMENT_MAP: Record<string, string> = {
  admin: 'Admin',
  reports: 'Analytics',
  'academic-records': 'Academic Records',
  enrollments: 'Enrollments',
  batches: 'Batches',
  courses: 'Courses',
  exams: 'Exams',
  exam: 'Exam',
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
  'payment-access': 'Payment access',
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
  setup: 'Setup',
  details: 'Details',
  leaderboard: 'Leaderboard',
  papers: 'Papers',
  pdf: 'PDF',
  new: 'New',
};

const EXAM_STATIC_SEGMENTS = new Set(['new']);

function resolveExamIdFromPath(segments: string[]): string | null {
  if (segments[0] !== 'admin' || segments[1] !== 'exam') return null;
  const candidate = segments[2];
  if (!candidate || EXAM_STATIC_SEGMENTS.has(candidate)) return null;
  return candidate;
}

function formatBreadcrumbLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed.length <= 48) return trimmed;
  return `${trimmed.slice(0, 45).trimEnd()}…`;
}

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const { user } = useAdminSession();

  const pathSegments = useMemo(
    () => (pathname ? pathname.split('/').filter(Boolean) : []),
    [pathname],
  );
  const examId = useMemo(() => resolveExamIdFromPath(pathSegments), [pathSegments]);

  const { data: examTitle } = useQuery({
    queryKey: ['admin-breadcrumb-exam', examId],
    queryFn: async () => {
      if (!examId) return null;
      const response = await getExamById(examId);
      return response.success && response.data?.title?.trim()
        ? response.data.title.trim()
        : null;
    },
    enabled: Boolean(examId),
    staleTime: 60_000,
  });

  const breadcrumbs = useMemo(() => {
    if (!pathname) return [{ label: 'Admin', active: true }];

    const segments = pathSegments;

    if (segments.length <= 1) {
      const second = user?.role === 'BRANCH_ADMIN' ? 'Branch' : 'Analytics';
      return [
        { label: 'Admin', active: false },
        { label: second, active: true },
      ];
    }

    return segments.map((segment, index) => {
      let label =
        SEGMENT_MAP[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

      if (examId && index === 2 && segment === examId) {
        label = formatBreadcrumbLabel(examTitle ?? 'Exam');
      }

      return { label, active: index === segments.length - 1 };
    });
  }, [examId, examTitle, pathSegments, pathname, user?.role]);

  return (
    <div className="flex items-center gap-2 text-slate-400">
      {breadcrumbs.map((crumb, idx) => (
        <div key={`${crumb.label}-${idx}`} className="flex items-center gap-2">
          <span
            className={cn(
              'max-w-[12rem] truncate text-base font-bold uppercase tracking-widest transition-colors duration-200 sm:max-w-xs',
              crumb.active ? 'text-indigo-600' : 'text-slate-400',
            )}
            title={crumb.label}
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
