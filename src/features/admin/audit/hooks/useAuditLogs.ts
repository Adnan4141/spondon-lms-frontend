'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAuditLogs, type AuditRow } from '@/lib/api/audit';
import type { AuditFiltersState } from '../audit-utils';

export function useAuditLogs(
  enabled: boolean,
  filters: AuditFiltersState,
  page: number,
  limit: number,
) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [rangeFrom, setRangeFrom] = useState(0);
  const [rangeTo, setRangeTo] = useState(0);

  const query = useMemo(
    () => ({
      page,
      limit,
      actorRole: filters.actorRole.trim() || undefined,
      branchId: filters.branchId.trim() || undefined,
      actorUserId: filters.actorUserId.trim() || undefined,
      entityType: filters.entityType.trim() || undefined,
      entityId: filters.entityId.trim() || undefined,
      action: filters.action.trim() || undefined,
      search: filters.search.trim() || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    }),
    [page, limit, filters],
  );

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const response = await getAuditLogs(query);
      setRows(response.data || []);
      setPages(response.pagination?.pages || 1);
      setTotal(response.pagination?.total || 0);
      setRangeFrom(response.pagination?.from ?? 0);
      setRangeTo(response.pagination?.to ?? 0);
    } finally {
      setLoading(false);
    }
  }, [enabled, query]);

  useEffect(() => {
    void load();
  }, [load]);

  return { rows, loading, pages, total, rangeFrom, rangeTo, refresh: load };
}
