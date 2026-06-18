'use client';

import { useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { TeachersFiltersBar } from './components/TeachersFiltersBar';
import { TeachersPageHeader } from './components/TeachersPageHeader';
import { TeachersSortBanner } from './components/TeachersSortBanner';
import { TeachersTable } from './components/TeachersTable';
import { useTeacherPageActions } from './hooks/useTeacherPageActions';
import { useTeachersPageData, useTeachersPageFilters } from './hooks/useTeachersPageData';
import { filterTeachersByQuery } from './teachers-page-utils';

export function TeachersPageContent() {
  const { toasts, removeToast } = useToast();
  const {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    branchFilter,
    setBranchFilter,
    actorRole,
    actorBranchId,
    isBranchAdmin,
    listFilters,
  } = useTeachersPageFilters();

  const { teachers, branches, loading, refetch, invalidateTeachers } =
    useTeachersPageData(listFilters);

  const {
    sortMode,
    orderedTeachers,
    savingOrder,
    sensors,
    syncOrderedTeachers,
    openCreate,
    openView,
    openEdit,
    setTeacherStatus,
    handleDelete,
    handleDragEnd,
    handleSaveOrder,
    toggleSortMode,
  } = useTeacherPageActions({
    branches,
    teachers,
    actorRole,
    actorBranchId,
    invalidateTeachers,
  });

  useEffect(() => {
    syncOrderedTeachers(teachers);
  }, [teachers, syncOrderedTeachers]);

  const filteredTeachers = useMemo(
    () => filterTeachersByQuery(teachers, query),
    [teachers, query],
  );

  return (
    <div className="space-y-10 pb-12 text-slate-900">
      <Toaster toasts={toasts} removeToast={removeToast} />

      <TeachersPageHeader
        sortMode={sortMode}
        savingOrder={savingOrder}
        onAddTeacher={openCreate}
        onToggleSortMode={toggleSortMode}
        onSaveOrder={() => void handleSaveOrder()}
      />

      {sortMode ? <TeachersSortBanner /> : null}

      {!sortMode ? (
        <TeachersFiltersBar
          query={query}
          onQueryChange={setQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          branchFilter={branchFilter}
          onBranchFilterChange={setBranchFilter}
          branches={branches}
          isBranchAdmin={isBranchAdmin}
          loading={loading}
          onRefresh={() => void refetch()}
        />
      ) : null}

      <TeachersTable
        loading={loading}
        sortMode={sortMode}
        filteredTeachers={filteredTeachers}
        orderedTeachers={orderedTeachers}
        totalTeachers={teachers.length}
        sensors={sensors}
        onDragEnd={handleDragEnd}
        actions={{
          onView: (id) => void openView(id),
          onEdit: (id) => void openEdit(id),
          onSetStatus: setTeacherStatus,
          onDelete: handleDelete,
        }}
      />
    </div>
  );
}
