import { getAdminFilters, type AdminFiltersData } from '@/lib/api/meta';
import {
  getDashboardSummary,
  type DashboardSummaryParams,
} from '@/lib/api/reports';

export const queryKeys = {
  adminFilters: ['admin-filters'] as const,
  dashboard: (params: DashboardSummaryParams) => ['dashboard-summary', params] as const,
};

export async function fetchAdminFilters(): Promise<AdminFiltersData> {
  const res = await getAdminFilters();
  if (!res.success || !res.data) {
    throw new Error('Failed to load admin filters');
  }
  return res.data;
}

export async function fetchDashboardSummary(params: DashboardSummaryParams) {
  const res = await getDashboardSummary(params);
  if (!res.success || !res.data) {
    throw new Error('Failed to load dashboard summary');
  }
  return res.data;
}
