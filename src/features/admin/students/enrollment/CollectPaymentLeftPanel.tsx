'use client';

import { Fragment } from 'react';
import { AlertTriangle, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fmt, fmtMonth } from '../utils';
import { StudentAdminBadge as AppBadge } from '../components/StudentAdminBadge';
import { statusBadgeColor, statusLabel, parseInstallmentInfo, resolveInvoiceDue } from './collect-payment-modal-utils';
import { CollectPaymentInvoiceGroupButton } from './CollectPaymentInvoiceGroupButton';
import { EnrollmentAccessControls } from './EnrollmentAccessControls';
import type { CollectPaymentModalController } from './hooks/useCollectPaymentModal';

export function CollectPaymentLeftPanel({ ctrl }: { ctrl: CollectPaymentModalController }) {
  const {
    isSelectedMonthly,
    billingRangeSummaries,
    selectedMonth,
    fetchError,
    fetchInvoices,
    advanceNotice,
    setAdvanceNotice,
    loadingInvoices,
    generatingAdvance,
    oneTimeGroups,
    monthlyGroups,
    invoiceGroups,
    displayInvoices,
    selectedProgramNames,
    totalDueForMonth,
    pdfLoading,
    downloadInvoicePdf,
    enrollments,
    reloadEnrollments,
  } = ctrl;

  return (
        <div className="min-w-0">
          {enrollments.length > 0 && (
            <div className="mb-4 space-y-3">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{enrollment.programName || 'Enrollment'}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Status: {enrollment.status} · Access: {enrollment.accessStatus || 'NO_ACCESS'}
                        {enrollment.accessHoldExempt ? ' · Exempt from bulk due blocks' : ''}
                      </p>
                      {enrollment.accessStatus === 'NO_ACCESS' && (
                        <p className="mt-1 text-xs font-semibold text-rose-700">
                          Portal access blocked — restore after payment or admin approval.
                        </p>
                      )}
                    </div>
                    <EnrollmentAccessControls
                      enrollment={enrollment}
                      compact
                      onUpdated={reloadEnrollments}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {isSelectedMonthly && billingRangeSummaries.length > 0 && (
            <div className="mb-4 rounded-2xl border border-sky-200 bg-[linear-gradient(135deg,rgba(240,249,255,1),rgba(248,250,252,1))] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Monthly Billing Window</p>
                  <div className="mt-3 grid gap-2 lg:grid-cols-2">
                {billingRangeSummaries.map(summary => (
                  <div key={summary.id} className="rounded-xl border border-sky-100 bg-white px-3 py-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900" title={summary.programName}>{summary.programName}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {fmtMonth(summary.startMonth)} to {summary.endMonth ? fmtMonth(summary.endMonth) : 'Ongoing'}
                        </p>
                      </div>
                      <AppBadge label={summary.status.replace(/_/g, ' ')} color={summary.status === 'ACTIVE' ? 'green' : summary.status === 'PENDING_PAYMENT' ? 'amber' : 'slate'} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-600">
                      <span className="rounded-full bg-sky-50 px-2 py-1 text-sky-700">
                        {summary.monthCount ? `${summary.monthCount} month${summary.monthCount !== 1 ? 's' : ''}` : 'Open-ended'}
                      </span>
                      {selectedMonth && (!summary.startMonth || summary.startMonth <= selectedMonth) && (!summary.endMonth || selectedMonth <= summary.endMonth) && (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Covers {fmtMonth(selectedMonth)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
                </div>
            
              </div>
             
            </div>
          )}

          <div className="mb-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Invoice Groups</p>
            {fetchError ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <p className="text-sm text-rose-700 flex-1">{fetchError}</p>
                <button
                  onClick={() => fetchInvoices()}
                  className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                {advanceNotice && isSelectedMonthly && (
                  <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-900 flex-1">{advanceNotice}</p>
                    <button
                      type="button"
                      onClick={() => setAdvanceNotice(null)}
                      className="text-xs font-bold text-amber-800 hover:underline cursor-pointer shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
                {generatingAdvance && (
                  <div className="mb-3 flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-600" />
                    <p className="text-sm font-medium text-sky-800">Generating monthly invoices…</p>
                  </div>
                )}
                {loadingInvoices ? (
                  <p className="text-sm text-slate-400">Loading invoices…</p>
                ) : (
                  <div className={cn('space-y-3', generatingAdvance && 'pointer-events-none opacity-60')}>
                    {oneTimeGroups.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">One-Time Programs</p>
                        <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto pr-1">
                          {oneTimeGroups.map(group => <CollectPaymentInvoiceGroupButton key={group.key} ctrl={ctrl} group={group} />)}
                        </div>
                      </div>
                    )}
                    {monthlyGroups.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Monthly Programs</p>
                        <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pr-1 sm:max-h-44">
                          {monthlyGroups.map(group => <CollectPaymentInvoiceGroupButton key={group.key} ctrl={ctrl} group={group} />)}
                        </div>
                      </div>
                    )}
                    {invoiceGroups.length === 0 && (
                      <p className="text-sm font-medium text-slate-500">No invoices are available for this student.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Invoices — {isSelectedMonthly && selectedMonth ? fmtMonth(selectedMonth) : 'One-Time / Program'}
                  </p>
                  {selectedProgramNames.length > 0 && (
                    <p className="mt-1 max-w-[520px] truncate text-sm font-bold text-slate-900" title={selectedProgramNames.join(', ')}>
                      {selectedProgramNames.join(', ')}
                    </p>
                  )}
                  {displayInvoices.length > 0 && (
                    <div className="mt-1 flex items-center gap-2 text-[11px] font-bold text-slate-500">
                      <span>{displayInvoices.length} invoice{displayInvoices.length !== 1 ? 's' : ''}</span>
                      <span className="text-rose-600">Due {fmt(totalDueForMonth)}</span>
                    </div>
                  )}
                </div>
                {displayInvoices.length > 0 && (
                  <div className="flex max-w-full flex-wrap justify-end gap-1.5">
                    {displayInvoices.map(inv => (
                      <div
                        key={`invoice-actions-${inv.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1 shadow-sm"
                      >
                     
                       
                        <button
                          type="button"
                          onClick={() => downloadInvoicePdf(inv)}
                          disabled={pdfLoading === `download:${inv.id}`}
                          title={`Download invoice ${inv.invoiceNumber ?? '#' + inv.id.slice(0, 8)}`}
                          className="inline-flex items-center cursor-pointer  gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {displayInvoices.length > 0 ? (
              <div className="overflow-x-auto [scrollbar-color:rgb(203_213_225)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400">
                <table className="min-w-[860px] w-full border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="bg-slate-50/50">
                      {['Invoice', 'Branch', 'Gross', 'Payable', 'Paid', 'Due', 'Status'].map(h => (
                        <th
                          key={h}
                          className="border-b border-slate-200 px-3 py-2 text-left align-top text-[11px] font-bold uppercase text-slate-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                  {displayInvoices.map(inv => {
                    const invoiceDue = resolveInvoiceDue(inv);
                    return (
                    <Fragment key={inv.id}>
                      <tr className="border-b border-slate-100">
                        <td className="max-w-[280px] border-b border-slate-100 px-3 py-2.5 align-top font-semibold text-slate-900">
                          {inv.billingType === 'MONTHLY' && inv.month ? `${fmtMonth(inv.month)} — Monthly Invoice` : 'One-Time / Program Invoice'}
                          <span className="block font-mono text-[11px] font-bold text-slate-400">{inv.invoiceNumber ?? `#${inv.id.slice(0, 8)}`}</span>
                          {inv.dueDate ? <span className="block text-[11px] font-medium text-slate-400">Due {inv.dueDate}</span> : null}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-2.5 align-top text-xs text-slate-500">{inv.branchName || '—'}</td>
                        <td className="border-b border-slate-100 px-3 py-2.5 align-top">
                          <span className="font-bold text-slate-900">{fmt((inv.items ?? []).reduce((sum, item) => sum + Number(item.grossAmount ?? item.unitPrice * item.qty), 0))}</span>
                        </td>
                        <td className="border-b border-slate-100 px-3 py-2.5 align-top">
                          <span className="font-bold text-slate-900">{fmt(inv.amount)}</span>
                          {(inv.monthlyDiscountAmount || inv.discountAmount || inv.waivedAmount) ? (
                            <span className="block text-[11px] font-semibold text-slate-400">
                              {inv.monthlyDiscountAmount ? `Scholarship -${fmt(inv.monthlyDiscountAmount)}` : ''}
                              {inv.monthlyDiscountAmount && inv.discountAmount ? ' · ' : ''}
                              {inv.discountAmount ? `Add. discount -${fmt(inv.discountAmount)}` : ''}
                              {(inv.monthlyDiscountAmount || inv.discountAmount) && inv.waivedAmount ? ' · ' : ''}
                              {inv.waivedAmount ? `Waived -${fmt(inv.waivedAmount)}` : ''}
                            </span>
                          ) : null}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-2.5 align-top">
                          <span className="font-semibold text-emerald-600">{fmt(inv.paidAmount)}</span>
                        </td>
                        <td className="border-b border-slate-100 px-3 py-2.5 align-top">
                          <span className={cn('font-bold', invoiceDue > 0 ? 'text-rose-700' : 'text-slate-400')}>
                            {fmt(invoiceDue)}
                          </span>
                        </td>
                        <td className="border-b border-slate-100 px-3 py-2.5 align-top">
                          <AppBadge
                            label={inv.displayLabel ?? statusLabel(inv.displayStatus ?? inv.status)}
                            color={statusBadgeColor[inv.displayStatus ?? inv.status] ?? 'red'}
                          />
                        </td>
                      </tr>
                      {inv.items?.map((item, ii) => {
                        const itemGross = Number(item.grossAmount ?? item.unitPrice * item.qty);
                        const itemDiscount = Number(item.discountAmount ?? 0);
                        const itemWaived = Number(item.waivedAmount ?? 0);
                        const itemTotal = Number(item.payableAmount ?? item.unitPrice * item.qty);
                        const itemPaid = Number(item.paidAmount ?? 0);
                        const itemDue = Number(item.dueAmount ?? Math.max(0, itemTotal - itemPaid));
                        const installment = parseInstallmentInfo(item);
                        return (
                          <tr key={`${inv.id}-item-${ii}`} className="bg-slate-50/60 border-b border-slate-100">
                            <td className="max-w-[280px] border-b border-slate-100 px-3 py-1.5 pl-7 align-top text-xs text-slate-500">
                              <span className="inline-block max-w-full truncate align-bottom">↳ {item.title}</span>
                              {installment && (
                                <AppBadge
                                  label={`Inst ${installment.number}/${installment.total}`}
                                  color="purple"
                                />
                              )}
                              {item.qty > 1 && <span className="text-slate-400 ml-1">×{item.qty}</span>}
                            </td>
                            <td className="border-b border-slate-100 px-3 py-1.5 align-top text-xs text-slate-400">—</td>
                            <td className="border-b border-slate-100 px-3 py-1.5 align-top text-xs text-slate-500">
                              {fmt(itemGross)}
                            </td>
                            <td className="border-b border-slate-100 px-3 py-1.5 align-top text-xs font-semibold text-slate-600">
                              {fmt(itemTotal)}
                              {(itemDiscount > 0 || itemWaived > 0) && (
                                <span className="block text-[10px] font-semibold text-slate-400">
                                  {itemDiscount > 0 ? `Discount -${fmt(itemDiscount)}` : ''}
                                  {itemDiscount > 0 && itemWaived > 0 ? ' · ' : ''}
                                  {itemWaived > 0 ? `Waived -${fmt(itemWaived)}` : ''}
                                </span>
                              )}
                            </td>
                            <td className="border-b border-slate-100 px-3 py-1.5 align-top text-xs font-semibold text-emerald-600">
                              {fmt(itemPaid)}
                            </td>
                            <td className={cn('border-b border-slate-100 px-3 py-1.5 align-top text-xs font-semibold', itemDue > 0 ? 'text-rose-600' : 'text-slate-400')}>
                              {fmt(itemDue)}
                            </td>
                            <td className="border-b border-slate-100 px-3 py-1.5 align-top">
                              <AppBadge
                                label={statusLabel(item.lineStatus)}
                                color={statusBadgeColor[item.lineStatus ?? 'DUE'] ?? 'red'}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm font-medium text-slate-500">
                No invoices are available for the selected group.
              </div>
            )}
          </div>
        </div>
  );
}
