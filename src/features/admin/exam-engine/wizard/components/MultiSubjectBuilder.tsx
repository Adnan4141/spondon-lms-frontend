'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExamWizardState } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import { SubjectCard } from './SubjectCard';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
};

export function MultiSubjectBuilder({ state, dispatch }: Props) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="font-serif text-lg text-[#0D1B35]">Subjects & sections</CardTitle>
          <p className="mt-1 text-xs text-slate-500">
            Build every subject here, then attach question folders in the next step.
          </p>
        </div>
        <Button type="button" size="sm" className="bg-[#0D1B35] text-[#E2C98A]" onClick={() => dispatch({ type: 'ADD_SUBJECT' })}>
          + Add subject
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600">
        {state.subjects.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
            Add Physics, Chemistry, Math, or any subject needed for this exam.
          </p>
        ) : null}
        {state.subjects.map((subject, index) => (
          <SubjectCard key={subject.localId} subject={subject} index={index} dispatch={dispatch} />
        ))}
      </CardContent>
    </Card>
  );
}
