'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getReportPaymentDetail, type ReportPaymentDetail } from '@/lib/api/reports';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  Banknote,
  Building2,
  CalendarDays,
  CreditCard,
  GraduationCap,
  Hash,
  Loader2,
  Phone,
  Receipt,
  RefreshCw,
  User,
  Wallet,
} from 'lucide-react';
import { fmtCur } from '../shared';

const ITEM_TYPE_BADGE: Record<string, string> = {
  COURSE: 'bg-indigo-100 text-indigo-700',
  BOOK: 'bg-amber-100 text-amber-700',
  ADMISSION_FEE: 'bg-emerald-100 text-emerald-700',
  FEE: 'bg-slate-100 text-slate-700',
  OTHER: 'bg-slate-100 text-slate-600',
};

const ITEM_TYPE_LABELS: Record<string, string> = {
  COURSE: 'Course Fee',
  BOOK: 'Book',
  ADMISSION_FEE: 'Admission Fee',
  FEE: 'Other Fee',
  OTHER: 'Other',
};

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  BKASH: 'bKash',
  BANK: 'Bank',
  GATEWAY: 'Gateway',
};

const SOURCE_LABELS: Record<string, string> = {
  ADMIN: 'Admin Enroll',
  STUDENT_SELF: 'Self Enroll',
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
  ISSUED: 'bg-blue-100 text-blue-700',
  DRAFT: 'bg-slate-100 text-slate-600',
  CANCELLED: 'bg-rose-100 text-rose-700',
  WAIVED: 'bg-purple-100 text-purple-700',
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-GB', { hour12: false });
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-5 sm:p-6">
      <div className="h-28 rounded-2xl bg-slate-100" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-24 rounded-2xl bg-slate-100" />
        <div className="h-24 rounded-2xl bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-slate-100" />
        <div className="h-16 rounded-xl bg-slate-100" />
        <div className="h-16 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof User;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={cn('text-sm font-bold text-slate-800', mono && 'font-mono')}>{value}</p>
    </div>
  );
}

export function FinancePaymentDetailModal({
  paymentId,
  open,
  onOpenChange,
}: {
  paymentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<ReportPaymentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDetail(id: string) {
    setLoading(true);
    setError(null);
    setDetail(null);
    try {
      const res = await getReportPaymentDetail(id);
      if (res.success && res.data) {
        setDetail(res.data);
      } else {
        setError(res.message || 'Payment not found');
      }
    } catch {
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open || !paymentId) {
      setDetail(null);
      setError(null);
      return;
    }
    void loadDetail(paymentId);
  }, [open, paymentId]);

  const studentInitial = detail?.student.fullName?.trim().charAt(0).toUpperCase() || '?';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(92vh,820px)] w-[calc(100vw-1rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl"
        showCloseButton
      >
        <DialogTitle className="sr-only">Payment details</DialogTitle>
        <DialogDescription className="sr-only">
          Detailed breakdown of the selected payment
        </DialogDescription>

        {loading ? (
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 opacity-90" />
            <div className="relative flex items-center justify-center gap-3 px-6 py-10 text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm font-bold">Loading payment details…</span>
            </div>
            <DetailSkeleton />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div>
              <p className="text-base font-black text-slate-900">Could not load payment</p>
              <p className="mt-1 text-sm text-slate-500">{error}</p>
            </div>
            {paymentId ? (
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => void loadDetail(paymentId)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
            ) : null}
          </div>
        ) : detail ? (
          <>
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-5 pb-5 pt-6 text-white sm:px-6">
              <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-10 left-10 h-32 w-32 rounded-full bg-indigo-300/20 blur-2xl" />

              <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-100">
                    Payment Received
                  </p>
                  <p className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                    {fmtCur(detail.payment.amount)}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full border-0 bg-white/20 px-2.5 py-0.5 text-[11px] font-black uppercase text-white backdrop-blur-sm">
                      {METHOD_LABELS[detail.payment.method] || detail.payment.method}
                    </Badge>
                    {detail.enrollmentSource ? (
                      <Badge className="rounded-full border-0 bg-white/15 px-2.5 py-0.5 text-[11px] font-black uppercase text-white/90">
                        {SOURCE_LABELS[detail.enrollmentSource] || detail.enrollmentSource}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-right backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-wider text-indigo-100">Paid at</p>
                  <p className="mt-0.5 text-sm font-bold">{formatDateTime(detail.payment.paidAt)}</p>
                  {detail.payment.trxId ? (
                    <p className="mt-1 font-mono text-[11px] text-indigo-100/90">{detail.payment.trxId}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-black text-white shadow-lg shadow-indigo-200">
                    {studentInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-black text-slate-900">{detail.student.fullName}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                      {detail.student.registrationNumber ? (
                        <span className="inline-flex items-center gap-1 font-bold">
                          <Hash className="h-3.5 w-3.5 text-slate-400" />
                          {detail.student.registrationNumber}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {detail.student.mobile}
                      </span>
                    </div>
                    {detail.student.email ? (
                      <p className="mt-1 truncate text-xs text-slate-500">{detail.student.email}</p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile
                    icon={Receipt}
                    label="Invoice"
                    value={detail.invoice.invoiceNumber || detail.invoice.id.slice(0, 12)}
                    mono
                  />
                  <InfoTile
                    icon={Building2}
                    label="Collected at"
                    value={detail.payment.collectionBranch?.name || '—'}
                  />
                  <InfoTile
                    icon={Banknote}
                    label="Billing branch"
                    value={detail.invoice.billingBranch.name}
                  />
                  <InfoTile
                    icon={User}
                    label="Received by"
                    value={detail.payment.receivedBy?.fullName || '—'}
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-indigo-500" />
                      <h3 className="text-sm font-black text-slate-900">Allocation Breakdown</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {detail.allocations.length} line{detail.allocations.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {detail.allocations.length === 0 ? (
                    <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No line-item allocations recorded for this payment.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {detail.allocations.map((row) => (
                        <div
                          key={row.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3 transition-colors hover:border-indigo-100 hover:bg-indigo-50/40"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-[10px] font-black uppercase',
                                  ITEM_TYPE_BADGE[row.itemType] || 'bg-slate-100 text-slate-600',
                                )}
                              >
                                {ITEM_TYPE_LABELS[row.itemType] || row.itemType}
                              </Badge>
                              {row.programName ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                                  <GraduationCap className="h-3 w-3" />
                                  {row.programName}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 truncate text-sm font-bold text-slate-800">
                              {row.courseName || row.itemTitle}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Line total {fmtCur(row.lineTotal)}
                            </p>
                          </div>
                          <p className="text-base font-black text-emerald-600">{fmtCur(row.amount)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-slate-500" />
                      <h3 className="text-sm font-black text-slate-900">Invoice Summary</h3>
                    </div>
                    <Badge
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase',
                        INVOICE_STATUS_COLORS[detail.invoice.status] || 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {detail.invoice.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: 'Payable', value: detail.invoice.payableAmount },
                      { label: 'Paid', value: detail.invoice.paidAmount, accent: true },
                      { label: 'Due', value: detail.invoice.dueAmount, warn: detail.invoice.dueAmount > 0 },
                      { label: 'Discount', value: detail.invoice.discountAmount },
                    ].map((cell) => (
                      <div key={cell.label} className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{cell.label}</p>
                        <p
                          className={cn(
                            'mt-0.5 text-sm font-black',
                            cell.accent && 'text-emerald-600',
                            cell.warn && 'text-amber-600',
                            !cell.accent && !cell.warn && 'text-slate-800',
                          )}
                        >
                          {fmtCur(cell.value)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    {detail.invoice.month ? (
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Month {detail.invoice.month}
                      </span>
                    ) : null}
                    {detail.invoice.issuedAt ? (
                      <span>Issued {formatDateTime(detail.invoice.issuedAt)}</span>
                    ) : null}
                  </div>
                </div>

                {detail.otherPaymentsOnInvoice.length > 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-black text-slate-900">Other payments on this invoice</h3>
                    <div className="space-y-2">
                      {detail.otherPaymentsOnInvoice.map((row) => (
                        <div
                          key={row.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2.5 text-sm"
                        >
                          <div>
                            <p className="font-bold text-slate-700">
                              {METHOD_LABELS[row.method] || row.method} · {fmtCur(row.amount)}
                            </p>
                            <p className="text-xs text-slate-400">{formatDateTime(row.paidAt)}</p>
                          </div>
                          {row.trxId ? (
                            <span className="font-mono text-[11px] text-slate-500">{row.trxId}</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
