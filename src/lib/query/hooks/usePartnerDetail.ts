'use client';

import { useQuery } from '@tanstack/react-query';
import { getPartnerById } from '@/lib/api/partners';
import { queryKeys } from '@/lib/query/admin-query';

export function usePartnerDetail(partnerId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.partners.detail(partnerId ?? ''),
    enabled: enabled && Boolean(partnerId),
    queryFn: async () => {
      const res = await getPartnerById(partnerId!);
      if (!res.success || !res.data) throw new Error('Could not load partner');
      return res.data;
    },
  });
}
