'use client';

import { useQuery } from '@tanstack/react-query';
import { getPartnerRevenueSummary } from '@/lib/api/partners';
import { queryKeys } from '@/lib/query/admin-query';

export function usePartnerRevenueSummary(partnerId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.partners.revenue(partnerId ?? ''),
    enabled: enabled && Boolean(partnerId),
    queryFn: async () => {
      const res = await getPartnerRevenueSummary(partnerId!);
      if (!res.success || !res.data) throw new Error('No revenue data');
      return res.data;
    },
  });
}
