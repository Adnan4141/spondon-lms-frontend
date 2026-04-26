'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExamWizard } from '@/features/admin/exam-engine/ExamWizard';

export default function AdminExamEditPage() {
  const params = useParams();
  const examId = typeof params.examId === 'string' ? params.examId : '';

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="gap-1 text-slate-600">
              <Link href="/admin/exam">
                <ChevronLeft className="h-4 w-4" /> Exams
              </Link>
            </Button>
            <div className="hidden h-5 w-px bg-slate-200 sm:block" />
            <h1 className="font-serif text-lg text-[#0D1B35]">Edit exam</h1>
          </div>
        </div>
      </header>
      
      <main className="mx-auto max-w-7xl px-4 py-6">
        {examId ? (
          <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading wizard…</p>}>
            <ExamWizard examId={examId} />
          </Suspense>
        ) : null}
      </main>
    </div>
  );
}
