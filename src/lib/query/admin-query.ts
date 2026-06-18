import { getAdminFilters, type AdminFiltersData } from '@/lib/api/meta';
import {
  getDashboardSummary,
  type DashboardSummaryParams,
} from '@/lib/api/reports';
import type { getBatches } from '@/lib/api/batches';
import type { getUsers } from '@/lib/api/users';

export const queryKeys = {
  adminFilters: ['admin-filters'] as const,
  dashboard: (params: DashboardSummaryParams) => ['dashboard-summary', params] as const,
  partners: {
    all: ['admin', 'partners'] as const,
    detail: (id: string) => ['admin', 'partners', id] as const,
    revenue: (id: string) => ['admin', 'partners', id, 'revenue'] as const,
  },
  branches: ['admin', 'branches'] as const,
  batches: (params: Record<string, unknown>) => ['admin', 'batches', params] as const,
  batchesForCourse: (courseId: string) => ['admin', 'batches', 'course', courseId] as const,
  teachers: (params: Record<string, unknown>) => ['admin', 'teachers', params] as const,
  students: {
    all: ['admin', 'students'] as const,
    list: (params: Record<string, unknown>) => ['admin', 'students', 'list', params] as const,
    stats: ['admin', 'students', 'stats'] as const,
  },
};

export type BatchesListParams = NonNullable<Parameters<typeof getBatches>[0]>;
export type TeachersListParams = Pick<
  NonNullable<Parameters<typeof getUsers>[0]>,
  'status' | 'branchId'
>;
export type StudentsListParams = {
  page: number;
  limit: number;
  debouncedSearch: string;
  branchFilter: string;
  statusFilter: string;
  programFilter: string;
  courseFilter: string;
  batchFilter: string;
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
