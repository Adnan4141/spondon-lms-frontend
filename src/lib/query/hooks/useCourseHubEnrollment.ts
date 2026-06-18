'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyCourses } from '@/lib/api/student-portal';
import {
  flattenEnrollmentCoursesForStudent,
  type StudentMyCourseFlatRow,
} from '@/lib/student-my-courses';

function findEnrollmentForCourse(
  rows: StudentMyCourseFlatRow[],
  courseId: string,
  courseSlug?: string | null,
): StudentMyCourseFlatRow | null {
  return (
    rows.find(
      (r) =>
        r.courseId === courseId ||
        r.course.slug === courseId ||
        (courseSlug && (r.course.slug === courseSlug || r.courseId === courseSlug)),
    ) ?? null
  );
}

export function useCourseHubEnrollment(courseId: string, courseSlug?: string | null) {
  const [studentUserId, setStudentUserId] = useState<string | undefined>();

  useEffect(() => {
    try {
      const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const parsed = u ? JSON.parse(u) : null;
      setStudentUserId(parsed?.id);
    } catch {
      setStudentUserId(undefined);
    }
  }, []);

  const query = useQuery({
    queryKey: ['student', 'my-courses', studentUserId],
    enabled: Boolean(studentUserId),
    queryFn: async () => {
      const res = await getMyCourses(studentUserId!);
      if (!res.success) return [];
      return flattenEnrollmentCoursesForStudent(res.data ?? []);
    },
    staleTime: 60_000,
  });

  const enrollment = findEnrollmentForCourse(query.data ?? [], courseId, courseSlug);

  return { enrollment, isLoading: query.isLoading };
}
