'use client';

import { useState, useCallback } from 'react';
import type { Enrollment } from '@/lib/api/enrollments';
import { cancelMonthlyEnrollment, getInvoices, getInvoicePdfUrl } from '@/lib/api/invoices';
import { API_ORIGIN } from '@/lib/api';
import type { Invoice } from '@/types/invoice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { CourseDeliveryBadge } from '@/lib/course-delivery';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  Clock,
  Users,
  Layers,
  Receipt,
  Ban,
  Loader2,
  CheckCircle2,
  BookOpen,
  FileText,
  GraduationCap,
  Tag,
  AlertCircle,
} from 'lucide-react';

export interface EnrollmentDetailsViewProps {
  enrollment: Enrollment;
  /** Opens parent confirmation / flow to settle outstanding invoices for this enrollment. */
  onRequestSettle?: () => void;
  /** Opens the cancel/remove flow (preview modal) for this enrollment. */
  onRequestDelete?: () => void;
  /** Called after successful monthly cancel or inline settle (if used). */
  onAfterMutation?: () => void | Promise<void>;
}

function getStatusBadgeClass(status: string) {
  const s = String(status).toUpperCase();
  if (s === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black';
  if (s === 'PAUSED') return 'bg-amber-50 text-amber-700 border-amber-100 font-black';
  if (s === 'CANCELLED') return 'bg-rose-50 text-rose-700 border-rose-100 font-black';
  if (s === 'COMPLETED') return 'bg-indigo-50 text-indigo-700 border-indigo-100 font-black';
  return 'bg-slate-100 text-slate-600 border-slate-200 font-black';
}

function getInvoiceStatusClass(status: string) {
  const s = String(status).toUpperCase();
  if (s === 'PAID') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (s === 'PARTIAL') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (s === 'ISSUED') return 'bg-blue-50 text-blue-700 border-blue-100';
  if (s === 'DRAFT') return 'bg-slate-100 text-slate-600 border-slate-200';
  if (s === 'CANCELLED') return 'bg-rose-50 text-rose-700 border-rose-100';
  return 'bg-slate-100 text-slate-500 border-slate-200';
}

export function EnrollmentDetailsView({
  enrollment,
  onRequestSettle,
  onRequestDelete,
  onAfterMutation,
}: EnrollmentDetailsViewProps) {
  const { toast } = useToast();
  const [monthlyBusy, setMonthlyBusy] = useState(false);
  const [monthlyReason, setMonthlyReason] = useState('');
  const [settleOutstandingOnCancel, setSettleOutstandingOnCancel] = useState(true);

  const course = enrollment.course;
  const isMonthly = course?.billingType === 'MONTHLY';
  const isActive = String(enrollment.status).toUpperCase() === 'ACTIVE';
  const canMonthlyCancel = isMonthly && isActive;

  const handleMonthlyFullCancel = async () => {
    try {
      setMonthlyBusy(true);
      const res = await cancelMonthlyEnrollment(enrollment.id, {
        reason: monthlyReason.trim() || undefined,
        settleInvoices: settleOutstandingOnCancel,
      });
      if (res.success) {
        toast({
          title: 'Monthly enrollment ended',
          description: res.message || 'Benefits updated; enrollment cancelled.',
          variant: 'success',
        });
        setMonthlyReason('');
        await onAfterMutation?.();
      } else {
        toast({ title: 'Failed', description: res.message, variant: 'destructive' });
      }
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Cancel failed',
        variant: 'destructive',
      });
    } finally {
      setMonthlyBusy(false);
    }
  };

  return (
    <div className="flex max-h-[min(90vh,720px)] flex-col overflow-hidden bg-white text-slate-900">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
        <div className="mb-8 rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-indigo-50/30 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'rounded-lg px-3 py-1 text-[10px] uppercase tracking-widest',
                    getStatusBadgeClass(String(enrollment.status))
                  )}
                >
                  {enrollment.status}
                </Badge>
                <CourseDeliveryBadge type={course?.type} className="rounded-lg px-3 py-1 text-[10px]" />
                {course?.billingType && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest',
                      course.billingType === 'MONTHLY'
                        ? 'border-violet-200 bg-violet-50 text-violet-800'
                        : 'border-sky-200 bg-sky-50 text-sky-800'
                    )}
                  >
                    {course.billingType === 'MONTHLY' ? 'মাসিক / Monthly' : 'এককালীন / One-time'}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Course</p>
                <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                  {course?.name ?? '—'}
                </h2>
                <p className="mt-1 font-mono text-xs font-bold text-indigo-600">{course?.code}</p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  {course?.program?.name ?? 'No program'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-rose-500" />
                  {enrollment.branch?.name ?? '—'}
                </span>
              </div>
            </div>
            <div className="shrink-0 rounded-xl border border-white/80 bg-white/70 p-4 text-center shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student</p>
              <p className="mt-1 text-lg font-black text-slate-900">{enrollment.student?.fullName}</p>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500">
                <Phone className="h-3.5 w-3.5" />
                {enrollment.student?.mobile}
              </p>
              {enrollment.student?.email && (
                <p className="mt-1 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500">
                  <Mail className="h-3.5 w-3.5" />
                  {enrollment.student.email}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: course?.billingType === 'MONTHLY' ? 'Monthly fee' : 'Course fee',
              value: course ? `৳${Number(course.fee).toLocaleString()}` : '—',
              icon: CreditCard,
              bg: 'bg-blue-50',
              color: 'text-blue-600',
            },
            {
              label: 'Billing start (YYYY-MM)',
              value: enrollment.billingStartMonth || (isMonthly ? '—' : 'N/A'),
              icon: Calendar,
              bg: 'bg-violet-50',
              color: 'text-violet-600',
            },
            {
              label: 'Batch',
              value: enrollment.batch?.name || 'Unassigned',
              icon: Users,
              bg: 'bg-emerald-50',
              color: 'text-emerald-600',
            },
            {
              label: 'Enrolled',
              value: new Date(enrollment.createdAt).toLocaleDateString(),
              icon: Clock,
              bg: 'bg-amber-50',
              color: 'text-amber-700',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className={cn('mb-2 flex h-9 w-9 items-center justify-center rounded-xl', s.bg, s.color)}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className="mt-1 text-sm font-black text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        {isMonthly && (
          <div className="mb-8 space-y-4 rounded-2xl border border-violet-200 bg-violet-50/40 p-5">
            <div className="flex items-start gap-3">
              <Receipt className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
              <div className="space-y-2 text-sm leading-relaxed text-slate-700">
                <p className="font-black text-violet-900">মাসিক কোর্স / Monthly billing</p>
                <p>
                  প্রথম ইনভয়েস মাস হিসেবে <strong>billing start month</strong> ব্যবহার করা হয়। মাসিক বাতিল করলে স্কলারশিপ/
                  ডিসকাউন্ট সুবিধার মেয়াদ শেষ এবং এনরোলমেন্ট বাতিল হতে পারে।
                </p>
              </div>
            </div>
          </div>
        )}

        {onRequestSettle && (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
              <BookOpen className="h-4 w-4" />
              Invoice settlement
            </h3>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-emerald-200 bg-white font-bold text-emerald-800 hover:bg-emerald-50"
              onClick={onRequestSettle}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Settle outstanding course invoices…
            </Button>
            <p className="text-xs font-medium text-slate-500">
              Confirms then marks unpaid course-line invoices for this enrollment as paid (same as enrollments list).
            </p>
          </div>
        )}

        {!isMonthly && isActive && onRequestDelete && (
          <div className="mt-8 space-y-4 rounded-2xl border border-rose-200 bg-rose-50/30 p-5">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-800">
              <Ban className="h-4 w-4" />
              Cancel enrollment
            </h3>
            <p className="text-sm font-medium text-slate-700">
              Permanently removes this enrollment, ends course-scoped benefits from the current month,
              and redistributes any remaining discount &amp; scholarship across other active courses on
              open invoices.
            </p>
            <Button
              type="button"
              variant="destructive"
              className="h-11 rounded-xl font-bold"
              onClick={onRequestDelete}
            >
              <Ban className="mr-2 h-4 w-4" />
              Cancel &amp; remove enrollment…
            </Button>
          </div>
        )}

        {canMonthlyCancel && (
          <div className="mt-8 space-y-4 rounded-2xl border border-rose-200 bg-rose-50/30 p-5">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-800">
              <Ban className="h-4 w-4" />
              End monthly subscription
            </h3>
            <p className="text-sm font-medium text-slate-700">
              Cancels this enrollment, ends course-scoped benefits from the current month, and optionally marks related
              outstanding invoices cancelled (per server rules).
            </p>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reason (optional)</label>
              <Input
                value={monthlyReason}
                onChange={(e) => setMonthlyReason(e.target.value)}
                placeholder="e.g. Student left the program"
                className="h-11 rounded-xl"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-slate-800">
              <Checkbox
                checked={settleOutstandingOnCancel}
                onCheckedChange={(c) => setSettleOutstandingOnCancel(c === true)}
              />
              Also cancel outstanding invoices for this course (invoice settlement)
            </label>
            <Button
              type="button"
              variant="destructive"
              className="h-11 rounded-xl font-bold"
              disabled={monthlyBusy}
              onClick={handleMonthlyFullCancel}
            >
              {monthlyBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
              Cancel monthly enrollment
            </Button>
          </div>
        )}

        <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-center">
          <p className="text-[10px] font-mono font-bold text-slate-400">ID {enrollment.id}</p>
        </div>
      </div>
    </div>
  );
}
