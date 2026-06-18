'use client';

import { useQuery } from '@tanstack/react-query';
import { getUsers } from '@/lib/api/users';
import { queryKeys } from '@/lib/query/admin-query';

export type TeachersListFilters = {
  statusFilter: 'all' | 'ACTIVE' | 'BLOCKED';
  branchFilter: string;
};

export function useTeachersList({ statusFilter, branchFilter }: TeachersListFilters) {
  const params = {
    statusFilter,
    branchFilter,
  };

  return useQuery({
    queryKey: queryKeys.teachers(params),
    queryFn: async () => {
      const apiParams: Parameters<typeof getUsers>[0] = {
        role: 'TEACHER',
        limit: 500,
      };
      if (statusFilter !== 'all') apiParams.status = statusFilter;
      if (branchFilter !== 'all') apiParams.branchId = branchFilter;

      const res = await getUsers(apiParams);
      if (!res.success) throw new Error('Could not load teachers');
      return res.data ?? [];
    },
  });
}
