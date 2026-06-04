'use client';

import { useParams, usePathname } from 'next/navigation';
import { ExamWorkspaceShell } from '@/features/admin/exam-engine/layout/ExamWorkspaceShell';
import { useAdminSession } from '@/features/admin/shared/admin-session';

export default function AdminExamWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname() || '';
  const examId = typeof params.examId === 'string' ? params.examId : '';
  const { user } = useAdminSession();
  const teacherEvaluatorMode = user?.role === 'TEACHER' && pathname.includes('/results');

  if (!examId) {
    return <div className="p-8 text-sm text-slate-500">Invalid exam.</div>;
  }

  return (
    <ExamWorkspaceShell
      examId={examId}
      hideSubnav={teacherEvaluatorMode}
      backHref={teacherEvaluatorMode ? '/teacher/exams' : undefined}
      backLabel={teacherEvaluatorMode ? 'My exams' : undefined}
    >
      {children}
    </ExamWorkspaceShell>
  );
}
