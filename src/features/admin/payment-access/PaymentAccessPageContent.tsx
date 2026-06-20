'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Lock, RefreshCw, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getBranches } from '@/lib/api/branches';
import { getPrograms } from '@/lib/api/programs';
import { getCourses } from '@/lib/api/courses';
import {
  bulkBlockEnrollmentAccess,
  bulkRestoreEnrollmentAccess,
  getDueAccessCandidates,
  type DueAccessCandidate,
} from '@/lib/api/enrollments';
import { confirmAction } from '@/features/admin/shared/confirm-action';
import { useAdminSession } from '@/features/admin/shared/admin-session';
import { currentMonth, fmt, fmtMonth } from '@/features/admin/students/utils';
import { StudentAdminSelect as AppSelect } from '@/features/admin/students/components/StudentAdminSelect';
import { StudentMonthInput as MonthInput } from '@/features/admin/students/components/StudentMonthInput';

export function PaymentAccessPageContent() {
  const { user } = useAdminSession();
  const [branchId, setBranchId] = useState('');
  const [programId, setProgramId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [dueMonth, setDueMonth] = useState(currentMonth());
  const [minDueAmount, setMinDueAmount] = useState('');
  const [reason, setReason] = useState('Due payment — portal access blocked by admin');
  const [rows, setRows] = useState<DueAccessCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<'preview-block' | 'block' | 'preview-restore' | 'restore' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string; programId: string }[]>([]);

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
    if (user?.role === 'BRANCH_ADMIN' && user.branchId) {
      setBranchId(user.branchId);
    }
  }, [user?.branchId, user?.role]);

  const filteredCourses = useMemo(
    () => (programId ? courses.filter((c) => c.programId === programId) : courses),
    [courses, programId],
  );

  const loadRows = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await getDueAccessCandidates({
        branchId: branchId || undefined,
        programId: programId || undefined,
        courseId: courseId || undefined,
        dueMonth: dueMonth || undefined,
        minDueAmount: minDueAmount ? Number(minDueAmount) : undefined,
        onlyWithAccess: true,
        limit: 200,
      });
      if (!res.success) throw new Error(res.message || 'Failed to load candidates');
      setRows(res.data ?? []);
      setSelected(new Set());
    } catch (error) {
      setMessage((error as Error).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, programId, courseId, dueMonth, minDueAmount]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

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

  const runBulk = async (mode: 'preview-block' | 'block' | 'preview-restore' | 'restore') => {
    const dryRun = mode.startsWith('preview');
    const isBlock = mode.includes('block');
    const enrollmentIds = selected.size > 0 ? [...selected] : undefined;
    const filters = {
      branchId: branchId || undefined,
      programId: programId || undefined,
      courseId: courseId || undefined,
      dueMonth: dueMonth || undefined,
      minDueAmount: minDueAmount ? Number(minDueAmount) : undefined,
      enrollmentIds,
    };

    if (isBlock && (!reason.trim() || reason.trim().length < 3)) {
      setMessage('Block reason must be at least 3 characters.');
      return;
    }

    if (!dryRun) {
      const confirmed = await confirmAction({
        title: isBlock ? 'Block portal access?' : 'Restore portal access?',
        description: isBlock
          ? `This will block access for ${enrollmentIds?.length ?? 'all filtered'} enrollment(s).`
          : `This will restore access for ${enrollmentIds?.length ?? 'all filtered blocked'} enrollment(s).`,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Payment Access Control</h1>
        <p className="mt-1 text-sm text-slate-500">
          Due invoices no longer auto-block access. Filter students with unpaid dues, then block or restore portal access manually.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <Label>Branch</Label>
            <AppSelect
              value={branchId}
              onChange={setBranchId}
              options={[{ value: '', label: 'All branches' }, ...branches.map((b) => ({ value: b.id, label: b.name }))]}
              disabled={user?.role === 'BRANCH_ADMIN'}
            />
          </div>
          <div>
            <Label>Program</Label>
            <AppSelect
              value={programId}
              onChange={(value) => {
                setProgramId(value);
                setCourseId('');
              }}
              options={[{ value: '', label: 'All programs' }, ...programs.map((p) => ({ value: p.id, label: p.name }))]}
            />
          </div>
          <div>
            <Label>Course</Label>
            <AppSelect
              value={courseId}
              onChange={setCourseId}
              options={[{ value: '', label: 'All courses' }, ...filteredCourses.map((c) => ({ value: c.id, label: c.name }))]}
            />
          </div>
          <div>
            <Label>Due month</Label>
            <MonthInput value={dueMonth} onChange={setDueMonth} />
          </div>
          <div>
            <Label>Minimum total due</Label>
            <Input value={minDueAmount} onChange={(e) => setMinDueAmount(e.target.value)} placeholder="e.g. 2000" />
          </div>
          <div>
            <Label>Block reason</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void loadRows()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" disabled={busy !== null} onClick={() => void runBulk('preview-block')}>
            Preview block
          </Button>
          <Button disabled={busy !== null} onClick={() => void runBulk('block')} className="bg-amber-600 hover:bg-amber-700">
            <Lock className="mr-2 h-4 w-4" />
            Block access
          </Button>
          <Button variant="outline" disabled={busy !== null} onClick={() => void runBulk('preview-restore')}>
            Preview restore
          </Button>
          <Button variant="outline" disabled={busy !== null} onClick={() => void runBulk('restore')}>
            <Unlock className="mr-2 h-4 w-4" />
            Restore access
          </Button>
        </div>

        {message && <p className="mt-3 text-sm font-semibold text-slate-700">{message}</p>}
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
                <th className="px-4 py-3 font-bold text-slate-600">Oldest due month</th>
                <th className="px-4 py-3 font-bold text-slate-600">Access</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleOne(row.id)} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{row.student?.fullName}</p>
                    <p className="text-xs text-slate-500">
                      {(row.student as { studentProfile?: { registrationNumber?: string | null } } | undefined)
                        ?.studentProfile?.registrationNumber || '—'}{' '}
                      · {row.student?.mobile}
                    </p>
                  </td>
                  <td className="px-4 py-3">{row.program?.name}</td>
                  <td className="px-4 py-3">{row.branch?.name}</td>
                  <td className="px-4 py-3 font-semibold text-rose-700">{fmt(row.totalDue ?? 0)}</td>
                  <td className="px-4 py-3">{row.oldestDueMonth ? fmtMonth(row.oldestDueMonth) : '—'}</td>
                  <td className="px-4 py-3">
                    {row.accessStatus}
                    {row.accessHoldExempt ? ' · exempt' : ''}
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    No due enrollments match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
