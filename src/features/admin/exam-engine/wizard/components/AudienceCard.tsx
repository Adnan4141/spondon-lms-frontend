'use client';

import type { Dispatch } from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import type { ExamWizardState } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import type { Step1FieldKey } from '../validateWizardStep';
import { wizardCardClass } from '../examWizardPageUi';
import { allAudienceCourseIds } from '../audienceHelpers';
import { getCourseAudienceScope } from '../audienceScopeHelpers';
import { CourseMultiSelect } from './CourseMultiSelect';
import { CourseAudienceScopeEditor } from './CourseAudienceScopeEditor';

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
  const audienceCourseIds = allAudienceCourseIds(state);
  const courseById = new Map(courses.map((course) => [course.id, course]));

  return (
    <Card className={cn(wizardCardClass, 'h-full')}>
      <CardHeader className="border-b border-slate-100 bg-slate-50/30">
        <CardTitle className="font-serif text-base text-[#0D1B35]">Audience</CardTitle>
        <CardDescription>
          Students enrolled in the selected course(s) can see this exam. Each course can have its own branch and batch scope.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Courses *</Label>
          <CourseMultiSelect
            courses={courses}
            value={audienceCourseIds}
            invalid={err('courseId')}
            onChange={(courseIds) => {
              clearFieldError('courseId');
              dispatch({ type: 'SET_AUDIENCE_COURSES', courseIds });
            }}
          />
          {err('courseId') ? <p className="text-xs text-rose-600">Select at least one course.</p> : null}
        </div>

        {audienceCourseIds.length > 0 ? (
          <div className="space-y-3">
            <Label className="text-sm">Branch &amp; batch per course</Label>
            <div className="space-y-3">
              {audienceCourseIds.map((courseId) => {
                const course = courseById.get(courseId);
                if (!course) return null;
                return (
                  <CourseAudienceScopeEditor
                    key={courseId}
                    course={course}
                    branches={branches}
                    scope={getCourseAudienceScope(state, courseId)}
                    onChange={(patch) =>
                      dispatch({ type: 'SET_COURSE_AUDIENCE_SCOPE', courseId, patch })
                    }
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        {audienceCourseIds.length > 0 ? (
          <p className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
            Students enrolled in <strong>any</strong> of the {audienceCourseIds.length} selected course
            {audienceCourseIds.length === 1 ? '' : 's'} (matching that course&apos;s branch/batch when set) will see this exam.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
