'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { BatchStatusType } from '@/lib/api/batches';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import { parseStoredAuthUser } from '@/features/admin/shared/admin-session';
import { useAdminFilterOptions } from '@/lib/query/hooks/useAdminFilterOptions';
import { useBatchesList } from '@/lib/query/hooks/useBatchesList';
import type { BatchesListParams } from '@/lib/query/admin-query';

export function useBatchesPageFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchStatusType | 'all'>('ACTIVE');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [scopedBranchId, setScopedBranchId] = useState<string | null>(null);
  const [branchScopeReady, setBranchScopeReady] = useState(false);

  useEffect(() => {
    const user = parseStoredAuthUser();
    const branchAdmin = user?.role === 'BRANCH_ADMIN';
    const ownBranch = user?.branchId ? String(user.branchId) : null;
    setScopedBranchId(branchAdmin ? ownBranch : null);
    if (branchAdmin && ownBranch) {
      setBranchFilter(ownBranch);
    }
    setBranchScopeReady(true);
  }, []);

  const batchQueryParams = useMemo(() => {
    if (!branchScopeReady) return null;
    const params: BatchesListParams = {};
    if (courseFilter !== 'all') params.courseId = courseFilter;
    if (scopedBranchId) params.branchId = scopedBranchId;
    else if (branchFilter !== 'all') params.branchId = branchFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    return params;
  }, [branchScopeReady, branchFilter, courseFilter, scopedBranchId, statusFilter]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    courseFilter,
    setCourseFilter,
    branchFilter,
    setBranchFilter,
    scopedBranchId,
    branchScopeReady,
    batchQueryParams,
  };
}

export function useBatchesPageData(batchQueryParams: BatchesListParams | null, branchScopeReady: boolean) {
  const queryClient = useQueryClient();
  const { courses: filterCourses, branches: filterBranches } = useAdminFilterOptions();

  const courses = useMemo(
    () =>
      filterCourses.map((course) => ({
        id: course.id,
        name: course.name,
        programId: course.programId,
      })) as Course[],
    [filterCourses],
  );

  const branches = useMemo(
    () => filterBranches.map((branch) => ({ id: branch.id, name: branch.name })) as Branch[],
    [filterBranches],
  );

  const batchesQuery = useBatchesList(batchQueryParams, branchScopeReady);

  const invalidateBatches = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'batches'] });
  };

  const error =
    batchesQuery.error instanceof Error
      ? batchesQuery.error.message
      : batchesQuery.error
        ? 'Something went wrong'
        : null;

  return {
    courses,
    branches,
    batches: batchesQuery.data ?? [],
    loading: batchesQuery.isLoading,
    isFetching: batchesQuery.isFetching,
    error,
    refetch: batchesQuery.refetch,
    invalidateBatches,
  };
}
