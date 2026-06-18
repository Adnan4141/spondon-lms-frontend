'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { parseStoredAuthUser } from '@/features/admin/shared/admin-session';
import { useTeachersList, type TeachersListFilters } from '@/lib/query/hooks/useTeachersList';
import { useAdminBranches } from '@/lib/query/hooks/useAdminBranches';
import type { TeachersStatusFilter } from '../teachers-page-utils';

export function useTeachersPageData(listFilters: TeachersListFilters) {
  const queryClient = useQueryClient();
  const teachersQuery = useTeachersList(listFilters);
  const branchesQuery = useAdminBranches();

  const invalidateTeachers = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] });
  };

  return {
    teachers: teachersQuery.data ?? [],
    branches: branchesQuery.data ?? [],
    loading: teachersQuery.isLoading,
    isFetching: teachersQuery.isFetching,
    refetch: teachersQuery.refetch,
    invalidateTeachers,
  };
}

export function useTeachersPageFilters() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TeachersStatusFilter>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [actorRole, setActorRole] = useState<string | null>(null);
  const [actorBranchId, setActorBranchId] = useState<string | null>(null);

  useEffect(() => {
    const user = parseStoredAuthUser();
    if (!user) return;
    setActorRole(user.role ?? null);
    setActorBranchId(user.branchId ?? null);
    if (user.role === 'BRANCH_ADMIN' && user.branchId) {
      setBranchFilter(user.branchId);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bid = new URLSearchParams(window.location.search).get('branchId');
    if (bid && actorRole !== 'BRANCH_ADMIN') setBranchFilter(bid);
  }, [actorRole]);

  return {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    branchFilter,
    setBranchFilter,
    actorRole,
    actorBranchId,
    isBranchAdmin: actorRole === 'BRANCH_ADMIN',
    listFilters: { statusFilter, branchFilter } satisfies TeachersListFilters,
  };
}
