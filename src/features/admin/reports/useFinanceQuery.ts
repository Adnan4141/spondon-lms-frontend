'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  defaultFinanceQuery,
  financeHref,
  getCurrentMonthRange,
  getLastMonthRange,
  normalizeSingleDateRange,
  parseFinanceQuery,
  type FinanceQueryState,
  type PaymentDatePreset,
} from './shared';

function monthValueToRange(month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]);
  const lastDay = new Date(year, monthIndex, 0).getDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function useFinanceQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = useMemo<FinanceQueryState>(() => {
    return parseFinanceQuery(searchParams);
  }, [searchParams]);

  const replaceQuery = useCallback(
    (next: FinanceQueryState) => {
      router.replace(financeHref(next), { scroll: false });
    },
    [router],
  );

  const updateQuery = useCallback(
    (patch: Partial<FinanceQueryState>, options?: { resetPage?: boolean }) => {
      const next = { ...query, ...patch };
      if (options?.resetPage !== false && !('page' in patch)) {
        next.page = 1;
      }
      replaceQuery(next);
    },
    [query, replaceQuery],
  );

  const applyDatePreset = useCallback(
    (preset: PaymentDatePreset) => {
      const range = preset === 'current' ? getCurrentMonthRange() : getLastMonthRange();
      updateQuery({
        month: '',
        from: range.from,
        to: range.to,
      });
    },
    [updateQuery],
  );

  const openPaymentDetail = useCallback(
    (paymentId: string) => {
      updateQuery({ paymentId }, { resetPage: false });
    },
    [updateQuery],
  );

  const closePaymentDetail = useCallback(() => {
    updateQuery({ paymentId: '' }, { resetPage: false });
  }, [updateQuery]);

  return {
    query,
    updateQuery,
    replaceQuery,
    applyDatePreset,
    openPaymentDetail,
    closePaymentDetail,
  };
}

export function buildFinanceApiParams(query: FinanceQueryState) {
  const useMonthOnly = Boolean(query.month) && !query.from && !query.to;
  const monthRange = query.month ? monthValueToRange(query.month) : null;
  const dateRange = normalizeSingleDateRange(
    useMonthOnly ? monthRange?.from : query.from,
    useMonthOnly ? monthRange?.to : query.to,
  );

  return {
    period: query.period,
    branchId: query.branchId || undefined,
    courseId: query.courseId || undefined,
    programId: query.programId || undefined,
    itemType: query.itemType || undefined,
    view: query.view,
    month: useMonthOnly ? query.month : undefined,
    search: query.search.trim() || undefined,
    from: dateRange.from,
    to: dateRange.to,
    page: query.page,
    limit: query.limit,
  };
}
