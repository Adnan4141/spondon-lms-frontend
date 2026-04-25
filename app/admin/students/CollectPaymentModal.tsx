'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getEnrollments } from '@/lib/api/enrollments';
import { generateAdvanceInvoices, getInvoicePdfUrl, getInvoices, processMonthPayment } from '@/lib/api/invoices';
import type { BadgeColor } from './StudentAdminBadge';
import type { Enrollment, Invoice, Student } from './types';
import { fmt, fmtMonth, normPdfUrl, toLocalEnrollment } from './utils';
import { StudentAdminBadge as AppBadge } from './StudentAdminBadge';
import { StudentAdminModal as AppModal } from './StudentAdminModal';

export function CollectPaymentModal({
  student, onClose, onSave,
}: {
  student: Student;
  onClose: () => void;
  onSave: (data: { student: Student; month: string; method: string; amount: number }) => void;
}) {
  const [selMonth, setSelMonth] = useState('');
  const [method, setMethod] = useState('CASH');
  const [addDiscount, setAddDiscount] = useState('0');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const [waiving, setWaiving] = useState(false);
  const [waiveReason, setWaiveReason] = useState('');
  const [waiveSubmitting, setWaiveSubmitting] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  // Prevent StrictMode double-invoke from firing generateAdvanceInvoices twice per mount
  const advanceFiredRef = useRef(false);

  // bgRefresh = true means: quietly re-fetch without showing a spinner (used after background advance generation)
  const fetchInvoices = async (bgRefresh = false) => {
    if (!bgRefresh) {
      setLoadingInvoices(true);
      setFetchError(null);
    }
    try {
      const [res, enrollRes] = await Promise.all([
        getInvoices({ studentUserId: student.id, limit: 200 }),
        getEnrollments({ studentUserId: student.id, limit: 50 }),
      ]);
      if (enrollRes.success && enrollRes.data) {
        setEnrollments(enrollRes.data.map(toLocalEnrollment));
      }
      const mapped: Invoice[] = (res.data ?? []).map(inv => ({
        id: inv.id,
        month: inv.month ?? '',
        amount: Number(inv.payableAmount),
        paidAmount: Number(inv.paidAmount),
        status: (
          inv.status === 'PAID' ? 'PAID'
          : inv.status === 'WAIVED' ? 'WAIVED'
          : inv.status === 'PARTIAL' ? 'PARTIAL'
          : 'DUE'
        ) as Invoice['status'],
        dueDate: inv.nextPaymentDueDate ?? '',
        branchName: (inv as { branch?: { name?: string } }).branch?.name,
        items: (inv as { items?: { title: string; unitPrice: number; qty: number; type?: string }[] }).items,
      }));
      // Sort descending so mapped[0] is most-recent for default selection logic below
      mapped.sort((a, b) => b.month.localeCompare(a.month));
      setInvoices(mapped);
      if (!bgRefresh) {
      // Sort ascending to find the earliest (oldest) unpaid/partial month
      const sortedAsc = [...mapped].sort((a, b) => a.month.localeCompare(b.month));
      const firstUnpaidOrPartial = sortedAsc.find(i => i.status === 'DUE' || i.status === 'PARTIAL');
      if (firstUnpaidOrPartial) setSelMonth(firstUnpaidOrPartial.month);
      else if (sortedAsc.length > 0) setSelMonth(sortedAsc[sortedAsc.length - 1].month); // latest if all settled
        // Fire advance invoice generation in background — do NOT await it.
        // Guard: only fire once per mount (StrictMode double-invokes useEffect in dev).
        if (!advanceFiredRef.current) {
          advanceFiredRef.current = true;
          generateAdvanceInvoices({ studentUserId: student.id, months: 12 })
            .catch(() => {})
            .then(() => fetchInvoices(true)); // silent refresh when done
        }
      }
    } catch (err) {
      if (!bgRefresh) setFetchError((err as Error).message ?? 'Failed to load invoices');
    } finally {
      if (!bgRefresh) setLoadingInvoices(false);
    }
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

  const methods = [
    { id: 'CASH', label: 'Cash', icon: '💵' },
    { id: 'BKASH', label: 'bKash', icon: '🔴' },
    { id: 'NAGAD', label: 'Nagad', icon: '🟠' },
    { id: 'CARD', label: 'Card', icon: '💳' },
    { id: 'CHEQUE', label: 'Cheque', icon: '📄' },
  ];

  // ── Aggregate status per month ──────────────────────────────────────────────
  const monthGroups = useMemo(() => {
    const map = new Map<string, Invoice[]>();
    for (const inv of invoices) {
      if (!map.has(inv.month)) map.set(inv.month, []);
      map.get(inv.month)!.push(inv);
    }
    return map;
  }, [invoices]);

  // Build the full month range from enrollment dates, merged with invoice months
  const allMonths = useMemo(() => {
    const monthSet = new Set<string>(monthGroups.keys());
    for (const enr of enrollments) {
      if (!enr.billingStartMonth) continue;
      // Find the latest endMonth across all courses in this enrollment
      const ends = enr.courses.map(c => c.endMonth).filter(Boolean);
      const endMonth = ends.length > 0 ? ends.reduce((a, b) => (a > b ? a : b)) : '';
      if (!endMonth) continue;
      // Walk month-by-month and add all months in range
      let cur = enr.billingStartMonth;
      while (cur <= endMonth) {
        monthSet.add(cur);
        const [y, mo] = cur.split('-').map(Number);
        // Use UTC to avoid timezone-shift bugs (local midnight → prev day in UTC)
        const next = new Date(Date.UTC(y, mo, 1)); // mo is 1-based; Date.UTC(y, mo) = next month
        cur = next.toISOString().slice(0, 7);
      }
    }
    // Ascending order: Jan 2026 → Dec 2026 (natural billing timeline)
    return [...monthSet].sort((a, b) => a.localeCompare(b));
  }, [monthGroups, enrollments]);

  const displayInvoices = useMemo(
    () => monthGroups.get(selMonth) ?? [],
    [monthGroups, selMonth],
  );

  const getMonthAggStatus = (invs: Invoice[]): 'PAID' | 'WAIVED' | 'PARTIAL' | 'DUE' => {
    if (!invs.length) return 'DUE';
    if (invs.every(i => i.status === 'PAID')) return 'PAID';
    if (invs.every(i => i.status === 'WAIVED' || i.status === 'PAID')) return 'WAIVED';
    if (invs.some(i => i.status === 'PARTIAL' || i.paidAmount > 0)) return 'PARTIAL';
    return 'DUE';
  };

  const statusBadgeColor: Record<string, BadgeColor> = {
    PAID: 'green', WAIVED: 'purple', PARTIAL: 'amber', DUE: 'red',
  };

  const totalPayable = displayInvoices.reduce((s, i) => s + i.amount, 0);
  const totalAlreadyPaid = displayInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const admissionFeeTotal = displayInvoices.reduce((s, inv) =>
    s + (inv.items ?? []).filter(it => it.type === 'ADMISSION_FEE').reduce((a, it) => a + it.unitPrice * it.qty, 0), 0);
  const discountable = Math.max(0, totalPayable - admissionFeeTotal);
  const requestedDiscount = Number(addDiscount) || 0;
  const discount = Math.min(requestedDiscount, discountable);
  // Remaining due = (payable − additional discount) − already paid
  const netDue = Math.max(0, totalPayable - discount - totalAlreadyPaid);
  const discountCapped = requestedDiscount > discountable && discountable >= 0 && requestedDiscount > 0;
  const monthStatus = getMonthAggStatus(displayInvoices);
  const canWaive = displayInvoices.every(i => i.paidAmount <= 0);

  const handleWaive = async () => {
    if (waiveReason.trim().length < 5) return;
    setWaiveSubmitting(true);
    try {
      await processMonthPayment({
        studentUserId: student.id,
        month: selMonth,
        waive: true,
        waiveReason: waiveReason.trim(),
      });
      setWaiving(false);
      setWaiveReason('');
      fetchInvoices();
    } finally {
      setWaiveSubmitting(false);
    }
  };

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
                  onClick={() => fetchInvoices()}
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
                  const aggStatus = getMonthAggStatus(monthGroups.get(m) ?? []);
                  return (
                    <button
                      key={m}
                      onClick={() => { setSelMonth(m); setWaiving(false); setWaiveReason(''); setAddDiscount('0'); setPaymentAmount(''); }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-bold transition-colors cursor-pointer',
                        selMonth === m
                          ? 'border-rose-300 bg-rose-50 text-rose-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                      )}
                    >
                    {fmtMonth(m)}
                      <AppBadge label={aggStatus} color={statusBadgeColor[aggStatus] ?? 'red'} />
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
            {displayInvoices.length > 0 ? (
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
                  {displayInvoices.map(inv => (
                    <Fragment key={inv.id}>
                      <tr className="border-b border-slate-100">
                        <td className="px-3 py-2.5 font-semibold text-slate-900">
                          {fmtMonth(inv.month)} — Monthly Fee
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 text-xs">{inv.branchName || '—'}</td>
                        <td className="px-3 py-2.5">
                          {inv.status === 'PARTIAL' ? (
                            <>
                              <span className="font-bold text-rose-700 block">{fmt(inv.amount - inv.paidAmount)}</span>
                              <span className="text-[11px] text-emerald-600 font-semibold">{fmt(inv.paidAmount)} paid</span>
                            </>
                          ) : (
                            <span className="font-bold text-rose-700">{fmt(inv.amount)}</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <AppBadge
                            label={inv.status}
                            color={
                              inv.status === 'PAID' ? 'green'
                              : inv.status === 'WAIVED' ? 'purple'
                              : inv.status === 'PARTIAL' ? 'amber'
                              : 'red'
                            }
                          />
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
                    </Fragment>
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
          {monthStatus === 'PAID' || monthStatus === 'WAIVED' ? (
            /* Already settled — show status instead of payment form */
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center mb-3.5">
              <div className="flex justify-center mb-3">
                <AppBadge
                  label={monthStatus === 'PAID' ? '✓ Payment Complete' : '✓ Month Waived'}
                  color={monthStatus === 'PAID' ? 'green' : 'purple'}
                />
              </div>
              <p className="text-sm text-slate-500">
                {monthStatus === 'PAID'
                  ? 'This month has been fully paid.'
                  : 'This month has been waived — no payment required.'}
              </p>
            </div>
          ) : (
            /* Payment form */
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3.5">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-500">Total payable</span>
                  <span className="font-bold text-sm">{fmt(totalPayable)}</span>
                </div>
                {totalAlreadyPaid > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-500">Already paid(−)</span>
                    <span className="font-semibold text-sm text-emerald-600">−{fmt(totalAlreadyPaid)}</span>
                  </div>
                )}
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
                  className="text-right focus-visible:ring-indigo-400"
                />
                {discountCapped && (
                  <p className="mt-1 mb-2 text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    Capped at {fmt(discountable)} — admission fees cannot be discounted.
                  </p>
                )}
                {!discountCapped && <div className="mb-3" />}
                <div className="bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-900">Due amount</span>
                    <span className="font-black text-2xl text-rose-700">{fmt(netDue)}</span>
                  </div>
                </div>

                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment Amount (Enter amount or leave blank for full payment)</p>
                <Input
                  type="number"
                  min={0}
                  max={netDue}
                  value={paymentAmount}
                  onChange={e => {
                    const val = Number(e.target.value) || 0;
                    setPaymentAmount(val > netDue ? String(netDue) : e.target.value);
                  }}
                  placeholder={fmt(netDue)}
                  className="text-right focus-visible:ring-indigo-400 mb-2"
                />
                {paymentAmount && Number(paymentAmount) < netDue && (
                  <p className="text-xs text-amber-700 font-semibold mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    Partial payment: {fmt(Number(paymentAmount))} of {fmt(netDue)} will be collected
                  </p>
                )}
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
                className="w-full gap-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-all mb-3"
                disabled={(paymentAmount ? Number(paymentAmount) <= 0 : netDue <= 0) || saving || loadingInvoices}
                onClick={async () => {
                  const amountToCollect = paymentAmount ? Number(paymentAmount) : netDue;
                  if (amountToCollect <= 0) return;
                  setSaving(true);
                  try {
                    const payResult = await processMonthPayment({
                      studentUserId: student.id,
                      month: selMonth,
                      payment: { amount: amountToCollect, method },
                    });
                    setPaymentAmount('');
                    await fetchInvoices(true); // silent refresh — updates invoice status/paidAmount before modal closes
                    // Auto-open updated invoice PDF in a new tab
                    const invoiceId = payResult?.data?.invoice?.id;
                    if (invoiceId) openInvoicePdf(invoiceId);
                    onSave({ student, month: selMonth, method, amount: amountToCollect });
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <Check className="h-4 w-4" /> {saving ? 'Processing…' : `Collect ${method} Payment`}
              </Button>

              {/* Waive this month */}
              <div className="border-t border-slate-100 pt-3">
                {!waiving ? (
                  <button
                    onClick={() => setWaiving(true)}
                    disabled={!canWaive || displayInvoices.length === 0}
                    title={!canWaive ? 'Cannot waive: payment already received for this month' : 'Mark this month as waived without payment'}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors cursor-pointer',
                      canWaive && displayInvoices.length > 0
                        ? 'border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100'
                        : 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed',
                    )}
                  >
                    Waive This Month
                  </button>
                ) : (
                  <div className="border border-purple-200 rounded-xl p-3.5 bg-purple-50">
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1.5">
                      Waive Reason <span className="text-rose-600">*</span>
                    </p>
                    <textarea
                      value={waiveReason}
                      onChange={e => setWaiveReason(e.target.value)}
                      placeholder="Enter reason for waiving this month (min 5 characters)…"
                      rows={2}
                      className="w-full text-sm border border-purple-200 rounded-lg px-3 py-2 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 mb-2"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setWaiving(false); setWaiveReason(''); }}
                        className="flex-1 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleWaive}
                        disabled={waiveReason.trim().length < 5 || waiveSubmitting}
                        className="flex-1 text-xs bg-purple-600 text-white hover:bg-purple-700 gap-1"
                      >
                        <Check className="h-3 w-3" />
                        {waiveSubmitting ? 'Waiving…' : 'Confirm Waive'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AppModal>
  );
}
