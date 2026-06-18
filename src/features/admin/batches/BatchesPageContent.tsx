'use client';

import { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { BatchesFiltersBar } from './components/BatchesFiltersBar';
import { BatchesTable } from './components/BatchesTable';
import { useBatchPageActions } from './hooks/useBatchPageActions';
import { useBatchesPageData, useBatchesPageFilters } from './hooks/useBatchesPageData';
import { filterBatchesByQuery } from './batches-page-utils';

export function BatchesPageContent() {
  const { toasts, removeToast } = useToast();

  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    courseFilter,
    setCourseFilter,
    branchFilter,
    setBranchFilter,
    scopedBranchId,
    branchScopeReady,
    batchQueryParams,
  } = useBatchesPageFilters();

  const {
    courses,
    branches,
    batches,
    loading,
    isFetching,
    error,
    refetch,
    invalidateBatches,
  } = useBatchesPageData(batchQueryParams, branchScopeReady);

  const {
    handleViewBatch,
    handleRoutineBatch,
    handleEditBatch,
    handleCreateBatch,
    handleDeleteBatch,
  } = useBatchPageActions({
    courses,
    branches,
    scopedBranchId,
    invalidateBatches,
  });

  const filteredBatches = useMemo(
    () => filterBatchesByQuery(batches, searchQuery),
    [batches, searchQuery],
  );

  return (
    <div className="space-y-6 text-slate-900 sm:space-y-8">
      <BatchesFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        courseFilter={courseFilter}
        onCourseFilterChange={setCourseFilter}
        branchFilter={branchFilter}
        onBranchFilterChange={setBranchFilter}
        courses={courses}
        branches={branches}
        showBranchFilter={!scopedBranchId}
        loading={loading}
        isFetching={isFetching}
        onRefresh={() => void refetch()}
        onCreateBatch={handleCreateBatch}
      />

      <BatchesTable
        loading={loading}
        error={error}
        batches={filteredBatches}
        onView={(id) => void handleViewBatch(id)}
        onRoutine={(id) => void handleRoutineBatch(id)}
        onEdit={(id) => void handleEditBatch(id)}
        onDelete={handleDeleteBatch}
      />

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
