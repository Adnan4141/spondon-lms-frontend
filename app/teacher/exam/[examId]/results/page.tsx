'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ExamResultsPage } from '@/features/admin/exam-engine/ExamResultsPage';

export default function TeacherExamResultsPage() {
  const params = useParams();
  const examId = typeof params.examId === 'string' ? params.examId : '';

  if (!examId) return null;

  return (
    <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading results…</p>}>
      <ExamResultsPage examId={examId} teacherEvaluatorMode />
    </Suspense>
  );
}
