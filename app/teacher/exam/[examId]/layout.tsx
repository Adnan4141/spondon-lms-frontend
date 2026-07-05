'use client';

import { useParams } from 'next/navigation';
import { ExamWorkspaceShell } from '@/features/admin/exam-engine/layout/ExamWorkspaceShell';
import { useTeacherSession } from '@/components/teacher/useTeacherSession';

export default function TeacherExamWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const examId = typeof params.examId === 'string' ? params.examId : '';
  const { user } = useTeacherSession();

  if (!examId) {
    return <div className="p-8 text-sm text-slate-500">Invalid exam.</div>;
  }

  return (
    <ExamWorkspaceShell examId={examId} portal="teacher" teacherUserId={user?.id}>
      {children}
    </ExamWorkspaceShell>
  );
}
