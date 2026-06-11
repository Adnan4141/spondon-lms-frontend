'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExamWizardState } from '../../types';

type Props = {
  state: ExamWizardState;
  examId?: string;
  hasMasterPdf: boolean;
  deliveryMode: 'ONLINE' | 'OFFLINE';
  /** Hall OMR sheets generated (batch PDF or persisted omrGeneratedUrl). */
  hasOmrSheets?: boolean;
  /** At least one OMR scan batch uploaded in Results. */
  hasOmrUploads?: boolean;
};

function StepRow({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <li className="flex gap-2.5 text-sm">
      {done ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
      ) : (
        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
      )}
      <span className={done ? 'text-slate-600' : 'font-medium text-slate-800'}>{children}</span>
    </li>
  );
}

/**
 * Step 6 checklist for offline MCQ exams that use OMR scan — replaces the
 * need to hunt through docs for the bank → PDF → OMR pipeline.
 */
export function OfflineOmrWorkflowCard({
  state,
  examId,
  hasMasterPdf,
  deliveryMode,
  hasOmrSheets = false,
  hasOmrUploads = false,
}: Props) {
  const omrFlow =
    deliveryMode === 'OFFLINE'
    && state.resultInputModes.includes('OMR_SCAN')
    && state.productType !== 'WRITTEN';

  if (!omrFlow) return null;

  const omrConfigured = state.omrConfig !== null;
  const hasSections =
    state.productType === 'MULTI' ? state.subjects.length > 0 : state.sections.length > 0;

  return (
    <Card className="border-[#C8A96E]/50 bg-[#FBF4E6]/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="font-serif text-base text-[#0D1B35]">Offline OMR workflow</CardTitle>
        <CardDescription>
          Offline exams do not use automatic online grading. Pull questions from the bank, print the paper at the
          centre, print per-student OMR bubble sheets for MCQ, then scan them in Results. Written/CQ answers use any
          paper — no LMS answer template.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2.5">
          <StepRow done={omrConfigured}>
            Step 1: Enable the <strong>OMR sheet</strong> and match question count to your MCQ section total.
          </StepRow>
          <StepRow done={hasSections}>
            Steps 2–3: Add MCQ sections and assign <strong>question bank folders</strong>.
          </StepRow>
          <StepRow done={Boolean(examId)}>
            Click <strong>Save &amp; pull questions from bank</strong> below to build exam sets (not automatic
            online grading).
          </StepRow>
          <StepRow done={hasMasterPdf}>
            Click <strong>Regenerate question paper PDF</strong> in Exam outputs to print the master paper.
          </StepRow>
          <StepRow done={hasOmrSheets}>
            Click <strong>Print hall OMR sheets (scan in Results)</strong> (one page per enrolled student; A4, no scaling).
          </StepRow>
          <StepRow done={hasOmrUploads}>
            After the exam, upload scans from{' '}
            {examId ? (
              <Link href={`/admin/exam/${examId}/results`} className="font-semibold text-[#0D1B35] underline">
                Results → OMR review
              </Link>
            ) : (
              'Results → OMR review'
            )}
            .
          </StepRow>
        </ol>
        {!state.resultInputModes.includes('AUTOMATED') ? null : (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
            Remove <strong>Automatic (online grading)</strong> in step 5 — it only works with Online delivery.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
