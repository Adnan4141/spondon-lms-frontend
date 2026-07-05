'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ExamOverviewPage } from '@/features/admin/exam-engine/ExamOverviewPage';

export default function TeacherExamOverviewPage() {
  const params = useParams();
  const examId = typeof params.examId === 'string' ? params.examId : '';

  if (!examId) return null;

  return (
    <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading overview…</p>}>
      <ExamOverviewPage examId={examId} />
    </Suspense>
  );
}
