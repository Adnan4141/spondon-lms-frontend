'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCourseContentsWithProgress, getMyCourses } from '@/lib/api/student-portal';
import { computeCourseProgressPct } from '@/lib/student-course-progress';
import {
  flattenEnrollmentCoursesForStudent,
  type StudentMyCourseFlatRow,
} from '@/lib/student-my-courses';

export type StudentMyCourseWithProgress = StudentMyCourseFlatRow & {
  progress: number | null;
};

async function enrichCoursesWithProgress(
  courses: StudentMyCourseFlatRow[],
  studentUserId: string,
): Promise<StudentMyCourseWithProgress[]> {
  return Promise.all(
    courses.map(async (course) => {
      try {
        const res = await getCourseContentsWithProgress(course.courseId, studentUserId);
        const pct =
          res.success && Array.isArray(res.data) ? computeCourseProgressPct(res.data) : null;
        return { ...course, progress: pct };
      } catch {
        return { ...course, progress: null };
      }
    }),
  );
}

export function useStudentMyCourses() {
  const [studentId, setStudentId] = useState<string | undefined>();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = raw ? (JSON.parse(raw) as { id?: string }) : null;
      setStudentId(user?.id);
    } catch {
      setStudentId(undefined);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  const query = useQuery({
    queryKey: ['student', 'my-courses', studentId],
    enabled: Boolean(studentId),
    queryFn: async () => {
      const res = await getMyCourses(studentId!);
      if (!res.success) {
        throw new Error(
          (res as { message?: string }).message || 'Failed to load your courses',
        );
      }
      const flat = flattenEnrollmentCoursesForStudent(res.data ?? []);
      return enrichCoursesWithProgress(flat, studentId!);
    },
  });

  return {
    ...query,
    studentId,
    authChecked,
    isLoading: !authChecked || (Boolean(studentId) && query.isLoading),
  };
}
