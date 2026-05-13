'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { ChevronLeft, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExamWizard } from '@/features/admin/exam-engine/ExamWizard';

export default function AdminExamNewPage() {
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
            <h1 className="font-serif text-lg text-[#0D1B35]">Create exam</h1>
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Workflow-first wizard · 6 steps</span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1B35] text-[#E2C98A]">
              <ClipboardCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#0D1B35]">Choose the exam workflow first</h2>
              <p className="text-sm text-slate-600">
                MCQ stays digital, CQ/written uses handwritten upload, hybrid combines both, and offline exams support teacher result entry.
              </p>
            </div>
          </div>
        </section>
        <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading wizard…</p>}>
          <ExamWizard />
        </Suspense>
      </main>
    </div>
  );
}
