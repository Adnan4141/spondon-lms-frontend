'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchAdminFilters,
  queryKeys,
} from '@/lib/query/admin-query';

const ADMIN_FILTERS_STALE_MS = 5 * 60_000;

export function useAdminFilters(opts?: { allBranches?: boolean }) {
  const allBranches = opts?.allBranches ?? false;
  return useQuery({
    queryKey: allBranches ? queryKeys.adminFiltersAll : queryKeys.adminFilters,
    queryFn: () => fetchAdminFilters({ allBranches }),
    staleTime: ADMIN_FILTERS_STALE_MS,
  });
}
