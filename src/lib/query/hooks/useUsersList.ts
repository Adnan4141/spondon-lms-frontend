'use client';

import { useQuery } from '@tanstack/react-query';
import { getStaffRoleSummary, getUsers } from '@/lib/api/users';
import { queryKeys } from '@/lib/query/admin-query';
import { USERS_PAGE_SIZE } from '@/features/admin/users/users-constants';

export type UsersListFilters = {
  page: number;
  debouncedQuery: string;
  roleTab: string;
  statusFilter: string;
  branchFilter: string;
};

export function useUsersListQuery(filters: UsersListFilters, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    enabled,
    queryFn: async () => {
      const res = await getUsers({
        page: filters.page,
        limit: USERS_PAGE_SIZE,
        search: filters.debouncedQuery || undefined,
        role: filters.roleTab === 'ALL' ? undefined : filters.roleTab,
        branchId: filters.branchFilter || undefined,
        status: filters.statusFilter || undefined,
        staffOnly: true,
        minimal: true,
      });
      if (!res.success) throw new Error('Failed to load users');
      return {
        users: res.data ?? [],
        pagination: res.pagination ?? null,
      };
    },
  });
}

export function useStaffRoleSummaryQuery(
  branchFilter: string,
  statusFilter: string,
  enabled: boolean,
) {
  const params = { branchFilter, statusFilter };

  return useQuery({
    queryKey: queryKeys.users.summary(params),
    enabled,
    queryFn: async () => {
      const res = await getStaffRoleSummary({
        branchId: branchFilter || undefined,
        status: statusFilter || undefined,
      });
      if (!res.success || !res.data) throw new Error('Failed to load role summary');
      return res.data;
    },
  });
}
