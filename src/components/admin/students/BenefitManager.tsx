'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useModalStore } from '@/store/modalStore';
import {
  deleteBenefit,
  getBenefits,
  type Benefit,
} from '@/lib/api/benefits';
import type { Enrollment } from '@/lib/api/enrollments';
import { BenefitFormModal } from './BenefitFormModal';
import { cn } from '@/lib/utils';
import { ChevronRight, CreditCard, Loader2, PencilLine, Plus, Receipt, Trash2 } from 'lucide-react';

interface BenefitManagerProps {
  studentId: string;
  enrollments: Enrollment[];
  onChanged?: () => void | Promise<void>;
}

function money(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function monthLabel(startMonth?: string | null, endMonth?: string | null) {
  if (!startMonth && !endMonth) return 'Open-ended';
  if (startMonth && !endMonth) return `From ${startMonth}`;
  if (!startMonth && endMonth) return `Until ${endMonth}`;
  return `${startMonth} to ${endMonth}`;
}

export function BenefitManager({ studentId, enrollments, onChanged }: BenefitManagerProps) {
  const { toast } = useToast();
  const { openModal } = useModalStore();
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadBenefits = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getBenefits({ studentUserId: studentId, limit: 200 });
      if (!response.success || !response.data) {
        toast({ title: 'Error', description: response.message || 'Could not load benefits.', variant: 'destructive' });
        return;
      }
      setBenefits(response.data);
    } catch {
      toast({ title: 'Error', description: 'Could not load benefits.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [studentId, toast]);

  useEffect(() => {
    loadBenefits();
  }, [loadBenefits]);

  const activeBenefits = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return benefits.filter((benefit) => !benefit.endMonth || benefit.endMonth >= currentMonth);
  }, [benefits]);

  const groupedBenefits = useMemo(() => {
    const map = new Map<string, Benefit[]>();
    for (const benefit of activeBenefits) {
      const key = benefit.courseId ?? 'GLOBAL';
      const items = map.get(key) ?? [];
      items.push(benefit);
      map.set(key, items);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      title:
        key === 'GLOBAL'
          ? 'All active courses'
          : items[0]?.course?.name || enrollments.flatMap((e) => e.enrollmentCourses ?? []).find((ec) => ec.courseId === key)?.course?.name || key,
      subtitle:
        key === 'GLOBAL'
          ? 'Global discount / scholarship'
          : items[0]?.course?.slug || enrollments.flatMap((e) => e.enrollmentCourses ?? []).find((ec) => ec.courseId === key)?.course?.slug || 'Course benefit',
      items,
    }));
  }, [activeBenefits, enrollments]);

  const summary = useMemo(() => {
    return activeBenefits.reduce(
      (acc, benefit) => {
        const numericValue = Number(benefit.value);
        if (benefit.type === 'DISCOUNT') acc.discount += numericValue;
        if (benefit.type === 'SCHOLARSHIP') acc.scholarship += numericValue;
        return acc;
      },
      { discount: 0, scholarship: 0 },
    );
  }, [activeBenefits]);

  const openBenefitModal = (benefit?: Benefit) => {
    openModal({
      title: benefit ? 'Edit benefit' : 'Add benefit',
      description: benefit ? benefit.course?.name || 'Update current benefit' : 'Create a new discount or scholarship',
      className: 'sm:max-w-5xl p-0 overflow-hidden',
      content: (
        <BenefitFormModal
          studentId={studentId}
          enrollments={enrollments}
          benefit={benefit}
          onSuccess={async () => {
            await loadBenefits();
            await onChanged?.();
          }}
        />
      ),
    });
  };

  const handleDelete = async (benefit: Benefit) => {
    try {
      setDeletingId(benefit.id);
      const response = await deleteBenefit(benefit.id);
      if (!response.success) {
        toast({ title: 'Failed', description: response.message || 'Could not delete the benefit.', variant: 'destructive' });
        return;
      }

      toast({
        title: 'Benefit deleted',
        description:
          response.meta?.replacedInvoicesCount && response.meta.replacedInvoicesCount > 0
            ? `${response.meta.replacedInvoicesCount} unpaid invoice${response.meta.replacedInvoicesCount === 1 ? '' : 's'} replaced.`
            : 'No open invoice needed replacement.',
        variant: 'success',
      });

      await loadBenefits();
      await onChanged?.();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unexpected error while deleting benefit.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-500">Discounts and scholarships</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Manage current benefit rules</h3>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
              Edit current discount and scholarship data here. When the amount changes, open invoices are cancelled and replaced with recalculated ones.
            </p>
          </div>
          <Button
            type="button"
            className="h-12 rounded-2xl bg-indigo-600 px-6 text-[11px] font-black uppercase tracking-[0.22em] text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700"
            onClick={() => openBenefitModal()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add benefit
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-700">Total discount value</p>
            <p className="mt-2 text-2xl font-black text-amber-900">৳{money(summary.discount)}</p>
          </div>
          <div className="rounded-3xl border border-violet-100 bg-violet-50/70 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-violet-700">Total scholarship value</p>
            <p className="mt-2 text-2xl font-black text-violet-900">৳{money(summary.scholarship)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Active rules</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{activeBenefits.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Current rules</p>
              <h4 className="mt-1 text-lg font-black text-slate-900">Editable benefit lines</h4>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Receipt className="h-4 w-4" />
              Open invoices will be replaced on save
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 px-6 py-14 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-bold">Loading benefit data…</span>
              </div>
            ) : groupedBenefits.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-14 text-center">
                <p className="text-sm font-black text-slate-600">No active discount or scholarship rules</p>
                <p className="mt-2 text-xs font-medium text-slate-400">Add one to start auto-updating invoice amounts.</p>
              </div>
            ) : (
              groupedBenefits.map((group) => (
                <div key={group.key} className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50/60">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
                    <div>
                      <p className="text-sm font-black text-slate-900">{group.title}</p>
                      <p className="text-xs font-bold text-slate-400">{group.subtitle}</p>
                    </div>
                    <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                      {group.items.length} rule{group.items.length === 1 ? '' : 's'}
                    </Badge>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {group.items.map((benefit) => (
                      <div key={benefit.id} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                'rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]',
                                benefit.type === 'DISCOUNT'
                                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                                  : 'border-violet-200 bg-violet-50 text-violet-800',
                              )}
                            >
                              {benefit.type}
                            </Badge>
                            <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                              {benefit.mode}
                            </Badge>
                            <span className="text-lg font-black text-slate-900">{benefit.mode === 'PERCENT' ? `${benefit.value}%` : `৳${money(Number(benefit.value))}`}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                            <span>{monthLabel(benefit.startMonth, benefit.endMonth)}</span>
                            {benefit.approvedBy?.fullName ? <span>Approved by {benefit.approvedBy.fullName}</span> : null}
                            {benefit.reason ? <span>{benefit.reason}</span> : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-2xl border-slate-200 px-4 text-[11px] font-black uppercase tracking-[0.2em]"
                            onClick={() => openBenefitModal(benefit)}
                          >
                            <PencilLine className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-10 rounded-2xl px-4 text-[11px] font-black uppercase tracking-[0.2em] text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => handleDelete(benefit)}
                            disabled={deletingId === benefit.id}
                          >
                            {deletingId === benefit.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-indigo-100 bg-indigo-50/70 p-6 shadow-sm sm:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-600">Current coverage</p>
            <h4 className="mt-2 text-lg font-black text-slate-900">Courses receiving active benefits</h4>
            <div className="mt-5 space-y-3">
              {enrollments
                .filter((enrollment) => String(enrollment.status).toUpperCase() === 'ACTIVE')
                .flatMap((enrollment) => (enrollment.enrollmentCourses ?? []).map((ec) => ({ ...ec, enrollmentId: enrollment.id })))
                .map((ec) => {
                  const courseBenefits = activeBenefits.filter((benefit) => benefit.courseId === ec.courseId || benefit.courseId === null);
                  return (
                    <div key={ec.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-sm ring-1 ring-indigo-100">
                      <div>
                        <p className="text-sm font-black text-slate-900">{ec.course?.name}</p>
                        <p className="text-xs font-medium text-slate-400">{ec.course?.slug || 'Course'}</p>
                      </div>
                      <div className="flex items-center gap-2 text-indigo-700">
                        <span className="text-sm font-black">{courseBenefits.length}</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2 text-slate-500">
              <CreditCard className="h-4 w-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.28em]">Invoice replacement rule</p>
            </div>
            <div className="mt-4 space-y-3 text-sm font-medium leading-relaxed text-slate-600">
              <p>When a benefit changes, the system recalculates current invoice totals from the latest benefit set.</p>
              <p>Open invoices are marked cancelled and a replacement invoice is created automatically.</p>
              <p>Paid invoices are preserved and never rewritten.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}