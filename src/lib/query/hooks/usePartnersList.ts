'use client';

import { useQuery } from '@tanstack/react-query';
import { getAllPartners } from '@/lib/api/partners';
import { queryKeys } from '@/lib/query/admin-query';

export function usePartnersList() {
  return useQuery({
    queryKey: queryKeys.partners.all,
    queryFn: async () => {
      const res = await getAllPartners();
      if (!res.success) throw new Error('Failed to load partners');
      return res.data ?? [];
    },
  });
}
