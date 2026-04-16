'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useModalStore } from '@/store/modalStore';
import {
  getCancelPreview,
  deleteEnrollment,
  type CancelPreviewData,
  type CancelPreviewInvoice,
} from '@/lib/api/enrollments';
import {
  Ban,
  Loader2,
  TriangleAlert,
  BookOpen,
  ArrowRight,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnrollmentCancelModalProps {
  enrollmentId: string;
  enrollmentName?: string;
  onSuccess?: () => void | Promise<void>;
}

function money(v: number) {
  return v.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function InvoiceRow({ inv }: { inv: CancelPreviewInvoice }) {
  const discountChanged = inv.before.discount !== inv.after.discount;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 space-y-3',
        inv.isAllRemoved ? 'border-rose-100 bg-rose-50/40' : 'border-slate-100 bg-white',
      )}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Invoice</span>
          <span className="font-mono text-xs font-bold text-indigo-700">{inv.month}</span>
        </div>
        {inv.isAllRemoved && (
          <Badge
            variant="outline"
            className="rounded-lg border-rose-200 bg-rose-50 text-[10px] font-black uppercase tracking-widest text-rose-700"
          >
            All items removed → zeroed
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Before */}
        <div className="space-y-1 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Before</p>
          <p className="font-bold text-slate-700">Payable: ৳{money(inv.before.payable)}</p>
          <p className="font-medium text-slate-500">Due: ৳{money(inv.before.due)}</p>
          {inv.before.discount > 0 && (
            <p className="font-medium text-amber-700">Discount: ৳{money(inv.before.discount)}</p>
          )}
        </div>

        {/* After */}
        <div
          className={cn(
            'space-y-1 rounded-lg border p-3',
            inv.isAllRemoved
              ? 'border-rose-100 bg-rose-50/60'
              : 'border-emerald-100 bg-emerald-50/50',
          )}
        >
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">After</p>
          <p className="font-bold text-slate-700">Payable: ৳{money(inv.after.payable)}</p>
          <p className="font-medium text-slate-500">Due: ৳{money(inv.after.due)}</p>
          {(discountChanged || inv.after.discount > 0) && (
            <p className="font-medium text-amber-700">Discount: ৳{money(inv.after.discount)}</p>
          )}
        </div>
      </div>

      {inv.isAllRemoved && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
          <p className="text-[11px] font-bold text-rose-700">
            Invoice kept as a cancelled record — charged amount → ৳0
          </p>
        </div>
      )}
    </div>
  );
}

export function EnrollmentCancelModal({
  enrollmentId,
  enrollmentName,
  onSuccess,
}: EnrollmentCancelModalProps) {
  const { toast } = useToast();
  const { closeModal } = useModalStore();
  const [preview, setPreview] = useState<CancelPreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingPreview(true);
    getCancelPreview(enrollmentId)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setPreview(res.data);
        } else {
          toast({ title: 'Error', description: res.message || 'Could not load preview', variant: 'destructive' });
        }
      })
      .catch(() => {
        if (!cancelled) toast({ title: 'Error', description: 'Failed to load cancel preview', variant: 'destructive' });
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });
    return () => { cancelled = true; };
  }, [enrollmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      const res = await deleteEnrollment(enrollmentId);
      if (res.success) {
        toast({ title: 'Enrollment removed', description: 'Invoice amounts updated.', variant: 'success' });
        await onSuccess?.();
        closeModal();
      } else {
        toast({ title: 'Failed', description: res.message || 'Could not remove enrollment', variant: 'destructive' });
      }
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Remove failed',
        variant: 'destructive',
      });
    } finally {
      setConfirming(false);
    }
  };

  const noInvoices = preview && preview.affectedInvoices.length === 0;

  return (
    <div className="flex max-h-[min(90vh,680px)] flex-col overflow-hidden rounded-[40px] bg-white">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-slate-100 px-8 pb-6 pt-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.04),transparent_40%)]" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 shadow-sm">
            <Ban className="h-7 w-7 text-rose-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Remove enrollment</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">
              {enrollmentName ?? preview?.programName ?? 'This enrollment'}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {loadingPreview ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm font-bold text-slate-500">Calculating impact…</p>
          </div>
        ) : (
          <>
            {/* Courses in this enrollment */}
            {preview && preview.courses.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <BookOpen className="h-4 w-4" />
                  Courses being removed ({preview.courses.length})
                </h3>
                <div className="space-y-2">
                  {preview.courses.map(c => (
                    <div key={c.courseId} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm">
                      <span className="font-bold text-slate-700">{c.courseName}</span>
                      <span className="text-xs text-slate-500">
                        ৳{money(c.fee)}
                        {c.bookPrice != null && ` + বই ৳${money(c.bookPrice)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Invoice impact */}
            {!noInvoices ? (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <ArrowRight className="h-4 w-4" />
                  Invoice impact ({preview!.affectedInvoices.length} invoice
                  {preview!.affectedInvoices.length !== 1 ? 's' : ''})
                </h3>
                <div className="space-y-3">
                  {preview!.affectedInvoices.map((inv) => (
                    <InvoiceRow key={inv.invoiceId} inv={inv} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-sm font-bold text-emerald-800">
                  No outstanding invoices — no financial adjustments needed.
                </p>
              </div>
            )}

            {/* General warning */}
            <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/60 p-4">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <p className="text-sm font-bold text-rose-800">
                The enrollment will be permanently deleted. This cannot be undone.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-8 py-6 sm:flex-row">
        <Button
          variant="ghost"
          className="h-14 flex-1 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
          onClick={closeModal}
          disabled={confirming}
        >
          Keep enrollment
        </Button>
        <Button
          className="h-14 flex-2 rounded-2xl bg-rose-600 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-rose-200 transition-all hover:bg-rose-700 hover:scale-[1.02] active:scale-95"
          onClick={handleConfirm}
          disabled={loadingPreview || confirming}
        >
          {confirming ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Ban className="mr-2 h-4 w-4" />
          )}
          Confirm removal
        </Button>
      </div>
    </div>
  );
}
