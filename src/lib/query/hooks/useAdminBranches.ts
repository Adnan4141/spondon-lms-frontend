'use client';

import { useQuery } from '@tanstack/react-query';
import { getBranches } from '@/lib/api/branches';
import { queryKeys } from '@/lib/query/admin-query';

export function useAdminBranches() {
  return useQuery({
    queryKey: queryKeys.branches,
    queryFn: async () => {
      const res = await getBranches();
      if (!res.success || !res.data) throw new Error('Failed to load branches');
      return res.data;
    },
  });
}
