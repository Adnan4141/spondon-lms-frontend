'use client';

import { useQuery } from '@tanstack/react-query';
import { getCourses } from '@/lib/api/courses';
import { getDoubtThreads } from '@/lib/api/doubts';

export type TeacherDoubtStatusFilter = 'OPEN' | 'RESOLVED' | 'CLOSED' | 'all';
export type TeacherDoubtQueueFilter = 'all' | 'needs_response';

export interface TeacherDoubtsFilters {
  status: TeacherDoubtStatusFilter;
  courseId: string;
  search: string;
  queue: TeacherDoubtQueueFilter;
}

export function useTeacherDoubts(teacherUserId: string | undefined, filters: TeacherDoubtsFilters) {
  const coursesQuery = useQuery({
    queryKey: ['teacher-doubt-courses', teacherUserId],
    enabled: Boolean(teacherUserId),
    staleTime: 120_000,
    queryFn: async () => {
      const res = await getCourses({ teacherUserId, limit: 100 });
      return res.success && res.data ? res.data : [];
    },
  });

  const doubtsQuery = useQuery({
    queryKey: ['teacher-doubts', teacherUserId, filters],
    enabled: Boolean(teacherUserId),
    staleTime: 30_000,
    queryFn: async () => {
      if (!teacherUserId) return [];
      const res = await getDoubtThreads({
        teacherUserId,
        status: filters.status === 'all' ? undefined : filters.status,
        courseId: filters.courseId && filters.courseId !== 'all' ? filters.courseId : undefined,
        search: filters.search.trim() || undefined,
        needsResponse: filters.queue === 'needs_response',
      });
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to load doubts');
      }
      return res.data;
    },
  });

  return {
    courses: coursesQuery.data ?? [],
    coursesLoading: coursesQuery.isLoading,
    doubts: doubtsQuery.data ?? [],
    loading: doubtsQuery.isLoading,
    error: doubtsQuery.error,
    refetch: doubtsQuery.refetch,
  };
}

export function useTeacherDoubtBadgeCount(teacherUserId: string | undefined) {
  return useQuery({
    queryKey: ['teacher-doubt-badge', teacherUserId],
    enabled: Boolean(teacherUserId),
    staleTime: 60_000,
    refetchInterval: 120_000,
    queryFn: async () => {
      if (!teacherUserId) return 0;
      const res = await getDoubtThreads({
        teacherUserId,
        status: 'OPEN',
        needsResponse: true,
      });
      return res.success && res.data ? res.data.length : 0;
    },
  });
}
