'use client';

import { useQuery } from '@tanstack/react-query';
import { getCourses } from '@/lib/api/courses';
import {
  currentTeacherStudentsMonth,
  getTeacherStudents,
  getTeacherStudentsSummary,
} from '@/lib/api/teacher-students';

export type TeacherStudentsFilters = {
  month: string;
  courseId: string;
  batchId: string;
  search: string;
  page: number;
};

export function useTeacherStudents(
  teacherUserId: string | undefined,
  filters: TeacherStudentsFilters,
) {
  const coursesQuery = useQuery({
    queryKey: ['teacher-student-courses', teacherUserId],
    enabled: Boolean(teacherUserId),
    staleTime: 120_000,
    queryFn: async () => {
      const res = await getCourses({ teacherUserId, limit: 100 });
      return res.success && res.data ? res.data : [];
    },
  });

  const summaryQuery = useQuery({
    queryKey: ['teacher-students-summary', teacherUserId, filters.month, filters.courseId],
    enabled: Boolean(teacherUserId),
    staleTime: 30_000,
    queryFn: async () => {
      const res = await getTeacherStudentsSummary({
        month: filters.month,
        courseId: filters.courseId !== 'all' ? filters.courseId : undefined,
      });
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to load student summary');
      }
      return res.data;
    },
  });

  const studentsQuery = useQuery({
    queryKey: ['teacher-students', teacherUserId, filters],
    enabled: Boolean(teacherUserId),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    queryFn: async () => {
      const res = await getTeacherStudents({
        month: filters.month,
        courseId: filters.courseId !== 'all' ? filters.courseId : undefined,
        batchId: filters.batchId !== 'all' ? filters.batchId : undefined,
        search: filters.search.trim() || undefined,
        page: filters.page,
        limit: 50,
      });
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to load students');
      }
      return {
        rows: res.data,
        pagination: res.pagination ?? { page: 1, limit: 50, total: res.data.length, pages: 1 },
        month: res.month ?? filters.month,
      };
    },
  });

  const batchOptions = (summaryQuery.data?.batches ?? []).filter((batch) => {
    if (filters.courseId === 'all') return true;
    return batch.courseId === filters.courseId;
  });

  return {
    courses: coursesQuery.data ?? [],
    coursesLoading: coursesQuery.isLoading,
    summary: summaryQuery.data,
    summaryLoading: summaryQuery.isLoading,
    students: studentsQuery.data?.rows ?? [],
    pagination: studentsQuery.data?.pagination,
    activeMonth: studentsQuery.data?.month ?? filters.month,
    batchOptions,
    loading: studentsQuery.isLoading || studentsQuery.isFetching,
    error: studentsQuery.error ?? summaryQuery.error,
    refetch: async () => {
      await Promise.all([summaryQuery.refetch(), studentsQuery.refetch()]);
    },
  };
}

export function useTeacherStudentCount(teacherUserId: string | undefined) {
  return useQuery({
    queryKey: ['teacher-students-count', teacherUserId],
    enabled: Boolean(teacherUserId),
    staleTime: 60_000,
    queryFn: async () => {
      const res = await getTeacherStudentsSummary({ month: currentTeacherStudentsMonth() });
      if (!res.success || !res.data) return 0;
      return res.data.uniqueStudents;
    },
  });
}
