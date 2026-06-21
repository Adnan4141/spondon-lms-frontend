'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ExamScope, ExamType } from '@/types/exam';
import type { ExamWizardState } from '../../types';
import { EXAM_TYPE_OPTIONS } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
  restrictGlobalScope?: boolean;
  allowedExamTypes?: ExamType[];
};

export function ExamClassificationCard({
  state,
  dispatch,
  restrictGlobalScope = false,
  allowedExamTypes,
}: Props) {
  const typeOptions = allowedExamTypes
    ? EXAM_TYPE_OPTIONS.filter((opt) => allowedExamTypes.includes(opt.id))
    : EXAM_TYPE_OPTIONS;
  const currentTypeMissing = !typeOptions.some((opt) => opt.id === state.examType);
  const displayTypeOptions = currentTypeMissing
    ? [
        ...typeOptions,
        EXAM_TYPE_OPTIONS.find((opt) => opt.id === state.examType)!,
      ].filter(Boolean)
    : typeOptions;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-base text-[#0D1B35]">Exam category & visibility</CardTitle>
        <CardDescription>
          Category controls badges, talent-hunt stages, and university branding. Scope controls which students can see the exam.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Exam category</Label>
          <Select
            value={state.examType}
            onValueChange={(value) =>
              dispatch({
                type: 'MERGE',
                patch: {
                  examType: value as ExamWizardState['examType'],
                  ...(value !== 'UNIVERSITY' ? { universityName: '' } : {}),
                },
              })
            }
          >
            <SelectTrigger className="border-slate-200">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {displayTypeOptions.map((opt) => (
                <SelectItem
                  key={opt.id}
                  value={opt.id}
                  disabled={Boolean(allowedExamTypes && !allowedExamTypes.includes(opt.id))}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-500">
            {EXAM_TYPE_OPTIONS.find((o) => o.id === state.examType)?.description}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Student visibility</Label>
          <Select
            value={state.scope}
            onValueChange={(value) => dispatch({ type: 'MERGE', patch: { scope: value as ExamScope } })}
          >
            <SelectTrigger className="border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COURSE">Course enrollment (branch/batch)</SelectItem>
              {!restrictGlobalScope ? (
                <SelectItem value="GLOBAL">Global (all enrolled in linked courses)</SelectItem>
              ) : null}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-500">
            {state.scope === 'GLOBAL'
              ? 'Any active student enrolled in the primary or linked courses can see this exam — branch/batch filters are ignored.'
              : 'Students must match course, branch, and batch enrollment rules.'}
          </p>
        </div>

        {state.examType === 'UNIVERSITY' ? (
          <div className="md:col-span-2 space-y-2">
            <Label>University / institution name</Label>
            <Input
              value={state.universityName}
              onChange={(event) => dispatch({ type: 'MERGE', patch: { universityName: event.target.value } })}
              placeholder="e.g. Dhaka University"
              className="border-slate-200"
            />
          </div>
        ) : null}

        {state.examType === 'TALENT_HUNT' ? (
          <div
            className={cn(
              'md:col-span-2 rounded-lg border border-fuchsia-200 bg-fuchsia-50/60 px-3 py-2 text-xs text-fuchsia-900',
            )}
          >
            After saving, open <strong>Exam details → Talent hunt</strong> to add stages, cutoffs, and prizes.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
