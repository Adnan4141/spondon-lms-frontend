'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ExamWizard } from '@/features/admin/exam-engine/ExamWizard';
import { ExamWorkspacePageHeader } from '@/features/admin/exam-engine/layout/ExamWorkspacePageHeader';
import { useTeacherSession } from '@/components/teacher/useTeacherSession';

export default function TeacherExamSetupPage() {
  const params = useParams();
  const examId = typeof params.examId === 'string' ? params.examId : '';
  const { user } = useTeacherSession();

  if (!examId) return null;

  return (
    <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading wizard…</p>}>
      <div className="w-full max-w-full min-w-0 space-y-4">
        <ExamWorkspacePageHeader
          title="Setup wizard"
          description="Configure questions, schedule, and publish settings."
        />
        <ExamWizard examId={examId} teacherUserId={user?.id} variant="teacher" />
      </div>
    </Suspense>
  );
}
