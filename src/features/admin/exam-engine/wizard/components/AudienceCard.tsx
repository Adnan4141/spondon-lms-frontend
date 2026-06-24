'use client';

import { useEffect, useState } from 'react';
import type { Dispatch } from 'react';
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
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import { getBatches, type Batch } from '@/lib/api/batches';
import type { ExamWizardState } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import type { Step1FieldKey } from '../validateWizardStep';
import { wizardCardClass } from '../examWizardPageUi';
import {
  EXAM_WIZARD_ALL_BATCHES,
  EXAM_WIZARD_ALL_BRANCHES,
  resolveWizardBranchIdForApi,
} from '../constants';
import { allAudienceCourseIds } from '../audienceHelpers';
import { CourseMultiSelect } from './CourseMultiSelect';

type Props = {
  state: ExamWizardState;
  dispatch: Dispatch<WizardFormAction>;
  courses: Course[];
  branches: Branch[];
  fieldErrors?: Partial<Record<Step1FieldKey, boolean>>;
  clearFieldError: (key: Step1FieldKey) => void;
};

export function AudienceCard({
  state,
  dispatch,
  courses,
  branches,
  fieldErrors,
  clearFieldError,
}: Props) {
  const err = (key: Step1FieldKey) => Boolean(fieldErrors?.[key]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const audienceCourseIds = allAudienceCourseIds(state);

  useEffect(() => {
    if (!state.courseId) {
      setBatches([]);
      return;
    }
    let cancelled = false;
    const branchId = resolveWizardBranchIdForApi(state.branchId);
    getBatches({
      all: true,
      status: 'ACTIVE',
      courseId: state.courseId,
      ...(branchId ? { branchId } : {}),
    })
      .then((res) => {
        if (cancelled) return;
        setBatches(res.success && res.data ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setBatches([]);
      });
    return () => {
      cancelled = true;
    };
  }, [state.branchId, state.courseId]);

  return (
    <Card className={cn(wizardCardClass, 'h-full')}>
      <CardHeader className="border-b border-slate-100 bg-slate-50/30">
        <CardTitle className="font-serif text-base text-[#0D1B35]">Audience</CardTitle>
        <CardDescription>
          Students enrolled in the selected course(s) can see this exam. Branch and batch optionally narrow who can take it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Courses *</Label>
          <CourseMultiSelect
            courses={courses}
            value={audienceCourseIds}
            primaryCourseId={state.courseId}
            invalid={err('courseId')}
            onChange={(courseIds) => {
              clearFieldError('courseId');
              dispatch({ type: 'SET_AUDIENCE_COURSES', courseIds });
            }}
          />
          {err('courseId') ? <p className="text-xs text-rose-600">Select at least one course.</p> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Branch (optional)</Label>
            <Select
              value={state.branchId || EXAM_WIZARD_ALL_BRANCHES}
              onValueChange={(value) => dispatch({ type: 'MERGE', patch: { branchId: value } })}
              disabled={!state.courseId}
            >
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder={state.courseId ? 'Branch scope' : 'Select a course first'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EXAM_WIZARD_ALL_BRANCHES}>All branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-500">
              Scoped to the primary course ({courses.find((c) => c.id === state.courseId)?.name ?? '—'}).
            </p>
          </div>

          <div className="space-y-2">
            <Label>Batch (optional)</Label>
            <Select
              value={state.batchId || EXAM_WIZARD_ALL_BATCHES}
              onValueChange={(value) => dispatch({ type: 'MERGE', patch: { batchId: value } })}
              disabled={!state.courseId}
            >
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder={state.courseId ? 'Batch scope' : 'Select a course first'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EXAM_WIZARD_ALL_BATCHES}>All batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name}
                    {batch.branch?.name ? ` · ${batch.branch.name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-500">
              Limit to one batch, or leave as all batches for enrolled students in scope.
            </p>
          </div>
        </div>

        {audienceCourseIds.length > 0 ? (
          <p className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
            Students enrolled in <strong>any</strong> of the {audienceCourseIds.length} selected course
            {audienceCourseIds.length === 1 ? '' : 's'} (matching branch/batch when set) will see this exam.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
