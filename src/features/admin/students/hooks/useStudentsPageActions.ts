'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { BULK_STUDENT_IMPORT_COMPLETE_EVENT } from '@/features/admin/students/bulk-import-events';
import {
  buildStudentDetailHref,
  studentsListHref,
} from '@/features/admin/students/useStudentsPageQuery';
import { effectiveStudentSearch } from '@/features/admin/students/studentSearch';
import type { Student } from '@/features/admin/students/types';
import { fmt, fmtMonth } from '@/features/admin/students/utils';
import { useBulkImportJobsStore } from '@/store/bulkImportJobsStore';
import type { StudentsPageData } from './useStudentsPageData';

const SYNC_EXPORT_ROW_LIMIT = 5000;

export function useStudentsPageActions(data: StudentsPageData) {
  const { toast } = useToast();
  const router = useRouter();
  const [modal, setModal] = useState<{ type: string; student?: Student } | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [exportingStudents, setExportingStudents] = useState(false);

  const {
    query,
    updateQuery,
    clearFilters,
    lockedBranchId,
    debouncedSearch,
    branchFilter,
    programFilter,
    courseFilter,
    batchFilter,
    statusFilter,
    setSearchInput,
    pagination,
    exportScopedBranchId,
    invalidateStudents,
    clearSearchInput,
  } = data;

  const showToast = useCallback(
    (msg: string, type = 'success') => {
      toast({ title: msg, variant: type === 'error' ? 'destructive' : 'default' });
    },
    [toast],
  );

  const handleClearFilters = useCallback(() => {
    clearSearchInput();
    clearFilters(lockedBranchId);
  }, [clearFilters, clearSearchInput, lockedBranchId]);

  const handleSearchChange = useCallback(
    (v: string) => {
      setSearchInput(v);
    },
    [setSearchInput],
  );

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

  const handleAction = useCallback(
    (action: string, student: Student) => {
      if (action === 'view') {
        router.push(buildStudentDetailHref(student.regNo, studentsListHref(query)));
        return;
      }
      if (action === 'enrollments') openEnrollments(student);
      else if (action === 'enroll') setModal({ type: 'enroll', student });
      else if (action === 'payment') setModal({ type: 'payment', student });
      else if (action === 'edit') setEditStudent(student);
      else showToast(`"${action}" action for ${student.fullName}`, 'info');
    },
    [openEnrollments, query, router, showToast],
  );

  const exportParams = useCallback(() => {
    const exportSearch = effectiveStudentSearch(debouncedSearch);
    return {
      ...(exportScopedBranchId
        ? { branchId: exportScopedBranchId }
        : branchFilter !== 'ALL'
          ? { branchId: branchFilter }
          : {}),
      ...(programFilter !== 'ALL' ? { programId: programFilter } : {}),
      ...(courseFilter !== 'ALL' ? { courseId: courseFilter } : {}),
      ...(batchFilter !== 'ALL' ? { batchId: batchFilter } : {}),
      ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      ...(exportSearch ? { search: exportSearch } : {}),
    };
  }, [
    exportScopedBranchId,
    branchFilter,
    programFilter,
    courseFilter,
    batchFilter,
    statusFilter,
    debouncedSearch,
  ]);

  const handleDownloadStudents = useCallback(async () => {
    setExportingStudents(true);
    try {
      const {
        downloadStudentExportJobXlsx,
        downloadStudentExportXlsx,
        getStudentExportJobStatus,
        queueStudentExportXlsx,
      } = await import('@/lib/api/students');

      const params = exportParams();
      const totalUnknown = pagination.total == null;
      if (totalUnknown || pagination.total > SYNC_EXPORT_ROW_LIMIT) {
        const queued = await queueStudentExportXlsx(params);
        const jobId = queued.data?.jobId;
        if (!queued.success || !jobId) throw new Error(queued.message || 'Could not queue export');
        toast({
          title: 'Export queued',
          description: `${queued.data?.totalRows ?? pagination.total ?? 'Filtered'} students will be prepared in the background.`,
        });

        for (let i = 0; i < 60; i += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 2000));
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
  }, [exportParams, pagination.total, toast]);

  const openAddStudent = useCallback(() => setModal({ type: 'addStudent' }), []);
  const openBulkImport = useCallback(() => setModal({ type: 'bulkImport' }), []);
  const closeModal = useCallback(() => setModal(null), []);
  const closeEditStudent = useCallback(() => setEditStudent(null), []);

  const handleBulkImportQueued = useCallback(
    (payload: { jobId: string; totalRows: number; fileName: string }) => {
      useBulkImportJobsStore.getState().addJob({
        jobId: payload.jobId,
        jobType: 'students',
        totalRows: payload.totalRows,
        originalName: payload.fileName,
        folderId: null,
      });
      setModal(null);
    },
    [],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => updateQuery({ page: nextPage }, { resetPage: false }),
    [updateQuery],
  );

  const handleLimitChange = useCallback(
    (nextLimit: number) => updateQuery({ limit: nextLimit, page: 1 }, { resetPage: false }),
    [updateQuery],
  );

  return {
    modal,
    editStudent,
    exportingStudents,
    showToast,
    handleClearFilters,
    handleSearchChange,
    handleProgramFilterChange,
    handleCourseFilterChange,
    handleBatchFilterChange,
    handleBranchFilterChange,
    handleStatusFilterChange,
    openEnrollments,
    closeEnrollments,
    handleAction,
    handleDownloadStudents,
    openAddStudent,
    openBulkImport,
    closeModal,
    closeEditStudent,
    handleBulkImportQueued,
    handlePageChange,
    handleLimitChange,
    fmt,
    fmtMonth,
  };
}

export type StudentsPageActions = ReturnType<typeof useStudentsPageActions>;
