'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCourseContentsWithProgress } from '@/lib/api/student-portal';
import { getCourseById } from '@/lib/api/courses';
import { ApiError } from '@/lib/api';
import type { CourseDetails } from '@/types/course';
import type { HubContentItem } from '@/components/student/course-hub/course-hub-types';

export type CourseHubAccessError = {
  code: 'COURSE_ACCESS_ENDED';
  effectiveMonth: string | null;
};

async function fetchCourseHub(courseId: string, studentUserId: string) {
  const courseRes = await getCourseById(courseId);
  const loadedCourse =
    courseRes.success && courseRes.data ? (courseRes.data as CourseDetails) : null;
  const resolvedCourseId = loadedCourse?.id ?? courseId;

  try {
    const contentsRes = await getCourseContentsWithProgress(resolvedCourseId, studentUserId);
    const contents =
      contentsRes.success && contentsRes.data ? (contentsRes.data as HubContentItem[]) : [];
    return {
      course: loadedCourse,
      contents,
      accessEndedMonth: null as string | null,
    };
  } catch (err) {
    if (err instanceof ApiError && err.body && typeof err.body === 'object') {
      const body = err.body as { code?: string; data?: { effectiveMonth?: string } };
      if (body.code === 'COURSE_ACCESS_ENDED') {
        return {
          course: loadedCourse,
          contents: [] as HubContentItem[],
          accessEndedMonth: body.data?.effectiveMonth || null,
        };
      }
    }
    throw err;
  }
}

export function useCourseHubData(courseId: string) {
  const [studentUserId, setStudentUserId] = useState<string | undefined>();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    try {
      const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const parsed = u ? JSON.parse(u) : null;
      setStudentUserId(parsed?.id);
    } catch {
      setStudentUserId(undefined);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  const query = useQuery({
    queryKey: ['student', 'course-hub', courseId, studentUserId],
    enabled: Boolean(courseId && studentUserId),
    queryFn: () => fetchCourseHub(courseId, studentUserId!),
  });

  const course = query.data?.course ?? null;
  const contents = query.data?.contents ?? [];
  const accessEndedMonth = query.data?.accessEndedMonth ?? null;
  const courseRouteId = course?.slug ?? courseId;

  return {
    course,
    contents,
    accessEndedMonth,
    courseRouteId,
    studentUserId: studentUserId ?? null,
    authChecked,
    isLoading: !authChecked || (Boolean(studentUserId) && query.isLoading),
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
