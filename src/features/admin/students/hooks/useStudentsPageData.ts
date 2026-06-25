'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getStudentProfileByRegistrationNumber } from '@/lib/api/student-profiles';
import { useAdminFilters } from '@/lib/query/hooks/useAdminFilters';
import {
  useStudentDatabaseStats,
  useStudentsList,
} from '@/lib/query/hooks/useStudentsList';
import { useBatchesForCourse } from '@/lib/query/hooks/useBatchesList';
import { queryKeys } from '@/lib/query/admin-query';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import {
  sanitizeStudentsPageQuery,
  studentsPageHasActiveFilters,
  studentsQueryStatesEqual,
  useStudentsPageQuery,
} from '@/features/admin/students/useStudentsPageQuery';
import { effectiveStudentSearch } from '@/features/admin/students/studentSearch';
import { mapUsersToStudents } from '@/features/admin/students/students-list-utils';
import type { Course, Program, Student } from '@/features/admin/students/types';
import { useToast } from '@/hooks/use-toast';

export function useStudentsPageData() {
  const queryClient = useQueryClient();
  const { user } = useAdminSession();
  const { toast } = useToast();
  const { query, updateQuery, replaceQuery, clearFilters } = useStudentsPageQuery();
  const {
    page,
    limit,
    search: debouncedSearch,
    statusFilter,
    branchFilter,
    programFilter,
    courseFilter,
    batchFilter,
    view,
    regNo,
  } = query;

  // Moderators stay branch-scoped; branch admins may browse all branches (export stays own-branch).
  const lockedBranchId =
    user?.role === 'MODERATOR' && user.branchId ? user.branchId : undefined;

  const { data: adminFilters, isLoading: filtersLoading } = useAdminFilters({ allBranches: true });
  const programs = useMemo(
    () => (adminFilters?.programs ?? []) as Program[],
    [adminFilters?.programs],
  );
  const allCourses = useMemo(
    () =>
      (adminFilters?.courses ?? []).map((course) => ({
        id: course.id,
        name: course.name,
        programId: course.programId,
        fee: Number(course.fee ?? 0),
        offerPrice: course.offerPrice ?? null,
        type: (course.type === 'OFFLINE' ? 'OFFLINE' : 'ONLINE') as 'OFFLINE' | 'ONLINE',
        startMonth: course.startMonth ?? '',
        endMonth: course.endMonth ?? '',
        batches: [],
      })) as Course[],
    [adminFilters?.courses],
  );
  const branches = useMemo(
    () => (adminFilters?.branches ?? []).map((branch) => ({ id: branch.id, name: branch.name })),
    [adminFilters?.branches],
  );

  const [searchInput, setSearchInput] = useState(debouncedSearch);
  const [enrollmentsStudent, setEnrollmentsStudent] = useState<Student | null>(null);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const searchSyncedRef = useRef(debouncedSearch);
  const updateQueryRef = useRef(updateQuery);
  updateQueryRef.current = updateQuery;

  useEffect(() => {
    if (debouncedSearch === searchSyncedRef.current) return;
    searchSyncedRef.current = debouncedSearch;
    setSearchInput(debouncedSearch);
  }, [debouncedSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = effectiveStudentSearch(searchInput);
      if (next !== searchSyncedRef.current) {
        searchSyncedRef.current = next;
        updateQueryRef.current({ search: next });
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (lockedBranchId && branchFilter !== lockedBranchId) {
      updateQuery({ branchFilter: lockedBranchId }, { resetPage: false });
    }
  }, [lockedBranchId, branchFilter, updateQuery]);

  const listParams = useMemo(
    () => ({
      page,
      limit,
      debouncedSearch: effectiveStudentSearch(debouncedSearch),
      branchFilter,
      statusFilter,
      programFilter,
      courseFilter,
      batchFilter,
    }),
    [page, limit, debouncedSearch, branchFilter, statusFilter, programFilter, courseFilter, batchFilter],
  );

  const {
    data: studentsResult,
    isLoading: loadingStudents,
    isError: studentsError,
    error: studentsQueryError,
  } = useStudentsList(listParams, { enabled: view === 'list' });

  const { data: dbStats = null, isLoading: statsLoading } = useStudentDatabaseStats({
    enabled: view === 'list',
    branchId: branchFilter !== 'ALL' ? branchFilter : undefined,
  });

  const batchesCourseId =
    programFilter !== 'ALL' && courseFilter !== 'ALL' ? courseFilter : null;
  const { data: batchesForCourse = [], isLoading: batchesLoading } = useBatchesForCourse(batchesCourseId);

  const invalidateStudents = useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.students.all }),
    [queryClient],
  );

  const pagination = studentsResult?.pagination ?? {
    page,
    limit,
    total: 0,
    pages: 1,
    hasMore: false,
  };

  const sanitizeContext = useMemo(
    () => ({
      programIds: new Set(programs.map((program) => program.id)),
      branchIds: new Set(branches.map((branch) => branch.id)),
      courseIdsByProgram: allCourses.reduce((map, course) => {
        if (!map.has(course.programId)) map.set(course.programId, new Set<string>());
        map.get(course.programId)!.add(course.id);
        return map;
      }, new Map<string, Set<string>>()),
      batchIds: new Set(batchesForCourse.map((batch) => batch.id)),
      validateBatch: courseFilter === 'ALL' || !batchesLoading,
      lockedBranchId,
      maxPage: view === 'list' && !loadingStudents ? pagination.pages : undefined,
    }),
    [
      programs,
      branches,
      allCourses,
      batchesForCourse,
      batchesLoading,
      courseFilter,
      lockedBranchId,
      view,
      loadingStudents,
      pagination.pages,
    ],
  );

  useEffect(() => {
    if (filtersLoading) return;
    const sanitized = sanitizeStudentsPageQuery(query, sanitizeContext);
    if (!studentsQueryStatesEqual(query, sanitized)) {
      replaceQuery(sanitized);
    }
  }, [filtersLoading, query, replaceQuery, sanitizeContext]);

  const students = useMemo(
    () => (studentsResult?.users ? mapUsersToStudents(studentsResult.users) : []),
    [studentsResult?.users],
  );

  useEffect(() => {
    if (view !== 'enrollments' || !regNo) {
      setEnrollmentsStudent(null);
      setEnrollmentsLoading(false);
      return;
    }

    const fromList = students.find((student) => student.regNo === regNo);
    if (fromList) {
      setEnrollmentsStudent(fromList);
      setEnrollmentsLoading(false);
      return;
    }

    let cancelled = false;
    setEnrollmentsLoading(true);
    void getStudentProfileByRegistrationNumber(regNo)
      .then((res) => {
        if (cancelled) return;
        const profileUser = res.data?.user;
        if (!res.success || !profileUser) {
          setEnrollmentsStudent(null);
          return;
        }
        setEnrollmentsStudent({
          id: profileUser.id,
          regNo: profileUser.studentProfile?.registrationNumber ?? regNo,
          fullName: profileUser.fullName,
          mobile: profileUser.mobile,
          email: profileUser.email ?? null,
          status: profileUser.status as 'ACTIVE' | 'BLOCKED',
          branchId: profileUser.branchId ?? '',
          createdAt: profileUser.createdAt ?? '',
        });
      })
      .catch(() => {
        if (!cancelled) setEnrollmentsStudent(null);
      })
      .finally(() => {
        if (!cancelled) setEnrollmentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [view, regNo, students]);

  useEffect(() => {
    if (!studentsError) return;
    const msg =
      studentsQueryError instanceof Error ? studentsQueryError.message : 'Could not load students';
    toast({ title: 'Could not load students', description: msg, variant: 'destructive' });
  }, [studentsError, studentsQueryError, toast]);

  const exportOwnBranchOnly = user?.role === 'BRANCH_ADMIN' || user?.role === 'MODERATOR';
  const exportScopedBranchId = exportOwnBranchOnly ? user?.branchId || '' : '';
  const exportOwnBranchHint = exportOwnBranchOnly
    ? `Export includes only students registered under your branch${
        branches.find((b) => b.id === user?.branchId)?.name
          ? ` (${branches.find((b) => b.id === user?.branchId)?.name})`
          : ''
      }`
    : undefined;
  const hasActiveFilters = studentsPageHasActiveFilters(query, lockedBranchId);

  const clearSearchInput = useCallback(() => {
    searchSyncedRef.current = '';
    setSearchInput('');
  }, []);

  return {
    user,
    query,
    updateQuery,
    clearFilters,
    lockedBranchId,
    view,
    regNo,
    debouncedSearch,
    statusFilter,
    branchFilter,
    programFilter,
    courseFilter,
    batchFilter,
    searchInput,
    setSearchInput,
    programs,
    allCourses,
    branches,
    students,
    pagination,
    dbStats,
    loadingStudents,
    statsLoading,
    batchesForCourse,
    enrollmentsStudent,
    enrollmentsLoading,
    hasActiveFilters,
    exportScopedBranchId,
    exportOwnBranchHint,
    invalidateStudents,
    clearSearchInput,
  };
}

export type StudentsPageData = ReturnType<typeof useStudentsPageData>;
