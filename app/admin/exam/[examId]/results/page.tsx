'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ExamResultsPage } from '@/features/admin/exam-engine/ExamResultsPage';
import { useAdminSession } from '@/features/admin/shared/admin-session';

export default function AdminExamResultsRoutePage() {
  const params = useParams();
  const examId = typeof params.examId === 'string' ? params.examId : '';
  const { user } = useAdminSession();
  const teacherEvaluatorMode = user?.role === 'TEACHER';

  if (!examId) return null;

  return (
    <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading…</p>}>
      <ExamResultsPage examId={examId} teacherEvaluatorMode={teacherEvaluatorMode} />
    </Suspense>
  );
}
