'use client';

import { AlertTriangle, Check, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { fmt } from '../utils';
import { StudentAdminBadge as AppBadge } from '../components/StudentAdminBadge';
import { statusBadgeColor, statusLabel } from './collect-payment-modal-utils';
import { CollectPaymentCourseWaiverPanel } from './CollectPaymentCourseWaiverPanel';
import { PAYMENT_METHODS } from './hooks/useCollectPaymentModal';
import type { CollectPaymentModalController } from './hooks/useCollectPaymentModal';

export function CollectPaymentRightPanel({ ctrl }: { ctrl: CollectPaymentModalController }) {
  const {
    monthStatus,
    isSelectedMonthly,
    totalPayable,
    totalMonthlyScholarship,
    totalAdditionalDiscount,
    totalWaived,
    totalSettlement,
    totalAlreadyPaid,
    addDiscount,
    setAddDiscount,
    discountCapped,
    discountable,
    effectiveNetDue,
    admissionDue,
    effectiveCourseDue,
    nextInstallmentDue,
    paymentAmount,
    setPaymentAmount,
    method,
    setMethod,
    trxId,
    setTrxId,
    trxIdRequired,
    trxIdValid,
    saving,
    loadingInvoices,
    submitError,
    collectBlockedByWaiver,
    canCollectPayment,
    handleCollectPayment,
    lastPaidInvoiceId,
    openInvoicePdf,
    downloadInvoicePdf,
    invoices,
    displayInvoices,
    selectedMonth,
    pdfLoading,
    auditTrail,
  } = ctrl;

  return (
        <div className="min-w-0 xl:sticky xl:top-0 xl:self-start">
          {['PAID', 'PAID_WITH_WAIVER', 'WAIVED', 'SETTLED'].includes(monthStatus) ? (
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center mb-3.5 sm:p-6">
                <div className="flex justify-center mb-3">
                  <AppBadge
                    label={`✓ ${statusLabel(monthStatus)}`}
                    color={statusBadgeColor[monthStatus] ?? 'slate'}
                  />
                </div>
                <p className="text-sm text-slate-500">
                  {monthStatus === 'PAID'
                    ? isSelectedMonthly ? 'This month has been fully paid by cash.' : 'This program invoice has been fully paid.'
                    : monthStatus === 'WAIVED'
                    ? isSelectedMonthly ? 'This month has been waived — no payment required.' : 'This program invoice has been waived — no payment required.'
                    : isSelectedMonthly ? 'This month is settled; due is zero but not only from cash payment.' : 'This program invoice is settled; due is zero.'}
                </p>
              </div>
              <CollectPaymentCourseWaiverPanel ctrl={ctrl} />
            </>
          ) : (
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-3.5 sm:p-4">
                <div className="flex justify-between gap-3 mb-2">
                  <span className="text-sm text-slate-500">Total payable</span>
                  <span className="shrink-0 font-bold text-sm">{fmt(totalPayable)}</span>
                </div>
                {totalMonthlyScholarship > 0 && (
                  <div className="flex justify-between gap-3 mb-2">
                    <span className="text-sm text-slate-500">Monthly scholarship(−)</span>
                    <span className="shrink-0 font-semibold text-sm text-rose-600">−{fmt(totalMonthlyScholarship)}</span>
                  </div>
                )}
                {totalAdditionalDiscount > 0 && (
                  <div className="flex justify-between gap-3 mb-2">
                    <span className="text-sm text-slate-500">Additional discount(−)</span>
                    <span className="shrink-0 font-semibold text-sm text-blue-600">−{fmt(totalAdditionalDiscount)}</span>
                  </div>
                )}
                {totalWaived > 0 && (
                  <div className="flex justify-between gap-3 mb-2">
                    <span className="text-sm text-slate-500">Waived(−)</span>
                    <span className="shrink-0 font-semibold text-sm text-purple-600">−{fmt(totalWaived)}</span>
                  </div>
                )}
                {totalSettlement !== 0 && (
                  <div className="flex justify-between gap-3 mb-2">
                    <span className="text-sm text-slate-500">Settlement</span>
                    <span className={cn('shrink-0 font-semibold text-sm', totalSettlement > 0 ? 'text-emerald-600' : 'text-amber-600')}>
                      {totalSettlement > 0 ? '−' : '+'}{fmt(Math.abs(totalSettlement))}
                    </span>
                  </div>
                )}
                {totalAlreadyPaid > 0 && (
                  <div className="flex justify-between gap-3 mb-2">
                    <span className="text-sm text-slate-500">Already paid(−)</span>
                    <span className="shrink-0 font-semibold text-sm text-emerald-600">−{fmt(totalAlreadyPaid)}</span>
                  </div>
                )}
                {isSelectedMonthly && (
                  <>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Collect-time additional discount(−)</p>
                    <Input
                      type="number"
                      min={0}
                      value={addDiscount}
                      onChange={e => setAddDiscount(e.target.value)}
                      className="text-right focus-visible:ring-indigo-400"
                    />
                    {discountCapped && (
                      <p className="mt-1 mb-2 text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        Capped at {fmt(discountable)} — admission fees cannot be discounted.
                      </p>
                    )}
                    {!discountCapped && <div className="mb-3" />}
                  </>
                )}
                <div className="bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5 mb-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-sm text-slate-900">Due amount</span>
                    <span className="shrink-0 text-right text-xl font-black text-rose-700 sm:text-2xl">{fmt(effectiveNetDue)}</span>
                  </div>
                </div>

                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment Amount</p>
                <div className="grid gap-1.5 mb-2">
                  {[
                    { label: 'Pay Admission Due', amount: admissionDue, disabled: admissionDue <= 0 },
                    {
                      label: isSelectedMonthly ? 'Pay Monthly Course Due' : 'Pay One-Time Course Due',
                      amount: effectiveCourseDue,
                      disabled: effectiveCourseDue <= 0 || admissionDue > 0,
                    },
                    ...(nextInstallmentDue.amount > 0 && nextInstallmentDue.label
                      ? [{
                          label: `Pay ${nextInstallmentDue.label}`,
                          amount: nextInstallmentDue.amount,
                          disabled: nextInstallmentDue.amount <= 0,
                        }]
                      : []),
                    { label: 'Pay Full Due', amount: effectiveNetDue, disabled: effectiveNetDue <= 0 },
                  ].map(action => (
                    <button
                      key={action.label}
                      type="button"
                      disabled={action.disabled}
                      onClick={() => setPaymentAmount(String(Math.min(action.amount, effectiveNetDue)))}
                      className={cn(
                        'flex justify-between gap-3 px-2.5 py-1.5 rounded-md border text-xs font-bold transition-colors',
                        action.disabled
                          ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700 cursor-pointer',
                      )}
                    >
                      <span className="min-w-0 text-left">{action.label}</span>
                      <span className="shrink-0">{fmt(action.amount)}</span>
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  min={0}
                  max={effectiveNetDue}
                  value={paymentAmount}
                  onChange={e => {
                    const val = Number(e.target.value) || 0;
                    setPaymentAmount(val > effectiveNetDue ? String(effectiveNetDue) : e.target.value);
                  }}
                  placeholder={fmt(effectiveNetDue)}
                  className="text-right focus-visible:ring-indigo-400 mb-2"
                />
                {paymentAmount && Number(paymentAmount) < effectiveNetDue && (
                  <p className="text-xs text-amber-700 font-semibold mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    Partial payment: {fmt(Number(paymentAmount))} of {fmt(effectiveNetDue)} will be collected and distributed equally among due course rows after any admission due is covered.
                  </p>
                )}
              </div>

              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Method</p>
              <div className="grid grid-cols-2 gap-2 mb-3.5 sm:grid-cols-3 xl:grid-cols-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      'flex min-w-0 items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg border-2 text-xs font-bold transition-all cursor-pointer sm:text-sm',
                      method === m.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                    )}
                  >
                    <span className="shrink-0">{m.icon}</span> <span className="truncate">{m.label}</span>
                    {method === m.id && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                  </button>
                ))}
              </div>

              {trxIdRequired && (
                <div className="mb-3.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Transaction ID <span className="text-rose-600">*</span>
                  </p>
                  <Input
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="Enter payment reference / trx ID"
                    className={cn(
                      'focus-visible:ring-indigo-400',
                      !trxIdValid && trxId.length > 0 && 'border-rose-300',
                    )}
                  />
                  {!trxIdValid && (
                    <p className="mt-1 text-[11px] font-semibold text-rose-600">
                      Transaction ID is required for {method} payments (min 4 characters).
                    </p>
                  )}
                </div>
              )}

              {collectBlockedByWaiver && (
                <p className="mb-3 text-xs font-semibold text-amber-800 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Confirm or cancel the course waiver before collecting payment.
                </p>
              )}

              {submitError && (
                <p className="mb-3 text-sm font-semibold text-rose-600 flex items-start gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  {submitError}
                </p>
              )}

              <Button
                className="w-full gap-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-all mb-3"
                disabled={!canCollectPayment}
                onClick={() => void handleCollectPayment()}
              >
                <Check className="h-4 w-4" /> {saving ? 'Processing…' : `Collect ${method} Payment`}
              </Button>

              {lastPaidInvoiceId && (
                <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-700" />
                    <p className="text-sm font-bold text-emerald-900">Payment recorded</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openInvoicePdf(lastPaidInvoiceId)}
                      disabled={pdfLoading === `view:${lastPaidInvoiceId}`}
                      className="gap-1.5 border-emerald-200 bg-white text-xs text-emerald-800 hover:bg-emerald-100"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View invoice
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const invoice = invoices.find(inv => inv.id === lastPaidInvoiceId) ?? displayInvoices.find(inv => inv.id === lastPaidInvoiceId);
                        void downloadInvoicePdf(invoice ?? { id: lastPaidInvoiceId, month: selectedMonth });
                      }}
                      disabled={pdfLoading === `download:${lastPaidInvoiceId}`}
                      className="gap-1.5 border-emerald-200 bg-white text-xs text-emerald-800 hover:bg-emerald-100"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  </div>
                </div>
              )}

              <CollectPaymentCourseWaiverPanel ctrl={ctrl} />
            </>
          )}
          <div className="mt-3.5 rounded-xl border border-slate-200 bg-white p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Settlement / Audit Trail</p>
              <AppBadge label={auditTrail.length ? `${auditTrail.length}` : 'Clear'} color={auditTrail.length ? 'slate' : 'green'} />
            </div>
            {auditTrail.length > 0 ? (
              <div className="space-y-2">
                {auditTrail.slice(0, 8).map((entry, index) => (
                  <div key={`${entry.label}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                    <div className="mb-1">
                      <AppBadge label={entry.label} color={entry.tone} />
                    </div>
                    <p className="break-words text-xs font-semibold text-slate-600">{entry.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-400">No waiver, discount, or settlement adjustment for this selected group.</p>
            )}
          </div>
        </div>
  );
}
