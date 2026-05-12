'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import { getAuditLogs, type AuditRow } from '@/lib/api/audit';

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function compactJson(value: unknown): string {
  if (value == null) return '-';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default function AuditHistoryPage() {
  const { user } = useAdminSession();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actorUserId, setActorUserId] = useState('');
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const canAccess = user?.role === 'SUPER_ADMIN';

  const canPrev = page > 1;
  const canNext = page < pages;

  const filterPayload = useMemo(
    () => ({
      page,
      limit: 50,
      actorUserId: actorUserId.trim() || undefined,
      entityType: entityType.trim() || undefined,
      action: action.trim() || undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    [page, actorUserId, entityType, action, from, to],
  );

  const loadData = useCallback(async () => {
    if (!canAccess) return;
    setLoading(true);
    try {
      const response = await getAuditLogs(filterPayload);
      setRows(response.data || []);
      setPages(response.pagination?.pages || 1);
      setTotal(response.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  }, [canAccess, filterPayload]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (!canAccess) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Audit history is restricted to Super Admin.
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit History</h1>
          <p className="text-sm text-slate-500">Track admin actions across login, enrollment, payment, invoice and SMS operations.</p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <section className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-3 lg:grid-cols-6">
        <Input placeholder="Actor user ID" value={actorUserId} onChange={(e) => { setPage(1); setActorUserId(e.target.value); }} />
        <Input placeholder="Entity type" value={entityType} onChange={(e) => { setPage(1); setEntityType(e.target.value); }} />
        <Input placeholder="Action" value={action} onChange={(e) => { setPage(1); setAction(e.target.value); }} />
        <Input type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} />
        <Input type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} />
        <Button
          variant="secondary"
          onClick={() => {
            setPage(1);
            setActorUserId('');
            setEntityType('');
            setAction('');
            setFrom('');
            setTo('');
          }}
        >
          Clear Filters
        </Button>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Time</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Actor</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Action</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Entity</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Old</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">New</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    {loading ? 'Loading audit logs...' : 'No audit records found for the selected filters.'}
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="px-3 py-2 whitespace-nowrap text-slate-700">{formatDateTime(row.createdAt)}</td>
                  <td className="px-3 py-2 text-slate-700">
                    <div className="font-medium">{row.actor?.fullName || row.actorUserId}</div>
                    <div className="text-xs text-slate-500">{row.actor?.role || '-'}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {row.action}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    <div>{row.entityType}</div>
                    <div className="text-xs text-slate-500">{row.entityId}</div>
                  </td>
                  <td className="max-w-xs px-3 py-2 text-xs text-slate-600"><div className="line-clamp-3">{compactJson(row.oldValue)}</div></td>
                  <td className="max-w-xs px-3 py-2 text-xs text-slate-600"><div className="line-clamp-3">{compactJson(row.newValue)}</div></td>
                  <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">{row.ip || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>Total records: {total}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!canPrev || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <span>Page {page} of {pages}</span>
          <Button variant="outline" size="sm" disabled={!canNext || loading} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </main>
  );
}
