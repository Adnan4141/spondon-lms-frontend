'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPortalBooks, getMyBookPurchases } from '@/lib/api/student-portal';
import { getBranches } from '@/lib/api/branches';
import type { Book } from '@/lib/api/books';
import type { MyBookPurchaseRow } from '@/components/student/MyBookPurchasesPanel';

export function useStudentBooks() {
  const [studentId, setStudentId] = useState<string | undefined>();
  const [authChecked, setAuthChecked] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = raw ? (JSON.parse(raw) as { id?: string }) : null;
      setStudentId(user?.id);
    } catch {
      setStudentId(undefined);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  const booksQuery = useQuery({
    queryKey: ['student', 'portal-books'],
    queryFn: async () => {
      const res = await getPortalBooks();
      if (!res.success) {
        throw new Error((res as { message?: string }).message || 'Failed to load books');
      }
      return res.data ?? [];
    },
  });

  const purchasesQuery = useQuery({
    queryKey: ['student', 'book-purchases', studentId],
    enabled: Boolean(studentId),
    queryFn: async () => {
      const res = await getMyBookPurchases(studentId!);
      if (!res.success) {
        throw new Error((res as { message?: string }).message || 'Failed to load purchases');
      }
      return res.data ?? [];
    },
  });

  const branchesQuery = useQuery({
    queryKey: ['student', 'branches'],
    queryFn: async () => {
      const res = await getBranches();
      if (!res.success) {
        throw new Error((res as { message?: string }).message || 'Failed to load branches');
      }
      return (res.data ?? []) as { id: string; name: string }[];
    },
  });

  const refetchPurchases = async () => {
    if (!studentId) return;
    await queryClient.invalidateQueries({ queryKey: ['student', 'book-purchases', studentId] });
  };

  const isLoading =
    !authChecked || booksQuery.isLoading || branchesQuery.isLoading || (Boolean(studentId) && purchasesQuery.isLoading);

  const isError = booksQuery.isError || branchesQuery.isError || purchasesQuery.isError;

  const error =
    booksQuery.error ?? branchesQuery.error ?? purchasesQuery.error ?? null;

  return {
    books: (booksQuery.data ?? []) as Book[],
    purchases: (purchasesQuery.data ?? []) as MyBookPurchaseRow[],
    branches: (branchesQuery.data ?? []) as { id: string; name: string }[],
    studentId,
    authChecked,
    isLoading,
    isError,
    error,
    refetch: async () => {
      await Promise.all([
        booksQuery.refetch(),
        branchesQuery.refetch(),
        studentId ? purchasesQuery.refetch() : Promise.resolve(),
      ]);
    },
    refetchPurchases,
  };
}
