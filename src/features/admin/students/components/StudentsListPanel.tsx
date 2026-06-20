'use client';

import { StudentsStats } from '@/features/admin/students/components/StudentsStats';
import { StudentsTable } from '@/features/admin/students/components/StudentsTable';
import { StudentsToolbar } from '@/features/admin/students/components/StudentsToolbar';
import type { StudentsPageActions } from '@/features/admin/students/hooks/useStudentsPageActions';
import type { StudentsPageData } from '@/features/admin/students/hooks/useStudentsPageData';

type Props = {
  data: StudentsPageData;
  actions: StudentsPageActions;
};

export function StudentsListPanel({ data, actions }: Props) {
  const {
    lockedBranchId,
    statusFilter,
    branchFilter,
    programFilter,
    courseFilter,
    batchFilter,
    searchInput,
    programs,
    allCourses,
    branches,
    students,
    pagination,
    dbStats,
    loadingStudents,
    statsLoading,
    batchesForCourse,
    hasActiveFilters,
  } = data;

  const {
    exportingStudents,
    handleClearFilters,
    handleSearchChange,
    handleProgramFilterChange,
    handleCourseFilterChange,
    handleBatchFilterChange,
    handleBranchFilterChange,
    handleStatusFilterChange,
    openEnrollments,
    handleCopyLink,
    handleAction,
    handleDownloadStudents,
    openAddStudent,
    openBulkImport,
    handlePageChange,
    handleLimitChange,
  } = actions;

  return (
    <div className="min-h-screen space-y-6 p-6 sm:p-0 bg-slate-50/50">
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
          onAddStudent={openAddStudent}
          onBulkImport={openBulkImport}
        />

        <StudentsTable
          students={students}
          totalStudents={pagination.total}
          branches={branches}
          loading={loadingStudents}
          page={pagination.page}
          totalPages={pagination.pages}
          pageSize={pagination.limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onViewEnrollments={openEnrollments}
          onAction={handleAction}
        />
      </div>

      <StudentsStats stats={dbStats} loading={statsLoading} />
    </div>
  );
}
