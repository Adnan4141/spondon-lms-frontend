'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, Plus, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getBatches } from '@/lib/api/batches';
import { cancelFullEnrollment, getEnrollments } from '@/lib/api/enrollments';
import type { BranchOption, Course, Enrollment, Program, Student } from '../types';
import { avatarHue, currentMonth, fmt, fmtMonth, nextMonth, toLocalEnrollment } from '../utils';
import { StudentAdminBadge as AppBadge } from '../components/StudentAdminBadge';
import { StudentAdminField as Field } from '../components/StudentAdminField';
import { StudentAdminModal as AppModal } from '../components/StudentAdminModal';
import { StudentAdminSelect as AppSelect } from '../components/StudentAdminSelect';
import { StudentMonthInput as MonthInput } from '../components/StudentMonthInput';
import { ManageEnrollmentModal } from './ManageEnrollmentModal';

export function EnrolledCoursesView({
  student, onBack, showToast, programs, allCourses, branches,
}: {
  student: Student;
  onBack: () => void;
  showToast: (msg: string, type?: string) => void;
  programs: Program[];
  allCourses: Course[];
  branches: BranchOption[];
}) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [manageModal, setManageModal] = useState<{ enrollment: Enrollment; initialCancelCourseId?: string } | null>(null);
  const [cancelModal, setCancelModal] = useState<Enrollment | null>(null);
  const [batchesMap, setBatchesMap] = useState<Map<string, string>>(new Map());

  // Load all batches and build a lookup map
  useEffect(() => {
    const map = new Map<string, string>();
    // Load first batch of batches (this is a simple approach; for larger datasets, paginate)
    getBatches({ limit: 500 })
      .then(res => {
        if (res.success && res.data) {
          res.data.forEach(b => map.set(b.id, b.name));
        }
        setBatchesMap(map);
      })
      .catch(() => setBatchesMap(new Map()));
  }, []);

  useEffect(() => {
    getEnrollments({ studentUserId: student.id, limit: 50 }).then(res => {
      if (res.success && res.data) setEnrollments(res.data.map(toLocalEnrollment));
      setLoadingEnrollments(false);
    });
  }, [student.id]);

  const reloadEnrollments = () => {
    getEnrollments({ studentUserId: student.id, limit: 50 }).then(res => {
      if (res.success && res.data) setEnrollments(res.data.map(toLocalEnrollment));
    });
  };

  const hue = avatarHue(student.fullName);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Students
        </button>
        <span className="text-slate-400">/</span>
        <span className="text-sm font-bold text-slate-900">Enrolled Courses</span>
      </div>

      {/* Student info */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 mb-5 flex items-center gap-4 shadow-sm">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shrink-0"
          style={{ background: `hsl(${hue},55%,90%)`, color: `hsl(${hue},45%,35%)` }}
        >
          {student.fullName.charAt(0)}
        </div>
        <div>
          <p className="font-black text-lg text-slate-900">{student.fullName}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-slate-500">
              Reg: <strong className="text-rose-700 font-mono">{student.regNo}</strong>
            </span>
            <span className="text-xs text-slate-500">Mobile: {student.mobile}</span>
            <AppBadge label={student.status} color={student.status === 'ACTIVE' ? 'green' : 'red'} />
          </div>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 mb-4">
        {['Active', 'Suspended', 'Cancelled'].map((s, i) => (
          <label
            key={s}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 border rounded-lg cursor-pointer text-sm font-semibold transition-colors',
              i === 0
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
            )}
          >
            <input type="checkbox" defaultChecked={i === 0} className="accent-rose-600" />
            {s}
          </label>
        ))}
      </div>

      {/* Per-enrollment sections */}
      {loadingEnrollments && (
        <div className="bg-white border border-slate-200 rounded-2xl py-10 text-center">
          <p className="text-slate-400 text-base">Loading enrollments…</p>
        </div>
      )}
      {!loadingEnrollments && enrollments.map(enrollment => {
        const program = programs.find(p => p.id === enrollment.programId);
        const totalFee = enrollment.courses.filter(ec => ec.status === 'ACTIVE').reduce((s, ec) => {
          const c = allCourses.find(x => x.id === ec.courseId);
          return s + (c?.fee || 0);
        }, 0);
        const netFee = totalFee - (enrollment.monthlyDiscount || 0);

        const canManageEnrollment = true;

        return (
          <div key={enrollment.id} className="bg-white border border-slate-200 rounded-2xl mb-5 overflow-hidden shadow-sm">
            {/* Program header */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <p className="font-black text-sm text-slate-900">{program?.name}</p>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  <AppBadge label={enrollment.billingType} color="blue" />
                  <AppBadge label={enrollment.status} color={enrollment.status === 'ACTIVE' ? 'green' : 'red'} />
                  <AppBadge
                    label={enrollment.accessStatus || 'NO_ACCESS'}
                    color={enrollment.accessStatus === 'FULL_ACCESS' ? 'green' : 'amber'}
                  />
                  {enrollment.source && <AppBadge label={enrollment.source} color="slate" />}
                  <span className="text-xs text-slate-500">From: {fmtMonth(enrollment.billingStartMonth)}</span>
                  <span className="text-xs text-slate-500">
                    Discount: <strong className="text-rose-600">{fmt(enrollment.monthlyDiscount)}/mo</strong>
                  </span>
                  <span className="text-xs text-slate-500">
                    Net: <strong className="text-emerald-600">{fmt(netFee)}/mo</strong>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={enrollment.status === 'CANCELLED'}
                  onClick={() => setCancelModal(enrollment)}
                  className="gap-1.5 border-rose-200 bg-white text-rose-600 hover:bg-rose-50 shrink-0"
                >
                  <XCircle className="h-3.5 w-3.5" /> Cancel Enrollment
                </Button>
                <Button
                  size="sm"
                  disabled={!canManageEnrollment}
                  onClick={() => canManageEnrollment && setManageModal({ enrollment })}
                  className={cn(
                    'gap-1.5 bg-slate-900 text-white hover:bg-indigo-600 transition-all shrink-0',
                    !canManageEnrollment && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <Plus className="h-3.5 w-3.5" /> Manage Enrollment
                </Button>
              </div>
            </div>

            {enrollment.status !== 'ACTIVE' && (
              <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100">
                <p className="text-xs font-semibold text-amber-800">
                  This enrollment is {enrollment.status.replace('_', ' ').toLowerCase()}; admin can still manage courses, but payment/access state follows invoice rules.
                </p>
              </div>
            )}

            {/* Courses table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    {['Course', 'Enrolled at', 'Program', 'Branch', 'Batch', 'Course Type', 'Books', 'Status', ''].map(h => (
                      <th
                        key={h}
                        className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrollment.courses.map((ec) => {
                    const course = allCourses.find(c => c.id === ec.courseId);
                    if (!course) return null;
                    return (
                      <tr key={ec.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-3.5 py-3">
                          <p className="font-bold text-sm text-slate-900">{course.name}</p>
                          <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{fmt(course.fee)}/mo</p>
                        </td>
                        <td className="px-3.5 py-3 text-xs text-slate-400 whitespace-nowrap">
                          {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-3.5 py-3">
                          <p className="text-xs text-slate-600 font-medium">{program?.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{enrollment.billingType}</p>
                        </td>
                        <td className="px-3.5 py-3 text-xs text-slate-600">
                          {branches.find(b => b.id === enrollment.branchId)?.name ?? enrollment.branchId}
                        </td>
                        <td className="px-3.5 py-3">
                          {ec.batchId
                            ? <AppBadge label={batchesMap.get(ec.batchId) ?? ec.batchId} color="slate" />
                            : <span className="text-xs text-slate-400">—</span>
                          }
                        </td>
                        <td className="px-3.5 py-3">
                          <AppBadge label={course.type.toLowerCase()} color={course.type === 'OFFLINE' ? 'amber' : 'blue'} />
                        </td>
                        <td className="px-3.5 py-3">
                          <AppBadge label={ec.includeBook ? 'Yes' : 'No'} color={ec.includeBook ? 'green' : 'slate'} />
                        </td>
                        <td className="px-3.5 py-3">
                          <AppBadge label={ec.status || 'Active'} color={ec.status === 'ACTIVE' ? 'green' : 'red'} />
                        </td>
                        <td className="px-3.5 py-3">
                          {canManageEnrollment && ec.status === 'ACTIVE' && (
                            <button
                              onClick={() => setManageModal({ enrollment, initialCancelCourseId: ec.courseId })}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                {enrollment.courses.filter(ec => ec.status === 'ACTIVE').length} active courses
              </span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-600">Total fee: <strong>{fmt(totalFee)}/mo</strong></span>
                <span className="text-xs text-slate-600">
                  Discount: <strong className="text-rose-600">−{fmt(enrollment.monthlyDiscount)}/mo</strong>
                </span>
                <span className="text-sm font-black text-emerald-600">Net: {fmt(netFee)}/mo</span>
              </div>
            </div>
          </div>
        );
      })}

      {!loadingEnrollments && enrollments.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl py-10 text-center">
          <p className="text-slate-400 text-base">No enrollments found for this student.</p>
        </div>
      )}

      {manageModal && (
        <ManageEnrollmentModal
          enrollment={manageModal.enrollment}
          allCourses={allCourses}
          programs={programs}
          studentUserId={student.id}
          initialCancelCourseId={manageModal.initialCancelCourseId}
          onClose={() => setManageModal(null)}
          onDone={(summary) => {
            const hasBoth = summary.added > 0 && summary.removed > 0;
            const message = summary.failed > 0
              ? `Enrollment updated with ${summary.failed} failed operation(s).`
              : hasBoth
                ? `Enrollment updated: ${summary.added} added, ${summary.removed} cancelled.`
                : summary.added > 0
                  ? `${summary.added} course(s) added and invoices regenerated!`
                  : `${summary.removed} course(s) cancelled. Invoices updated from ${fmtMonth(nextMonth())}.`;
            showToast(message, summary.failed > 0 ? 'error' : 'success');
            getEnrollments({ studentUserId: student.id, limit: 50 }).then(res => {
              if (res.success && res.data) setEnrollments(res.data.map(toLocalEnrollment));
            });
          }}
        />
      )}
      {cancelModal && (
        <FullEnrollmentCancelModal
          enrollment={cancelModal}
          programName={programs.find((p) => p.id === cancelModal.programId)?.name ?? ''}
          onClose={() => setCancelModal(null)}
          onDone={(message) => {
            showToast(message, 'success');
            setCancelModal(null);
            reloadEnrollments();
          }}
        />
      )}
    </div>
  );
}

function FullEnrollmentCancelModal({
  enrollment,
  programName,
  onClose,
  onDone,
}: {
  enrollment: Enrollment;
  programName: string;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [effectiveMonth, setEffectiveMonth] = useState(() => currentMonth());
  const [cancellationPolicy, setCancellationPolicy] = useState<'FULL_REMOVE' | 'PRORATE_CURRENT' | 'CANCEL_FROM_NEXT_MONTH'>('FULL_REMOVE');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Cancellation reason is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await cancelFullEnrollment(enrollment.id, {
        reason: reason.trim(),
        effectiveMonth,
        cancellationPolicy,
      });
      if (!res.success) {
        setError((res as { message?: string }).message ?? 'Failed to cancel enrollment');
        return;
      }
      onDone(`Enrollment cancellation ${cancellationPolicy === 'CANCEL_FROM_NEXT_MONTH' ? 'scheduled' : 'completed'} from ${fmtMonth(res.data?.effectiveMonth || effectiveMonth)}.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open
      onClose={saving ? () => undefined : onClose}
      title="Cancel Full Enrollment"
      subtitle={programName}
      maxWidth="max-w-xl"
    >
      <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-5 flex gap-2.5">
        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
        <p className="text-sm text-rose-800 font-semibold">
          This cancels all active courses in the enrollment. Paid invoices stay unchanged and adjustment settlements are created when needed.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Effective From Month">
          <MonthInput
            value={effectiveMonth}
            onChange={setEffectiveMonth}
            disabled={cancellationPolicy === 'CANCEL_FROM_NEXT_MONTH'}
          />
        </Field>
        <Field label="Cancellation Policy">
          <AppSelect
            value={cancellationPolicy}
            onChange={(value) => {
              const next = value as typeof cancellationPolicy;
              setCancellationPolicy(next);
              if (next === 'CANCEL_FROM_NEXT_MONTH') setEffectiveMonth(nextMonth());
            }}
            options={[
              { value: 'FULL_REMOVE', label: 'Full remove' },
              { value: 'PRORATE_CURRENT', label: 'Prorate current' },
              { value: 'CANCEL_FROM_NEXT_MONTH', label: 'Cancel next month' },
            ]}
          />
        </Field>
      </div>

      <Field label="Reason" required>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          placeholder="Write the reason for cancellation"
        />
      </Field>

      {error && <p className="text-sm text-rose-600 font-semibold mb-3">{error}</p>}

      <div className="flex justify-end gap-2.5">
        <Button variant="outline" onClick={onClose} disabled={saving}>Keep Enrollment</Button>
        <Button
          onClick={handleSubmit}
          disabled={saving || !reason.trim()}
          className="bg-rose-600 text-white hover:bg-rose-700"
        >
          {saving ? 'Cancelling...' : 'Confirm Cancellation'}
        </Button>
      </div>
    </AppModal>
  );
}
