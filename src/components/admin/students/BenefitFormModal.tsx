'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useModalStore } from '@/store/modalStore';
import { getActorUserIdFromStorage } from '@/lib/actor-user';
import {
  createBenefit,
  updateBenefit,
  type Benefit,
  type BenefitApiResponse,
  type BenefitMode,
  type BenefitType,
} from '@/lib/api/benefits';
import type { Enrollment } from '@/lib/api/enrollments';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles, Receipt, Tag } from 'lucide-react';

interface BenefitFormModalProps {
  studentId: string;
  enrollments: Enrollment[];
  benefit?: Benefit;
  onSuccess?: (response?: BenefitApiResponse<Benefit>) => void | Promise<void>;
}

const MODE_OPTIONS: Array<{ value: BenefitMode; label: string }> = [
  { value: 'FLAT', label: 'Flat amount' },
  { value: 'PERCENT', label: 'Percent' },
  { value: 'MONTHLY_FIXED', label: 'Monthly fixed' },
  { value: 'ONE_TIME', label: 'One-time' },
];

function money(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function BenefitFormModal({ studentId, enrollments, benefit, onSuccess }: BenefitFormModalProps) {
  const { toast } = useToast();
  const { closeModal } = useModalStore();
  const [type, setType] = useState<BenefitType>(benefit?.type ?? 'DISCOUNT');
  const [mode, setMode] = useState<BenefitMode>(benefit?.mode ?? 'FLAT');
  const [courseId, setCourseId] = useState(benefit?.courseId ?? 'GLOBAL');
  const [value, setValue] = useState(String(benefit?.value ?? ''));
  const [startMonth, setStartMonth] = useState(benefit?.startMonth ?? new Date().toISOString().slice(0, 7));
  const [endMonth, setEndMonth] = useState(benefit?.endMonth ?? '');
  const [reason, setReason] = useState(benefit?.reason ?? '');
  const [submitting, setSubmitting] = useState(false);

  const activeEnrollments = useMemo(
    () => enrollments.filter((item) => String(item.status).toUpperCase() === 'ACTIVE'),
    [enrollments],
  );

  const selectedEnrollment = activeEnrollments.find((item) => item.courseId === courseId);
  const courseFee = Number(selectedEnrollment?.course?.fee ?? 0);
  const numericValue = Number(value || 0);
  const reduction = useMemo(() => {
    if (!numericValue || numericValue <= 0 || !courseFee) return 0;
    if (mode === 'PERCENT') return Math.min(courseFee, (courseFee * numericValue) / 100);
    return Math.min(courseFee, numericValue);
  }, [courseFee, mode, numericValue]);

  const afterFee = Math.max(0, courseFee - reduction);
  const replacedCountText = (count?: number) =>
    count && count > 0 ? `${count} unpaid invoice${count === 1 ? '' : 's'} replaced.` : 'No open invoice needed replacement.';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const actorUserId = getActorUserIdFromStorage();

    if (!actorUserId) {
      toast({ title: 'Error', description: 'Could not resolve the current admin user.', variant: 'destructive' });
      return;
    }

    if (!numericValue || numericValue <= 0) {
      toast({ title: 'Validation', description: 'Benefit amount must be greater than zero.', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        type,
        mode,
        value: numericValue,
        startMonth: startMonth || undefined,
        endMonth: endMonth || undefined,
        reason: reason || undefined,
      };

      const response = benefit
        ? await updateBenefit(benefit.id, payload)
        : await createBenefit({
            studentUserId: studentId,
            courseId: courseId === 'GLOBAL' ? null : courseId,
            approvedByUserId: actorUserId,
            ...payload,
          });

      if (!response.success || !response.data) {
        toast({ title: 'Failed', description: response.message || 'Could not save the benefit.', variant: 'destructive' });
        return;
      }

      toast({
        title: benefit ? 'Benefit updated' : 'Benefit created',
        description: replacedCountText(response.meta?.replacedInvoicesCount),
        variant: 'success',
      });

      await onSuccess?.(response);
      closeModal();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unexpected error while saving benefit.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-h-[min(88vh,760px)] flex-col overflow-hidden rounded-[32px] bg-white">
      <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.08),transparent_40%)] px-7 py-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-100 bg-white shadow-sm">
            <Tag className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-500">
              {benefit ? 'Edit benefit' : 'New benefit'}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              Discount and scholarship manager
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
              Update the current benefit and the system will replace any open invoice that needs recalculation.
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto px-7 py-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Benefit type</Label>
            <div className="grid grid-cols-2 gap-3">
              {(['DISCOUNT', 'SCHOLARSHIP'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setType(option)}
                  className={cn(
                    'rounded-2xl border px-4 py-4 text-left transition-all',
                    type === option
                      ? option === 'DISCOUNT'
                        ? 'border-amber-200 bg-amber-50 text-amber-900 shadow-sm'
                        : 'border-violet-200 bg-violet-50 text-violet-900 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                  )}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.22em]">{option}</p>
                  <p className="mt-1 text-xs font-medium">
                    {option === 'DISCOUNT' ? 'Reduce billed course fee' : 'Apply scholarship support'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="benefit-mode" className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                Mode
              </Label>
              <select
                id="benefit-mode"
                value={mode}
                onChange={(event) => setMode(event.target.value as BenefitMode)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none ring-0 transition focus:border-indigo-300"
              >
                {MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefit-course" className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                Scope
              </Label>
              <select
                id="benefit-course"
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none ring-0 transition focus:border-indigo-300"
              >
                <option value="GLOBAL">All current courses</option>
                {activeEnrollments.map((item) => (
                  <option key={item.id} value={item.courseId}>
                    {item.course?.name || item.courseId}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefit-value" className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                {mode === 'PERCENT' ? 'Percent value' : 'Amount'}
              </Label>
              <Input
                id="benefit-value"
                type="number"
                value={value}
                min={0}
                step={mode === 'PERCENT' ? '0.1' : '0.01'}
                onChange={(event) => setValue(event.target.value)}
                className="h-12 rounded-2xl border-slate-200 font-bold"
                placeholder={mode === 'PERCENT' ? '10' : '1000'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefit-start" className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                Start month
              </Label>
              <Input
                id="benefit-start"
                type="month"
                value={startMonth}
                onChange={(event) => setStartMonth(event.target.value)}
                className="h-12 rounded-2xl border-slate-200 font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefit-end" className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                End month
              </Label>
              <Input
                id="benefit-end"
                type="month"
                value={endMonth}
                onChange={(event) => setEndMonth(event.target.value)}
                className="h-12 rounded-2xl border-slate-200 font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="benefit-reason" className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
              Note for admins
            </Label>
            <Textarea
              id="benefit-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="min-h-28 rounded-3xl border-slate-200 px-4 py-3 text-sm"
              placeholder="Why was this benefit approved?"
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-5">
            <div className="flex items-center gap-2 text-indigo-700">
              <Sparkles className="h-4 w-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.22em]">Live preview</p>
            </div>
            <div className="mt-4 space-y-3 text-sm font-medium text-slate-700">
              <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-indigo-100">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Selected scope</p>
                <p className="mt-2 font-black text-slate-900">
                  {courseId === 'GLOBAL' ? 'All current active courses' : selectedEnrollment?.course?.name || 'Specific course'}
                </p>
                {selectedEnrollment?.course?.slug ? (
                  <Badge variant="outline" className="mt-2 rounded-full border-slate-200 bg-white text-[10px] font-black uppercase">
                    {selectedEnrollment.course.slug}
                  </Badge>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-indigo-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Course fee</p>
                  <p className="mt-1 text-lg font-black text-slate-900">৳{money(courseFee)}</p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-indigo-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estimated reduction</p>
                  <p className="mt-1 text-lg font-black text-indigo-700">৳{money(reduction)}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950 p-4 text-white shadow-lg">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Projected fee after benefit</p>
                <p className="mt-2 text-2xl font-black">৳{money(afterFee)}</p>
                <p className="mt-2 text-xs font-medium text-slate-300">
                  This is a fee preview. Any open invoice tied to the current benefit set will be cancelled and regenerated.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-5">
            <div className="flex items-center gap-2 text-amber-800">
              <Receipt className="h-4 w-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.22em]">Invoice behavior</p>
            </div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-amber-900/80">
              Only unpaid invoices are replaced. Paid invoices stay untouched. The old invoice remains for audit with status set to cancelled.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-7 py-5 sm:flex-row">
        <Button
          type="button"
          variant="ghost"
          className="h-12 flex-1 rounded-2xl text-[11px] font-black uppercase tracking-[0.22em] text-slate-500"
          onClick={closeModal}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-12 flex-2 rounded-2xl bg-indigo-600 text-[11px] font-black uppercase tracking-[0.22em] text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700"
          disabled={submitting}
        >
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {benefit ? 'Save benefit' : 'Create benefit'}
        </Button>
      </div>
    </form>
  );
}