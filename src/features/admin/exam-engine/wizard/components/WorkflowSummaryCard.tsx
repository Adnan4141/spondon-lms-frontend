'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { ExamWizardState } from '../../types';
import { RESULT_INPUT_MODE_LABELS } from '../../types';

export function WorkflowSummaryCard({
  state,
  deliveryMode,
}: {
  state: ExamWizardState;
  deliveryMode: 'ONLINE' | 'OFFLINE';
}) {
  if (!state.productType) return null;

  const isWritten = state.productType === 'WRITTEN' || state.productType === 'COMBINED';
  const submissionLabel = isWritten
    ? deliveryMode === 'ONLINE'
      ? 'Student camera/PDF upload'
      : 'Teacher result entry'
    : deliveryMode === 'ONLINE'
      ? 'Auto-graded online attempt'
      : state.resultInputModes.includes('OMR_SCAN')
        ? 'OMR sheet scan'
        : 'Teacher result entry';

  const evaluationLabel = isWritten
    ? 'Teacher reviewed written marks'
    : deliveryMode === 'OFFLINE'
      ? state.resultInputModes.includes('OMR_SCAN')
        ? 'OMR auto-grade + admin verify'
        : 'Physical script marked offline'
      : 'System auto-grade';

  const resultLabel =
    state.resultInputModes.length === 0
      ? 'Not configured'
      : state.resultInputModes.map((m) => RESULT_INPUT_MODE_LABELS[m]).join(' · ');

  return (
    <Card className="border-slate-200 bg-slate-50/70 shadow-sm">
      <CardContent className="grid gap-3 p-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Submission</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{submissionLabel}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Evaluation</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{evaluationLabel}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Result input</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{resultLabel}</p>
        </div>
      </CardContent>
    </Card>
  );
}
