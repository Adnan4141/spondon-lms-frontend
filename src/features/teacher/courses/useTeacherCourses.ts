'use client';

import { useQuery } from '@tanstack/react-query';
import { getCourses } from '@/lib/api/courses';
import type { Course } from '@/types/course';

export function useTeacherCourses(userId: string | null) {
  const query = useQuery({
    queryKey: ['teacher', 'my-courses', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const res = await getCourses({ teacherUserId: userId!, limit: 100 });
      if (!res.success) {
        throw new Error((res as { message?: string }).message || 'Failed to load courses');
      }
      return (res.data ?? []) as Course[];
    },
  });

  return {
    courses: (query.data ?? []) as Course[],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
