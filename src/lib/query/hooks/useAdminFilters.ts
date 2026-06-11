'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchAdminFilters,
  queryKeys,
} from '@/lib/query/admin-query';

const ADMIN_FILTERS_STALE_MS = 5 * 60_000;

export function useAdminFilters() {
  return useQuery({
    queryKey: queryKeys.adminFilters,
    queryFn: fetchAdminFilters,
    staleTime: ADMIN_FILTERS_STALE_MS,
  });
}
