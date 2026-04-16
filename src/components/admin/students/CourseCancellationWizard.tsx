'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Ban, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { deleteEnrollment, removeCourseFromEnrollment, type Enrollment, type EnrollmentCourse } from '@/lib/api/enrollments';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface Props {
  studentId: string;
  studentName: string;
  studentReg?: string;
  branchName?: string;
  enrollments: Enrollment[];
  onSuccess: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function money(n: unknown): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return '৳' + x.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function Row({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between border-b border-slate-100 py-2 last:border-b-0', className)}>
      <span className="text-[13px] text-slate-500">{label}</span>
      <span className="text-[13px] font-medium text-slate-900">{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export function CourseCancellationWizard({
  studentId,
  studentName,
  studentReg,
  branchName,
  enrollments,
  onSuccess,
}: Props) {
  const { toast } = useToast();

  /* step: 1 | 2 | 'done' */
  const [step, setStep] = useState<1 | 2 | 'done'>(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const [cancelReason, setCancelReason] = useState('');
  const [cancelNotes, setCancelNotes] = useState('');

  /* sms / invoice options */
  const [sendSms, setSendSms] = useState(true);
  const [genInvoice, setGenInvoice] = useState(false);

  /* results */
  const [cancelledNames, setCancelledNames] = useState<string[]>([]);
  const [activeNames, setActiveNames] = useState<string[]>([]);

  /* ---------- derived data ---------- */
  const activeEnrollments = useMemo(
    () => enrollments.filter((e) => String(e.status).toUpperCase() === 'ACTIVE'),
    [enrollments],
  );

  // Flatten all enrollmentCourses across active enrollments
  const allEnrollmentCourses = useMemo(() => {
    const items: (EnrollmentCourse & { enrollmentId: string; billingType?: string })[] = [];
    for (const e of activeEnrollments) {
      for (const ec of (e.enrollmentCourses || [])) {
        items.push({ ...ec, enrollmentId: e.id, billingType: e.billingType });
      }
    }
    return items;
  }, [activeEnrollments]);

  const selectedCourses = useMemo(
    () => allEnrollmentCourses.filter((ec) => selected.has(ec.id)),
    [allEnrollmentCourses, selected],
  );

  const remainingCourses = useMemo(
    () => allEnrollmentCourses.filter((ec) => !selected.has(ec.id)),
    [allEnrollmentCourses, selected],
  );

  const cancelledMonthlyFee = useMemo(
    () =>
      selectedCourses
        .filter((ec) => ec.billingType === 'MONTHLY')
        .reduce((s, ec) => s + Number(ec.course?.fee || 0), 0),
    [selectedCourses],
  );

  const cancelledOnetimeFee = useMemo(
    () =>
      selectedCourses
        .filter((ec) => ec.billingType !== 'MONTHLY')
        .reduce((s, ec) => s + Number(ec.course?.fee || 0), 0),
    [selectedCourses],
  );

  const remainingMonthlyCourses = useMemo(
    () => remainingCourses.filter((ec) => ec.billingType === 'MONTHLY'),
    [remainingCourses],
  );

  const remainingMonthlyFee = useMemo(
    () => remainingMonthlyCourses.reduce((s, ec) => s + Number(ec.course?.fee || 0), 0),
    [remainingMonthlyCourses],
  );

  const hasMonthlyCancel = useMemo(
    () => selectedCourses.some((ec) => ec.billingType === 'MONTHLY'),
    [selectedCourses],
  );

  /* ---------- toggle course ---------- */
  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ---------- confirm ---------- */
  const handleConfirm = async () => {
    setBusy(true);
    try {
      /* 1. Group selected courses by enrollmentId */
      const byEnrollment = new Map<string, string[]>();
      for (const ec of selectedCourses) {
        const list = byEnrollment.get(ec.enrollmentId) || [];
        list.push(ec.courseId);
        byEnrollment.set(ec.enrollmentId, list);
      }

      /* For each enrollment, check if all courses are being removed */
      for (const [enrollmentId, courseIds] of byEnrollment.entries()) {
        const enrollment = activeEnrollments.find(e => e.id === enrollmentId);
        const totalCourses = enrollment?.enrollmentCourses?.length || 0;
        if (courseIds.length >= totalCourses) {
          // All courses removed — delete the whole enrollment
          await deleteEnrollment(enrollmentId);
        } else {
          // Remove individual courses
          for (const courseId of courseIds) {
            await removeCourseFromEnrollment(enrollmentId, courseId);
          }
        }
      }

      setCancelledNames(selectedCourses.map((ec) => ec.course?.name || ec.courseId));
      setActiveNames(remainingCourses.map((ec) => ec.course?.name || ec.courseId));
      setStep('done');
      toast({ title: 'Cancellation complete', description: `${selectedCourses.length} course(s) cancelled`, variant: 'success' });
      onSuccess();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  /* ---------- step header ---------- */
  const stepLabels = ['Select courses', 'Confirm'];

  return (
    <div className="space-y-5 text-slate-900">
      {/* Steps indicator */}
      {step !== 'done' && (
        <div className="flex border-b border-slate-200">
          {stepLabels.map((label, i) => {
            const n = i + 1;
            const isActive = step === n;
            const isDone = typeof step === 'number' && n < step;
            return (
              <div
                key={label}
                className={cn(
                  'flex-1 py-2.5 text-center text-xs font-medium transition-colors',
                  isActive && 'border-b-2 border-slate-900 text-slate-900 font-semibold',
                  isDone && 'border-b-2 border-emerald-500 text-slate-400',
                  !isActive && !isDone && 'text-slate-400',
                )}
              >
                {n}. {label}
              </div>
            );
          })}
        </div>
      )}

      {/* ===================== STEP 1 ===================== */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Student card */}
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">Student</p>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
                {studentName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-[15px] font-medium text-slate-900">{studentName}</p>
                <p className="text-[12px] text-slate-500">
                  {studentReg ? `Reg. ${studentReg}` : 'No reg.'}
                  {branchName ? ` · ${branchName}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* course list */}
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Enrolled courses — select to cancel
            </p>
            <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
              {allEnrollmentCourses.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">No active enrollments</p>
              ) : (
                allEnrollmentCourses.map((ec) => (
                  <label
                    key={ec.id}
                    className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50/50 transition-colors"
                  >
                    <div>
                      <p className="text-[14px] font-medium text-slate-900">{ec.course?.name || ec.courseId}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-md px-2 py-0 text-[10px] font-medium',
                            ec.course?.type === 'OFFLINE'
                              ? 'border-violet-200 bg-violet-50 text-violet-700'
                              : 'border-sky-200 bg-sky-50 text-sky-700',
                          )}
                        >
                          {ec.course?.type === 'OFFLINE' ? 'offline' : 'online'}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-md px-2 py-0 text-[10px] font-medium',
                            ec.billingType === 'MONTHLY'
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700',
                          )}
                        >
                          {ec.billingType === 'MONTHLY'
                            ? `monthly · ${money(ec.course?.fee)}`
                            : `one-time · ${money(ec.course?.fee)}`}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-slate-500">Cancel</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-slate-900 cursor-pointer"
                        checked={selected.has(ec.id)}
                        onChange={() => toggle(ec.id)}
                      />
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* monthly cancel warning */}
          {hasMonthlyCancel && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
              Cancelling a monthly course — the enrollment discount may need manual adjustment afterward.
            </div>
          )}

          {/* impact preview */}
          {selected.size > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">Impact preview</p>
              <Row label="Courses cancelled">
                <span className="font-medium text-rose-600">
                  {selected.size} course{selected.size > 1 ? 's' : ''}
                </span>
              </Row>
              <Row label="Monthly fee removed">
                <span className="text-rose-600">{cancelledMonthlyFee > 0 ? `−${money(cancelledMonthlyFee)}/mo` : money(0)}</span>
              </Row>
              <Row label="One-time fee removed">
                <span className="text-rose-600">
                  {cancelledOnetimeFee > 0 ? `−${money(cancelledOnetimeFee)} (one-time)` : money(0)}
                </span>
              </Row>
            </div>
          )}

          {/* Cancellation reason */}
          {selected.size > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">Cancellation reason</p>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 space-y-2">
                <Select value={cancelReason} onValueChange={setCancelReason}>
                  <SelectTrigger className="h-10 rounded-lg text-[13px]">
                    <SelectValue placeholder="Select reason…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="Student request — personal">Student request — personal</SelectItem>
                    <SelectItem value="Financial difficulty">Financial difficulty</SelectItem>
                    <SelectItem value="Switched program">Switched program</SelectItem>
                    <SelectItem value="Relocated">Relocated</SelectItem>
                    <SelectItem value="Admin correction">Admin correction</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <textarea
                  placeholder="Additional notes (optional)…"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 min-h-16 resize-y"
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* nav */}
          <div className="flex justify-end">
            <Button
              className="rounded-lg bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800"
              disabled={selected.size === 0}
              onClick={() => setStep(2)}
            >
              Next: confirm
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ===================== STEP 2 (Confirm) ===================== */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            Review carefully. Cancellation is not reversible without admin override.
          </div>

          {/* courses being cancelled */}
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Courses being cancelled
            </p>
            <div className="rounded-xl border border-rose-200 bg-white divide-y divide-slate-100">
              {selectedCourses.map((ec) => (
                <div key={ec.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-[14px] font-medium text-slate-900">{ec.course?.name || ec.courseId}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-md px-2 py-0 text-[10px] font-medium',
                          ec.course?.type === 'OFFLINE'
                            ? 'border-violet-200 bg-violet-50 text-violet-700'
                            : 'border-sky-200 bg-sky-50 text-sky-700',
                        )}
                      >
                        {ec.course?.type === 'OFFLINE' ? 'offline' : 'online'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="rounded-md px-2 py-0 text-[10px] font-medium border-slate-200 text-slate-500"
                      >
                        {ec.billingType === 'MONTHLY' ? 'monthly' : 'one-time'}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-[12px] font-medium text-rose-600">Cancelled</span>
                </div>
              ))}
            </div>
          </div>

          {/* after cancellation */}
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">After cancellation</p>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <Row label="Active courses">{remainingCourses.length} course(s)</Row>
              <Row label="Monthly fee / month">{money(remainingMonthlyFee)}/mo</Row>
            </div>
          </div>

          {/* sms / invoice options */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-1">
            <label className="flex items-center gap-2 cursor-pointer py-1 text-[13px] text-slate-900">
              <input
                type="checkbox"
                className="h-4 w-4 accent-slate-900"
                checked={sendSms}
                onChange={(e) => setSendSms(e.target.checked)}
              />
              Send SMS notification to student
            </label>
            <label className="flex items-center gap-2 cursor-pointer py-1 text-[13px] text-slate-900">
              <input
                type="checkbox"
                className="h-4 w-4 accent-slate-900"
                checked={genInvoice}
                onChange={(e) => setGenInvoice(e.target.checked)}
              />
              Generate revised invoice for this month
            </label>
          </div>

          {/* nav */}
          <div className="flex justify-between">
            <Button variant="outline" className="rounded-lg text-sm" onClick={() => setStep(1)}>
              <ChevronLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
            <Button
              className="rounded-lg border border-rose-300 bg-white px-5 text-sm font-medium text-rose-700 hover:bg-rose-50"
              disabled={busy}
              onClick={handleConfirm}
            >
              <Ban className="mr-1.5 h-4 w-4" />
              {busy ? 'Processing…' : 'Confirm cancellation'}
            </Button>
          </div>
        </div>
      )}

      {/* ===================== DONE ===================== */}
      {step === 'done' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-[14px] font-medium text-emerald-800">
            <Check className="mr-1.5 inline h-4 w-4" />
            Cancellation recorded successfully.
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">Summary</p>
            <Row label="Cancelled">{cancelledNames.join(', ')}</Row>
            <Row label="Active courses">{activeNames.join(', ') || 'None'}</Row>
            <Row label="Monthly fee / month">
              {money(remainingMonthlyFee)}/mo
            </Row>
          </div>
        </div>
      )}
    </div>
  );
}
