'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  defaultDueCollectionQuery,
  dueCollectionHref,
  getCurrentMonthRange,
  getNextMonthRange,
  parseDueCollectionQuery,
  type DueCollectionQueryState,
  type MonthPreset,
} from './shared';

export function useDueCollectionQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = useMemo<DueCollectionQueryState>(() => {
    if (searchParams.get('tab') !== 'due-collection') {
      return defaultDueCollectionQuery();
    }
    return parseDueCollectionQuery(searchParams);
  }, [searchParams]);

  const replaceQuery = useCallback(
    (next: DueCollectionQueryState) => {
      router.replace(dueCollectionHref(next), { scroll: false });
    },
    [router],
  );

  const updateQuery = useCallback(
    (patch: Partial<DueCollectionQueryState>, options?: { resetPage?: boolean }) => {
      const next = { ...query, ...patch };
      if (options?.resetPage !== false && !('page' in patch)) {
        next.page = 1;
      }
      replaceQuery(next);
    },
    [query, replaceQuery],
  );

  const applyMonthPreset = useCallback(
    (preset: MonthPreset) => {
      const range = preset === 'current' ? getCurrentMonthRange() : getNextMonthRange();
      updateQuery({
        month: range.month,
        from: '',
        to: '',
      });
    },
    [updateQuery],
  );

  const applyCurrentMonth = useCallback(() => {
    applyMonthPreset('current');
  }, [applyMonthPreset]);

  return { query, updateQuery, replaceQuery, applyCurrentMonth, applyMonthPreset };
}

export function buildDueCollectionApiParams(query: DueCollectionQueryState) {
  const dateRange = {
    from: query.from || query.to || undefined,
    to: query.to || query.from || undefined,
  };

  return {
    branchId: query.branchId || undefined,
    month: query.month || undefined,
    status: query.status || undefined,
    from: dateRange.from,
    to: dateRange.to,
    search: query.search || undefined,
    page: query.page,
    limit: query.limit,
  };
}
