'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ExamLeaderboardPage } from '@/features/admin/exam-engine/ExamLeaderboardPage';

export default function TeacherExamLeaderboardPage() {
  const params = useParams();
  const examId = typeof params.examId === 'string' ? params.examId : '';

  if (!examId) return null;

  return (
    <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading leaderboard…</p>}>
      <ExamLeaderboardPage examId={examId} />
    </Suspense>
  );
}
