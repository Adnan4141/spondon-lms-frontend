import type { Course, Enrollment, Program } from '../types';

export type ManageEnrollmentStep = 'select' | 'discount' | 'success';

export type ManageEnrollmentResult = {
  added: number;
  removed: number;
  failed: number;
  effectiveMonth: string;
};

export type CourseMeta = { batch: string; startMonth: string; endMonth: string };

export function maxMonth(a?: string | null, b?: string | null): string {
  if (!a) return b || '';
  if (!b) return a;
  return a >= b ? a : b;
}

/** Earliest allowed billing start when adding a course during manage enrollment. */
export function resolveMinCourseStartMonth(
  courseStartMonth: string | null | undefined,
  effectiveMonth: string,
): string {
  return maxMonth(courseStartMonth, effectiveMonth);
}

export function defaultCourseMeta(course: Course, effectiveMonth: string): CourseMeta {
  const startMonth = resolveMinCourseStartMonth(course.startMonth, effectiveMonth);
  const endMonth = maxMonth(course.endMonth || course.startMonth || startMonth, startMonth);
  return { batch: '', startMonth, endMonth };
}

export interface ManageEnrollmentModalProps {
  enrollment: Enrollment;
  allCourses: Course[];
  programs: Program[];
  studentUserId: string;
  initialCancelCourseId?: string;
  onClose: () => void;
  onDone: (summary: ManageEnrollmentResult) => void;
}

export function getCourseTimelineError(
  course: Course,
  meta: CourseMeta,
  effectiveMonth: string,
): string | null {
  if (!meta.startMonth) return 'Start month is required';
  if (!meta.endMonth) return 'End month is required';
  if (meta.startMonth < effectiveMonth) {
    return `Start month cannot be before ${effectiveMonth} (effective month)`;
  }
  if (course.startMonth && meta.startMonth < course.startMonth) {
    return `Start month cannot be before ${course.startMonth}`;
  }
  if (course.endMonth && meta.endMonth > course.endMonth) {
    return `End month cannot be after ${course.endMonth}`;
  }
  if (meta.endMonth < meta.startMonth) {
    return 'End month cannot be before start month';
  }
  return null;
}
