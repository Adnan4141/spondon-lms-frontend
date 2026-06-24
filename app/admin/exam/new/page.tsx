'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExamWizard } from '@/features/admin/exam-engine/ExamWizard';
import { WIZARD_STEPS } from '@/features/admin/exam-engine/types';
import { parseStepParam } from '@/features/admin/exam-engine/wizard/wizardHelpers';
import {
  examWizardContainerClass,
  examWizardHeaderClass,
  examWizardMainClass,
  examWizardPageClass,
} from '@/features/admin/exam-engine/wizard/examWizardPageUi';

function AdminExamNewPageContent() {
  const searchParams = useSearchParams();
  const step = parseStepParam(searchParams.get('step'));
  const stepLabel = WIZARD_STEPS[step - 1] ?? WIZARD_STEPS[0];

  return (
    <div className={examWizardPageClass}>
      <header className={examWizardHeaderClass}>
        <div className={`${examWizardContainerClass} flex flex-wrap items-center justify-between gap-3 py-3`}>
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="shrink-0 gap-1 text-slate-600">
              <Link href="/admin/exam">
                <ChevronLeft className="h-4 w-4" /> Exams
              </Link>
            </Button>
            <div className="hidden h-5 w-px shrink-0 bg-slate-200 sm:block" />
            <div className="min-w-0">
              <h1 className="truncate font-serif text-lg text-[#0D1B35]">Create exam</h1>
              <p className="truncate text-xs text-slate-500">
                Step {step} · {stepLabel}
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            6-step wizard
          </span>
        </div>
      </header>

      <main className={examWizardMainClass}>
        {step === 1 ? (
          <section className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1 bg-gradient-to-r from-[#0D1B35] to-[#C8A96E]" />
            <div className="flex flex-wrap items-start gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0D1B35] text-[#E2C98A]">
                <ClipboardCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-[#0D1B35] sm:text-base">Choose the exam workflow first</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                  MCQ stays digital, CQ/written uses handwritten upload, hybrid combines both, and offline exams support
                  teacher result entry.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading wizard…</p>}>
          <ExamWizard />
        </Suspense>
      </main>
    </div>
  );
}

export default function AdminExamNewPage() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-sm text-slate-500">Loading page…</p>}>
      <AdminExamNewPageContent />
    </Suspense>
  );
}
