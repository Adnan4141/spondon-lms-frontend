'use client';

import dynamic from 'next/dynamic';
import { StudentsTable } from '@/features/admin/students/components/StudentsTable';
import { StudentsToolbar } from '@/features/admin/students/components/StudentsToolbar';
import type { StudentsPageActions } from '@/features/admin/students/hooks/useStudentsPageActions';
import type { StudentsPageData } from '@/features/admin/students/hooks/useStudentsPageData';

const StudentsStats = dynamic(
  () =>
    import('@/features/admin/students/components/StudentsStats').then((m) => m.StudentsStats),
  { ssr: false },
);

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
    exportOwnBranchHint,
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
    handleAction,
    handleDownloadStudents,
    openAddStudent,
    openBulkImport,
    handlePageChange,
    handleLimitChange,
  } = actions;

  const toolbarCount =
    pagination.total != null
      ? pagination.total
      : loadingStudents
        ? null
        : students.length > 0
          ? (pagination.page - 1) * pagination.limit + students.length
          : 0;

  return (
    <div className="min-h-screen space-y-6 p-6 sm:p-0 bg-slate-50/50">
      <StudentsStats stats={dbStats} loading={statsLoading} />

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <StudentsToolbar
          count={toolbarCount}
          countHasMore={pagination.hasMore}
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
          onDownload={handleDownloadStudents}
          downloadBusy={exportingStudents}
          exportOwnBranchHint={exportOwnBranchHint}
          onAddStudent={openAddStudent}
          onBulkImport={openBulkImport}
        />

        <StudentsTable
          students={students}
          totalStudents={pagination.total}
          hasMore={pagination.hasMore}
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
    </div>
  );
}
