'use client';

import { usePathname } from 'next/navigation';
import { AdminLayout } from './AdminLayout';
import { ExamResultsTeacherLayout } from '@/features/admin/exam-engine/ExamResultsTeacherLayout';
import { useAdminSession } from './admin-session';
import { AdminQueryProvider } from '@/components/providers/AdminQueryProvider';

const TEACHER_RESULTS_PATH = /^\/admin\/exam\/[^/]+\/results\/?$/;

export function ConditionalAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAdminSession();
  const teacherOnResults =
    user?.role === 'TEACHER' && (pathname ? TEACHER_RESULTS_PATH.test(pathname) : false);

  const shell = teacherOnResults ? (
    <ExamResultsTeacherLayout>{children}</ExamResultsTeacherLayout>
  ) : (
    <AdminLayout>{children}</AdminLayout>
  );

  return <AdminQueryProvider>{shell}</AdminQueryProvider>;
}
