'use client';

import { useQuery } from '@tanstack/react-query';
import { getAccounts } from '@/lib/api/accounting';
import { getBranches } from '@/lib/api/branches';
import { getDistributionChannels, getStockSources } from '@/lib/api/books';

export function useAccountingMeta() {
  return useQuery({
    queryKey: ['admin', 'accounting', 'meta'],
    queryFn: async () => {
      const [accountRes, branchRes, sourceRes, channelRes] = await Promise.all([
        getAccounts(),
        getBranches(),
        getStockSources({ includeInactive: true }),
        getDistributionChannels({ includeInactive: true }),
      ]);

      return {
        accounts: accountRes.success ? accountRes.data : [],
        branches: branchRes.success && branchRes.data ? branchRes.data : [],
        stockSources: sourceRes.success && sourceRes.data ? sourceRes.data : [],
        channels: channelRes.success && channelRes.data ? channelRes.data : [],
      };
    },
  });
}
