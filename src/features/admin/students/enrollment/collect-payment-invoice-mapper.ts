import type { Enrollment, Invoice } from '../types';
import type { DisplayStatus, InvoiceBillingType } from './collect-payment-modal-utils';

type ApiInvoice = {
  id: string;
  month?: string | null;
  payableAmount?: number | string;
  paidAmount?: number | string;
  status?: string;
  displayStatus?: DisplayStatus;
  displayLabel?: string;
  discountReference?: string | null;
  discountAmount?: number | string;
  settlementAmount?: number | string;
  nextPaymentDueDate?: string | null;
  invoiceNumber?: string | null;
  settlementSummary?: {
    discountAmount?: number | string;
    waivedAmount?: number | string;
    settlementAmount?: number | string;
    displayStatus?: DisplayStatus;
    displayLabel?: string;
  };
  branch?: { name?: string };
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
};

export function mapApiInvoicesToLocal(
  apiInvoices: ApiInvoice[],
  localEnrolls: Enrollment[],
): Invoice[] {
  const courseMetaById = new Map<
    string,
    { programId: string; programName: string; billingType: InvoiceBillingType }
  >();
  for (const enrollment of localEnrolls) {
    for (const course of enrollment.courses) {
      courseMetaById.set(course.courseId, {
        programId: enrollment.programId,
        programName:
          enrollment.programName ||
          (enrollment.billingType === 'MONTHLY' ? 'Monthly Program' : 'One-Time Program'),
        billingType: enrollment.billingType,
      });
    }
  }

  const mapped: Invoice[] = apiInvoices.map((inv) => {
    const items = inv.items?.map((item) => ({
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
    }));
    const courseMetas = (items ?? [])
      .filter((item) => item.type === 'COURSE' && item.refId)
      .map((item) => courseMetaById.get(item.refId!))
      .filter(Boolean) as Array<{
      programId: string;
      programName: string;
      billingType: InvoiceBillingType;
    }>;
    const uniqueProgramIds = [...new Set(courseMetas.map((meta) => meta.programId))];
    const uniqueBillingTypes = [...new Set(courseMetas.map((meta) => meta.billingType))];
    const soleProgram =
      uniqueProgramIds.length === 1
        ? courseMetas.find((meta) => meta.programId === uniqueProgramIds[0])
        : null;
    const billingType: InvoiceBillingType =
      uniqueBillingTypes.length === 1
        ? uniqueBillingTypes[0]
        : inv.month
          ? 'MONTHLY'
          : 'ONE_TIME';
    const fallbackEnrollment =
      localEnrolls.find((enrollment) => enrollment.billingType === billingType) ?? localEnrolls[0];
    const programId =
      soleProgram?.programId ?? fallbackEnrollment?.programId ?? `unknown-${billingType.toLowerCase()}`;
    const programName =
      soleProgram?.programName ??
      fallbackEnrollment?.programName ??
      (billingType === 'MONTHLY' ? 'Monthly Program' : 'One-Time Program');
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber ?? null,
      month: inv.month ?? '',
      isDuePaymentInvoice: String(inv.discountReference ?? '').startsWith('DUE_PAYMENT|'),
      billingType,
      programId,
      programName,
      displayPeriod: billingType === 'MONTHLY' ? (inv.month ?? '') : '',
      amount: Number(inv.payableAmount),
      paidAmount: Number(inv.paidAmount),
      discountAmount: Number(inv.settlementSummary?.discountAmount ?? inv.discountAmount ?? 0),
      waivedAmount: Number(inv.settlementSummary?.waivedAmount ?? 0),
      settlementAmount: Number(inv.settlementSummary?.settlementAmount ?? inv.settlementAmount ?? 0),
      status: (
        inv.status === 'PAID'
          ? 'PAID'
          : inv.status === 'WAIVED'
            ? 'WAIVED'
            : inv.status === 'PARTIAL'
              ? 'PARTIAL'
              : 'DUE'
      ) as Invoice['status'],
      displayStatus: (inv.displayStatus ?? inv.settlementSummary?.displayStatus) as Invoice['displayStatus'],
      displayLabel: inv.displayLabel ?? inv.settlementSummary?.displayLabel,
      dueDate: inv.nextPaymentDueDate ?? '',
      branchName: inv.branch?.name,
      items,
    };
  });

  const chargeInvoices = mapped.filter((inv) => !inv.isDuePaymentInvoice);
  chargeInvoices.sort((a, b) => b.month.localeCompare(a.month));
  return chargeInvoices;
}
