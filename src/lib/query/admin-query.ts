import { getAdminFilters, type AdminFiltersData } from '@/lib/api/meta';
import {
  getDashboardSummary,
  type DashboardSummaryParams,
} from '@/lib/api/reports';
import type { getBatches } from '@/lib/api/batches';
import type { getUsers } from '@/lib/api/users';

export const queryKeys = {
  adminFilters: ['admin-filters'] as const,
  adminFiltersAll: ['admin-filters', 'all-branches'] as const,
  dashboard: (params: DashboardSummaryParams) => ['dashboard-summary', params] as const,
  partners: {
    all: ['admin', 'partners'] as const,
    detail: (id: string) => ['admin', 'partners', id] as const,
    revenue: (id: string) => ['admin', 'partners', id, 'revenue'] as const,
  },
  branches: ['admin', 'branches'] as const,
  programs: {
    all: ['admin', 'programs'] as const,
  },
  batches: (params: Record<string, unknown>) => ['admin', 'batches', params] as const,
  batchesForCourse: (courseId: string) => ['admin', 'batches', 'course', courseId] as const,
  teachers: (params: Record<string, unknown>) => ['admin', 'teachers', params] as const,
  students: {
    all: ['admin', 'students'] as const,
    list: (params: Record<string, unknown>) => ['admin', 'students', 'list', params] as const,
    bootstrap: (params: Record<string, unknown>) => ['admin', 'students', 'bootstrap', params] as const,
    stats: ['admin', 'students', 'stats'] as const,
  },
  questions: {
    all: ['admin', 'questions'] as const,
    folders: ['admin', 'questions', 'folders'] as const,
    list: (params: Record<string, unknown>) => ['admin', 'questions', 'list', params] as const,
    passages: (params: Record<string, unknown>) => ['admin', 'questions', 'passages', params] as const,
    statsCount: (params: Record<string, unknown>) => ['admin', 'questions', 'stats', params] as const,
    passageCount: ['admin', 'questions', 'passage-count'] as const,
  },
  users: {
    list: (params: Record<string, unknown>) => ['admin', 'users', 'list', params] as const,
    summary: (params: Record<string, unknown>) => ['admin', 'users', 'summary', params] as const,
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

export async function fetchAdminFilters(
  opts?: { allBranches?: boolean },
): Promise<AdminFiltersData> {
  const res = await getAdminFilters(opts);
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
