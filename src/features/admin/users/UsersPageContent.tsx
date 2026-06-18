'use client';

import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import { UsersAccessDenied } from './components/UsersAccessDenied';
import { UsersDialogs } from './components/UsersDialogs';
import { UsersFiltersBar } from './components/UsersFiltersBar';
import { UsersPageHeader } from './components/UsersPageHeader';
import { UsersRoleTabs } from './components/UsersRoleTabs';
import { UsersTable } from './components/UsersTable';
import { useUserPageActions } from './hooks/useUserPageActions';
import { useUsersPageData, useUsersPageFilters } from './hooks/useUsersPageData';

export function UsersPageContent() {
  const { user: sessionUser } = useAdminSession();
  const { toasts, removeToast } = useToast();
  const canAccess = sessionUser?.role === 'SUPER_ADMIN';

  const {
    query,
    setQuery,
    page,
    setPage,
    roleTab,
    setRoleTab,
    statusFilter,
    setStatusFilter,
    branchFilter,
    setBranchFilter,
    listFilters,
  } = useUsersPageFilters();

  const {
    branches,
    users,
    pagination,
    roleSummary,
    loading,
    summaryLoading,
    refreshAll,
  } = useUsersPageData(listFilters, canAccess);

  const {
    formOpen,
    setFormOpen,
    editingUser,
    detailUser,
    setDetailUser,
    blockTarget,
    setBlockTarget,
    deleteTarget,
    setDeleteTarget,
    resetTarget,
    setResetTarget,
    actionLoading,
    openCreate,
    openEdit,
    closeForm,
    handleFormSuccess,
    handleViewDetails,
    handleBlockToggle,
    handleDelete,
    handleResetSuccess,
  } = useUserPageActions({ refreshAll });

  if (!canAccess) {
    return <UsersAccessDenied />;
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 px-1 pb-12">
      <Toaster toasts={toasts} removeToast={removeToast} />

      <UsersPageHeader
        loading={loading}
        summaryLoading={summaryLoading}
        roleSummaryTotal={roleSummary.total}
        statusFilter={statusFilter}
        roleTab={roleTab}
        onRefresh={() => void refreshAll()}
        onAddUser={openCreate}
      />

      <UsersRoleTabs
        roleTab={roleTab}
        summaryLoading={summaryLoading}
        roleSummary={roleSummary}
        onRoleTabChange={(role) => {
          setRoleTab(role);
          setPage(1);
        }}
      />

      <UsersFiltersBar
        query={query}
        onQueryChange={setQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        branchFilter={branchFilter}
        onBranchFilterChange={(value) => {
          setBranchFilter(value);
          setPage(1);
        }}
        branches={branches}
        users={users}
        pagination={pagination}
      />

      <UsersTable
        loading={loading}
        users={users}
        page={page}
        pagination={pagination}
        onPageChange={setPage}
        onView={(user) => void handleViewDetails(user)}
        onEdit={openEdit}
        onResetPassword={setResetTarget}
        onToggleBlock={setBlockTarget}
        onDelete={setDeleteTarget}
      />

      <UsersDialogs
        branches={branches}
        formOpen={formOpen}
        editingUser={editingUser}
        detailUser={detailUser}
        blockTarget={blockTarget}
        deleteTarget={deleteTarget}
        resetTarget={resetTarget}
        actionLoading={actionLoading}
        onFormOpenChange={(open) => { if (!open) setFormOpen(false); }}
        onFormSuccess={() => void handleFormSuccess()}
        onFormCancel={closeForm}
        onDetailOpenChange={(open) => { if (!open) setDetailUser(null); }}
        onBlockOpenChange={(open) => { if (!open) setBlockTarget(null); }}
        onDeleteOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onResetClose={() => setResetTarget(null)}
        onResetSuccess={() => void handleResetSuccess()}
        onBlockConfirm={() => void handleBlockToggle()}
        onDeleteConfirm={() => void handleDelete()}
      />
    </div>
  );
}
