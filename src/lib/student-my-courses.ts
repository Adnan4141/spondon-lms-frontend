import type { MyCourseRow } from '@/components/student/dashboard/types';

/** One flattened line per enrollment-course (matches GET /student-portal/my-courses payload). */
export type StudentMyCourseFlatRow = {
  /** `EnrollmentCourse.id` when present; else synthetic `${enrollmentId}-${courseId}`. */
  id: string;
  courseId: string;
  course: { id: string; name: string; slug?: string | null; thumbnail?: string | null };
  batch?: { name: string } | null;
  billingType?: 'ONE_TIME' | 'MONTHLY' | null;
  billingStartMonth?: string | null;
  progress?: number;
};

type ApiEnrollmentCourse = {
  id?: string;
  course?: { id?: string; name?: string; slug?: string | null; thumbnail?: string | null } | null;
  batch?: { name?: string } | null;
};

type ApiEnrollment = {
  id?: string;
  billingType?: 'ONE_TIME' | 'MONTHLY' | null;
  billingStartMonth?: string | null;
  enrollmentCourses?: ApiEnrollmentCourse[] | null;
};

/**
 * API returns enrollments with nested `enrollmentCourses[].course`.
 * UI that links to `/student/courses/[courseId]` must flatten to real course ids.
 */
export function flattenEnrollmentCoursesForStudent(enrollments: unknown[]): StudentMyCourseFlatRow[] {
  if (!Array.isArray(enrollments)) return [];
  const out: StudentMyCourseFlatRow[] = [];
  for (const raw of enrollments) {
    const e = raw as ApiEnrollment;
    const ecs = e.enrollmentCourses;
    if (!Array.isArray(ecs)) continue;
    for (const ec of ecs) {
      const cid = ec.course?.id;
      if (!cid) continue;
      const name = (ec.course?.name && String(ec.course.name).trim()) || 'Course';
      out.push({
        id: ec.id ?? `${e.id ?? 'enrollment'}-${cid}`,
        courseId: cid,
        course: { id: cid, name, slug: ec.course?.slug ?? null, thumbnail: ec.course?.thumbnail ?? null },
        batch: ec.batch?.name ? { name: ec.batch.name } : null,
        billingType: e.billingType ?? null,
        billingStartMonth: e.billingStartMonth ?? null,
        progress: undefined,
      });
    }
  }
  return out;
}

export function flatStudentCoursesToMyCourseRows(rows: StudentMyCourseFlatRow[]): MyCourseRow[] {
  return rows.map((r) => ({
    id: r.id,
    courseId: r.courseId,
    course: r.course,
  }));
}
