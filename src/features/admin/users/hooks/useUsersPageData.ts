'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminBranches } from '@/lib/query/hooks/useAdminBranches';
import {
  useStaffRoleSummaryQuery,
  useUsersListQuery,
  type UsersListFilters,
} from '@/lib/query/hooks/useUsersList';

export function useUsersPageFilters() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [roleTab, setRoleTab] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const lastDebouncedRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = query.trim();
      if (lastDebouncedRef.current !== null && lastDebouncedRef.current !== next) {
        setPage(1);
      }
      lastDebouncedRef.current = next;
      setDebouncedQuery(next);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const listFilters: UsersListFilters = {
    page,
    debouncedQuery,
    roleTab,
    statusFilter,
    branchFilter,
  };

  return {
    query,
    setQuery,
    page,
    setPage,
    roleTab,
    setRoleTab,
    statusFilter,
    setStatusFilter,
    branchFilter,
    setBranchFilter,
    listFilters,
  };
}

export function useUsersPageData(listFilters: UsersListFilters, enabled: boolean) {
  const queryClient = useQueryClient();
  const branchesQuery = useAdminBranches();
  const usersQuery = useUsersListQuery(listFilters, enabled);
  const summaryQuery = useStaffRoleSummaryQuery(
    listFilters.branchFilter,
    listFilters.statusFilter,
    enabled,
  );

  const invalidateUsers = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
    ]);
  };

  const refreshAll = async () => {
    await Promise.all([usersQuery.refetch(), summaryQuery.refetch()]);
  };

  return {
    branches: branchesQuery.data ?? [],
    users: usersQuery.data?.users ?? [],
    pagination: usersQuery.data?.pagination ?? null,
    roleSummary: summaryQuery.data ?? { byRole: {}, total: 0 },
    loading: usersQuery.isLoading,
    summaryLoading: summaryQuery.isLoading,
    isFetching: usersQuery.isFetching,
    refreshAll,
    invalidateUsers,
  };
}
