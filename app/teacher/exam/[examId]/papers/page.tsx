'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ExamPapersPage } from '@/features/admin/exam-engine/ExamPapersPage';

export default function TeacherExamPapersPage() {
  const params = useParams();
  const examId = typeof params.examId === 'string' ? params.examId : '';

  if (!examId) return null;

  return (
    <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading papers…</p>}>
      <ExamPapersPage examId={examId} />
    </Suspense>
  );
}
