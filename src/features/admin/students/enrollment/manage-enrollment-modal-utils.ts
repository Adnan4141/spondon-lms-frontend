import type { Course, Enrollment, Program } from '../types';

export type ManageEnrollmentStep = 'select' | 'discount' | 'success';

export type ManageEnrollmentResult = {
  added: number;
  removed: number;
  failed: number;
  effectiveMonth: string;
};

export type CourseMeta = { batch: string; startMonth: string; endMonth: string };

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
): string | null {
  if (!meta.startMonth) return 'Start month is required';
  if (!meta.endMonth) return 'End month is required';
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
