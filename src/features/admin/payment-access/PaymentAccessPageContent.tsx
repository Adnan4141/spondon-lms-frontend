'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Lock, RefreshCw, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getBranches } from '@/lib/api/branches';
import { getPrograms } from '@/lib/api/programs';
import { getCourses } from '@/lib/api/courses';
import {
  bulkBlockEnrollmentAccess,
  bulkRestoreEnrollmentAccess,
  getDueAccessCandidates,
  restoreEnrollmentAccess,
  blockEnrollmentAccess,
  type DueAccessCandidate,
  type PaymentAccessViewMode,
} from '@/lib/api/enrollments';
import { confirmAction } from '@/features/admin/shared/confirm-action';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import { AuditPagination } from '@/features/admin/audit/components/AuditPagination';
import { fmt, fmtMonth } from '@/features/admin/students/utils';
import { StudentAdminSelect as AppSelect } from '@/features/admin/students/components/StudentAdminSelect';
import { StudentMonthInput as MonthInput } from '@/features/admin/students/components/StudentMonthInput';
import { usePaymentAccessQuery } from '@/features/admin/payment-access/usePaymentAccessQuery';

const VIEW_MODES: Array<{ id: PaymentAccessViewMode; label: string; hint: string }> = [
  {
    id: 'TO_BLOCK',
    label: 'To block',
    hint: 'Due + portal access still ON — ready to block',
  },
  {
    id: 'BLOCKED',
    label: 'Blocked',
    hint: 'Due + portal access OFF — restore from here',
  },
  {
    id: 'ALL_DUE',
    label: 'All due',
    hint: 'Everyone with unpaid dues (any access state)',
  },
];

function emptyStateMessage(viewMode: PaymentAccessViewMode, dueMonth: string): string {
  if (viewMode === 'TO_BLOCK') {
    return dueMonth
      ? `No enrollments with due for ${fmtMonth(dueMonth)} and active portal access. Try “Blocked” — they may already be blocked.`
      : 'No enrollments with unpaid dues and active portal access. Switch to “Blocked” to see already-blocked students.';
  }
  if (viewMode === 'BLOCKED') {
    return dueMonth
      ? `No blocked enrollments with due for ${fmtMonth(dueMonth)} under these filters.`
      : 'No blocked enrollments with unpaid dues under these filters.';
  }
  return 'No enrollments with unpaid dues match these filters.';
}

export function PaymentAccessPageContent() {
  const { user } = useAdminSession();
  const { query, updateQuery, clearFilters: clearQueryFilters } = usePaymentAccessQuery();
  const {
    viewMode,
    page,
    limit,
    branchId,
    programId,
    courseId,
    dueMonth,
    anyDueMonth,
    minDueAmount,
  } = query;

  const canManageAccess = user?.role === 'SUPER_ADMIN' || user?.role === 'BRANCH_ADMIN';
  const [minDueInput, setMinDueInput] = useState(minDueAmount);
  const [debouncedMinDue, setDebouncedMinDue] = useState(minDueAmount);
  const [reason, setReason] = useState('Due payment — portal access blocked by admin');
  const [rows, setRows] = useState<DueAccessCandidate[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [busy, setBusy] = useState<'preview-block' | 'block' | 'preview-restore' | 'restore' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string; programId: string }[]>([]);
  const minDueSyncedRef = useRef(minDueAmount);
  const updateQueryRef = useRef(updateQuery);
  updateQueryRef.current = updateQuery;

  useEffect(() => {
    if (minDueAmount === minDueSyncedRef.current) return;
    minDueSyncedRef.current = minDueAmount;
    setMinDueInput(minDueAmount);
    setDebouncedMinDue(minDueAmount);
  }, [minDueAmount]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = minDueInput.trim();
      setDebouncedMinDue(next);
      if (next !== minDueSyncedRef.current) {
        minDueSyncedRef.current = next;
        updateQueryRef.current({ minDueAmount: next });
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [minDueInput]);

  useEffect(() => {
    void Promise.all([getBranches(), getPrograms(), getCourses({ limit: 500 })]).then(
      ([branchRes, programRes, courseRes]) => {
        if (branchRes.success && branchRes.data) setBranches(branchRes.data);
        if (programRes.success && programRes.data) setPrograms(programRes.data);
        if (courseRes.success && courseRes.data) {
          setCourses(
            courseRes.data.map((c) => ({
              id: c.id,
              name: c.name,
              programId: c.programId,
            })),
          );
        }
      },
    );
  }, []);

  useEffect(() => {
    if (user?.role === 'BRANCH_ADMIN' && user.branchId && branchId !== user.branchId) {
      updateQuery({ branchId: user.branchId }, { resetPage: false });
    }
  }, [user?.branchId, user?.role, branchId, updateQuery]);

  const filteredCourses = useMemo(
    () => (programId ? courses.filter((c) => c.programId === programId) : courses),
    [courses, programId],
  );

  const effectiveDueMonth = anyDueMonth ? undefined : dueMonth || undefined;
  const totalPages = Math.max(1, Math.ceil(totalRows / limit));
  const rangeFrom = totalRows > 0 ? (page - 1) * limit + 1 : 0;
  const rangeTo = totalRows > 0 ? Math.min(page * limit, totalRows) : 0;

  const loadRows = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await getDueAccessCandidates({
        branchId: branchId || undefined,
        programId: programId || undefined,
        courseId: courseId || undefined,
        dueMonth: effectiveDueMonth,
        minDueAmount: debouncedMinDue ? Number(debouncedMinDue) : undefined,
        viewMode,
        page,
        limit,
      });
      if (!res.success) throw new Error(res.message || 'Failed to load candidates');
      setRows(res.data ?? []);
      setTotalRows(res.pagination?.total ?? res.data?.length ?? 0);
      setSelected(new Set());
    } catch (error) {
      setMessage((error as Error).message);
      setRows([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [branchId, programId, courseId, effectiveDueMonth, debouncedMinDue, viewMode, page, limit]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const clearFilters = () => {
    const lockedBranchId = user?.role === 'BRANCH_ADMIN' && user.branchId ? user.branchId : '';
    setMinDueInput('');
    setDebouncedMinDue('');
    minDueSyncedRef.current = '';
    clearQueryFilters(lockedBranchId);
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(rows.map((r) => r.id)) : new Set());
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const buildFilters = () => ({
    branchId: branchId || undefined,
    programId: programId || undefined,
    courseId: courseId || undefined,
    dueMonth: effectiveDueMonth,
    minDueAmount: debouncedMinDue ? Number(debouncedMinDue) : undefined,
    viewMode,
    enrollmentIds: selected.size > 0 ? [...selected] : undefined,
  });

  const runBulk = async (mode: 'preview-block' | 'block' | 'preview-restore' | 'restore') => {
    if (!canManageAccess) return;
    const dryRun = mode.startsWith('preview');
    const isBlock = mode.includes('block');
    const filters = {
      ...buildFilters(),
      viewMode: (isBlock ? 'TO_BLOCK' : 'BLOCKED') as PaymentAccessViewMode,
    };

    if (isBlock && (!reason.trim() || reason.trim().length < 3)) {
      setMessage('Block reason must be at least 3 characters.');
      return;
    }

    if (!dryRun) {
      const confirmed = await confirmAction({
        title: isBlock ? 'Block portal access?' : 'Restore portal access?',
        description: isBlock
          ? `This will block access for ${filters.enrollmentIds?.length ?? 'all matching'} enrollment(s).`
          : `This will restore access for ${filters.enrollmentIds?.length ?? 'all matching blocked'} enrollment(s).`,
        confirmLabel: isBlock ? 'Block access' : 'Restore access',
        variant: isBlock ? 'danger' : 'info',
      });
      if (!confirmed) return;
    }

    setBusy(mode);
    setMessage(null);
    try {
      const res = isBlock
        ? await bulkBlockEnrollmentAccess({
            ...filters,
            reason: reason.trim(),
            source: 'DUE_PAYMENT',
            dryRun,
          })
        : await bulkRestoreEnrollmentAccess({
            ...filters,
            reason: reason.trim() || 'Bulk access restore by admin',
            dryRun,
          });
      if (!res.success || !res.data) throw new Error(res.message || 'Bulk action failed');
      setMessage(res.message || `${res.data.count} enrollment(s) affected`);
      if (!dryRun) await loadRows();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const runRowAction = async (row: DueAccessCandidate, action: 'block' | 'restore') => {
    if (!canManageAccess) return;
    setRowBusy(`${action}:${row.id}`);
    try {
      if (action === 'block') {
        const res = await blockEnrollmentAccess(row.id, { reason: reason.trim(), source: 'DUE_PAYMENT' });
        if (!res.success) throw new Error(res.message || 'Failed to block');
      } else {
        const res = await restoreEnrollmentAccess(row.id, { reason: 'Access restored by admin' });
        if (!res.success) throw new Error(res.message || 'Failed to restore');
      }
      await loadRows();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setRowBusy(null);
    }
  };

  const showBlockActions = viewMode === 'TO_BLOCK' || viewMode === 'ALL_DUE';
  const showRestoreActions = viewMode === 'BLOCKED' || viewMode === 'ALL_DUE';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Payment Access Control</h1>
        <p className="mt-1 text-sm text-slate-500">
          Due invoices no longer auto-block access. Filter by due status, then block or restore portal access manually.
        </p>
        {!canManageAccess && (
          <p className="mt-2 text-sm font-semibold text-amber-700">
            Read-only view — only Branch Admin / Super Admin can block or restore access.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => updateQuery({ viewMode: mode.id })}
            className={cn(
              'rounded-xl border px-4 py-2 text-left transition-colors',
              viewMode === mode.id
                ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            <span className="block text-sm font-bold">{mode.label}</span>
            <span className="block text-[11px] text-slate-500">{mode.hint}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <Label>Branch</Label>
            <AppSelect
              value={branchId}
              onChange={(value) => updateQuery({ branchId: value })}
              options={[{ value: '', label: 'All branches' }, ...branches.map((b) => ({ value: b.id, label: b.name }))]}
              disabled={user?.role === 'BRANCH_ADMIN'}
            />
          </div>
          <div>
            <Label>Program</Label>
            <AppSelect
              value={programId}
              onChange={(value) => updateQuery({ programId: value, courseId: '' })}
              options={[{ value: '', label: 'All programs' }, ...programs.map((p) => ({ value: p.id, label: p.name }))]}
            />
          </div>
          <div>
            <Label>Course</Label>
            <AppSelect
              value={courseId}
              onChange={(value) => updateQuery({ courseId: value })}
              options={[{ value: '', label: 'All courses' }, ...filteredCourses.map((c) => ({ value: c.id, label: c.name }))]}
            />
          </div>
          <div>
            <Label>Due month</Label>
            <div className="flex gap-2">
              <MonthInput
                value={dueMonth}
                onChange={(value) => updateQuery({ dueMonth: value, anyDueMonth: false })}
                disabled={anyDueMonth}
              />
              <Button
                type="button"
                variant={anyDueMonth ? 'default' : 'outline'}
                size="sm"
                className="shrink-0"
                onClick={() => updateQuery({ anyDueMonth: !anyDueMonth })}
              >
                Any month
              </Button>
            </div>
          </div>
          <div>
            <Label>Minimum due {effectiveDueMonth ? `for ${fmtMonth(effectiveDueMonth)}` : '(total)'}</Label>
            <Input value={minDueInput} onChange={(e) => setMinDueInput(e.target.value)} placeholder="e.g. 2000" />
          </div>
          <div>
            <Label>Block reason</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} disabled={!canManageAccess} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void loadRows()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
          {showBlockActions && canManageAccess && (
            <>
              <Button variant="outline" disabled={busy !== null} onClick={() => void runBulk('preview-block')}>
                Preview block
              </Button>
              <Button
                disabled={busy !== null}
                onClick={() => void runBulk('block')}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Lock className="mr-2 h-4 w-4" />
                Block access
              </Button>
            </>
          )}
          {showRestoreActions && canManageAccess && (
            <>
              <Button variant="outline" disabled={busy !== null} onClick={() => void runBulk('preview-restore')}>
                Preview restore
              </Button>
              <Button variant="outline" disabled={busy !== null} onClick={() => void runBulk('restore')}>
                <Unlock className="mr-2 h-4 w-4" />
                Restore access
              </Button>
            </>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {totalRows > 0
            ? `Showing ${rangeFrom}–${rangeTo} of ${totalRows.toLocaleString()} matching enrollment(s) in “${VIEW_MODES.find((m) => m.id === viewMode)?.label}” view.`
            : `No matching enrollments in “${VIEW_MODES.find((m) => m.id === viewMode)?.label}” view.`}
        </p>
        {message && <p className="mt-2 text-sm font-semibold text-slate-700">{message}</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selected.size === rows.length}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
                <th className="px-4 py-3 font-bold text-slate-600">Student</th>
                <th className="px-4 py-3 font-bold text-slate-600">Program</th>
                <th className="px-4 py-3 font-bold text-slate-600">Branch</th>
                <th className="px-4 py-3 font-bold text-slate-600">Due</th>
                <th className="px-4 py-3 font-bold text-slate-600">Oldest due</th>
                <th className="px-4 py-3 font-bold text-slate-600">Access</th>
                {canManageAccess && viewMode === 'ALL_DUE' && (
                  <th className="px-4 py-3 font-bold text-slate-600">Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const regNo = (row.student as { studentProfile?: { registrationNumber?: string | null } } | undefined)
                  ?.studentProfile?.registrationNumber;
                const hasAccess = row.accessStatus === 'FULL_ACCESS' || row.accessStatus === 'LIMITED_ACCESS';
                return (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleOne(row.id)} />
                    </td>
                    <td className="px-4 py-3">
                      {regNo ? (
                        <Link
                          href={`/admin/students/${regNo}`}
                          className="font-semibold text-indigo-700 hover:underline"
                        >
                          {row.student?.fullName}
                        </Link>
                      ) : (
                        <p className="font-semibold text-slate-900">{row.student?.fullName}</p>
                      )}
                      <p className="text-xs text-slate-500">
                        {regNo || '—'} · {row.student?.mobile}
                      </p>
                    </td>
                    <td className="px-4 py-3">{row.program?.name}</td>
                    <td className="px-4 py-3">{row.branch?.name}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-rose-700">
                        {effectiveDueMonth && row.dueForMonth != null
                          ? fmt(row.dueForMonth)
                          : fmt(row.totalDue ?? 0)}
                      </p>
                      {effectiveDueMonth && (row.totalDue ?? 0) > (row.dueForMonth ?? 0) && (
                        <p className="text-[11px] text-slate-500">Total {fmt(row.totalDue ?? 0)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">{row.oldestDueMonth ? fmtMonth(row.oldestDueMonth) : '—'}</td>
                    <td className="px-4 py-3">
                      {row.accessStatus}
                      {row.accessHoldExempt ? ' · exempt' : ''}
                      {row.accessBlockedReason ? (
                        <p className="mt-0.5 text-[11px] text-slate-500">{row.accessBlockedReason}</p>
                      ) : null}
                    </td>
                    {canManageAccess && viewMode === 'ALL_DUE' && (
                      <td className="px-4 py-3">
                        {hasAccess ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={rowBusy !== null}
                            onClick={() => void runRowAction(row, 'block')}
                          >
                            Block
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={rowBusy !== null}
                            onClick={() => void runRowAction(row, 'restore')}
                          >
                            Restore
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={canManageAccess && viewMode === 'ALL_DUE' ? 8 : 7} className="px-4 py-10 text-center">
                    <p className="text-slate-500">{emptyStateMessage(viewMode, effectiveDueMonth || '')}</p>
                    {viewMode === 'TO_BLOCK' && (
                      <button
                        type="button"
                        className="mt-2 text-sm font-semibold text-indigo-600 hover:underline"
                        onClick={() => updateQuery({ viewMode: 'BLOCKED' })}
                      >
                        Switch to Blocked view
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 p-3">
          <AuditPagination
            page={page}
            pages={totalPages}
            total={totalRows}
            rangeFrom={rangeFrom}
            rangeTo={rangeTo}
            limit={limit}
            loading={loading}
            onPrev={() => updateQuery({ page: page - 1 }, { resetPage: false })}
            onNext={() => updateQuery({ page: page + 1 }, { resetPage: false })}
            onLimitChange={(nextLimit) => updateQuery({ limit: nextLimit, page: 1 }, { resetPage: false })}
          />
        </div>
      </div>
    </div>
  );
}
