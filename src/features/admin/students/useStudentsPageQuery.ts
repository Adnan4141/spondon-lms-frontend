'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const STUDENTS_LIST_RETURN_KEY = 'admin-students-list-url';
export const STUDENTS_PAGE_SIZES = [25, 50, 100] as const;

const DEFAULT_LIMIT = 50;

export type StudentsPageQueryState = {
  page: number;
  limit: number;
  search: string;
  statusFilter: string;
  branchFilter: string;
  programFilter: string;
  courseFilter: string;
  batchFilter: string;
  view: 'list' | 'enrollments';
  regNo: string;
};

function parsePage(raw: string | null): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function parseLimit(raw: string | null): number {
  const n = Number(raw);
  return STUDENTS_PAGE_SIZES.includes(n as (typeof STUDENTS_PAGE_SIZES)[number]) ? n : DEFAULT_LIMIT;
}

function parseFilter(raw: string | null): string {
  const value = raw?.trim();
  return value ? value : 'ALL';
}

function parseStatus(raw: string | null): string {
  const value = raw?.trim();
  if (value === 'ACTIVE' || value === 'BLOCKED') return value;
  return 'ALL';
}

export function buildStudentsPageSearchParams(state: StudentsPageQueryState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.page > 1) params.set('page', String(state.page));
  if (state.limit !== DEFAULT_LIMIT) params.set('limit', String(state.limit));
  if (state.search.trim()) params.set('search', state.search.trim());
  if (state.statusFilter !== 'ALL') params.set('status', state.statusFilter);
  if (state.branchFilter !== 'ALL') params.set('branchId', state.branchFilter);
  if (state.programFilter !== 'ALL') params.set('programId', state.programFilter);
  if (state.courseFilter !== 'ALL') params.set('courseId', state.courseFilter);
  if (state.batchFilter !== 'ALL') params.set('batchId', state.batchFilter);
  if (state.view === 'enrollments' && state.regNo.trim()) {
    params.set('view', 'enrollments');
    params.set('regNo', state.regNo.trim());
  }
  return params;
}

export function studentsListHref(state: StudentsPageQueryState): string {
  const qs = buildStudentsPageSearchParams(state).toString();
  return qs ? `/admin/students?${qs}` : '/admin/students';
}

export type StudentsListFilterPatch = Partial<
  Pick<
    StudentsPageQueryState,
    'branchFilter' | 'programFilter' | 'courseFilter' | 'batchFilter' | 'statusFilter' | 'search' | 'limit'
  >
>;

export function defaultStudentsPageQuery(): StudentsPageQueryState {
  return {
    page: 1,
    limit: DEFAULT_LIMIT,
    search: '',
    statusFilter: 'ALL',
    branchFilter: 'ALL',
    programFilter: 'ALL',
    courseFilter: 'ALL',
    batchFilter: 'ALL',
    view: 'list',
    regNo: '',
  };
}

export function studentsListHrefFromFilters(patch: StudentsListFilterPatch): string {
  return studentsListHref({ ...defaultStudentsPageQuery(), ...patch });
}

export function studentsListHrefFromPaymentAccess(filters: {
  branchId?: string;
  programId?: string;
  courseId?: string;
  viewMode: 'TO_BLOCK' | 'BLOCKED' | 'ALL_DUE';
}): string {
  const statusFilter =
    filters.viewMode === 'BLOCKED' ? 'BLOCKED' : filters.viewMode === 'TO_BLOCK' ? 'ACTIVE' : 'ALL';
  return studentsListHrefFromFilters({
    branchFilter: filters.branchId || 'ALL',
    programFilter: filters.programId || 'ALL',
    courseFilter: filters.courseId || 'ALL',
    statusFilter,
  });
}

export function buildStudentDetailHref(regNo: string, returnTo?: string): string {
  const base = `/admin/students/${encodeURIComponent(regNo)}`;
  if (!returnTo) return base;
  return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
}

export function isSafeAdminReturnPath(path: string): boolean {
  return path.startsWith('/admin/') && !path.includes('//') && !path.includes('\\');
}

export function resolveAdminReturnUrl(returnToParam: string | null, fallback: string): string {
  if (returnToParam) {
    try {
      const decoded = decodeURIComponent(returnToParam);
      if (isSafeAdminReturnPath(decoded)) return decoded;
    } catch {
      // fall through
    }
  }
  return fallback;
}

export function persistStudentsListReturnUrl(href: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STUDENTS_LIST_RETURN_KEY, href);
}

export function getStudentsListReturnUrl(): string {
  if (typeof window === 'undefined') return '/admin/students';
  return sessionStorage.getItem(STUDENTS_LIST_RETURN_KEY) || '/admin/students';
}

export function resolveStudentsListReturnUrl(returnToParam: string | null): string {
  return resolveAdminReturnUrl(returnToParam, getStudentsListReturnUrl());
}

export type SanitizeStudentsQueryContext = {
  programIds: Set<string>;
  branchIds: Set<string>;
  courseIdsByProgram: Map<string, Set<string>>;
  batchIds: Set<string>;
  validateBatch: boolean;
  lockedBranchId?: string;
  maxPage?: number;
};

export function sanitizeStudentsPageQuery(
  state: StudentsPageQueryState,
  ctx: SanitizeStudentsQueryContext,
): StudentsPageQueryState {
  const next = { ...state };

  if (ctx.lockedBranchId) {
    next.branchFilter = ctx.lockedBranchId;
  } else if (next.branchFilter !== 'ALL' && !ctx.branchIds.has(next.branchFilter)) {
    next.branchFilter = 'ALL';
  }

  if (next.programFilter !== 'ALL' && !ctx.programIds.has(next.programFilter)) {
    next.programFilter = 'ALL';
    next.courseFilter = 'ALL';
    next.batchFilter = 'ALL';
  }

  if (next.courseFilter !== 'ALL') {
    const programCourses = ctx.courseIdsByProgram.get(next.programFilter);
    if (next.programFilter === 'ALL' || !programCourses?.has(next.courseFilter)) {
      next.courseFilter = 'ALL';
      next.batchFilter = 'ALL';
    }
  }

  if (ctx.validateBatch && next.batchFilter !== 'ALL') {
    if (next.courseFilter === 'ALL' || !ctx.batchIds.has(next.batchFilter)) {
      next.batchFilter = 'ALL';
    }
  }

  if (ctx.maxPage != null && ctx.maxPage > 0 && next.page > ctx.maxPage) {
    next.page = ctx.maxPage;
  }

  return next;
}

export function studentsQueryStatesEqual(a: StudentsPageQueryState, b: StudentsPageQueryState): boolean {
  return (
    a.page === b.page &&
    a.limit === b.limit &&
    a.search === b.search &&
    a.statusFilter === b.statusFilter &&
    a.branchFilter === b.branchFilter &&
    a.programFilter === b.programFilter &&
    a.courseFilter === b.courseFilter &&
    a.batchFilter === b.batchFilter &&
    a.view === b.view &&
    a.regNo === b.regNo
  );
}

export function useStudentsPageQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = useMemo<StudentsPageQueryState>(() => {
    const viewRaw = searchParams.get('view');
    const regNo = searchParams.get('regNo')?.trim() ?? '';
    return {
      page: parsePage(searchParams.get('page')),
      limit: parseLimit(searchParams.get('limit')),
      search: searchParams.get('search')?.trim() ?? '',
      statusFilter: parseStatus(searchParams.get('status')),
      branchFilter: parseFilter(searchParams.get('branchId')),
      programFilter: parseFilter(searchParams.get('programId')),
      courseFilter: parseFilter(searchParams.get('courseId')),
      batchFilter: parseFilter(searchParams.get('batchId')),
      view: viewRaw === 'enrollments' && regNo ? 'enrollments' : 'list',
      regNo: viewRaw === 'enrollments' && regNo ? regNo : '',
    };
  }, [searchParams]);

  const replaceQuery = useCallback(
    (next: StudentsPageQueryState) => {
      const href = studentsListHref(next);
      persistStudentsListReturnUrl(href);
      router.replace(href, { scroll: false });
    },
    [router],
  );

  const updateQuery = useCallback(
    (patch: Partial<StudentsPageQueryState>, options?: { resetPage?: boolean }) => {
      const next = { ...query, ...patch };
      if (options?.resetPage !== false && !('page' in patch)) {
        next.page = 1;
      }
      replaceQuery(next);
    },
    [query, replaceQuery],
  );

  useEffect(() => {
    persistStudentsListReturnUrl(studentsListHref(query));
  }, [query]);

  const clearFilters = useCallback(
    (lockedBranchId?: string) => {
      replaceQuery({
        page: 1,
        limit: query.limit,
        search: '',
        statusFilter: 'ALL',
        branchFilter: lockedBranchId ?? 'ALL',
        programFilter: 'ALL',
        courseFilter: 'ALL',
        batchFilter: 'ALL',
        view: 'list',
        regNo: '',
      });
    },
    [query.limit, replaceQuery],
  );

  return { query, updateQuery, replaceQuery, clearFilters };
}

export function studentsPageHasActiveFilters(
  query: StudentsPageQueryState,
  lockedBranchId?: string,
): boolean {
  const branchIsDefault =
    query.branchFilter === 'ALL' ||
    (lockedBranchId != null && query.branchFilter === lockedBranchId);
  return (
    query.search.trim() !== '' ||
    query.statusFilter !== 'ALL' ||
    !branchIsDefault ||
    query.programFilter !== 'ALL' ||
    query.courseFilter !== 'ALL' ||
    query.batchFilter !== 'ALL'
  );
}
