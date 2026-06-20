'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getUsers, getStudentDatabaseStats } from '@/lib/api/users';
import { queryKeys, type StudentsListParams } from '@/lib/query/admin-query';

const DEFAULT_PAGE_SIZE = 50;

function buildStudentsApiParams(params: StudentsListParams): NonNullable<Parameters<typeof getUsers>[0]> {
  const apiParams: NonNullable<Parameters<typeof getUsers>[0]> = {
    role: 'STUDENT',
    page: params.page,
    limit: params.limit,
    includeDetails: false,
  };

  if (params.debouncedSearch) apiParams.search = params.debouncedSearch;
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

export function useStudentsList(params: StudentsListParams, options?: { enabled?: boolean }) {
  const queryParams = {
    page: params.page,
    limit: params.limit,
    debouncedSearch: params.debouncedSearch,
    branchFilter: params.branchFilter,
    statusFilter: params.statusFilter,
    programFilter: params.programFilter,
    courseFilter: params.courseFilter,
    batchFilter: params.batchFilter,
  };

  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.students.list(queryParams),
    queryFn: async () => {
      const res = await getUsers(buildStudentsApiParams(params));
      if (!res.success || !res.data) throw new Error('Could not load students');

      return {
        users: res.data,
        pagination: res.pagination ?? {
          page: params.page,
          limit: params.limit,
          total: res.data.length,
          pages: 1,
        },
      };
    },
    placeholderData: keepPreviousData,
  });
}

export function useStudentDatabaseStats() {
  return useQuery({
    queryKey: queryKeys.students.stats,
    queryFn: async () => {
      const res = await getStudentDatabaseStats();
      if (!res.success || !res.data) throw new Error('Could not load student stats');
      return res.data;
    },
  });
}

export { DEFAULT_PAGE_SIZE as STUDENTS_PAGE_SIZE };
