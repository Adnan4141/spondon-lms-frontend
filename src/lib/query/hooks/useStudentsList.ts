'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getAdminStudents,
  getStudentDatabaseStats,
  getStudentsPageBootstrap,
} from '@/lib/api/users';
import { effectiveStudentSearch } from '@/features/admin/students/studentSearch';
import { queryKeys, type StudentsListParams } from '@/lib/query/admin-query';

const DEFAULT_PAGE_SIZE = 25;
const STUDENT_STATS_STALE_MS = 2 * 60_000;

function buildStudentsApiParams(params: StudentsListParams): NonNullable<Parameters<typeof getAdminStudents>[0]> {
  const apiParams: NonNullable<Parameters<typeof getAdminStudents>[0]> = {
    page: params.page,
    limit: params.limit,
    includeDetails: false,
  };

  const search = effectiveStudentSearch(params.debouncedSearch);
  if (search) apiParams.search = search;
  if (params.branchFilter !== 'ALL') apiParams.branchId = params.branchFilter;
  if (params.statusFilter !== 'ALL') apiParams.status = params.statusFilter;

  if (params.programFilter !== 'ALL' && params.courseFilter === 'ALL') {
    apiParams.programId = params.programFilter;
  }

  if (params.programFilter !== 'ALL' && params.courseFilter !== 'ALL') {
    apiParams.programId = params.programFilter;
    apiParams.courseId = params.courseFilter;
    if (params.batchFilter !== 'ALL') apiParams.batchId = params.batchFilter;
  }

  return apiParams;
}

function buildStudentsQueryParams(params: StudentsListParams) {
  const effectiveSearch = effectiveStudentSearch(params.debouncedSearch);
  return {
    page: params.page,
    limit: params.limit,
    debouncedSearch: effectiveSearch,
    branchFilter: params.branchFilter,
    statusFilter: params.statusFilter,
    programFilter: params.programFilter,
    courseFilter: params.courseFilter,
    batchFilter: params.batchFilter,
  };
}

/** Single round trip: filtered list + global stats for /admin/students. */
export function useStudentsPageBundle(params: StudentsListParams, options?: { enabled?: boolean }) {
  const queryParams = buildStudentsQueryParams(params);

  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.students.bootstrap(queryParams),
    queryFn: async () => {
      const res = await getStudentsPageBootstrap(buildStudentsApiParams(params));
      if (!res.success || !res.data) throw new Error('Could not load students page');

      return {
        users: res.data.students,
        pagination: res.data.pagination,
        stats: res.data.stats,
      };
    },
    placeholderData: keepPreviousData,
    staleTime: STUDENT_STATS_STALE_MS,
  });
}

export function useStudentsList(params: StudentsListParams, options?: { enabled?: boolean }) {
  const queryParams = buildStudentsQueryParams(params);

  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.students.list(queryParams),
    queryFn: async () => {
      const res = await getAdminStudents(buildStudentsApiParams(params));
      if (!res.success || !res.data) throw new Error('Could not load students');

      return {
        users: res.data,
        pagination: res.pagination ?? {
          page: params.page,
          limit: params.limit,
          total: res.data.length,
          pages: 1,
          hasMore: false,
        },
      };
    },
    placeholderData: keepPreviousData,
  });
}

export function useStudentDatabaseStats(options?: { enabled?: boolean; branchId?: string }) {
  const branchId = options?.branchId;
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: [...queryKeys.students.stats, branchId ?? 'ALL'],
    queryFn: async () => {
      const res = await getStudentDatabaseStats(branchId ? { branchId } : undefined);
      if (!res.success || !res.data) throw new Error('Could not load student stats');
      return res.data;
    },
    staleTime: STUDENT_STATS_STALE_MS,
  });
}

export { DEFAULT_PAGE_SIZE as STUDENTS_PAGE_SIZE };
