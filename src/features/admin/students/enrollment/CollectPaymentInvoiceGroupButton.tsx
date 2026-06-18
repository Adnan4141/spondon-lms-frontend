'use client';

import { cn } from '@/lib/utils';
import { fmt, fmtMonth } from '../utils';
import { StudentAdminBadge as AppBadge } from '../components/StudentAdminBadge';
import type { InvoiceGroup } from './collect-payment-modal-utils';
import { getMonthAggStatus, statusBadgeColor, statusLabel } from './collect-payment-modal-utils';
import type { CollectPaymentModalController } from './hooks/useCollectPaymentModal';

export function CollectPaymentInvoiceGroupButton({
  ctrl,
  group,
}: {
  ctrl: CollectPaymentModalController;
  group: InvoiceGroup;
}) {
  const { selectedGroupKey, selectInvoiceGroup } = ctrl;
  const aggStatus = getMonthAggStatus(group.invoices);
  const due = group.invoices.reduce((sum, inv) => sum + Math.max(0, inv.amount - inv.paidAmount), 0);
  const label =
    group.billingType === 'MONTHLY'
      ? `${group.programName} · ${group.month ? fmtMonth(group.month) : 'Monthly'}`
      : group.programName;

  return (
    <button
      type="button"
      onClick={() => selectInvoiceGroup(group.key)}
      className={cn(
        'flex min-w-0 items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer sm:px-3 sm:text-sm',
        selectedGroupKey === group.key
          ? 'border-rose-300 bg-rose-50 text-rose-700'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
      )}
    >
      <span className="truncate">{label}</span>
      {group.invoices.length > 1 && (
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-500">
          {group.invoices.length} invoices
        </span>
      )}
      <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-black text-rose-600">
        Due {fmt(due)}
      </span>
      <AppBadge label={statusLabel(aggStatus)} color={statusBadgeColor[aggStatus] ?? 'red'} />
    </button>
  );
}
