import type { BadgeColor } from '../components/StudentAdminBadge';
import type { Invoice } from '../types';

export type DisplayStatus =
  | 'PAID'
  | 'PAID_WITH_WAIVER'
  | 'WAIVED'
  | 'PARTIALLY_WAIVED'
  | 'PARTIAL'
  | 'SETTLED'
  | 'DUE'
  | 'CANCELLED';

export type InvoiceBillingType = 'MONTHLY' | 'ONE_TIME';

export type InvoiceGroup = {
  key: string;
  billingType: InvoiceBillingType;
  programId: string;
  programName: string;
  month: string;
  invoices: Invoice[];
};

export const statusBadgeColor: Record<string, BadgeColor> = {
  PAID: 'green',
  PAID_WITH_WAIVER: 'blue',
  WAIVED: 'purple',
  PARTIALLY_WAIVED: 'purple',
  PARTIAL: 'amber',
  SETTLED: 'slate',
  DUE: 'red',
  CANCELLED: 'slate',
};

export function statusLabel(status?: string) {
  switch (status) {
    case 'PAID_WITH_WAIVER':
      return 'Paid + Waived';
    case 'PARTIALLY_WAIVED':
      return 'Partially Waived';
    case 'SETTLED':
      return 'Settled';
    case 'WAIVED':
      return 'Waived';
    case 'PAID':
      return 'Paid';
    case 'PARTIAL':
      return 'Partial';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return 'Due';
  }
}

export function monthSpanCount(startMonth?: string | null, endMonth?: string | null) {
  if (!startMonth || !endMonth) return null;
  const [startYear, startMon] = startMonth.split('-').map(Number);
  const [endYear, endMon] = endMonth.split('-').map(Number);
  const diff = (endYear - startYear) * 12 + (endMon - startMon) + 1;
  return diff > 0 ? diff : null;
}

import type { CollectPaymentSaveData } from './collect-payment-modal-types';

export const DIGITAL_PAYMENT_METHODS = ['BKASH', 'NAGAD', 'BANK', 'GATEWAY'] as const;

export function requiresTrxId(method: string): boolean {
  return (DIGITAL_PAYMENT_METHODS as readonly string[]).includes(method);
}

export function formatCollectPaymentSuccessMessage(
  data: CollectPaymentSaveData,
  formatMoney: (n: number) => string,
  formatMonth: (m: string) => string,
): string {
  const base = `${formatMoney(data.amount)} collected via ${data.method}`;
  if (data.billingType === 'MONTHLY' && data.month) {
    return `${base} for ${formatMonth(data.month)}`;
  }
  if (data.programName) {
    return `${base} for ${data.programName} (one-time)`;
  }
  return `${base} for one-time program`;
}

export function parseInstallmentInfo(item: {
  title: string;
  installmentNumber?: number | null;
  totalInstallments?: number | null;
}): { number: number; total: number } | null {
  if (item.installmentNumber != null && item.totalInstallments != null && item.totalInstallments > 1) {
    return { number: item.installmentNumber, total: item.totalInstallments };
  }
  const match = item.title.match(/Installment\s+(\d+)\s*\/\s*(\d+)/i);
  if (match) {
    const total = Number(match[2]);
    if (total > 1) return { number: Number(match[1]), total };
  }
  return null;
}

/** Line-item due when enriched; avoids stale header payable double-counting admission payments. */
export function resolveInvoiceDue(inv: Invoice): number {
  const items = inv.items ?? [];
  if (items.length > 0) {
    return items.reduce(
      (sum, item) =>
        sum +
        Number(
          item.dueAmount ??
            Math.max(
              0,
              Number(item.payableAmount ?? item.unitPrice * item.qty) - Number(item.paidAmount ?? 0),
            ),
        ),
      0,
    );
  }
  return Math.max(0, inv.amount - inv.paidAmount);
}

export function getMonthAggStatus(invs: Invoice[]): DisplayStatus {
  if (!invs.length) return 'DUE';
  const statuses = invs.map((i) => (i.displayStatus ?? i.status) as DisplayStatus);
  const totalDue = invs.reduce((sum, inv) => sum + resolveInvoiceDue(inv), 0);
  if (statuses.every((s) => s === 'WAIVED')) return 'WAIVED';
  if (
    totalDue <= 0 &&
    (statuses.includes('PAID_WITH_WAIVER') || (statuses.includes('PAID') && statuses.includes('WAIVED')))
  ) {
    return 'PAID_WITH_WAIVER';
  }
  if (totalDue <= 0 && statuses.every((s) => s === 'PAID')) return 'PAID';
  if (totalDue <= 0) return statuses.includes('SETTLED') ? 'SETTLED' : 'PAID';
  if (statuses.includes('PARTIALLY_WAIVED')) return 'PARTIALLY_WAIVED';
  if (invs.some((i) => i.status === 'PARTIAL' || i.paidAmount > 0)) return 'PARTIAL';
  return 'DUE';
}
