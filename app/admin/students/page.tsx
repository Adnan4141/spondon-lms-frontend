'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { getPrograms } from '@/lib/api/programs';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import { getUsers, getStudentDatabaseStats } from '@/lib/api/users';
import {
  downloadStudentExportJobXlsx,
  downloadStudentExportXlsx,
  getStudentExportJobStatus,
  queueStudentExportXlsx,
} from '@/lib/api/students';
import { getBatches, type Batch } from '@/lib/api/batches';
import {
  AddStudentModal,
  type AddStudentSaveMeta,
  BULK_STUDENT_IMPORT_COMPLETE_EVENT,
  BranchOption,
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

const STUDENTS_PAGE_SIZE = 50;
const SYNC_EXPORT_ROW_LIMIT = 5000;
const STUDENTS_CACHE_MS = 30_000;

type StudentsPaginationState = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

const studentsListCache = new Map<string, {
  students: Student[];
  pagination: StudentsPaginationState;
  cachedAt: number;
}>();

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [view, setView] = useState<'list' | 'enrollments'>('list');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [actor, setActor] = useState<{ role?: string; branchId?: string | null }>({});
  const [programFilter, setProgramFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [batchesForCourse, setBatchesForCourse] = useState<Batch[]>([]);
  const [modal, setModal] = useState<{ type: string; student?: Student } | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [exportingStudents, setExportingStudents] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: STUDENTS_PAGE_SIZE, total: 0, pages: 1 });
  const [dbStats, setDbStats] = useState<{ total: number; active: number; blocked: number; newThisMonth: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const debouncedSearch = useDebounce(search.trim(), 500);

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
      if (user?.role === 'BRANCH_ADMIN' && branchId) {
        setBranchFilter(branchId);
      }
    } catch {
      setActor({});
    }
  }, []);

  const isBranchAdmin = actor.role === 'BRANCH_ADMIN';
  const scopedBranchId = isBranchAdmin ? actor.branchId || '' : '';

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await getStudentDatabaseStats();
      if (res.success && res.data) {
        setDbStats(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not load student stats';
      toast({ title: 'Could not load student stats', description: msg, variant: 'destructive' });
    } finally {
      setStatsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const loadStudents = useCallback(() => {
    const params = {
      role: 'STUDENT',
      page,
      limit: STUDENTS_PAGE_SIZE,
      includeDetails: false,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(scopedBranchId ? { branchId: scopedBranchId } : branchFilter !== 'ALL' ? { branchId: branchFilter } : {}),
      ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      ...(programFilter !== 'ALL' && courseFilter === 'ALL'
        ? { programId: programFilter }
        : {}),
      ...(programFilter !== 'ALL' && courseFilter !== 'ALL'
        ? {
            programId: programFilter,
            courseId: courseFilter,
            ...(batchFilter !== 'ALL' ? { batchId: batchFilter } : {}),
          }
        : {}),
    };
    const cacheKey = JSON.stringify(params);
    const cached = studentsListCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < STUDENTS_CACHE_MS) {
      setStudents(cached.students);
      setPagination(cached.pagination);
      setLoadingStudents(false);
      return;
    }

    setLoadingStudents(true);
    getUsers(params)
      .then(res => {
        if (res.success && res.data) {
          const nextStudents = mapUsersToStudents(res.data);
          const nextPagination = res.pagination ?? {
            page,
            limit: STUDENTS_PAGE_SIZE,
            total: res.data.length,
            pages: 1,
          };
          studentsListCache.set(cacheKey, {
            students: nextStudents,
            pagination: nextPagination,
            cachedAt: Date.now(),
          });
          setStudents(nextStudents);
          setPagination(nextPagination);
        } else {
          setStudents([]);
          setPagination({ page, limit: STUDENTS_PAGE_SIZE, total: 0, pages: 1 });
        }
      })
      .catch((err: unknown) => {
        setStudents([]);
        setPagination({ page, limit: STUDENTS_PAGE_SIZE, total: 0, pages: 1 });
        const msg = err instanceof Error ? err.message : 'Could not load students';
        toast({ title: 'Could not load students', description: msg, variant: 'destructive' });
      })
      .finally(() => setLoadingStudents(false));
  }, [page, debouncedSearch, branchFilter, scopedBranchId, statusFilter, programFilter, courseFilter, batchFilter, mapUsersToStudents, toast]);

  useEffect(() => {
    void Promise.resolve().then(loadStudents);
  }, [loadStudents]);

  useEffect(() => {
    void Promise.all([
      getPrograms(),
      getBranches(),
      getCourses({ limit: 500 }),
    ]).then(([programRes, branchRes, courseRes]) => {
      if (programRes.success && programRes.data) setPrograms(programRes.data as Program[]);
      if (branchRes.success && branchRes.data) setBranches(branchRes.data.map(b => ({ id: b.id, name: b.name })));
      if (courseRes.success && courseRes.data) {
        setAllCourses(courseRes.data.map(c => ({
          id: c.id,
          name: c.name,
          programId: c.programId,
          fee: Number(c.fee ?? 0),
          type: (c.type === 'OFFLINE' ? 'OFFLINE' : 'ONLINE') as 'OFFLINE' | 'ONLINE',
          startMonth: c.startMonth ?? '',
          endMonth: c.endMonth ?? '',
          batches: [],
        })));
      }
    });
  }, []);

  // When program changes, reset course + batch. Courses are listed from allCourses.
  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const handleProgramFilterChange = useCallback((v: string) => {
    setPage(1);
    setProgramFilter(v);
    setCourseFilter('ALL');
    setBatchFilter('ALL');
    setBatchesForCourse([]);
  }, []);

  const handleCourseFilterChange = useCallback((v: string) => {
    setPage(1);
    setCourseFilter(v);
    setBatchFilter('ALL');
    if (v === 'ALL') setBatchesForCourse([]);
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

  // Batches load per selected course (batches belong to a course; courses belong to a program)
  useEffect(() => {
    if (programFilter === 'ALL' || courseFilter === 'ALL') {
      setBatchesForCourse([]);
      setBatchFilter('ALL');
      return;
    }
    let ignore = false;
    getBatches({ courseId: courseFilter, limit: 500 }).then((res) => {
      if (ignore) return;
      if (res.success && res.data) {
        setBatchesForCourse(res.data);
        setBatchFilter('ALL');
      } else {
        setBatchesForCourse([]);
        setBatchFilter('ALL');
      }
    });
    return () => {
      ignore = true;
    };
  }, [programFilter, courseFilter]);

  const showToast = (msg: string, type = 'success') => {
    toast({ title: msg, variant: type === 'error' ? 'destructive' : 'default' });
  };

  useEffect(() => {
    const onImportDone = () => {
      studentsListCache.clear();
      void loadStudents();
      void loadStats();
    };
    window.addEventListener(BULK_STUDENT_IMPORT_COMPLETE_EVENT, onImportDone);
    return () => window.removeEventListener(BULK_STUDENT_IMPORT_COMPLETE_EVENT, onImportDone);
  }, [loadStudents, loadStats]);

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
    ...(scopedBranchId ? { branchId: scopedBranchId } : branchFilter !== 'ALL' ? { branchId: branchFilter } : {}),
    ...(programFilter !== 'ALL' ? { programId: programFilter } : {}),
    ...(courseFilter !== 'ALL' ? { courseId: courseFilter } : {}),
    ...(batchFilter !== 'ALL' ? { batchId: batchFilter } : {}),
    ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  }), [scopedBranchId, branchFilter, programFilter, courseFilter, batchFilter, statusFilter, debouncedSearch]);

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
          branchFilter={scopedBranchId || branchFilter}
          onBranchFilterChange={isBranchAdmin ? () => {} : handleBranchFilterChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          programs={programs}
          branches={branches}
          lockedBranchId={scopedBranchId || undefined}
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
          onClose={() => setModal(null)}
          onSave={(s, meta?: AddStudentSaveMeta) => {
            studentsListCache.clear();
            setStudents(p => page === 1 ? [s, ...p].slice(0, STUDENTS_PAGE_SIZE) : p);
            setPagination(p => ({ ...p, total: p.total + 1, pages: Math.ceil((p.total + 1) / p.limit) || 1 }));
            setModal(null);
            void loadStats();
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
          defaultBranchId={branchFilter !== 'ALL' ? branchFilter : undefined}
          onClose={() => setModal(null)}
          onQueued={(payload) => {
            useBulkImportJobsStore.getState().addJob({
              jobId: payload.jobId,
              totalRows: payload.totalRows,
              originalName: payload.fileName,
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
            studentsListCache.clear();
            setStudents(prev => prev.map(s =>
              s.id === data.student.id
                ? { ...s, _count: { ...s._count, enrollments: (s._count?.enrollments ?? 0) + 1 } }
                : s
            ));
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
            studentsListCache.clear();
            setStudents(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
            setEditStudent(null);
            void loadStats();
            showToast(`${updated.fullName}'s profile updated successfully`, 'success');
          }}
        />
      )}

      <Toaster />
    </div>
  );
}
