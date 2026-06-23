'use client';

import { useQuery } from '@tanstack/react-query';
import { getPrograms } from '@/lib/api/programs';
import { queryKeys } from '@/lib/query/admin-query';

const PROGRAMS_STALE_MS = 2 * 60_000;

export function useProgramsList() {
  return useQuery({
    queryKey: queryKeys.programs.all,
    queryFn: async () => {
      const res = await getPrograms();
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to load programs');
      }
      return res.data;
    },
    staleTime: PROGRAMS_STALE_MS,
  });
}
