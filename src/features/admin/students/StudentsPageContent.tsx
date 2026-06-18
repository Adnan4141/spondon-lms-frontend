'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Toaster } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { getUsers } from '@/lib/api/users';
import { useAdminFilters } from '@/lib/query/hooks/useAdminFilters';
import {
  STUDENTS_PAGE_SIZE,
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
import { useBulkImportJobsStore } from '@/store/bulkImportJobsStore';

const SYNC_EXPORT_ROW_LIMIT = 5000;

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function StudentsPageContent() {
  const queryClient = useQueryClient();
  const { data: adminFilters } = useAdminFilters();
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
  const [view, setView] = useState<'list' | 'enrollments'>('list');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [actor, setActor] = useState<{ role?: string; branchId?: string | null }>({});
  const [programFilter, setProgramFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [modal, setModal] = useState<{ type: string; student?: Student } | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [exportingStudents, setExportingStudents] = useState(false);
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const router = useRouter();
  const debouncedSearch = useDebounce(search.trim(), 500);

  const listParams = useMemo(
    () => ({
      page,
      limit: STUDENTS_PAGE_SIZE,
      debouncedSearch,
      branchFilter,
      statusFilter,
      programFilter,
      courseFilter,
      batchFilter,
    }),
    [page, debouncedSearch, branchFilter, statusFilter, programFilter, courseFilter, batchFilter],
  );

  const {
    data: studentsResult,
    isLoading: loadingStudents,
    isError: studentsError,
    error: studentsQueryError,
  } = useStudentsList(listParams);

  const { data: dbStats = null, isLoading: statsLoading } = useStudentDatabaseStats();

  const batchesCourseId =
    programFilter !== 'ALL' && courseFilter !== 'ALL' ? courseFilter : null;
  const { data: batchesForCourse = [] } = useBatchesForCourse(batchesCourseId);

  const invalidateStudents = useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.students.all }),
    [queryClient],
  );

  const pagination = studentsResult?.pagination ?? {
    page,
    limit: STUDENTS_PAGE_SIZE,
    total: 0,
    pages: 1,
  };

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('user');
      const user = raw ? JSON.parse(raw) : null;
      const branchId = user?.branchId ? String(user.branchId) : null;
      setActor({ role: user?.role, branchId });
    } catch {
      setActor({});
    }
  }, []);

  const students = useMemo(
    () => (studentsResult?.users ? mapUsersToStudents(studentsResult.users) : []),
    [studentsResult?.users, mapUsersToStudents],
  );

  useEffect(() => {
    if (!studentsError) return;
    const msg =
      studentsQueryError instanceof Error ? studentsQueryError.message : 'Could not load students';
    toast({ title: 'Could not load students', description: msg, variant: 'destructive' });
  }, [studentsError, studentsQueryError, toast]);

  const exportOwnBranchOnly = actor.role === 'BRANCH_ADMIN' || actor.role === 'MODERATOR';
  const exportScopedBranchId = exportOwnBranchOnly ? actor.branchId || '' : '';

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const handleProgramFilterChange = useCallback((v: string) => {
    setPage(1);
    setProgramFilter(v);
    setCourseFilter('ALL');
    setBatchFilter('ALL');
  }, []);

  const handleCourseFilterChange = useCallback((v: string) => {
    setPage(1);
    setCourseFilter(v);
    setBatchFilter('ALL');
  }, []);

  const handleBatchFilterChange = useCallback((v: string) => {
    setPage(1);
    setBatchFilter(v);
  }, []);

  const handleBranchFilterChange = useCallback((v: string) => {
    setPage(1);
    setBranchFilter(v);
  }, []);

  const handleStatusFilterChange = useCallback((v: string) => {
    setPage(1);
    setStatusFilter(v);
  }, []);

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

  const openEnrollments = (student: Student) => {
    setActiveStudent(student);
    setView('enrollments');
  };

  const handleAction = (action: string, student: Student) => {
    if (action === 'view') router.push(`/admin/students/${student.regNo}`);
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

  if (view === 'enrollments' && activeStudent) {
    return (
      <div className="min-h-screen p-6 bg-slate-50/50">
        <EnrolledCoursesView
          student={activeStudent}
          onBack={() => setView('list')}
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
          search={search}
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
          lockedBranchId={undefined}
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
          onPageChange={setPage}
          onViewEnrollments={openEnrollments}
          onAction={handleAction}
        />
      </div>

      {modal?.type === 'addStudent' && (
        <AddStudentModal
          defaultBranchId={actor.branchId ?? undefined}
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
          defaultBranchId={branchFilter !== 'ALL' ? branchFilter : actor.branchId ?? undefined}
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
