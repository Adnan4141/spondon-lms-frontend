'use client';

import { useState } from 'react';
import type { ActorRoleGroup } from '@/lib/api/audit';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import { AuditAccessDenied } from '@/features/admin/audit/components/AuditAccessDenied';
import { AuditActorTabs } from '@/features/admin/audit/components/AuditActorTabs';
import { AuditFilters } from '@/features/admin/audit/components/AuditFilters';
import { AuditHeader } from '@/features/admin/audit/components/AuditHeader';
import { AuditList } from '@/features/admin/audit/components/AuditList';
import { AuditPagination } from '@/features/admin/audit/components/AuditPagination';
import { EMPTY_AUDIT_FILTERS, countActiveFilters } from '@/features/admin/audit/audit-utils';
import { useAuditLogs } from '@/features/admin/audit/hooks/useAuditLogs';

export default function AuditHistoryPage() {
  const { user } = useAdminSession();
  const canAccess = user?.role === 'SUPER_ADMIN';

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [actorRoleGroup, setActorRoleGroup] = useState<ActorRoleGroup>('admin');
  const [filters, setFilters] = useState(EMPTY_AUDIT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { rows, loading, pages, total, rangeFrom, rangeTo, refresh } = useAuditLogs(
    canAccess,
    filters,
    page,
    limit,
    actorRoleGroup,
  );

  if (!canAccess) {
    return <AuditAccessDenied />;
  }

  const activeFilterCount = countActiveFilters(filters);

  return (
    <main className="w-full min-w-0 space-y-2">
      <AuditHeader
        total={total}
        page={page}
        pages={pages}
        loading={loading}
        onRefresh={() => void refresh()}
      />

      <AuditActorTabs
        value={actorRoleGroup}
        onChange={(group) => {
          setActorRoleGroup(group);
          setPage(1);
        }}
      />

      <AuditFilters
        filters={filters}
        open={filtersOpen}
        activeCount={activeFilterCount}
        onOpenChange={setFiltersOpen}
        onChange={(patch) => {
          setPage(1);
          setFilters((prev) => ({ ...prev, ...patch }));
        }}
        onClear={() => {
          setPage(1);
          setFilters(EMPTY_AUDIT_FILTERS);
        }}
      />

      <AuditList rows={rows} loading={loading} actorRoleGroup={actorRoleGroup} />

      <AuditPagination
        page={page}
        pages={pages}
        total={total}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        limit={limit}
        loading={loading}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
        onLimitChange={(next) => {
          setLimit(next);
          setPage(1);
        }}
      />
    </main>
  );
}
