'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { ExamWizardState } from '../../types';

export function WorkflowSummaryCard({ state }: { state: ExamWizardState }) {
  if (state.uiCategory !== 'CQ' && state.uiCategory !== 'MCQCQ' && state.uiCategory !== 'OFFLINE_RESULT') return null;

  return (
    <Card className="border-slate-200 bg-slate-50/70 shadow-sm">
      <CardContent className="grid gap-3 p-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Submission</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {state.uiCategory === 'OFFLINE_RESULT' ? 'Teacher result entry' : 'Student camera/PDF upload'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Evaluation</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {state.uiCategory === 'OFFLINE_RESULT' ? 'Physical script marked offline' : 'Teacher reviewed written marks'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Result input</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {state.uiCategory === 'OFFLINE_RESULT' ? 'Single, bulk manual, Excel' : 'MCQ auto + written finalize'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
