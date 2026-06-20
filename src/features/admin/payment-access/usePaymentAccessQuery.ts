'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { PaymentAccessViewMode } from '@/lib/api/enrollments';
import { currentMonth } from '@/features/admin/students/utils';

export const PAYMENT_ACCESS_PAGE_SIZES = [25, 50, 100] as const;

const DEFAULT_VIEW_MODE: PaymentAccessViewMode = 'BLOCKED';
const DEFAULT_LIMIT = 50;

export type PaymentAccessQueryState = {
  viewMode: PaymentAccessViewMode;
  page: number;
  limit: number;
  branchId: string;
  programId: string;
  courseId: string;
  dueMonth: string;
  anyDueMonth: boolean;
  minDueAmount: string;
};

function parseViewMode(raw: string | null): PaymentAccessViewMode {
  if (raw === 'TO_BLOCK' || raw === 'BLOCKED' || raw === 'ALL_DUE') return raw;
  return DEFAULT_VIEW_MODE;
}

function parsePage(raw: string | null): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function parseLimit(raw: string | null): number {
  const n = Number(raw);
  return PAYMENT_ACCESS_PAGE_SIZES.includes(n as (typeof PAYMENT_ACCESS_PAGE_SIZES)[number])
    ? n
    : DEFAULT_LIMIT;
}

function buildPaymentAccessSearchParams(state: PaymentAccessQueryState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.viewMode !== DEFAULT_VIEW_MODE) params.set('viewMode', state.viewMode);
  if (state.page > 1) params.set('page', String(state.page));
  if (state.limit !== DEFAULT_LIMIT) params.set('limit', String(state.limit));
  if (state.branchId) params.set('branchId', state.branchId);
  if (state.programId) params.set('programId', state.programId);
  if (state.courseId) params.set('courseId', state.courseId);
  if (state.anyDueMonth) {
    params.set('anyMonth', '1');
  } else if (state.dueMonth && state.dueMonth !== currentMonth()) {
    params.set('dueMonth', state.dueMonth);
  }
  if (state.minDueAmount.trim()) params.set('minDue', state.minDueAmount.trim());
  return params;
}

export function usePaymentAccessQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = useMemo<PaymentAccessQueryState>(() => {
    const anyDueMonth = searchParams.get('anyMonth') === '1';
    return {
      viewMode: parseViewMode(searchParams.get('viewMode')),
      page: parsePage(searchParams.get('page')),
      limit: parseLimit(searchParams.get('limit')),
      branchId: searchParams.get('branchId') ?? '',
      programId: searchParams.get('programId') ?? '',
      courseId: searchParams.get('courseId') ?? '',
      dueMonth: anyDueMonth ? currentMonth() : searchParams.get('dueMonth') ?? currentMonth(),
      anyDueMonth,
      minDueAmount: searchParams.get('minDue') ?? '',
    };
  }, [searchParams]);

  const replaceQuery = useCallback(
    (next: PaymentAccessQueryState) => {
      const qs = buildPaymentAccessSearchParams(next).toString();
      router.replace(qs ? `/admin/payment-access?${qs}` : '/admin/payment-access', { scroll: false });
    },
    [router],
  );

  const updateQuery = useCallback(
    (patch: Partial<PaymentAccessQueryState>, options?: { resetPage?: boolean }) => {
      const next = { ...query, ...patch };
      if (options?.resetPage !== false && !('page' in patch)) {
        next.page = 1;
      }
      replaceQuery(next);
    },
    [query, replaceQuery],
  );

  const clearFilters = useCallback(
    (branchId: string) => {
      replaceQuery({
        viewMode: query.viewMode,
        page: 1,
        limit: query.limit,
        branchId,
        programId: '',
        courseId: '',
        dueMonth: currentMonth(),
        anyDueMonth: false,
        minDueAmount: '',
      });
    },
    [query.limit, query.viewMode, replaceQuery],
  );

  return { query, updateQuery, clearFilters };
}
