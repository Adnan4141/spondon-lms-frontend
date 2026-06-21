'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  courseTransactionsHref,
  defaultCourseTransactionsQuery,
  getCurrentMonthRange,
  getLastMonthRange,
  parseCourseTransactionsQuery,
  type CourseTransactionsQueryState,
  type PaymentDatePreset,
} from './shared';

export function useCourseTransactionsQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = useMemo<CourseTransactionsQueryState>(() => {
    if (searchParams.get('tab') !== 'course-transactions') {
      return defaultCourseTransactionsQuery();
    }
    return parseCourseTransactionsQuery(searchParams);
  }, [searchParams]);

  const replaceQuery = useCallback(
    (next: CourseTransactionsQueryState) => {
      router.replace(courseTransactionsHref(next), { scroll: false });
    },
    [router],
  );

  const updateQuery = useCallback(
    (patch: Partial<CourseTransactionsQueryState>, options?: { resetPage?: boolean }) => {
      const next = { ...query, ...patch };
      if (options?.resetPage !== false && !('page' in patch)) {
        next.page = 1;
      }
      replaceQuery(next);
    },
    [query, replaceQuery],
  );

  const applyPaymentDatePreset = useCallback(
    (preset: PaymentDatePreset) => {
      const range = preset === 'current' ? getCurrentMonthRange() : getLastMonthRange();
      updateQuery({
        from: range.from,
        to: range.to,
      });
    },
    [updateQuery],
  );

  return { query, updateQuery, replaceQuery, applyPaymentDatePreset };
}

export function buildCourseTransactionsApiParams(query: CourseTransactionsQueryState) {
  const dateRange = {
    from: query.from || query.to || undefined,
    to: query.to || query.from || undefined,
  };

  return {
    courseId: query.courseId,
    from: dateRange.from,
    to: dateRange.to,
    branchId: query.branchId || undefined,
    search: query.search || undefined,
    page: query.page,
    limit: query.limit,
  };
}
