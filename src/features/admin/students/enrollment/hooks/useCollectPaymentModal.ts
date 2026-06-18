'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PaymentMethod } from '@/lib/api/invoices';
import {
  createPayment,
  generateAdvanceInvoices,
  getInvoicePdfUrl,
  getInvoices,
  getMonthlyDueList,
  processMonthPayment,
  waiveMonthlyCourses,
} from '@/lib/api/invoices';
import { getEnrollments } from '@/lib/api/enrollments';
import type { BadgeColor } from '../../components/StudentAdminBadge';
import type { Enrollment, Invoice } from '../../types';
import { fmt, fmtMonth, normPdfUrl, toLocalEnrollment } from '../../utils';
import { mapApiInvoicesToLocal } from '../collect-payment-invoice-mapper';
import type { CollectPaymentModalProps } from '../collect-payment-modal-types';
import {
  getMonthAggStatus,
  monthSpanCount,
  type InvoiceGroup,
} from '../collect-payment-modal-utils';

export const PAYMENT_METHODS = [
  { id: 'CASH' as PaymentMethod, label: 'Cash', icon: '💵' },
  { id: 'BKASH' as PaymentMethod, label: 'bKash', icon: '🔴' },
  { id: 'NAGAD' as PaymentMethod, label: 'Nagad', icon: '🟠' },
  { id: 'BANK' as PaymentMethod, label: 'Bank', icon: '🏦' },
  { id: 'GATEWAY' as PaymentMethod, label: 'Gateway', icon: '💳' },
];

export function useCollectPaymentModal({ student, onSave }: CollectPaymentModalProps) {
  const [selectedGroupKey, setSelectedGroupKey] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
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
  const [validMonthlyMonths, setValidMonthlyMonths] = useState<string[]>([]);
  const [advanceNotice, setAdvanceNotice] = useState<string | null>(null);
  const advanceFiredRef = useRef(false);
  const suggestedPaymentRef = useRef('');

  const fetchInvoices = useCallback(
    async (bgRefresh = false) => {
      if (!bgRefresh) {
        setLoadingInvoices(true);
        setFetchError(null);
        setAdvanceNotice(null);
      }
      try {
        const [res, enrollRes, dueListRes] = await Promise.all([
          getInvoices({ studentUserId: student.id, limit: 200 }),
          getEnrollments({ studentUserId: student.id, limit: 50 }),
          getMonthlyDueList({ studentUserId: student.id }),
        ]);
        const localEnrolls =
          enrollRes.success && enrollRes.data ? enrollRes.data.map(toLocalEnrollment) : [];
        if (enrollRes.success && enrollRes.data) {
          setEnrollments(localEnrolls);
        }
        if (dueListRes.success && dueListRes.data) {
          setValidMonthlyMonths(dueListRes.data.validMonths ?? []);
        } else {
          setValidMonthlyMonths([]);
        }
        const hasBillableMonthlyEnrollment = localEnrolls.some(
          (e) => ['ACTIVE', 'PAUSED', 'PENDING_PAYMENT'].includes(e.status) && e.billingType === 'MONTHLY',
        );
        const chargeInvoices = mapApiInvoicesToLocal(res.data ?? [], localEnrolls);
        setInvoices(chargeInvoices);
        if (!bgRefresh) {
          if (!advanceFiredRef.current) {
            advanceFiredRef.current = true;
            if (hasBillableMonthlyEnrollment) {
              generateAdvanceInvoices({ studentUserId: student.id, months: 12 })
                .then((advRes) => {
                  if (advRes && typeof advRes === 'object' && advRes.success === false) {
                    setAdvanceNotice(
                      typeof advRes.message === 'string' && advRes.message.trim()
                        ? advRes.message.trim()
                        : 'Could not generate advance invoices.',
                    );
                  }
                })
                .catch((err) => {
                  setAdvanceNotice((err as Error).message ?? 'Could not generate advance invoices.');
                })
                .finally(() => {
                  void fetchInvoices(true);
                });
            } else {
              setAdvanceNotice(
                'No billable monthly enrollment — advance months are only created for monthly billing. One-time fees use program invoices or other tools.',
              );
            }
          }
        }
      } catch (err) {
        if (!bgRefresh) setFetchError((err as Error).message ?? 'Failed to load invoices');
      } finally {
        if (!bgRefresh) setLoadingInvoices(false);
      }
    },
    [student.id],
  );

  useEffect(() => {
    advanceFiredRef.current = false;
    void fetchInvoices();
  }, [fetchInvoices]);

  const invoiceFileName = (
    invoice: Pick<Invoice, 'id' | 'month'> & { invoiceNumber?: string | null },
  ) =>
    `${invoice.invoiceNumber ?? 'invoice-' + invoice.id.slice(0, 8)}-${student.regNo}-${invoice.month || 'one-time'}.pdf`;

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

  const openInvoicePdfInWindow = async (invoiceId: string, targetWindow?: Window | null) => {
    setPdfLoading(`view:${invoiceId}`);
    try {
      const path = await getInvoicePdfPath(invoiceId);
      if (!path) {
        if (targetWindow && !targetWindow.closed) targetWindow.close();
        return;
      }
      if (targetWindow && !targetWindow.closed) {
        targetWindow.location.href = path;
        return;
      }
      window.open(path, '_blank', 'noopener,noreferrer');
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

  const validMonthlyMonthSet = useMemo(() => new Set(validMonthlyMonths), [validMonthlyMonths]);

  const invoiceGroups = useMemo<InvoiceGroup[]>(() => {
    const map = new Map<string, InvoiceGroup>();
    for (const inv of invoices) {
      const billingType = inv.billingType ?? (inv.month ? 'MONTHLY' : 'ONE_TIME');
      if (
        billingType === 'MONTHLY' &&
        inv.month &&
        validMonthlyMonthSet.size > 0 &&
        !validMonthlyMonthSet.has(inv.month)
      ) {
        continue;
      }
      const programId = inv.programId ?? `unknown-${billingType.toLowerCase()}`;
      const programName =
        inv.programName ?? (billingType === 'MONTHLY' ? 'Monthly Program' : 'One-Time Program');
      const month = billingType === 'MONTHLY' ? inv.month : '';
      const key =
        billingType === 'MONTHLY'
          ? `MONTHLY:${programId}:${month || 'unassigned'}`
          : `ONE_TIME:${programId}`;
      if (!map.has(key)) {
        map.set(key, { key, billingType, programId, programName, month, invoices: [] });
      }
      map.get(key)!.invoices.push(inv);
    }
    return [...map.values()].sort((a, b) => {
      if (a.billingType !== b.billingType) return a.billingType === 'ONE_TIME' ? -1 : 1;
      const programCompare = a.programName.localeCompare(b.programName);
      if (programCompare !== 0) return programCompare;
      return a.month.localeCompare(b.month);
    });
  }, [invoices, validMonthlyMonthSet]);

  const oneTimeGroups = useMemo(
    () => invoiceGroups.filter((group) => group.billingType === 'ONE_TIME'),
    [invoiceGroups],
  );

  const monthlyGroups = useMemo(
    () => invoiceGroups.filter((group) => group.billingType === 'MONTHLY'),
    [invoiceGroups],
  );

  useEffect(() => {
    if (invoiceGroups.length === 0) {
      if (selectedGroupKey) setSelectedGroupKey('');
      return;
    }
    if (selectedGroupKey && invoiceGroups.some((group) => group.key === selectedGroupKey)) return;
    const firstUnpaidOrPartial = invoiceGroups.find((group) =>
      group.invoices.some((invoice) => invoice.status === 'DUE' || invoice.status === 'PARTIAL'),
    );
    const nextKey = firstUnpaidOrPartial?.key ?? invoiceGroups[0]?.key ?? '';
    if (nextKey !== selectedGroupKey) {
      setSelectedGroupKey(nextKey);
    }
  }, [invoiceGroups, selectedGroupKey]);

  const selectedGroup = useMemo(
    () => invoiceGroups.find((group) => group.key === selectedGroupKey) ?? null,
    [invoiceGroups, selectedGroupKey],
  );

  const displayInvoices = useMemo(() => selectedGroup?.invoices ?? [], [selectedGroup]);

  const selectedMonth = selectedGroup?.billingType === 'MONTHLY' ? selectedGroup.month : '';
  const isSelectedMonthly = selectedGroup?.billingType === 'MONTHLY';
  const selectedProgramNames = selectedGroup ? [selectedGroup.programName] : [];

  const billingRangeSummaries = useMemo(() => {
    return enrollments
      .filter((enrollment) => enrollment.billingType === 'MONTHLY')
      .map((enrollment) => {
        const monthCount = monthSpanCount(enrollment.billingStartMonth, enrollment.billingEndMonth);
        return {
          id: enrollment.id,
          programName: enrollment.programName || 'Monthly Program',
          status: enrollment.status,
          startMonth: enrollment.billingStartMonth,
          endMonth: enrollment.billingEndMonth || null,
          monthCount,
        };
      })
      .sort((left, right) => {
        const startCompare = (left.startMonth || '').localeCompare(right.startMonth || '');
        if (startCompare !== 0) return startCompare;
        return left.programName.localeCompare(right.programName);
      });
  }, [enrollments]);

  const totalPayable = displayInvoices.reduce((s, i) => s + i.amount, 0);
  const totalAlreadyPaid = displayInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalDueForMonth = displayInvoices.reduce(
    (s, i) => s + Math.max(0, i.amount - i.paidAmount),
    0,
  );
  const totalWaived = displayInvoices.reduce((s, i) => s + (i.waivedAmount ?? 0), 0);
  const totalDiscounted = displayInvoices.reduce((s, i) => s + (i.discountAmount ?? 0), 0);
  const totalSettlement = displayInvoices.reduce((s, i) => s + (i.settlementAmount ?? 0), 0);
  const admissionFeeTotal = displayInvoices.reduce(
    (s, inv) =>
      s +
      (inv.items ?? [])
        .filter((it) => it.type === 'ADMISSION_FEE')
        .reduce((a, it) => a + it.unitPrice * it.qty, 0),
    0,
  );
  const discountable = Math.max(0, totalPayable - admissionFeeTotal);
  const requestedDiscount = isSelectedMonthly ? Number(addDiscount) || 0 : 0;
  const discount = isSelectedMonthly ? Math.min(requestedDiscount, discountable) : 0;
  const netDue = Math.max(0, totalPayable - discount - totalAlreadyPaid);
  const discountCapped = requestedDiscount > discountable && discountable >= 0 && requestedDiscount > 0;
  const monthStatus = getMonthAggStatus(displayInvoices);

  const itemRows = displayInvoices.flatMap((inv) =>
    (inv.items ?? []).map((item) => {
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
    .filter((item) => item.type === 'ADMISSION_FEE')
    .reduce((sum, item) => sum + item.due, 0);
  const courseDue = itemRows
    .filter((item) => item.type === 'COURSE')
    .reduce((sum, item) => sum + item.due, 0);
  const courseWaiverRows = itemRows
    .filter((item) => item.type === 'COURSE' && item.refId)
    .map((item) => ({
      ...item,
      waiverAmount: Math.max(0, item.gross - item.discountAmount - item.waived),
    }))
    .filter((item) => item.waiverAmount > 0);
  const selectedCourseWaiverRows = courseWaiverRows.filter((item) =>
    selectedWaiveCourseIds.includes(item.refId!),
  );
  const selectedWaiverAmount = selectedCourseWaiverRows.reduce((sum, item) => sum + item.waiverAmount, 0);
  const selectedCurrentDueWaiverAmount = selectedCourseWaiverRows.reduce(
    (sum, item) => sum + Math.min(item.waiverAmount, item.due),
    0,
  );
  const effectiveNetDue = Math.max(0, netDue - selectedCurrentDueWaiverAmount);
  const effectiveCourseDue = Math.max(0, courseDue - selectedCurrentDueWaiverAmount);
  const payableAfterCourseWaiver = effectiveNetDue;
  const waiverCreatesSettlement =
    totalAlreadyPaid > 0 || monthStatus === 'PAID' || monthStatus === 'PARTIAL';

  useEffect(() => {
    const nextSuggested = effectiveNetDue > 0 ? String(effectiveNetDue) : '';
    setPaymentAmount((prev) => {
      const shouldAutoSync = !prev || prev === suggestedPaymentRef.current || Number(prev) > effectiveNetDue;
      return shouldAutoSync ? nextSuggested : prev;
    });
    suggestedPaymentRef.current = nextSuggested;
  }, [effectiveNetDue]);

  const auditTrail = displayInvoices.flatMap((inv) => {
    const rows: Array<{ label: string; detail: string; tone: BadgeColor }> = [];
    if (inv.waivedAmount && inv.waivedAmount > 0) {
      rows.push({
        label: 'Course waiver',
        detail: `${fmt(inv.waivedAmount)} waived for ${fmtMonth(inv.month)}`,
        tone: 'purple',
      });
    }
    if (inv.discountAmount && inv.discountAmount > 0) {
      rows.push({
        label: 'Discount',
        detail: `${fmt(inv.discountAmount)} discount applied`,
        tone: 'blue',
      });
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

  const selectInvoiceGroup = (key: string) => {
    setSelectedGroupKey(key);
    setWaiving(false);
    setWaiveReason('');
    setSelectedWaiveCourseIds([]);
    setAddDiscount('0');
    setPaymentAmount('');
    setLastPaidInvoiceId(null);
  };

  const handleWaive = async () => {
    if (waiveReason.trim().length < 5 || selectedWaiveCourseIds.length === 0) return;
    setWaiveSubmitting(true);
    try {
      await waiveMonthlyCourses({
        studentUserId: student.id,
        month: selectedMonth,
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

  const handleCollectPayment = async () => {
    const amountToCollect = paymentAmount
      ? Math.min(Number(paymentAmount), effectiveNetDue)
      : effectiveNetDue;
    if (amountToCollect <= 0) return;
    const pdfWindow = window.open('', '_blank');
    if (pdfWindow && !pdfWindow.closed) {
      pdfWindow.document.title = 'Loading invoice';
      pdfWindow.document.body.innerHTML =
        '<div style="font-family: sans-serif; padding: 24px; color: #0f172a;">Preparing invoice PDF...</div>';
    }
    setSaving(true);
    setLastPaidInvoiceId(null);
    try {
      let invoiceId: string | null = null;
      if (isSelectedMonthly) {
        const payResult = await processMonthPayment({
          studentUserId: student.id,
          month: selectedMonth,
          discountAmount: discount > 0 ? discount : undefined,
          payment: { amount: amountToCollect, method },
        });
        invoiceId = payResult?.data?.invoice?.id ?? null;
      } else {
        let remaining = amountToCollect;
        const payableInvoices = displayInvoices
          .map((inv) => ({ invoice: inv, due: Math.max(0, inv.amount - inv.paidAmount) }))
          .filter((row) => row.due > 0);
        for (const row of payableInvoices) {
          if (remaining <= 0) break;
          const amount = Math.min(remaining, row.due);
          const payResult = await createPayment({
            invoiceId: row.invoice.id,
            method,
            amount,
          });
          const paymentData = payResult.data as
            | {
                duePaymentInvoice?: { id?: string };
                payment?: { invoiceId?: string };
                sourceInvoice?: { id?: string };
              }
            | undefined;
          invoiceId =
            paymentData?.duePaymentInvoice?.id ??
            paymentData?.payment?.invoiceId ??
            paymentData?.sourceInvoice?.id ??
            row.invoice.id;
          remaining = Math.max(0, remaining - amount);
        }
      }
      setPaymentAmount('');
      await fetchInvoices(true);
      if (invoiceId) {
        setLastPaidInvoiceId(invoiceId);
        await openInvoicePdfInWindow(invoiceId, pdfWindow);
      } else if (pdfWindow && !pdfWindow.closed) {
        pdfWindow.close();
      }
      onSave({ student, month: selectedMonth, method, amount: amountToCollect });
    } catch (error) {
      if (pdfWindow && !pdfWindow.closed) pdfWindow.close();
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    student,
    selectedGroupKey,
    method,
    setMethod,
    addDiscount,
    setAddDiscount,
    paymentAmount,
    setPaymentAmount,
    invoices,
    loadingInvoices,
    fetchError,
    saving,
    pdfLoading,
    lastPaidInvoiceId,
    waiving,
    setWaiving,
    waiveReason,
    setWaiveReason,
    selectedWaiveCourseIds,
    setSelectedWaiveCourseIds,
    waiveSubmitting,
    advanceNotice,
    setAdvanceNotice,
    fetchInvoices,
    invoiceGroups,
    oneTimeGroups,
    monthlyGroups,
    selectedGroup,
    displayInvoices,
    selectedMonth,
    isSelectedMonthly,
    selectedProgramNames,
    billingRangeSummaries,
    totalPayable,
    totalAlreadyPaid,
    totalDueForMonth,
    totalWaived,
    totalDiscounted,
    totalSettlement,
    discountable,
    discount,
    netDue,
    discountCapped,
    monthStatus,
    courseWaiverRows,
    selectedWaiverAmount,
    selectedCurrentDueWaiverAmount,
    effectiveNetDue,
    effectiveCourseDue,
    payableAfterCourseWaiver,
    waiverCreatesSettlement,
    admissionDue,
    auditTrail,
    selectInvoiceGroup,
    handleWaive,
    handleCollectPayment,
    openInvoicePdf,
    downloadInvoicePdf,
  };
}

export type CollectPaymentModalController = ReturnType<typeof useCollectPaymentModal>;
