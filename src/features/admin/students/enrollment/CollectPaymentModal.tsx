'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getEnrollments } from '@/lib/api/enrollments';
import { generateAdvanceInvoices, getInvoicePdfUrl, getInvoices, processMonthPayment, waiveMonthlyCourses } from '@/lib/api/invoices';
import type { BadgeColor } from '../components/StudentAdminBadge';
import type { Enrollment, Invoice, Student } from '../types';
import { fmt, fmtMonth, normPdfUrl, toLocalEnrollment } from '../utils';
import { StudentAdminBadge as AppBadge } from '../components/StudentAdminBadge';
import { StudentAdminModal as AppModal } from '../components/StudentAdminModal';

type DisplayStatus =
  | 'PAID'
  | 'PAID_WITH_WAIVER'
  | 'WAIVED'
  | 'PARTIALLY_WAIVED'
  | 'PARTIAL'
  | 'SETTLED'
  | 'DUE'
  | 'CANCELLED';

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
  const [lastPaidInvoiceId, setLastPaidInvoiceId] = useState<string | null>(null);
  const [waiving, setWaiving] = useState(false);
  const [waiveReason, setWaiveReason] = useState('');
  const [selectedWaiveCourseIds, setSelectedWaiveCourseIds] = useState<string[]>([]);
  const [waiveSubmitting, setWaiveSubmitting] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [advanceNotice, setAdvanceNotice] = useState<string | null>(null);
  // Prevent StrictMode double-invoke from firing generateAdvanceInvoices twice per mount
  const advanceFiredRef = useRef(false);

  // bgRefresh = true means: quietly re-fetch without showing a spinner (used after background advance generation)
  const fetchInvoices = async (bgRefresh = false) => {
    if (!bgRefresh) {
      setLoadingInvoices(true);
      setFetchError(null);
      setAdvanceNotice(null);
    }
    try {
      const [res, enrollRes] = await Promise.all([
        getInvoices({ studentUserId: student.id, limit: 200 }),
        getEnrollments({ studentUserId: student.id, limit: 50 }),
      ]);
      const localEnrolls =
        enrollRes.success && enrollRes.data ? enrollRes.data.map(toLocalEnrollment) : [];
      if (enrollRes.success && enrollRes.data) {
        setEnrollments(localEnrolls);
      }
      const hasMonthlyActive = localEnrolls.some(
        e => e.status === 'ACTIVE' && e.billingType === 'MONTHLY',
      );
      const mapped: Invoice[] = (res.data ?? []).map(inv => ({
        id: inv.id,
        month: inv.month ?? '',
        amount: Number(inv.payableAmount),
        paidAmount: Number(inv.paidAmount),
        discountAmount: Number(inv.settlementSummary?.discountAmount ?? inv.discountAmount ?? 0),
        waivedAmount: Number(inv.settlementSummary?.waivedAmount ?? 0),
        settlementAmount: Number(inv.settlementSummary?.settlementAmount ?? inv.settlementAmount ?? 0),
        status: (
          inv.status === 'PAID' ? 'PAID'
          : inv.status === 'WAIVED' ? 'WAIVED'
          : inv.status === 'PARTIAL' ? 'PARTIAL'
          : 'DUE'
        ) as Invoice['status'],
        displayStatus: (inv.displayStatus ?? inv.settlementSummary?.displayStatus) as Invoice['displayStatus'],
        displayLabel: inv.displayLabel ?? inv.settlementSummary?.displayLabel,
        dueDate: inv.nextPaymentDueDate ?? '',
        branchName: (inv as { branch?: { name?: string } }).branch?.name,
        items: (inv as {
          items?: {
            title: string;
            refId?: string | null;
            unitPrice: number | string;
            qty: number;
            type?: string;
            grossAmount?: number | string;
            discountAmount?: number | string;
            waivedAmount?: number | string;
            settlementAmount?: number | string;
            payableAmount?: number | string;
            paidAmount?: number | string;
            dueAmount?: number | string;
            lineStatus?: DisplayStatus;
            waiverReason?: string | null;
            waivedByUserId?: string | null;
            waivedAt?: string | null;
            allocationPriority?: number;
          }[];
        }).items?.map(item => ({
          title: item.title,
          refId: item.refId,
          unitPrice: Number(item.unitPrice),
          qty: item.qty,
          type: item.type,
          grossAmount: Number(item.grossAmount ?? Number(item.unitPrice) * item.qty),
          discountAmount: Number(item.discountAmount ?? 0),
          waivedAmount: Number(item.waivedAmount ?? 0),
          settlementAmount: Number(item.settlementAmount ?? 0),
          payableAmount: Number(item.payableAmount ?? Number(item.unitPrice) * item.qty),
          paidAmount: Number(item.paidAmount ?? 0),
          dueAmount: Number(item.dueAmount ?? Math.max(0, Number(item.unitPrice) * item.qty)),
          lineStatus: item.lineStatus,
          waiverReason: item.waiverReason ?? null,
          waivedByUserId: item.waivedByUserId ?? null,
          waivedAt: item.waivedAt ?? null,
          allocationPriority: item.allocationPriority,
        })),
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
        // Advance generation: only when at least one ACTIVE MONTHLY enrollment; surface API errors.
        if (!advanceFiredRef.current) {
          advanceFiredRef.current = true;
          if (hasMonthlyActive) {
            generateAdvanceInvoices({ studentUserId: student.id, months: 12 })
              .then(advRes => {
                if (advRes && typeof advRes === 'object' && advRes.success === false) {
                  setAdvanceNotice(
                    typeof advRes.message === 'string' && advRes.message.trim()
                      ? advRes.message.trim()
                      : 'Could not generate advance invoices.',
                  );
                }
              })
              .catch(err => {
                setAdvanceNotice((err as Error).message ?? 'Could not generate advance invoices.');
              })
              .finally(() => {
                void fetchInvoices(true);
              });
          } else {
            setAdvanceNotice(
              'No active monthly enrollment — advance months are only created for monthly billing. One-time fees use program invoices or other tools.',
            );
          }
        }
      }
    } catch (err) {
      if (!bgRefresh) setFetchError((err as Error).message ?? 'Failed to load invoices');
    } finally {
      if (!bgRefresh) setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    advanceFiredRef.current = false;
    void fetchInvoices();
  }, [student.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const invoiceFileName = (invoice: Pick<Invoice, 'id' | 'month'>) =>
    `invoice-${student.regNo}-${invoice.month || 'one-time'}-${invoice.id.slice(0, 8)}.pdf`;

  const getInvoicePdfPath = async (invoiceId: string) => {
    const res = await getInvoicePdfUrl(invoiceId);
    return res.data?.pdfUrl ? normPdfUrl(res.data.pdfUrl) : null;
  };

  const openInvoicePdf = async (invoiceId: string) => {
    setPdfLoading(`view:${invoiceId}`);
    try {
      const path = await getInvoicePdfPath(invoiceId);
      if (path) window.open(path, '_blank', 'noopener,noreferrer');
    } finally {
      setPdfLoading(null);
    }
  };

  const downloadInvoicePdf = async (invoice: Pick<Invoice, 'id' | 'month'>) => {
    setPdfLoading(`download:${invoice.id}`);
    try {
      const path = await getInvoicePdfPath(invoice.id);
      if (!path) return;
      const a = document.createElement('a');
      a.href = path;
      a.download = invoiceFileName(invoice);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
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

  const getMonthAggStatus = (invs: Invoice[]): DisplayStatus => {
    if (!invs.length) return 'DUE';
    const statuses = invs.map(i => (i.displayStatus ?? i.status) as DisplayStatus);
    const totalDue = invs.reduce((sum, inv) => sum + Math.max(0, inv.amount - inv.paidAmount), 0);
    if (statuses.every(s => s === 'WAIVED')) return 'WAIVED';
    if (totalDue <= 0 && (statuses.includes('PAID_WITH_WAIVER') || (statuses.includes('PAID') && statuses.includes('WAIVED')))) {
      return 'PAID_WITH_WAIVER';
    }
    if (totalDue <= 0 && statuses.every(s => s === 'PAID')) return 'PAID';
    if (totalDue <= 0) return statuses.includes('SETTLED') ? 'SETTLED' : 'PAID';
    if (statuses.includes('PARTIALLY_WAIVED')) return 'PARTIALLY_WAIVED';
    if (invs.some(i => i.status === 'PARTIAL' || i.paidAmount > 0)) return 'PARTIAL';
    return 'DUE';
  };

  const statusBadgeColor: Record<string, BadgeColor> = {
    PAID: 'green',
    PAID_WITH_WAIVER: 'blue',
    WAIVED: 'purple',
    PARTIALLY_WAIVED: 'purple',
    PARTIAL: 'amber',
    SETTLED: 'slate',
    DUE: 'red',
    CANCELLED: 'slate',
  };

  const statusLabel = (status?: string) => {
    switch (status) {
      case 'PAID_WITH_WAIVER': return 'Paid + Waived';
      case 'PARTIALLY_WAIVED': return 'Partially Waived';
      case 'SETTLED': return 'Settled';
      case 'WAIVED': return 'Waived';
      case 'PAID': return 'Paid';
      case 'PARTIAL': return 'Partial';
      case 'CANCELLED': return 'Cancelled';
      default: return 'Due';
    }
  };

  const totalPayable = displayInvoices.reduce((s, i) => s + i.amount, 0);
  const totalAlreadyPaid = displayInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalDueForMonth = displayInvoices.reduce((s, i) => s + Math.max(0, i.amount - i.paidAmount), 0);
  const totalWaived = displayInvoices.reduce((s, i) => s + (i.waivedAmount ?? 0), 0);
  const totalDiscounted = displayInvoices.reduce((s, i) => s + (i.discountAmount ?? 0), 0);
  const totalSettlement = displayInvoices.reduce((s, i) => s + (i.settlementAmount ?? 0), 0);
  const admissionFeeTotal = displayInvoices.reduce((s, inv) =>
    s + (inv.items ?? []).filter(it => it.type === 'ADMISSION_FEE').reduce((a, it) => a + it.unitPrice * it.qty, 0), 0);
  const discountable = Math.max(0, totalPayable - admissionFeeTotal);
  const requestedDiscount = Number(addDiscount) || 0;
  const discount = Math.min(requestedDiscount, discountable);
  // Remaining due = (payable − additional discount) − already paid
  const netDue = Math.max(0, totalPayable - discount - totalAlreadyPaid);
  const discountCapped = requestedDiscount > discountable && discountable >= 0 && requestedDiscount > 0;
  const monthStatus = getMonthAggStatus(displayInvoices);
  const itemRows = displayInvoices.flatMap(inv =>
    (inv.items ?? []).map(item => {
      const total = Number(item.payableAmount ?? item.unitPrice * item.qty);
      const paid = Number(item.paidAmount ?? 0);
      const gross = Number(item.grossAmount ?? item.unitPrice * item.qty);
      const waived = Number(item.waivedAmount ?? 0);
      const discountAmount = Number(item.discountAmount ?? 0);
      return {
        ...item,
        gross,
        waived,
        discountAmount,
        total,
        paid,
        due: Number(item.dueAmount ?? Math.max(0, total - paid)),
      };
    }),
  );
  const admissionDue = itemRows
    .filter(item => item.type === 'ADMISSION_FEE')
    .reduce((sum, item) => sum + item.due, 0);
  const courseDue = itemRows
    .filter(item => item.type === 'COURSE')
    .reduce((sum, item) => sum + item.due, 0);
  const courseWaiverRows = itemRows
    .filter(item => item.type === 'COURSE' && item.refId)
    .map(item => ({
      ...item,
      waiverAmount: Math.max(0, item.gross - item.discountAmount - item.waived),
    }))
    .filter(item => item.waiverAmount > 0);
  const selectedCourseWaiverRows = courseWaiverRows.filter(item => selectedWaiveCourseIds.includes(item.refId!));
  const selectedWaiverAmount = selectedCourseWaiverRows.reduce((sum, item) => sum + item.waiverAmount, 0);
  const payableAfterCourseWaiver = Math.max(0, netDue - selectedWaiverAmount);
  const waiverCreatesSettlement = totalAlreadyPaid > 0 || monthStatus === 'PAID' || monthStatus === 'PARTIAL';
  const auditTrail = displayInvoices.flatMap(inv => {
    const rows: Array<{ label: string; detail: string; tone: BadgeColor }> = [];
    if (inv.waivedAmount && inv.waivedAmount > 0) {
      rows.push({ label: 'Course waiver', detail: `${fmt(inv.waivedAmount)} waived for ${fmtMonth(inv.month)}`, tone: 'purple' });
    }
    if (inv.discountAmount && inv.discountAmount > 0) {
      rows.push({ label: 'Discount', detail: `${fmt(inv.discountAmount)} discount applied`, tone: 'blue' });
    }
    if (inv.settlementAmount && inv.settlementAmount !== 0) {
      rows.push({
        label: inv.settlementAmount > 0 ? 'Credit settlement' : 'Debit settlement',
        detail: `${fmt(Math.abs(inv.settlementAmount))} adjusted on this invoice`,
        tone: inv.settlementAmount > 0 ? 'green' : 'amber',
      });
    }
    for (const item of inv.items ?? []) {
      if ((item.waivedAmount ?? 0) > 0) {
        const auditParts = [
          item.waiverReason ? `Reason: ${item.waiverReason}` : null,
          item.waivedByUserId ? `By: ${item.waivedByUserId}` : null,
          item.waivedAt ? `At: ${new Date(item.waivedAt).toLocaleString()}` : null,
        ].filter(Boolean);
        rows.push({
          label: 'Waived row',
          detail: `${item.title.replace(/^Monthly Fee:\s*/, '')}: ${fmt(item.waivedAmount ?? 0)}${auditParts.length ? ` (${auditParts.join(' · ')})` : ''}`,
          tone: 'purple',
        });
      }
    }
    return rows;
  });

  const handleWaive = async () => {
    if (waiveReason.trim().length < 5 || selectedWaiveCourseIds.length === 0) return;
    setWaiveSubmitting(true);
    try {
      await waiveMonthlyCourses({
        studentUserId: student.id,
        month: selMonth,
        courseIds: selectedWaiveCourseIds,
        reason: waiveReason.trim(),
      });
      setWaiving(false);
      setWaiveReason('');
      setSelectedWaiveCourseIds([]);
      await fetchInvoices(true);
    } finally {
      setWaiveSubmitting(false);
    }
  };

  const renderCourseWaiverPanel = () => (
    <div className="border-t border-slate-100 pt-3">
      {!waiving ? (
        <button
          onClick={() => setWaiving(true)}
          disabled={displayInvoices.length === 0 || courseWaiverRows.length === 0 || monthStatus === 'WAIVED'}
          title="Waive selected course rows for this selected month"
          className={cn(
            'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors cursor-pointer',
            displayInvoices.length > 0 && courseWaiverRows.length > 0 && monthStatus !== 'WAIVED'
              ? 'border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100'
              : 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed',
          )}
        >
          Waive Selected Course(s)
        </button>
      ) : (
        <div className="border border-purple-200 rounded-xl p-3.5 bg-purple-50">
          {courseWaiverRows.length > 0 ? (
            <div className="mb-3">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1.5">
                Course Waiver For {fmtMonth(selMonth)}
              </p>
              <div className="space-y-1.5">
                {courseWaiverRows.map(item => {
                  const courseId = item.refId!;
                  const checked = selectedWaiveCourseIds.includes(courseId);
                  return (
                    <label
                      key={`${courseId}-${item.title}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-purple-100 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setSelectedWaiveCourseIds(prev => (
                            checked ? prev.filter(id => id !== courseId) : [...prev, courseId]
                          ))}
                          className="accent-purple-600"
                        />
                        <span className="truncate">{item.title.replace(/^Monthly Fee:\s*/, '')}</span>
                      </span>
                      <span className="shrink-0 font-bold text-purple-700">{fmt(item.waiverAmount)}</span>
                    </label>
                  );
                })}
              </div>
              <div className="mt-2 rounded-lg border border-purple-100 bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-600 space-y-1">
                <div className="flex justify-between gap-3">
                  <span>Selected waiver</span>
                  <span className="shrink-0 text-purple-700">{fmt(selectedWaiverAmount)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Remaining payable after waiver</span>
                  <span className="shrink-0">{fmt(payableAfterCourseWaiver)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="shrink-0">Result</span>
                  <span className="min-w-0 text-right">
                    {waiverCreatesSettlement ? 'Credit settlement on next unpaid month' : 'Regenerate selected month invoice'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="mb-3 text-xs font-semibold text-purple-700">No payable course rows found for this month.</p>
          )}
          <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1.5">
            Waive Reason <span className="text-rose-600">*</span>
          </p>
          <textarea
            value={waiveReason}
            onChange={e => setWaiveReason(e.target.value)}
            placeholder="Enter reason for waiving selected course(s) (min 5 characters)..."
            rows={2}
            className="w-full text-sm border border-purple-200 rounded-lg px-3 py-2 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 mb-2"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setWaiving(false); setWaiveReason(''); setSelectedWaiveCourseIds([]); }}
              className="flex-1 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleWaive}
              disabled={selectedWaiveCourseIds.length === 0 || waiveReason.trim().length < 5 || waiveSubmitting}
              className="flex-1 text-xs bg-purple-600 text-white hover:bg-purple-700 gap-1"
            >
              <Check className="h-3 w-3" />
              {waiveSubmitting ? 'Waiving...' : 'Confirm Waiver'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AppModal
      open
      onClose={onClose}
      title={`Collect Payment — ${student.fullName}`}
      subtitle={`Reg: ${student.regNo} · ${student.mobile}`}
      maxWidth="max-w-7xl"
    >
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-6">
        {/* Left: month + invoices */}
        <div className="min-w-0">
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
            ) : (
              <>
                {advanceNotice && (
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
                {loadingInvoices ? (
                  <p className="text-sm text-slate-400">Loading invoices…</p>
                ) : (
                  <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pr-1 sm:max-h-44">
                    {allMonths.map(m => {
                      const aggStatus = getMonthAggStatus(monthGroups.get(m) ?? []);
                      return (
                        <button
                          key={m}
                          onClick={() => {
                            setSelMonth(m);
                            setWaiving(false);
                            setWaiveReason('');
                            setSelectedWaiveCourseIds([]);
                            setAddDiscount('0');
                            setPaymentAmount('');
                            setLastPaidInvoiceId(null);
                          }}
                          className={cn(
                            'flex min-w-0 items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer sm:px-3 sm:text-sm',
                            selMonth === m
                              ? 'border-rose-300 bg-rose-50 text-rose-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                          )}
                        >
                          <span className="truncate">{m ? fmtMonth(m) : 'One-Time / Program'}</span>
                          {(monthGroups.get(m)?.length ?? 0) > 1 && (
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-500">
                              {monthGroups.get(m)?.length} invoices
                            </span>
                          )}
                          {(monthGroups.get(m) ?? []).length > 0 && (
                            <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-black text-rose-600">
                              Due {fmt((monthGroups.get(m) ?? []).reduce((sum, inv) => sum + Math.max(0, inv.amount - inv.paidAmount), 0))}
                            </span>
                          )}
                          <AppBadge label={statusLabel(aggStatus)} color={statusBadgeColor[aggStatus] ?? 'red'} />
                        </button>
                      );
                    })}
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
                    Invoices — {selMonth ? fmtMonth(selMonth) : 'One-Time / Program'}
                  </p>
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
                          title={`Download invoice #${inv.id.slice(0, 8)}`}
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
                    const invoiceDue = Math.max(0, inv.amount - inv.paidAmount);
                    return (
                    <Fragment key={inv.id}>
                      <tr className="border-b border-slate-100">
                        <td className="max-w-[280px] border-b border-slate-100 px-3 py-2.5 align-top font-semibold text-slate-900">
                          {inv.month ? `${fmtMonth(inv.month)} — Monthly Invoice` : 'One-Time / Program Invoice'}
                          <span className="block font-mono text-[11px] font-bold text-slate-400">#{inv.id.slice(0, 8)}</span>
                          {inv.dueDate ? <span className="block text-[11px] font-medium text-slate-400">Due {inv.dueDate}</span> : null}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-2.5 align-top text-xs text-slate-500">{inv.branchName || '—'}</td>
                        <td className="border-b border-slate-100 px-3 py-2.5 align-top">
                          <span className="font-bold text-slate-900">{fmt((inv.items ?? []).reduce((sum, item) => sum + Number(item.grossAmount ?? item.unitPrice * item.qty), 0))}</span>
                        </td>
                        <td className="border-b border-slate-100 px-3 py-2.5 align-top">
                          <span className="font-bold text-slate-900">{fmt(inv.amount)}</span>
                          {(inv.discountAmount || inv.waivedAmount) ? (
                            <span className="block text-[11px] font-semibold text-slate-400">
                              {inv.discountAmount ? `Discount -${fmt(inv.discountAmount)}` : ''}
                              {inv.discountAmount && inv.waivedAmount ? ' · ' : ''}
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
                        return (
                          <tr key={`${inv.id}-item-${ii}`} className="bg-slate-50/60 border-b border-slate-100">
                            <td className="max-w-[280px] border-b border-slate-100 px-3 py-1.5 pl-7 align-top text-xs text-slate-500">
                              <span className="inline-block max-w-full truncate align-bottom">↳ {item.title}</span>
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
              <p className="text-center py-6 text-slate-400 text-sm">No invoices for this month</p>
            )}
          </div>
        </div>

        {/* Right: payment panel */}
        <div className="min-w-0 xl:sticky xl:top-0 xl:self-start">
          {['PAID', 'PAID_WITH_WAIVER', 'WAIVED', 'SETTLED'].includes(monthStatus) ? (
            /* Already settled — show status instead of payment form */
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
                    ? 'This month has been fully paid by cash.'
                    : monthStatus === 'WAIVED'
                    ? 'This month has been waived — no payment required.'
                    : 'This month is settled; due is zero but not only from cash payment.'}
                </p>
              </div>
              {renderCourseWaiverPanel()}
            </>
          ) : (
            /* Payment form */
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-3.5 sm:p-4">
                <div className="flex justify-between gap-3 mb-2">
                  <span className="text-sm text-slate-500">Total payable</span>
                  <span className="shrink-0 font-bold text-sm">{fmt(totalPayable)}</span>
                </div>
                {totalDiscounted > 0 && (
                  <div className="flex justify-between gap-3 mb-2">
                    <span className="text-sm text-slate-500">Discount(−)</span>
                    <span className="shrink-0 font-semibold text-sm text-blue-600">−{fmt(totalDiscounted)}</span>
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
                <div className="flex justify-between gap-3 mb-3">
                  <span className="text-sm text-slate-500">Monthly scholarship(−)</span>
                  <span className="shrink-0 font-semibold text-sm text-slate-400">৳0</span>
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
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-sm text-slate-900">Due amount</span>
                    <span className="shrink-0 text-right text-xl font-black text-rose-700 sm:text-2xl">{fmt(netDue)}</span>
                  </div>
                </div>

                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment Amount</p>
                <div className="grid gap-1.5 mb-2">
                  {[
                    { label: 'Pay Admission Due', amount: admissionDue, disabled: admissionDue <= 0 },
                    {
                      label: selMonth ? 'Pay Monthly Course Due' : 'Pay One-Time Course Due',
                      amount: courseDue,
                      disabled: courseDue <= 0 || admissionDue > 0,
                    },
                    { label: 'Pay Full Due', amount: netDue, disabled: netDue <= 0 },
                  ].map(action => (
                    <button
                      key={action.label}
                      type="button"
                      disabled={action.disabled}
                      onClick={() => setPaymentAmount(String(Math.min(action.amount, netDue)))}
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
              <div className="grid grid-cols-2 gap-2 mb-3.5 sm:grid-cols-3 xl:grid-cols-2">
                {methods.map(m => (
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

              <Button
                className="w-full gap-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-all mb-3"
                disabled={(paymentAmount ? Number(paymentAmount) <= 0 : netDue <= 0) || saving || loadingInvoices}
                onClick={async () => {
                  const amountToCollect = paymentAmount ? Number(paymentAmount) : netDue;
                  if (amountToCollect <= 0) return;
                  setSaving(true);
                  setLastPaidInvoiceId(null);
                  try {
                    const payResult = await processMonthPayment({
                      studentUserId: student.id,
                      month: selMonth,
                      payment: { amount: amountToCollect, method },
                    });
                    setPaymentAmount('');
                    await fetchInvoices(true); // silent refresh — updates invoice status/paidAmount before modal closes
                    const invoiceId = payResult?.data?.invoice?.id;
                    if (invoiceId) setLastPaidInvoiceId(invoiceId);
                    onSave({ student, month: selMonth, method, amount: amountToCollect });
                  } finally {
                    setSaving(false);
                  }
                }}
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
                        void downloadInvoicePdf(invoice ?? { id: lastPaidInvoiceId, month: selMonth });
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

              {renderCourseWaiverPanel()}
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
              <p className="text-xs font-semibold text-slate-400">No waiver, discount, or settlement adjustment for this selected month.</p>
            )}
          </div>
        </div>
      </div>
    </AppModal>
  );
}
