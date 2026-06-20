'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Toaster } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { getStudentProfileByRegistrationNumber } from '@/lib/api/student-profiles';
import { useAdminFilters } from '@/lib/query/hooks/useAdminFilters';
import {
  useStudentDatabaseStats,
  useStudentsList,
} from '@/lib/query/hooks/useStudentsList';
import { useBatchesForCourse } from '@/lib/query/hooks/useBatchesList';
import { queryKeys } from '@/lib/query/admin-query';
import {
  downloadStudentExportJobXlsx,
  downloadStudentExportXlsx,
  getStudentExportJobStatus,
  queueStudentExportXlsx,
} from '@/lib/api/students';
import {
  AddStudentModal,
  type AddStudentSaveMeta,
  BULK_STUDENT_IMPORT_COMPLETE_EVENT,
  BulkImportStudentsModal,
  CollectPaymentModal,
  Course,
  EditStudentModal,
  EnrolledCoursesView,
  EnrollmentModal,
  fmt,
  fmtMonth,
  Program,
  StudentsStats,
  StudentsTable,
  StudentsToolbar,
  Student,
} from '@/features/admin/students';
import { getUsers } from '@/lib/api/users';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import {
  buildStudentDetailHref,
  sanitizeStudentsPageQuery,
  studentsListHref,
  studentsPageHasActiveFilters,
  studentsQueryStatesEqual,
  useStudentsPageQuery,
} from '@/features/admin/students/useStudentsPageQuery';
import { useBulkImportJobsStore } from '@/store/bulkImportJobsStore';

const SYNC_EXPORT_ROW_LIMIT = 5000;

export function StudentsPageContent() {
  const queryClient = useQueryClient();
  const { user } = useAdminSession();
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

  const lockedBranchId =
    (user?.role === 'BRANCH_ADMIN' || user?.role === 'MODERATOR') && user.branchId
      ? user.branchId
      : undefined;

  const { data: adminFilters, isLoading: filtersLoading } = useAdminFilters();
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
  const [modal, setModal] = useState<{ type: string; student?: Student } | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [exportingStudents, setExportingStudents] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
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
      const next = searchInput.trim();
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
      debouncedSearch,
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

  const { data: dbStats = null, isLoading: statsLoading } = useStudentDatabaseStats();

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

  const mapUsersToStudents = useCallback((data: NonNullable<Awaited<ReturnType<typeof getUsers>>['data']>) => {
    type ApiStudentUser = (typeof data)[0] & {
      studentProfile?: { registrationNumber?: string };
      _count?: { enrollments?: number };
    };
    return (data as ApiStudentUser[]).map(u => ({
      id: u.id,
      regNo: u.studentProfile?.registrationNumber ?? '—',
      fullName: u.fullName,
      mobile: u.mobile,
      email: u.email ?? null,
      status: u.status as 'ACTIVE' | 'BLOCKED',
      branchId: u.branchId ?? '',
      createdAt: u.createdAt ?? '',
      _count: u._count,
    }));
  }, []);

  const students = useMemo(
    () => (studentsResult?.users ? mapUsersToStudents(studentsResult.users) : []),
    [studentsResult?.users, mapUsersToStudents],
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
  const hasActiveFilters = studentsPageHasActiveFilters(query, lockedBranchId);

  const handleClearFilters = useCallback(() => {
    searchSyncedRef.current = '';
    setSearchInput('');
    clearFilters(lockedBranchId);
  }, [clearFilters, lockedBranchId]);

  const handleSearchChange = useCallback((v: string) => {
    setSearchInput(v);
  }, []);

  const handleProgramFilterChange = useCallback(
    (v: string) => {
      updateQuery({ programFilter: v, courseFilter: 'ALL', batchFilter: 'ALL' });
    },
    [updateQuery],
  );

  const handleCourseFilterChange = useCallback(
    (v: string) => {
      updateQuery({ courseFilter: v, batchFilter: 'ALL' });
    },
    [updateQuery],
  );

  const handleBatchFilterChange = useCallback(
    (v: string) => {
      updateQuery({ batchFilter: v });
    },
    [updateQuery],
  );

  const handleBranchFilterChange = useCallback(
    (v: string) => {
      updateQuery({ branchFilter: v });
    },
    [updateQuery],
  );

  const handleStatusFilterChange = useCallback(
    (v: string) => {
      updateQuery({ statusFilter: v });
    },
    [updateQuery],
  );

  const showToast = (msg: string, type = 'success') => {
    toast({ title: msg, variant: type === 'error' ? 'destructive' : 'default' });
  };

  useEffect(() => {
    const onImportDone = () => {
      void invalidateStudents();
    };
    window.addEventListener(BULK_STUDENT_IMPORT_COMPLETE_EVENT, onImportDone);
    return () => window.removeEventListener(BULK_STUDENT_IMPORT_COMPLETE_EVENT, onImportDone);
  }, [invalidateStudents]);

  const openEnrollments = useCallback(
    (student: Student) => {
      updateQuery({ view: 'enrollments', regNo: student.regNo }, { resetPage: false });
    },
    [updateQuery],
  );

  const closeEnrollments = useCallback(() => {
    updateQuery({ view: 'list', regNo: '' }, { resetPage: false });
  }, [updateQuery]);

  const handleCopyLink = useCallback(async () => {
    try {
      const url = `${window.location.origin}${studentsListHref(query)}`;
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied', description: 'Filtered students list URL copied to clipboard.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Could not copy link to clipboard.', variant: 'destructive' });
    }
  }, [query, toast]);

  const handleAction = (action: string, student: Student) => {
    if (action === 'view') {
      router.push(buildStudentDetailHref(student.regNo, studentsListHref(query)));
      return;
    }
    else if (action === 'enrollments') openEnrollments(student);
    else if (action === 'enroll') setModal({ type: 'enroll', student });
    else if (action === 'payment') setModal({ type: 'payment', student });
    else if (action === 'edit') setEditStudent(student);
    else showToast(`"${action}" action for ${student.fullName}`, 'info');
  };

  const exportParams = useCallback(() => ({
    ...(exportScopedBranchId ? { branchId: exportScopedBranchId } : branchFilter !== 'ALL' ? { branchId: branchFilter } : {}),
    ...(programFilter !== 'ALL' ? { programId: programFilter } : {}),
    ...(courseFilter !== 'ALL' ? { courseId: courseFilter } : {}),
    ...(batchFilter !== 'ALL' ? { batchId: batchFilter } : {}),
    ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  }), [exportScopedBranchId, branchFilter, programFilter, courseFilter, batchFilter, statusFilter, debouncedSearch]);

  const handleDownloadStudents = async () => {
    setExportingStudents(true);
    try {
      const params = exportParams();
      if (pagination.total > SYNC_EXPORT_ROW_LIMIT) {
        const queued = await queueStudentExportXlsx(params);
        const jobId = queued.data?.jobId;
        if (!queued.success || !jobId) throw new Error(queued.message || 'Could not queue export');
        toast({
          title: 'Export queued',
          description: `${queued.data?.totalRows ?? pagination.total} students will be prepared in the background.`,
        });

        for (let i = 0; i < 60; i += 1) {
          await new Promise(resolve => window.setTimeout(resolve, 2000));
          const status = await getStudentExportJobStatus(jobId);
          const job = status.data;
          if (job?.status === 'COMPLETED') {
            await downloadStudentExportJobXlsx(jobId);
            toast({ title: 'Export ready', description: 'Students XLSX downloaded successfully.' });
            return;
          }
          if (job?.status === 'FAILED' || job?.status === 'CANCELLED') {
            throw new Error(job.failureReason || `Export ${job.status.toLowerCase()}`);
          }
        }
        throw new Error('Export is still preparing. Please try downloading again in a moment.');
      }

      await downloadStudentExportXlsx(params);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      toast({ title: 'Export failed', description: msg, variant: 'destructive' });
    } finally {
      setExportingStudents(false);
    }
  };

  if (view === 'enrollments') {
    if (enrollmentsLoading) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center bg-slate-50/50 p-6 text-sm font-medium text-slate-400">
          Loading enrollments…
        </div>
      );
    }

    if (!enrollmentsStudent) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 bg-slate-50/50 p-6">
          <p className="text-sm font-semibold text-slate-600">Student not found — Reg: {regNo}</p>
          <button
            type="button"
            onClick={closeEnrollments}
            className="text-sm font-semibold text-indigo-600 hover:underline"
          >
            Back to students list
          </button>
          <Toaster />
        </div>
      );
    }

    return (
      <div className="min-h-screen p-6 bg-slate-50/50">
        <EnrolledCoursesView
          student={enrollmentsStudent}
          onBack={closeEnrollments}
          showToast={showToast}
          programs={programs}
          allCourses={allCourses}
          branches={branches}
        />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 p-6 sm:p-0 bg-slate-50/50">
      <StudentsStats stats={dbStats} loading={statsLoading} />

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <StudentsToolbar
          count={pagination.total}
          search={searchInput}
          onSearchChange={handleSearchChange}
          programFilter={programFilter}
          onProgramFilterChange={handleProgramFilterChange}
          allCourses={allCourses}
          courseFilter={courseFilter}
          onCourseFilterChange={handleCourseFilterChange}
          batchFilter={batchFilter}
          onBatchFilterChange={handleBatchFilterChange}
          batchesForCourse={batchesForCourse}
          branchFilter={branchFilter}
          onBranchFilterChange={handleBranchFilterChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          programs={programs}
          branches={branches}
          lockedBranchId={lockedBranchId}
          showClearFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          onCopyLink={handleCopyLink}
          onDownload={handleDownloadStudents}
          downloadBusy={exportingStudents}
          onAddStudent={() => setModal({ type: 'addStudent' })}
          onBulkImport={() => setModal({ type: 'bulkImport' })}
        />

        <StudentsTable
          students={students}
          totalStudents={pagination.total}
          branches={branches}
          loading={loadingStudents}
          page={pagination.page}
          totalPages={pagination.pages}
          pageSize={pagination.limit}
          onPageChange={(nextPage) => updateQuery({ page: nextPage }, { resetPage: false })}
          onLimitChange={(nextLimit) => updateQuery({ limit: nextLimit, page: 1 }, { resetPage: false })}
          onViewEnrollments={openEnrollments}
          onAction={handleAction}
        />
      </div>

      {modal?.type === 'addStudent' && (
        <AddStudentModal
          defaultBranchId={user?.branchId ?? undefined}
          onClose={() => setModal(null)}
          onSave={(s, meta?: AddStudentSaveMeta) => {
            void invalidateStudents();
            setModal(null);
            if (meta?.oneTimePassword) {
              toast({
                title: `Student ${s.fullName} created`,
                description: `Reg: ${s.regNo}. One-time password: ${meta.oneTimePassword}`,
                variant: 'success',
              });
            } else if (meta?.usedCustomPassword) {
              toast({
                title: `Student ${s.fullName} created`,
                description: `Reg: ${s.regNo}. They can log in with the password you set. Automated SMS credentials do not include custom passwords.`,
                variant: 'success',
              });
            } else {
              showToast(`Student ${s.fullName} created! Reg: ${s.regNo}`, 'success');
            }
          }}
        />
      )}

      {modal?.type === 'bulkImport' && (
        <BulkImportStudentsModal
          branches={branches}
          defaultBranchId={branchFilter !== 'ALL' ? branchFilter : user?.branchId ?? undefined}
          onClose={() => setModal(null)}
          onQueued={(payload) => {
            useBulkImportJobsStore.getState().addJob({
              jobId: payload.jobId,
              jobType: 'students',
              totalRows: payload.totalRows,
              originalName: payload.fileName,
              folderId: null,
            });
            setModal(null);
          }}
        />
      )}

      {modal?.type === 'enroll' && modal.student && (
        <EnrollmentModal
          student={modal.student}
          programs={programs}
          allCourses={allCourses}
          branches={branches}
          onClose={() => setModal(null)}
          onSave={data => {
            void invalidateStudents();
            setModal(null);
            showToast(`Enrollment confirmed for ${data.student.fullName}!`, 'success');
          }}
        />
      )}

      {modal?.type === 'payment' && modal.student && (
        <CollectPaymentModal
          student={modal.student}
          onClose={() => setModal(null)}
          onSave={data => {
            setModal(null);
            showToast(`${fmt(data.amount)} collected via ${data.method} for ${fmtMonth(data.month)}`, 'success');
          }}
        />
      )}

      {editStudent && (
        <EditStudentModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSave={updated => {
            void invalidateStudents();
            setEditStudent(null);
            showToast(`${updated.fullName}'s profile updated successfully`, 'success');
          }}
        />
      )}

      <Toaster />
    </div>
  );
}
