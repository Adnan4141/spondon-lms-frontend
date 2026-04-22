'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  X,
  Check,
  Search,
  MoreVertical,
  ArrowLeft,
  AlertTriangle,
  BookOpen,
  CreditCard,
  Users,
  Pencil,
  Ban,
  Eye,
  Trash2,
  ArrowLeftRight,
  Tag,
  Info,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { getPrograms } from '@/lib/api/programs';
import { getCourses } from '@/lib/api/courses';
import { getBatches } from '@/lib/api/batches';
import { getBranches } from '@/lib/api/branches';
import { getUsers, createUser } from '@/lib/api/users';
import {
  getEnrollments,
  offlineAdmission,
  updateEnrollment,
  addCourseToEnrollment,
  removeCourseFromEnrollment,
  type Enrollment as ApiEnrollment,
  type OfflineAdmissionDto,
} from '@/lib/api/enrollments';
import { getInvoices, getInvoicePdfUrl, processMonthPayment } from '@/lib/api/invoices';
import { API_ORIGIN } from '@/lib/api';

function normPdfUrl(raw: string): string {
  return raw.startsWith('http') ? raw : `${API_ORIGIN}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Program {
  id: string;
  name: string;
  paymentCircle: 'MONTHLY' | 'ONE_TIME';
  admissionFeeEnabled: boolean;
  admissionFeeAmount: number;
}

interface Course {
  id: string;
  programId: string;
  name: string;
  fee: number;
  type: 'OFFLINE' | 'ONLINE';
  startMonth: string;
  endMonth: string;
  batches: { id: string; name: string }[];
}

interface Student {
  id: string;
  regNo: string;
  fullName: string;
  mobile: string;
  email: string | null;
  status: 'ACTIVE' | 'BLOCKED';
  branchId: string;
  createdAt: string;
  _count?: { enrollments?: number };
}

interface EnrolledCourse {
  id: string;
  courseId: string;
  batchId: string | null;
  status: 'ACTIVE' | 'CANCELLED';
  startMonth: string;
  endMonth: string;
  includeBook: boolean;
}

interface Enrollment {
  id: string;
  programId: string;
  branchId: string;
  status: 'ACTIVE' | 'CANCELLED';
  billingType: 'MONTHLY' | 'ONE_TIME';
  monthlyDiscount: number;
  billingStartMonth: string;
  courses: EnrolledCourse[];
}

interface Invoice {
  id: string;
  month: string;
  amount: number;
  paidAmount: number;
  status: 'PAID' | 'DUE';
  dueDate: string;
  branchName?: string;
  items?: { title: string; unitPrice: number; qty: number }[];
}

interface CourseWithDiscount extends Course {
  discount: number;
}

interface SelCourseState {
  checked: boolean;
  batch?: string;
  startMonth?: string;
}

// ─── UTILS ────────────────────────────────────────────────────────────────────

const fmt = (n: number | string) => '৳' + Number(n || 0).toLocaleString('en-BD');
const nextMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 7);
};
const fmtMonth = (m: string) => {
  if (!m) return '—';
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1).toLocaleString('en', { month: 'short', year: 'numeric' });
};

function toLocalEnrollment(e: ApiEnrollment): Enrollment {
  return {
    id: e.id,
    programId: e.programId,
    branchId: e.branchId,
    status: (['ACTIVE', 'WAITLISTED'].includes(e.status as string) ? 'ACTIVE' : 'CANCELLED') as 'ACTIVE' | 'CANCELLED',
    billingType: (e.billingType ?? 'MONTHLY') as 'MONTHLY' | 'ONE_TIME',
    monthlyDiscount: Number(e.monthlyDiscount ?? 0),
    billingStartMonth: e.billingStartMonth ?? '',
    courses: (e.enrollmentCourses ?? []).map(ec => ({
      id: ec.id,
      courseId: ec.courseId,
      batchId: ec.batchId ?? null,
      status: 'ACTIVE' as const,
      startMonth: '',
      endMonth: '',
      includeBook: ec.includeBook,
    })),
  };
}

function distributeDiscount(courses: Course[], total: number): CourseWithDiscount[] {
  const sum = courses.reduce((s, c) => s + c.fee, 0);
  if (!sum || !total) return courses.map(c => ({ ...c, discount: 0 }));
  let rem = Math.round(total);
  return courses.map((c, i) => {
    if (i === courses.length - 1) return { ...c, discount: rem };
    const d = Math.floor((c.fee / sum) * total);
    rem -= d;
    return { ...c, discount: d };
  });
}

// ─── SHARED BADGE ─────────────────────────────────────────────────────────────

type BadgeColor = 'green' | 'red' | 'amber' | 'blue' | 'slate' | 'orange';

function AppBadge({ label, color = 'slate' }: { label: string; color?: BadgeColor }) {
  const styles: Record<BadgeColor, string> = {
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-indigo-50 text-indigo-700',
    slate: 'bg-slate-100 text-slate-600',
    orange: 'bg-orange-50 text-orange-700',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap', styles[color])}>
      {label}
    </span>
  );
}

// ─── FORM FIELD ───────────────────────────────────────────────────────────────

function Field({
  label, required, hint, error, children,
}: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="mb-3.5">
      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-rose-600 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{error}</p>}
    </div>
  );
}

// ─── SHADCN SELECT WRAPPER ────────────────────────────────────────────────────

function AppSelect({
  value, onChange, options, placeholder, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full h-9 text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 bg-white">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── MONTH INPUT ──────────────────────────────────────────────────────────────

function MonthInput({
  value, onChange, min, max, disabled,
}: {
  value: string; onChange?: (v: string) => void; min?: string; max?: string; disabled?: boolean;
}) {
  return (
    <Input
      type="month"
      value={value}
      onChange={e => onChange?.(e.target.value)}
      min={min}
      max={max}
      disabled={disabled}
      className={cn('w-full text-sm', disabled ? 'cursor-not-allowed' : 'focus-visible:ring-indigo-400')}
    />
  );
}

// ─── MODAL WRAPPER ─────────────────────────────────────────────────────────────

function AppModal({
  open, onClose, title, subtitle, children, maxWidth = 'max-w-5xl',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  // DialogContent base has `sm:max-w-lg` which twMerge does NOT remove when
  // we only pass a bare `max-w-*`. We must supply the same sm:-prefixed variant
  // so twMerge resolves the conflict at every breakpoint level.
  const smMaxWidth = `sm:${maxWidth}`;
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn('p-0 gap-0 max-h-[92vh] w-[95vw] flex flex-col overflow-hidden', maxWidth, smMaxWidth)}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{subtitle || `${title} dialog`}</DialogDescription>
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-base font-black text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="bg-red-100 hover:bg-red-200 text-red-700 rounded-lg p-1.5 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 bg-white">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

// ─── DISCOUNT ADJUSTMENT PANEL ─────────────────────────────────────────────────

interface DiscountAdjustmentPanelProps {
  courses: Course[];
  currentDiscount: number;
  triggerType: 'ADD' | 'REMOVE';
  changedCourse: Course;
  effectiveMonth: string;
  onApply: (discount: number, distribution: CourseWithDiscount[]) => void;
  onBack: () => void;
}

function DiscountAdjustmentPanel({
  courses, currentDiscount, triggerType, changedCourse, effectiveMonth, onApply, onBack,
}: DiscountAdjustmentPanelProps) {
  const [mode, setMode] = useState<'keep' | 'adjust'>('keep');
  const [newDiscount, setNewDiscount] = useState(String(currentDiscount));

  const isRemove = triggerType === 'REMOVE';
  const totalFee = courses.reduce((s, c) => s + c.fee, 0);
  const appliedDiscount = mode === 'keep' ? currentDiscount : (Number(newDiscount) || 0);
  const distributed = distributeDiscount(courses, Math.min(appliedDiscount, totalFee));
  const netMonthly = totalFee - appliedDiscount;
  const discountExceedsTotal = appliedDiscount > totalFee;

  return (
    <div>
      {/* Alert banner */}
      <div className={cn(
        'rounded-xl border px-4 py-3 mb-5 flex gap-3 items-start',
        isRemove ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50 border-emerald-200',
      )}>
        {isRemove
          ? <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          : <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        }
        <div>
          <p className={cn('font-bold text-sm', isRemove ? 'text-orange-800' : 'text-emerald-800')}>
            {isRemove
              ? `You removed ${changedCourse.name} (${fmt(changedCourse.fee)}/month)`
              : `You added ${changedCourse.name} (${fmt(changedCourse.fee)}/month)`
            }
          </p>
          <p className={cn('text-xs mt-0.5', isRemove ? 'text-orange-600' : 'text-emerald-600')}>
            Your monthly discount distribution will change. Please review and confirm below.
          </p>
        </div>
      </div>

      {/* Remaining courses */}
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
        {isRemove ? 'Remaining courses after cancellation' : 'Courses after addition'}
      </p>
      <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
        {courses.map((c, i) => (
          <div
            key={c.id}
            className={cn(
              'flex justify-between items-center px-3.5 py-2.5',
              i < courses.length - 1 && 'border-b border-slate-100',
              !isRemove && c.id === changedCourse.id ? 'bg-emerald-50' : 'bg-white',
            )}
          >
            <div className="flex items-center gap-2">
              {!isRemove && c.id === changedCourse.id && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800">NEW</span>
              )}
              <span className="font-semibold text-sm text-slate-900">{c.name}</span>
              <AppBadge label={c.type} color={c.type === 'OFFLINE' ? 'amber' : 'blue'} />
            </div>
            <span className="font-bold text-rose-600 text-sm">{fmt(c.fee)}/mo</span>
          </div>
        ))}
        <div className="flex justify-between items-center px-3.5 py-2.5 bg-slate-50 border-t-2 border-slate-200">
          <span className="font-bold text-slate-900 text-sm">Total Fee</span>
          <span className="font-black text-slate-900 text-sm">{fmt(totalFee)}/mo</span>
        </div>
      </div>

      {/* Mode selector */}
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Discount Adjustment</p>
      <div className="flex flex-col gap-2 mb-4">
        {[
          { id: 'keep' as const, label: 'Keep same discount amount', desc: `৳${Number(currentDiscount).toLocaleString()} redistributed proportionally across new courses` },
          { id: 'adjust' as const, label: 'Adjust discount', desc: 'Enter a new monthly discount amount' },
        ].map(opt => (
          <label
            key={opt.id}
            className={cn(
              'flex gap-3 px-4 py-3 border rounded-xl cursor-pointer transition-colors',
              mode === opt.id
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-slate-200 bg-white hover:bg-slate-50',
            )}
          >
            <input
              type="radio"
              checked={mode === opt.id}
              onChange={() => setMode(opt.id)}
              className="accent-indigo-600 mt-0.5 shrink-0"
            />
            <div>
              <p className="font-bold text-sm text-slate-900">{opt.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {mode === 'adjust' && (
        <Field label="New Monthly Discount" hint={`Maximum: ${fmt(totalFee)}`} error={discountExceedsTotal ? 'Discount cannot exceed total fee' : ''}>
          <Input
            type="number"
            value={newDiscount}
            onChange={e => setNewDiscount(e.target.value)}
            min={0}
            max={totalFee}
            className="focus-visible:ring-indigo-400"
          />
        </Field>
      )}

      {/* Live preview */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Distribution Preview</p>
          <span className="text-[11px] px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 font-bold">
            Effective from: {fmtMonth(effectiveMonth)}
          </span>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200">
              {['Course', 'Fee', 'Discount', 'Net Fee'].map(h => (
                <th
                  key={h}
                  className={cn(
                    'py-2 px-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wide',
                    h === 'Course' ? 'text-left' : 'text-right',
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {distributed.map(c => (
              <tr key={c.id} className="border-b border-slate-100">
                <td className="py-2 px-2.5 font-semibold text-slate-900">{c.name}</td>
                <td className="py-2 px-2.5 text-right text-slate-600">{fmt(c.fee)}</td>
                <td className="py-2 px-2.5 text-right text-rose-500 font-semibold">
                  {c.discount > 0 ? `−${fmt(c.discount)}` : '—'}
                </td>
                <td className="py-2 px-2.5 text-right font-bold text-slate-900">{fmt(c.fee - c.discount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-rose-200 bg-rose-50">
              <td className="py-2.5 px-2.5 font-black text-slate-900">Total Monthly</td>
              <td className="py-2.5 px-2.5 text-right font-bold">{fmt(totalFee)}</td>
              <td className="py-2.5 px-2.5 text-right font-bold text-rose-500">
                {appliedDiscount > 0 ? `−${fmt(Math.min(appliedDiscount, totalFee))}` : '—'}
              </td>
              <td className="py-2.5 px-2.5 text-right font-black text-rose-700 text-base">
                {fmt(Math.max(0, netMonthly))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Go Back
        </Button>
        <Button
          onClick={() => !discountExceedsTotal && onApply(appliedDiscount, distributed)}
          disabled={discountExceedsTotal}
          className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
        >
          <Check className="h-4 w-4" /> Apply & Generate Updated Invoices
        </Button>
      </div>
    </div>
  );
}

// ─── SUCCESS SUMMARY ──────────────────────────────────────────────────────────

function SuccessSummary({
  action, courseName, effectiveMonth, netMonthly, newDiscount, pdfUrl, onClose,
}: {
  action: 'ADD' | 'REMOVE';
  courseName: string;
  effectiveMonth: string;
  netMonthly: number;
  newDiscount: number;
  pdfUrl?: string | null;
  onClose: () => void;
}) {
  const rows = [
    ['Action', action === 'REMOVE' ? 'Course Removed' : 'Course Added'],
    ['Course', courseName],
    ['Effective From', fmtMonth(effectiveMonth)],
    ['New Monthly Fee', fmt(netMonthly)],
    ['New Discount', fmt(newDiscount)],
    ['Past Invoices', 'Unchanged ✓'],
    ['Future Snapshots', 'Regenerated ✓'],
  ];
  return (
    <div className="text-center py-2">
      <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-4">
        <Check className="h-8 w-8 text-emerald-600" />
      </div>
      <h3 className="text-lg font-black text-slate-900 mb-1.5">Changes Applied Successfully</h3>
      <p className="text-sm text-slate-500 mb-6">
        Monthly snapshots and invoices have been regenerated from {fmtMonth(effectiveMonth)}.
      </p>
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-left mb-6">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-500">{k}</span>
            <span className="text-sm font-bold text-slate-900">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2.5 justify-center">
        {pdfUrl && (
          <Button
            variant="outline"
            onClick={() => window.open(pdfUrl, '_blank')}
            className="gap-2"
          >
            View Invoice PDF
          </Button>
        )}
        <Button
          onClick={onClose}
          className="gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all"
        >
          <Check className="h-4 w-4" /> Done
        </Button>
      </div>
    </div>
  );
}

// ─── CANCEL COURSE MODAL ──────────────────────────────────────────────────────

function CancelCourseModal({
  course, enrollment, allCourses, studentUserId, onClose, onDone,
}: {
  course: Course;
  enrollment: Enrollment;
  allCourses: Course[];
  studentUserId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<'confirm' | 'discount' | 'success'>('confirm');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [invoicePdfUrl, setInvoicePdfUrl] = useState<string | null>(null);
  const effMonth = nextMonth();

  const remainingCourses = enrollment.courses
    .filter(ec => ec.courseId !== course.id && ec.status === 'ACTIVE')
    .map(ec => allCourses.find(c => c.id === ec.courseId))
    .filter((c): c is Course => Boolean(c));

  const handleApply = async (disc: number) => {
    setSaving(true);
    try {
      const res = await removeCourseFromEnrollment(enrollment.id, course.id);
      if (!res.success) throw new Error((res as { message?: string }).message ?? 'Failed to remove course');
      if (disc !== enrollment.monthlyDiscount) {
        await updateEnrollment(enrollment.id, { monthlyDiscount: disc });
      }
      setAppliedDiscount(disc);
      // Fetch the regenerated invoice PDF for next month
      getInvoices({ studentUserId, month: effMonth, limit: 5 })
        .then(r => {
          const firstId = r.data?.[0]?.id;
          if (firstId) return getInvoicePdfUrl(firstId);
          return null;
        })
        .then(r => {
          if (r?.data?.pdfUrl) setInvoicePdfUrl(normPdfUrl(r.data.pdfUrl));
        })
        .catch(() => {});
      setStep('success');
    } catch (err: unknown) {
      alert((err as Error).message ?? 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const netMonthly = remainingCourses.reduce((s, c) => s + c.fee, 0) - appliedDiscount;

  const titles = { confirm: 'Cancel Course', discount: 'Adjust Monthly Discount', success: 'Changes Applied' };
  const subtitles = {
    confirm: `Removing ${course.name} from enrollment`,
    discount: `Effective from ${fmtMonth(effMonth)}`,
    success: '',
  };

  return (
    <AppModal open onClose={onClose} title={titles[step]} subtitle={subtitles[step]}>
      {step === 'confirm' && (
        <div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-5 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-orange-800">This action affects future months only</p>
              <p className="text-xs text-orange-600 mt-1">
                Past invoices and snapshots will remain unchanged. A settlement (CREDIT) will be created.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {[['Course', course.name], ['Fee', `${fmt(course.fee)}/month`], ['Effective From', fmtMonth(effMonth)]].map(([k, v]) => (
              <div key={k} className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{k}</p>
                <p className="font-bold text-sm text-slate-900">{v}</p>
              </div>
            ))}
          </div>
          {remainingCourses.length === 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-4 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700 font-semibold">
                This is the only active course. Cancelling it will also cancel the enrollment.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2.5">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => setStep('discount')}
              className="gap-2 bg-rose-600 text-white hover:bg-rose-700"
            >
              <Trash2 className="h-4 w-4" /> Confirm Cancellation
            </Button>
          </div>
        </div>
      )}

      {step === 'discount' && (
        <DiscountAdjustmentPanel
          courses={remainingCourses}
          currentDiscount={enrollment.monthlyDiscount}
          triggerType="REMOVE"
          changedCourse={course}
          effectiveMonth={effMonth}
          onApply={handleApply}
          onBack={saving ? () => undefined : () => setStep('confirm')}
        />
      )}

      {step === 'success' && (
        <SuccessSummary
          action="REMOVE"
          courseName={course.name}
          effectiveMonth={effMonth}
          netMonthly={netMonthly}
          newDiscount={appliedDiscount}
          pdfUrl={invoicePdfUrl}
          onClose={() => { onDone(); onClose(); }}
        />
      )}
    </AppModal>
  );
}

// ─── ADD COURSE MODAL ─────────────────────────────────────────────────────────

function AddCourseModal({
  enrollment, allCourses, programs, studentUserId, onClose, onDone,
}: {
  enrollment: Enrollment;
  allCourses: Course[];
  programs: Program[];
  studentUserId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<'select' | 'discount' | 'success'>('select');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [batch, setBatch] = useState('');
  const [startMonth, setStartMonth] = useState(nextMonth());
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [invoicePdfUrl, setInvoicePdfUrl] = useState<string | null>(null);
  const [courseBatches, setCourseBatches] = useState<{ id: string; name: string }[]>([]);
  const effMonth = nextMonth();

  useEffect(() => {
    if (!selectedCourseId) { setCourseBatches([]); return; }
    getBatches({ courseId: selectedCourseId, limit: 100 })
      .then(res => {
        if (res.success && res.data) setCourseBatches(res.data.map(b => ({ id: b.id, name: b.name })));
      })
      .catch(() => {
        setCourseBatches([]);
      });
  }, [selectedCourseId]);

  const enrolledCourseIds = enrollment.courses.filter(ec => ec.status === 'ACTIVE').map(ec => ec.courseId);
  const available = allCourses.filter(c => c.programId === enrollment.programId && !enrolledCourseIds.includes(c.id));
  const selectedCourse = allCourses.find(c => c.id === selectedCourseId);
  const activeCourses = enrollment.courses
    .filter(ec => ec.status === 'ACTIVE')
    .map(ec => allCourses.find(c => c.id === ec.courseId))
    .filter((c): c is Course => Boolean(c));
  const allCoursesAfterAdd = selectedCourse ? [...activeCourses, selectedCourse] : activeCourses;
  const canProceed = selectedCourseId && (selectedCourse?.type === 'ONLINE' || batch);
  const netMonthly = allCoursesAfterAdd.reduce((s, c) => s + c.fee, 0) - appliedDiscount;

  const program = programs.find(p => p.id === enrollment.programId);
  const titles = { select: 'Add Course to Enrollment', discount: 'Adjust Monthly Discount', success: 'Course Added' };
  const subtitles = {
    select: `Program: ${program?.name ?? ''}`,
    discount: `Effective from ${fmtMonth(effMonth)}`,
    success: '',
  };

  const handleApply = async (disc: number) => {
    if (!selectedCourseId) return;
    try {
      const res = await addCourseToEnrollment(enrollment.id, {
        courseId: selectedCourseId,
        batchId: batch || null,
        includeBook: false,
      });
      if (!res.success) throw new Error((res as { message?: string }).message ?? 'Failed to add course');
      if (disc !== enrollment.monthlyDiscount) {
        await updateEnrollment(enrollment.id, { monthlyDiscount: disc });
      }
      setAppliedDiscount(disc);
      // Fetch the regenerated invoice PDF for next month
      getInvoices({ studentUserId, month: effMonth, limit: 5 })
        .then(r => {
          const firstId = r.data?.[0]?.id;
          if (firstId) return getInvoicePdfUrl(firstId);
          return null;
        })
        .then(r => {
          if (r?.data?.pdfUrl) setInvoicePdfUrl(normPdfUrl(r.data.pdfUrl));
        })
        .catch(() => {});
      setStep('success');
    } catch (err: unknown) {
      alert((err as Error).message ?? 'Operation failed');
    }
  };

  return (
    <AppModal open onClose={onClose} title={titles[step]} subtitle={subtitles[step]}>
      {step === 'select' && (
        <div>
          <Field label="Select Course" required>
            <AppSelect
              value={selectedCourseId}
              onChange={v => { setSelectedCourseId(v); setBatch(''); }}
              placeholder="Choose a course to add"
              options={available.map(c => ({ value: c.id, label: `${c.name} — ${fmt(c.fee)}/month (${c.type})` }))}
            />
          </Field>

          {selectedCourse && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 mb-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-black text-base text-slate-900">{selectedCourse.name}</p>
                  <div className="flex gap-2 mt-1">
                    <AppBadge label={selectedCourse.type} color={selectedCourse.type === 'OFFLINE' ? 'amber' : 'blue'} />
                    <span className="text-xs text-slate-500">Monthly</span>
                  </div>
                </div>
                <span className="text-lg font-black text-rose-700">{fmt(selectedCourse.fee)}/mo</span>
              </div>
              <div className={cn(
                'grid gap-2.5',
                selectedCourse.type === 'OFFLINE' ? 'grid-cols-3' : 'grid-cols-2',
              )}>
                {selectedCourse.type === 'OFFLINE' && (
                  <Field label="Batch" required>
                    <AppSelect
                      value={batch}
                      onChange={setBatch}
                      placeholder="Select batch"
                      options={courseBatches.map(b => ({ value: b.id, label: b.name }))}
                    />
                    {!batch && <p className="text-[11px] text-rose-600 mt-1">Required for offline</p>}
                  </Field>
                )}
                <Field label="Start Month">
                  <MonthInput value={startMonth} onChange={setStartMonth} min={effMonth} max={selectedCourse.endMonth} />
                </Field>
                <Field label="End Month">
                  <MonthInput value={selectedCourse.endMonth || ''} disabled />
                </Field>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2.5">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              disabled={!canProceed}
              onClick={() => setStep('discount')}
              className="gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all"
            >
              <Plus className="h-4 w-4" /> Next: Adjust Discount
            </Button>
          </div>
        </div>
      )}

      {step === 'discount' && selectedCourse && (
        <DiscountAdjustmentPanel
          courses={allCoursesAfterAdd}
          currentDiscount={enrollment.monthlyDiscount}
          triggerType="ADD"
          changedCourse={selectedCourse}
          effectiveMonth={effMonth}
          onApply={handleApply}
          onBack={() => setStep('select')}
        />
      )}

      {step === 'success' && selectedCourse && (
        <SuccessSummary
          action="ADD"
          courseName={selectedCourse.name}
          effectiveMonth={effMonth}
          netMonthly={netMonthly}
          newDiscount={appliedDiscount}
          pdfUrl={invoicePdfUrl}
          onClose={() => { onDone(); onClose(); }}
        />
      )}
    </AppModal>
  );
}

// ─── ENROLLED COURSES VIEW ────────────────────────────────────────────────────

function EnrolledCoursesView({
  student, onBack, showToast, programs, allCourses,
}: {
  student: Student;
  onBack: () => void;
  showToast: (msg: string, type?: string) => void;
  programs: Program[];
  allCourses: Course[];
}) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [cancelModal, setCancelModal] = useState<{ course: Course; enrollment: Enrollment } | null>(null);
  const [addModal, setAddModal] = useState<Enrollment | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getEnrollments({ studentUserId: student.id, limit: 50 }).then(res => {
      if (res.success && res.data) setEnrollments(res.data.map(toLocalEnrollment));
      setLoadingEnrollments(false);
    });
  }, [student.id]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setActiveDropdown(null);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const avatarHue = student.fullName.charCodeAt(0) * 13 % 360;

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
          style={{ background: `hsl(${avatarHue},55%,90%)`, color: `hsl(${avatarHue},45%,35%)` }}
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

        return (
          <div key={enrollment.id} className="bg-white border border-slate-200 rounded-2xl mb-5 overflow-hidden shadow-sm">
            {/* Program header */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <p className="font-black text-sm text-slate-900">{program?.name}</p>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  <AppBadge label={enrollment.billingType} color="blue" />
                  <AppBadge label={enrollment.status} color={enrollment.status === 'ACTIVE' ? 'green' : 'red'} />
                  <span className="text-xs text-slate-500">From: {fmtMonth(enrollment.billingStartMonth)}</span>
                  <span className="text-xs text-slate-500">
                    Discount: <strong className="text-rose-600">{fmt(enrollment.monthlyDiscount)}/mo</strong>
                  </span>
                  <span className="text-xs text-slate-500">
                    Net: <strong className="text-emerald-600">{fmt(netFee)}/mo</strong>
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setAddModal(enrollment)}
                className="gap-1.5 bg-slate-900 text-white hover:bg-indigo-600 transition-all shrink-0"
              >
                <Plus className="h-3.5 w-3.5" /> Add Course
              </Button>
            </div>

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
                          {enrollment.branchId}
                        </td>
                        <td className="px-3.5 py-3">
                          {ec.batchId
                            ? <AppBadge label={ec.batchId} color="slate" />
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
                          <div ref={activeDropdown === ec.id ? dropRef : null} className="relative">
                            <button
                              onClick={() => setActiveDropdown(activeDropdown === ec.id ? null : ec.id)}
                              className={cn(
                                'p-1.5 rounded-md border transition-colors cursor-pointer',
                                activeDropdown === ec.id
                                  ? 'bg-slate-100 border-slate-300 text-slate-700'
                                  : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-100 hover:border-slate-200',
                              )}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {activeDropdown === ec.id && (
                              <div className="absolute right-0 top-[calc(100%+4px)] bg-white border border-slate-200 rounded-xl shadow-xl min-w-48 z-50 overflow-hidden">
                                {[
                                  { id: 'batch', icon: ArrowLeftRight, label: 'Change Batch' },
                                  { id: 'branch', icon: ArrowLeftRight, label: 'Change Branch' },
                                  { id: 'cancel', icon: Ban, label: 'Cancel This Course', danger: true },
                                ].map((a, ai) => (
                                  <button
                                    key={a.id}
                                    onClick={() => {
                                      setActiveDropdown(null);
                                      if (a.id === 'cancel') setCancelModal({ course, enrollment });
                                    }}
                                    className={cn(
                                      'w-full px-3.5 py-2.5 text-left text-sm font-semibold flex items-center gap-2.5 transition-colors cursor-pointer',
                                      ai > 0 && 'border-t border-slate-100',
                                      a.danger
                                        ? 'text-rose-600 hover:bg-rose-50'
                                        : 'text-slate-800 hover:bg-slate-50',
                                    )}
                                  >
                                    <a.icon className="h-3.5 w-3.5" /> {a.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
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

      {cancelModal && (
        <CancelCourseModal
          course={cancelModal.course}
          enrollment={cancelModal.enrollment}
          allCourses={allCourses}
          studentUserId={student.id}
          onClose={() => setCancelModal(null)}
          onDone={() => {
            showToast(`${cancelModal.course.name} cancelled. Invoices updated from ${fmtMonth(nextMonth())}.`, 'success');
            getEnrollments({ studentUserId: student.id, limit: 50 }).then(res => {
              if (res.success && res.data) setEnrollments(res.data.map(toLocalEnrollment));
            });
          }}
        />
      )}
      {addModal && (
        <AddCourseModal
          enrollment={addModal}
          allCourses={allCourses}
          programs={programs}
          studentUserId={student.id}
          onClose={() => setAddModal(null)}
          onDone={() => {
            showToast('Course added and invoices regenerated!', 'success');
            getEnrollments({ studentUserId: student.id, limit: 50 }).then(res => {
              if (res.success && res.data) setEnrollments(res.data.map(toLocalEnrollment));
            });
          }}
        />
      )}
    </div>
  );
}

// ─── ADD STUDENT MODAL ────────────────────────────────────────────────────────

function AddStudentModal({
  onClose, onSave,
}: {
  onClose: () => void;
  onSave: (student: Student) => void;
}) {
  const [form, setForm] = useState({
    fullName: '', mobile: '', email: '', fatherName: '', motherName: '',
    fatherMobile: '', gender: '', bloodGroup: '', address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Name is required';
    if (!form.mobile.trim()) e.mobile = 'Mobile is required';
    else if (!/^01[3-9]\d{8}$/.test(form.mobile.replace(/^88/, ''))) e.mobile = 'Invalid BD mobile (01XXXXXXXXX)';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const res = await createUser({
        fullName: form.fullName,
        mobile: form.mobile,
        email: form.email || undefined,
        role: 'STUDENT',
      });
      if (res.success && res.data) {
        type CreatedUser = typeof res.data & { studentProfile?: { registrationNumber?: string } };
        const u = res.data as CreatedUser;
        onSave({
          id: u.id,
          regNo: u.studentProfile?.registrationNumber ?? '—',
          fullName: u.fullName,
          mobile: u.mobile,
          email: u.email ?? null,
          status: 'ACTIVE',
          branchId: u.branchId ?? '',
          createdAt: u.createdAt ?? new Date().toISOString().slice(0, 10),
        });
      } else {
        const errMsg = (res as { message?: string }).message ?? 'Failed to create student';
        setErrors({ submit: errMsg });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal open onClose={onClose} title="Add New Student">
      <div className="grid grid-cols-2 gap-x-4">
        <div className="col-span-2">
          <Field label="Full Name" required error={errors.fullName}>
            <Input
              value={form.fullName}
              onChange={e => set('fullName')(e.target.value)}
              placeholder="Student's full name"
              className="focus-visible:ring-indigo-400"
            />
          </Field>
        </div>
        <Field label="Mobile Number" required hint="Format: 01XXXXXXXXX" error={errors.mobile}>
          <Input
            value={form.mobile}
            onChange={e => set('mobile')(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="focus-visible:ring-indigo-400"
          />
        </Field>
        <Field label="Email Address" error={errors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={e => set('email')(e.target.value)}
            placeholder="Optional"
            className="focus-visible:ring-indigo-400"
          />
        </Field>
        <Field label="Father's Name">
          <Input
            value={form.fatherName}
            onChange={e => set('fatherName')(e.target.value)}
            placeholder="Father's full name"
            className="focus-visible:ring-indigo-400"
          />
        </Field>
        <Field label="Mother's Name">
          <Input
            value={form.motherName}
            onChange={e => set('motherName')(e.target.value)}
            placeholder="Mother's full name"
            className="focus-visible:ring-indigo-400"
          />
        </Field>
        <Field label="Father's Mobile">
          <Input
            value={form.fatherMobile}
            onChange={e => set('fatherMobile')(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="focus-visible:ring-indigo-400"
          />
        </Field>
        <Field label="Gender">
          <AppSelect
            value={form.gender}
            onChange={set('gender')}
            placeholder="Select gender"
            options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }]}
          />
        </Field>
        <Field label="Blood Group">
          <AppSelect
            value={form.bloodGroup}
            onChange={set('bloodGroup')}
            placeholder="Select"
            options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(x => ({ value: x, label: x }))}
          />
        </Field>
        <div className="col-span-2">
          <Field label="Address">
            <Input
              value={form.address}
              onChange={e => set('address')(e.target.value)}
              placeholder="Full address"
              className="focus-visible:ring-indigo-400"
            />
          </Field>
        </div>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5 flex gap-2 items-center">
        <Info className="h-4 w-4 text-emerald-600 shrink-0" />
        <p className="text-xs text-emerald-800">
          Registration number will be <strong>auto-generated</strong> as a 7-digit unique ID on save.
        </p>
      </div>
      {errors.submit && (
        <p className="text-sm text-rose-600 font-semibold mb-3">{errors.submit}</p>
      )}
      <div className="flex justify-end gap-2.5">
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all"
        >
          <Check className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Student'}
        </Button>
      </div>
    </AppModal>
  );
}

// ─── ENROLLMENT MODAL ─────────────────────────────────────────────────────────

function EnrollmentModal({
  student, programs, allCourses, branches, onClose, onSave,
}: {
  student: Student;
  programs: Program[];
  allCourses: Course[];
  branches: { id: string; name: string }[];
  onClose: () => void;
  onSave: (data: { student: Student; program: Program | undefined; netMonthly: number; admFee: number }) => void;
}) {
  const [step, setStep] = useState(1);
  const [programId, setProgramId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [selCourses, setSelCourses] = useState<Record<string, SelCourseState>>({});
  const [monthlyDiscount, setMonthlyDiscount] = useState('0');
  const [admDiscount, setAdmDiscount] = useState('0');
  const [billingStart, setBillingStart] = useState(() => nextMonth());
  const [courseBatches, setCourseBatches] = useState<Record<string, { id: string; name: string }[]>>({});
  const [saving, setSaving] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  // Initialize branchId from the logged-in user's profile or first available branch
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      const u = raw ? JSON.parse(raw) : null;
      if (u?.branchId) {
        setBranchId(String(u.branchId));
      } else if (branches.length > 0) {
        setBranchId(branches[0].id);
      }
    } catch {
      if (branches.length > 0) setBranchId(branches[0].id);
    }
  }, [branches]);

  useEffect(() => {
    if (!programId) { setCourseBatches({}); return; }
    getBatches({ branchId: branchId || undefined, limit: 200 })
      .then(res => {
        if (res.success && res.data) {
          const map: Record<string, { id: string; name: string }[]> = {};
          for (const b of res.data) {
            map[b.courseId] ??= [];
            map[b.courseId].push({ id: b.id, name: b.name });
          }
          setCourseBatches(map);
        }
      })
      .catch(() => {
        setCourseBatches({});
      });
  }, [programId, branchId]);

  const program = programs.find(p => p.id === programId);
  const courses = programId ? allCourses.filter(c => c.programId === programId) : [];
  const selected = courses.filter(c => selCourses[c.id]?.checked);
  const totalFee = selected.reduce((s, c) => s + c.fee, 0);
  const distributed = distributeDiscount(selected, Number(monthlyDiscount) || 0);
  const netMonthly = totalFee - (Number(monthlyDiscount) || 0);
  const admFee = program?.admissionFeeEnabled
    ? Math.max(0, program.admissionFeeAmount - (Number(admDiscount) || 0))
    : 0;
  const canNext = selected.length > 0 && selected.every(c => c.type === 'ONLINE' || selCourses[c.id]?.batch);

  const toggle = (cid: string) =>
    setSelCourses(p => ({ ...p, [cid]: { ...p[cid], checked: !p[cid]?.checked, startMonth: billingStart } }));
  const setCF = (cid: string, f: string, v: string) =>
    setSelCourses(p => ({ ...p, [cid]: { ...p[cid], [f]: v } }));

  const handleConfirm = async () => {
    setSaving(true);
    setEnrollError('');
    try {
      const coursePayload = selected.map(c => ({
        courseId: c.id,
        batchId: selCourses[c.id]?.batch || null,
        includeBook: false,
      }));
      const dto: OfflineAdmissionDto = {
        studentUserId: student.id,
        programId,
        courses: coursePayload,
        branchId,
        billingType: program?.paymentCircle === 'MONTHLY' ? 'MONTHLY' : 'ONE_TIME',
        billingStartMonth: billingStart,
        monthlyDiscount: Number(monthlyDiscount) || 0,
        admissionFeeAmountOverrides: program?.admissionFeeEnabled ? { [programId]: admFee } : undefined,
      };
      const res = await offlineAdmission(dto);
      if (res.success) {
        const pdf = res.data?.pdfUrl || res.data?.invoicePdfUrl;
        if (pdf) window.open(pdf, '_blank');
        onSave({ student, program, netMonthly, admFee });
      } else {
        setEnrollError((res as { message?: string }).message ?? 'Enrollment failed');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open
      onClose={onClose}
      title={`Enrollment — ${student.fullName}`}
      subtitle={`Reg: ${student.regNo}`}
      maxWidth="max-w-6xl"
    >
      {/* Step tabs */}
      <div className="flex border border-slate-200 rounded-xl overflow-hidden mb-6">
        {['Program & Courses', 'Review & Confirm'].map((s, i) => (
          <div
            key={i}
            onClick={() => step > i + 1 && setStep(i + 1)}
            className={cn(
              'flex-1 px-4 py-3 text-center text-sm font-bold transition-colors',
              i === 0 && 'border-r border-slate-200',
              step === i + 1
                ? 'bg-slate-900 text-white'
                : step > i + 1
                  ? 'bg-indigo-50 text-indigo-700 cursor-pointer'
                  : 'bg-slate-50 text-slate-400',
            )}
          >
            {step > i + 1 ? '✓ ' : `${i + 1}. `}{s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="grid grid-cols-[1fr_320px] gap-6">
          <div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <Field label="Program" required>
                <AppSelect
                  value={programId}
                  onChange={v => { setProgramId(v); setSelCourses({}); }}
                  placeholder="Select program"
                  options={programs.map(p => ({ value: p.id, label: p.name }))}
                />
              </Field>
              <Field label="Branch">
                <AppSelect
                  value={branchId}
                  onChange={setBranchId}
                  placeholder="Select branch"
                  options={branches.map(b => ({ value: b.id, label: b.name }))}
                />
              </Field>
            </div>

            {programId && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Available Courses</p>
                <div className="flex flex-col gap-2">
                  {courses.map(c => {
                    const sel = selCourses[c.id];
                    return (
                      <div
                        key={c.id}
                        className={cn(
                          'border rounded-xl p-3.5 transition-all',
                          sel?.checked ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white hover:border-slate-300',
                        )}
                      >
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!sel?.checked}
                            onChange={() => toggle(c.id)}
                            className="mt-0.5 accent-rose-600"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span className="font-bold text-sm text-slate-900">{c.name}</span>
                              <span className="font-black text-rose-700 text-sm">{fmt(c.fee)}/month</span>
                            </div>
                            <div className="flex gap-2 mt-1">
                              <AppBadge label={c.type} color={c.type === 'OFFLINE' ? 'amber' : 'blue'} />
                              <span className="text-xs text-slate-400">Payment mode: monthly</span>
                            </div>
                          </div>
                        </label>
                        {sel?.checked && (
                          <div className={cn(
                            'grid gap-2.5 mt-3 pt-3 border-t border-dashed border-rose-200',
                            c.type === 'OFFLINE' ? 'grid-cols-3' : 'grid-cols-2',
                          )}>
                            {c.type === 'OFFLINE' && (
                              <Field label="Batch" required>
                                <AppSelect
                                  value={sel.batch || ''}
                                  onChange={v => setCF(c.id, 'batch', v)}
                                  placeholder="Select batch"
                                  options={(courseBatches[c.id] ?? []).map(b => ({ value: b.id, label: b.name }))}
                                />
                                {!sel.batch && <p className="text-[11px] text-rose-600 mt-1">Required</p>}
                              </Field>
                            )}
                            <Field label="Start Month">
                              <MonthInput
                                value={sel.startMonth || billingStart}
                                onChange={v => setCF(c.id, 'startMonth', v)}
                                min={c.startMonth}
                                max={c.endMonth}
                              />
                            </Field>
                            <Field label="End Month">
                              <MonthInput value={c.endMonth} disabled />
                            </Field>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3.5">Admission Summary</p>
              {selected.length > 0 ? (
                <>
                  <ul className="list-decimal pl-4 mb-3.5 space-y-1">
                    {selected.map(c => (
                      <li key={c.id} className="text-sm text-slate-900 font-semibold">{c.name}</li>
                    ))}
                  </ul>
                  <div className="border-t border-slate-200 pt-3 space-y-1.5">
                    {[['Course fee', fmt(totalFee)], ['Promotional discount', '৳0']].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-sm text-slate-500">{k}</span>
                        <span className="text-sm font-semibold text-slate-900">{v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-slate-200 mb-1">
                      <span className="text-sm font-bold text-slate-900">Sub-total</span>
                      <span className="text-sm font-black text-slate-900">{fmt(totalFee)}</span>
                    </div>
                  </div>

                  {program?.paymentCircle === 'MONTHLY' && (
                    <>
                      <Field label="Monthly Scholarship">
                        <Input
                          type="number"
                          min={0}
                          max={totalFee}
                          value={monthlyDiscount}
                          onChange={e => setMonthlyDiscount(e.target.value)}
                          className="text-right focus-visible:ring-indigo-400"
                        />
                      </Field>
                      <Field label="Billing Start Month">
                        <MonthInput value={billingStart} onChange={setBillingStart} />
                      </Field>
                      <div className="bg-white border-2 border-rose-200 rounded-xl px-3.5 py-2.5 mb-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm text-slate-900">Total (monthly fee)</span>
                          <span className="font-black text-base text-rose-700">{fmt(netMonthly)}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {program?.admissionFeeEnabled && (
                    <>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-slate-500">Admission fee</span>
                        <span className="font-bold text-sm">{fmt(program.admissionFeeAmount)}</span>
                      </div>
                      <Field label="Discount on admission fee">
                        <Input
                          type="number"
                          min={0}
                          max={program.admissionFeeAmount}
                          value={admDiscount}
                          onChange={e => setAdmDiscount(e.target.value)}
                          className="text-right focus-visible:ring-indigo-400"
                        />
                      </Field>
                      <div className="flex justify-between">
                        <span className="text-sm font-bold text-slate-900">Admission fee payment</span>
                        <span className="font-black text-rose-700">{fmt(admFee)}</span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-5">Select courses to see summary</p>
              )}
            </div>
            <Button
              className="w-full gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all"
              disabled={!canNext}
              onClick={() => setStep(2)}
            >
              Review & Confirm →
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5 flex gap-2.5">
            <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-emerald-800">Review enrollment details before confirming</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Once confirmed, monthly snapshots and invoices will be generated automatically.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2.5 mb-5">
            {[
              ['Student', student.fullName],
              ['Program', program?.name ?? ''],
              ['Billing', program?.paymentCircle ?? ''],
              ['Start Month', billingStart],
            ].map(([k, v]) => (
              <div key={k} className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{k}</p>
                <p className="font-bold text-sm text-slate-900">{v}</p>
              </div>
            ))}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  {['Course', 'Type', 'Batch', 'Fee', 'Discount', 'Net Fee'].map(h => (
                    <th
                      key={h}
                      className={cn(
                        'px-3.5 py-2.5 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-200',
                        ['Course', 'Type', 'Batch'].includes(h) ? 'text-left' : 'text-right',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {distributed.map(c => (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="px-3.5 py-3 font-bold text-slate-900">{c.name}</td>
                    <td className="px-3.5 py-3">
                      <AppBadge label={c.type} color={c.type === 'OFFLINE' ? 'amber' : 'blue'} />
                    </td>
                    <td className="px-3.5 py-3 text-slate-500">{selCourses[c.id]?.batch || '—'}</td>
                    <td className="px-3.5 py-3 text-right font-semibold">{fmt(c.fee)}</td>
                    <td className="px-3.5 py-3 text-right text-rose-500 font-semibold">
                      {c.discount > 0 ? `−${fmt(c.discount)}` : '—'}
                    </td>
                    <td className="px-3.5 py-3 text-right font-black text-rose-700">{fmt(c.fee - c.discount)}</td>
                  </tr>
                ))}
                <tr className="bg-rose-50 border-t-2 border-rose-200">
                  <td colSpan={3} className="px-3.5 py-3 font-black text-slate-900">Total Monthly Payable</td>
                  <td className="px-3.5 py-3 text-right font-bold">{fmt(totalFee)}</td>
                  <td className="px-3.5 py-3 text-right font-bold text-rose-500">
                    {Number(monthlyDiscount) > 0 ? `−${fmt(monthlyDiscount)}` : '—'}
                  </td>
                  <td className="px-3.5 py-3 text-right font-black text-rose-700 text-base">{fmt(netMonthly)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {program?.admissionFeeEnabled && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-5 flex justify-between items-center">
              <span className="font-bold text-sm text-slate-900">Admission Fee (one-time)</span>
              <span className="font-black text-lg text-rose-700">{fmt(admFee)}</span>
            </div>
          )}

          <div className="flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2" disabled={saving}>
              <ArrowLeft className="h-4 w-4" /> Go Back
            </Button>
            {enrollError && <p className="text-sm text-rose-600 font-semibold self-center">{enrollError}</p>}
            <Button
              onClick={handleConfirm}
              disabled={saving}
              className="gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all"
            >
              <Check className="h-4 w-4" /> {saving ? 'Processing…' : 'Confirm Admission'}
            </Button>
          </div>
        </div>
      )}
    </AppModal>
  );
}

// ─── COLLECT PAYMENT MODAL ────────────────────────────────────────────────────

function CollectPaymentModal({
  student, onClose, onSave,
}: {
  student: Student;
  onClose: () => void;
  onSave: (data: { student: Student; month: string; method: string; amount: number }) => void;
}) {
  const [selMonth, setSelMonth] = useState('');
  const [method, setMethod] = useState('CASH');
  const [addDiscount, setAddDiscount] = useState('0');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  const fetchInvoices = () => {
    setLoadingInvoices(true);
    setFetchError(null);
    getInvoices({ studentUserId: student.id, limit: 100 })
      .then(res => {
        const mapped: Invoice[] = (res.data ?? []).map(inv => ({
          id: inv.id,
          month: inv.month ?? '',
          amount: Number(inv.payableAmount),
          paidAmount: Number(inv.paidAmount),
          status: inv.status === 'PAID' ? 'PAID' : 'DUE',
          dueDate: inv.nextPaymentDueDate ?? '',
          branchName: (inv as { branch?: { name?: string } }).branch?.name,
          items: (inv as { items?: { title: string; unitPrice: number; qty: number }[] }).items,
        }));
        // Sort descending — most recent month first
        mapped.sort((a, b) => b.month.localeCompare(a.month));
        setInvoices(mapped);
        if (mapped.length > 0) setSelMonth(mapped[0].month);
        setLoadingInvoices(false);
      })
      .catch(err => {
        setFetchError((err as Error).message ?? 'Failed to load invoices');
        setLoadingInvoices(false);
      });
  };

  useEffect(() => { fetchInvoices(); }, [student.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const openInvoicePdf = async (invoiceId: string) => {
    setPdfLoading(invoiceId);
    try {
      const res = await getInvoicePdfUrl(invoiceId);
      if (res.data?.pdfUrl) window.open(normPdfUrl(res.data.pdfUrl), '_blank');
    } finally {
      setPdfLoading(null);
    }
  };

  const monthInvs = invoices.filter(i => i.month === selMonth);
  const totalDue = monthInvs.reduce((s, i) => s + i.amount, 0);
  const netDue = Math.max(0, totalDue - (Number(addDiscount) || 0));
  const allMonths = [...new Set(invoices.map(i => i.month))];

  const methods = [
    { id: 'CASH', label: 'Cash', icon: '💵' },
    { id: 'BKASH', label: 'bKash', icon: '🔴' },
    { id: 'NAGAD', label: 'Nagad', icon: '🟠' },
    { id: 'CARD', label: 'Card', icon: '💳' },
    { id: 'CHEQUE', label: 'Cheque', icon: '📄' },
  ];

  return (
    <AppModal
      open
      onClose={onClose}
      title={`Collect Payment — ${student.fullName}`}
      subtitle={`Reg: ${student.regNo} · ${student.mobile}`}
      maxWidth="max-w-5xl"
    >
      <div className="grid grid-cols-[1fr_280px] gap-6">
        {/* Left: month + invoices */}
        <div>
          <div className="mb-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Month</p>
            {fetchError ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <p className="text-sm text-rose-700 flex-1">{fetchError}</p>
                <button
                  onClick={fetchInvoices}
                  className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : loadingInvoices ? (
              <p className="text-sm text-slate-400">Loading invoices…</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {allMonths.map(m => {
                  const inv = invoices.find(i => i.month === m);
                  return (
                    <button
                      key={m}
                      onClick={() => setSelMonth(m)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-bold transition-colors cursor-pointer',
                        selMonth === m
                          ? 'border-rose-300 bg-rose-50 text-rose-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                      )}
                    >
                      {fmtMonth(m)}
                      <AppBadge label={inv?.status || 'N/A'} color={inv?.status === 'PAID' ? 'green' : 'red'} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Invoices — {fmtMonth(selMonth)}
              </p>
            </div>
            {monthInvs.length > 0 ? (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    {['Description', 'Branch', 'Amount', 'Status', 'Due Date', ''].map(h => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left text-[11px] font-bold text-slate-400 uppercase border-b border-slate-200"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthInvs.map(inv => (
                    <>
                      <tr key={inv.id} className="border-b border-slate-100">
                        <td className="px-3 py-2.5 font-semibold text-slate-900">
                          {fmtMonth(inv.month)} — Monthly Fee
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 text-xs">{inv.branchName || '—'}</td>
                        <td className="px-3 py-2.5 font-bold text-rose-700">{fmt(inv.amount)}</td>
                        <td className="px-3 py-2.5">
                          <AppBadge label={inv.status} color={inv.status === 'PAID' ? 'green' : 'red'} />
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 text-xs">{inv.dueDate}</td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => openInvoicePdf(inv.id)}
                            disabled={pdfLoading === inv.id}
                            title="Download Invoice PDF"
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer disabled:opacity-40"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                      {inv.items?.map((item, ii) => (
                        <tr key={`${inv.id}-item-${ii}`} className="bg-slate-50/60 border-b border-slate-100">
                          <td className="px-3 py-1.5 text-xs text-slate-500 pl-7" colSpan={2}>
                            ↳ {item.title}
                            {item.qty > 1 && <span className="text-slate-400 ml-1">×{item.qty}</span>}
                          </td>
                          <td className="px-3 py-1.5 text-xs text-slate-500">{fmt(item.unitPrice * item.qty)}</td>
                          <td colSpan={3} />
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center py-6 text-slate-400 text-sm">No invoices for this month</p>
            )}
          </div>
        </div>

        {/* Right: payment panel */}
        <div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3.5">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-500">Total dues</span>
              <span className="font-bold text-sm">{fmt(totalDue)}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-sm text-slate-500">Monthly scholarship(−)</span>
              <span className="font-semibold text-sm text-slate-400">৳0</span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Additional discount(−)</p>
            <Input
              type="number"
              min={0}
              value={addDiscount}
              onChange={e => setAddDiscount(e.target.value)}
              className="text-right mb-3 focus-visible:ring-indigo-400"
            />
            <div className="bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-slate-900">Due amount</span>
                <span className="font-black text-2xl text-rose-700">{fmt(netDue)}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Method</p>
          <div className="grid grid-cols-2 gap-2 mb-3.5">
            {methods.map(m => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={cn(
                  'flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg border-2 text-sm font-bold transition-all cursor-pointer',
                  method === m.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                <span>{m.icon}</span> {m.label}
                {method === m.id && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
              </button>
            ))}
          </div>
          <Button
            className="w-full gap-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
            disabled={netDue <= 0 || saving || loadingInvoices}
            onClick={async () => {
              setSaving(true);
              try {
                const paidInv = monthInvs[0];
                await processMonthPayment({
                  studentUserId: student.id,
                  month: selMonth,
                  payment: { amount: netDue, method },
                });
                // Refetch invoices to reflect updated status
                fetchInvoices();
                // Auto-open PDF for the paid invoice
                if (paidInv) {
                  getInvoicePdfUrl(paidInv.id)
                    .then(r => { if (r.data?.pdfUrl) window.open(normPdfUrl(r.data.pdfUrl), '_blank'); })
                    .catch(() => {});
                }
                onSave({ student, month: selMonth, method, amount: netDue });
              } finally {
                setSaving(false);
              }
            }}
          >
            <Check className="h-4 w-4" /> {saving ? 'Processing…' : `Collect ${method} Payment`}
          </Button>
        </div>
      </div>
    </AppModal>
  );
}

// ─── ROW ACTIONS DROPDOWN ─────────────────────────────────────────────────────

function RowActions({
  student, onAction,
}: {
  student: Student;
  onAction: (action: string, student: Student) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const actions = [
    { id: 'view', icon: Eye, label: 'View Profile' },
    { id: 'edit', icon: Pencil, label: 'Edit Student' },
    { id: 'enrollments', icon: BookOpen, label: 'View Enrollments' },
    { id: 'enroll', icon: Tag, label: 'New Enrollment' },
    { id: 'payment', icon: CreditCard, label: 'Collect Payment' },
    { id: 'cancel', icon: Ban, label: 'Cancel Admission', danger: true },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'p-1.5 rounded-md border transition-colors cursor-pointer',
          open
            ? 'bg-slate-100 border-slate-300 text-slate-700'
            : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-100 hover:border-slate-200',
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] bg-white border border-slate-200 rounded-xl shadow-xl min-w-48 z-50 overflow-hidden">
          {actions.map((a, i) => (
            <button
              key={a.id}
              onClick={() => { onAction(a.id, student); setOpen(false); }}
              className={cn(
                'w-full px-3.5 py-2.5 text-left text-sm font-semibold flex items-center gap-2.5 transition-colors cursor-pointer',
                i === 4 && 'border-t border-slate-100',
                a.danger
                  ? 'text-rose-600 hover:bg-rose-50'
                  : 'text-slate-800 hover:bg-slate-50',
              )}
            >
              <a.icon className="h-3.5 w-3.5" /> {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [view, setView] = useState<'list' | 'enrollments'>('list');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modal, setModal] = useState<{ type: string; student?: Student } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getUsers({ role: 'STUDENT', limit: 200 }).then(res => {
      if (res.success && res.data) {
        type ApiStudentUser = typeof res.data[0] & {
          studentProfile?: { registrationNumber?: string };
          _count?: { enrollments?: number };
        };
        setStudents((res.data as ApiStudentUser[]).map(u => ({
          id: u.id,
          regNo: u.studentProfile?.registrationNumber ?? '—',
          fullName: u.fullName,
          mobile: u.mobile,
          email: u.email ?? null,
          status: u.status as 'ACTIVE' | 'BLOCKED',
          branchId: u.branchId ?? '',
          createdAt: u.createdAt ?? '',
          _count: u._count,
        })));
      }
      setLoadingStudents(false);
    });
    getPrograms().then(res => {
      if (res.success && res.data) setPrograms(res.data as Program[]);
    });
    getBranches().then(res => {
      if (res.success && res.data) setBranches(res.data.map(b => ({ id: b.id, name: b.name })));
    });
    getCourses({ limit: 200 }).then(res => {
      if (res.success && res.data) {
        setAllCourses(res.data.map(c => ({
          id: c.id,
          name: c.name,
          programId: c.programId,
          fee: Number(c.fee ?? 0),
          type: (c.type === 'OFFLINE' ? 'OFFLINE' : 'ONLINE') as 'OFFLINE' | 'ONLINE',
          startMonth: c.startMonth ?? '',
          endMonth: c.endMonth ?? '',
          batches: [],
        })));
      }
    });
  }, []);

  const showToast = (msg: string, type = 'success') => {
    toast({ title: msg, variant: type === 'error' ? 'destructive' : 'default' });
  };

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return (
      (s.fullName.toLowerCase().includes(q) || s.mobile.includes(q) || s.regNo.includes(q)) &&
      (statusFilter === 'ALL' || s.status === statusFilter)
    );
  });

  const handleAction = (action: string, student: Student) => {
    if (action === 'enrollments') { setActiveStudent(student); setView('enrollments'); }
    else if (action === 'enroll') setModal({ type: 'enroll', student });
    else if (action === 'payment') setModal({ type: 'payment', student });
    else showToast(`"${action}" action for ${student.fullName}`, 'info');
  };

  const totalActive = students.filter(s => s.status === 'ACTIVE').length;

  if (view === 'enrollments' && activeStudent) {
    return (
      <div className="min-h-screen p-6 bg-slate-50/50">
        <EnrolledCoursesView
          student={activeStudent}
          onBack={() => setView('list')}
          showToast={showToast}
          programs={programs}
          allCourses={allCourses}
        />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 p-6 sm:p-0 bg-slate-50/50">
      {/* Page header */}
   

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Students', value: students.length, icon: '👥', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active', value: totalActive, icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Blocked', value: students.length - totalActive, icon: '🚫', color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'New This Month', value: 3, icon: '🆕', color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(card => (
          <div
            key={card.label}
            className="bg-white border border-slate-200 rounded-2xl px-4 py-4 flex items-center gap-3.5 shadow-sm"
          >
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0', card.bg)}>
              {card.icon}
            </div>
            <div>
              <p className={cn('text-2xl font-black leading-none', card.color)}>{card.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-slate-400" />
            <h2 className="text-base font-black text-slate-900">Students</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">
              {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-2 ">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, mobile, reg no..."
                className="pl-8 w-72 text-sm focus-visible:ring-indigo-400"
              />
            </div>
            <AppSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'BLOCKED', label: 'Blocked' },
              ]}
            />
            <Button
              onClick={() => setModal({ type: 'addStudent' })}
              className="gap-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all"
            >
              <Plus className="h-4 w-4" /> Add Student
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-100">
                {['Reg No', 'Full Name', 'Mobile', 'Branch', 'Enrollments', 'Status', 'Actions'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingStudents && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">
                    Loading students…
                  </td>
                </tr>
              )}
              {!loadingStudents && filtered.map(s => {
                const enrollCount = s._count?.enrollments ?? 0;
                const hue = s.fullName.charCodeAt(0) * 13 % 360;
                return (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-mono text-xs">
                        {s.regNo}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0"
                          style={{ background: `hsl(${hue},55%,90%)`, color: `hsl(${hue},45%,35%)` }}
                        >
                          {s.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{s.fullName}</p>
                          {s.email && <p className="text-[11px] text-slate-400">{s.email}</p>}
                          <p className="text-[11px] text-rose-600 font-mono mt-0.5">{s.regNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-mono text-xs">{s.mobile}</td>
                    <td className="px-4 py-3.5">
                      <AppBadge
                        label={branches.find(b => b.id === s.branchId)?.name ?? (s.branchId || '—')}
                        color="slate"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => { setActiveStudent(s); setView('enrollments'); }}
                        className={cn(
                          'font-bold text-sm px-2.5 py-1 rounded-lg cursor-pointer transition-colors',
                          enrollCount > 0
                            ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                            : 'text-slate-400 bg-slate-100',
                        )}
                      >
                        {enrollCount} {enrollCount === 1 ? 'enrollment' : 'enrollments'}
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <AppBadge label={s.status} color={s.status === 'ACTIVE' ? 'green' : 'red'} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction('enroll', s)}
                          className="gap-1.5 h-7 px-2.5 text-xs"
                        >
                          <BookOpen className="h-3 w-3" /> Enroll
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAction('payment', s)}
                          className="gap-1.5 h-7 px-2.5 text-xs bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          <CreditCard className="h-3 w-3" /> Pay
                        </Button>
                        <RowActions student={s} onAction={handleAction} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loadingStudents && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">
                    No students found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex justify-between items-center">
          <p className="text-xs text-slate-400">Showing {filtered.length} of {students.length} students</p>
          <div className="flex gap-1">
            {['← Prev', '1', '2', '3', 'Next →'].map(p => (
              <button
                key={p}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer',
                  p === '1'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'addStudent' && (
        <AddStudentModal
          onClose={() => setModal(null)}
          onSave={s => {
            setStudents(p => [s, ...p]);
            setModal(null);
            showToast(`Student ${s.fullName} created! Reg: ${s.regNo}`, 'success');
          }}
        />
      )}
      {modal?.type === 'enroll' && modal.student && (
        <EnrollmentModal
          student={modal.student}
          programs={programs}
          allCourses={allCourses}
          branches={branches}
          onClose={() => setModal(null)}
          onSave={data => {
            setModal(null);
            showToast(`Enrollment confirmed for ${data.student.fullName}!`, 'success');
          }}
        />
      )}
      {modal?.type === 'payment' && modal.student && (
        <CollectPaymentModal
          student={modal.student}
          onClose={() => setModal(null)}
          onSave={data => {
            setModal(null);
            showToast(`${fmt(data.amount)} collected via ${data.method} for ${fmtMonth(data.month)}`, 'success');
          }}
        />
      )}

      <Toaster />
    </div>
  );
}
