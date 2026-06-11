'use client';

import { useQuery } from '@tanstack/react-query';
import type { DashboardSummaryParams } from '@/lib/api/reports';
import {
  fetchDashboardSummary,
  queryKeys,
} from '@/lib/query/admin-query';

const DASHBOARD_STALE_MS = 60_000;

export function useDashboardSummary(params: DashboardSummaryParams) {
  return useQuery({
    queryKey: queryKeys.dashboard(params),
    queryFn: () => fetchDashboardSummary(params),
    staleTime: DASHBOARD_STALE_MS,
  });
}
