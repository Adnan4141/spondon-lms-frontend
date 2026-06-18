'use client';

import { useQueryClient } from '@tanstack/react-query';
import { usePartnersList } from '@/lib/query/hooks/usePartnersList';
import { queryKeys } from '@/lib/query/admin-query';

export function usePartnersPageData() {
  const queryClient = useQueryClient();
  const partnersQuery = usePartnersList();

  const invalidatePartners = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.partners.all });
  };

  return {
    partners: partnersQuery.data ?? [],
    loading: partnersQuery.isLoading,
    isFetching: partnersQuery.isFetching,
    refetch: partnersQuery.refetch,
    invalidatePartners,
  };
}
