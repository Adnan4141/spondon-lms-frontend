'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  courseTransactionsHref,
  defaultCourseTransactionsQuery,
  getCurrentMonthRange,
  getNextMonthRange,
  parseCourseTransactionsQuery,
  type CourseTransactionsQueryState,
  type MonthPreset,
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

export function buildCourseTransactionsApiParams(query: CourseTransactionsQueryState) {
  const dateRange = {
    from: query.from || query.to || undefined,
    to: query.to || query.from || undefined,
  };

  return {
    courseId: query.courseId,
    from: dateRange.from,
    to: dateRange.to,
    month: query.month || undefined,
    branchId: query.branchId || undefined,
    search: query.search || undefined,
    paymentStatus: query.paymentStatus === 'ALL' ? undefined : query.paymentStatus,
    includeWaived: query.includeWaived,
    page: query.page,
    limit: query.limit,
  };
}
