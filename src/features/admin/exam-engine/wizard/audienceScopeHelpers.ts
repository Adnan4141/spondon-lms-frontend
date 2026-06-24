import type { ExamWizardState } from '../types';
import { EXAM_WIZARD_ALL_BATCHES, EXAM_WIZARD_ALL_BRANCHES } from './constants';

export type CourseAudienceScope = {
  branchId: string;
  batchId: string;
};

export const DEFAULT_COURSE_AUDIENCE_SCOPE: CourseAudienceScope = {
  branchId: EXAM_WIZARD_ALL_BRANCHES,
  batchId: EXAM_WIZARD_ALL_BATCHES,
};

export function allAudienceCourseIdsFromState(
  state: Pick<ExamWizardState, 'courseId' | 'linkedCourseIds'>,
): string[] {
  if (!state.courseId) return [...state.linkedCourseIds];
  const linked = state.linkedCourseIds.filter((id) => id !== state.courseId);
  return [state.courseId, ...linked];
}

/** Keep scope map in sync with selected audience courses. */
export function normalizeCourseAudienceScopes(
  courseIds: string[],
  existing: Record<string, CourseAudienceScope>,
): Record<string, CourseAudienceScope> {
  const next: Record<string, CourseAudienceScope> = {};
  for (const courseId of courseIds) {
    next[courseId] = existing[courseId] ?? { ...DEFAULT_COURSE_AUDIENCE_SCOPE };
  }
  return next;
}

export function getCourseAudienceScope(
  state: Pick<ExamWizardState, 'courseAudienceScopes' | 'branchId' | 'batchId' | 'courseId'>,
  courseId: string,
): CourseAudienceScope {
  if (state.courseAudienceScopes[courseId]) return state.courseAudienceScopes[courseId];
  if (courseId === state.courseId) {
    return {
      branchId: state.branchId || EXAM_WIZARD_ALL_BRANCHES,
      batchId: state.batchId || EXAM_WIZARD_ALL_BATCHES,
    };
  }
  return { ...DEFAULT_COURSE_AUDIENCE_SCOPE };
}

export function scopeFromApiIds(
  branchId?: string | null,
  batchId?: string | null,
): CourseAudienceScope {
  return {
    branchId: branchId ?? EXAM_WIZARD_ALL_BRANCHES,
    batchId: batchId ?? EXAM_WIZARD_ALL_BATCHES,
  };
}

export function scopeToApiIds(scope: CourseAudienceScope): {
  branchId: string | null;
  batchId: string | null;
} {
  return {
    branchId:
      !scope.branchId || scope.branchId === EXAM_WIZARD_ALL_BRANCHES ? null : scope.branchId,
    batchId: !scope.batchId || scope.batchId === EXAM_WIZARD_ALL_BATCHES ? null : scope.batchId,
  };
}

/** Build scope map from hydrated exam row (primary + linked courses). */
export function courseAudienceScopesFromExam(
  exam: {
    courseId: string;
    branchId?: string | null;
    batchId?: string | null;
    examCourses?: Array<{ courseId: string; branchId?: string | null; batchId?: string | null }>;
  },
): Record<string, CourseAudienceScope> {
  const scopes: Record<string, CourseAudienceScope> = {
    [exam.courseId]: scopeFromApiIds(exam.branchId, exam.batchId),
  };
  for (const row of exam.examCourses ?? []) {
    if (!row.courseId || row.courseId === exam.courseId) continue;
    scopes[row.courseId] = scopeFromApiIds(row.branchId, row.batchId);
  }
  return scopes;
}

/** Sync legacy top-level branch/batch fields from the primary course scope. */
export function syncPrimaryScopeFields(
  state: Pick<ExamWizardState, 'courseId' | 'courseAudienceScopes' | 'branchId' | 'batchId'>,
): Pick<ExamWizardState, 'branchId' | 'batchId' | 'courseAudienceScopes'> {
  if (!state.courseId) {
    return {
      branchId: state.branchId || EXAM_WIZARD_ALL_BRANCHES,
      batchId: state.batchId || EXAM_WIZARD_ALL_BATCHES,
      courseAudienceScopes: state.courseAudienceScopes,
    };
  }
  const primary = getCourseAudienceScope(state, state.courseId);
  return {
    branchId: primary.branchId,
    batchId: primary.batchId,
    courseAudienceScopes: {
      ...state.courseAudienceScopes,
      [state.courseId]: primary,
    },
  };
}
