'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ExamLeaderboardPage } from '@/features/admin/exam-engine/ExamLeaderboardPage';

export default function AdminExamLeaderboardRoutePage() {
  const params = useParams();
  const examId = typeof params.examId === 'string' ? params.examId : '';

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-serif text-lg text-[#0D1B35]">Exam leaderboard</h1>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        {examId ? (
          <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading…</p>}>
            <ExamLeaderboardPage examId={examId} />
          </Suspense>
        ) : null}
      </main>
    </div>
  );
}
