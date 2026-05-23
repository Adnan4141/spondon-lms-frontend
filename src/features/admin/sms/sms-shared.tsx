'use client';

import type { ReactNode } from 'react';
import { FileText, History, Save, Settings } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { SmsSystemSetting } from '@/lib/api/sms';

export const systemTypes = ['OTP', 'PAYMENT_CONFIRMATION', 'DUE_REMINDER', 'BIRTHDAY', 'RESULT', 'ENROLLMENT_NOTICE'] as const;

export const smsTypeLabels: Record<string, string> = {
  OTP: 'OTP SMS',
  PAYMENT_CONFIRMATION: 'Payment SMS',
  DUE_REMINDER: 'Due SMS',
  BIRTHDAY: 'Birthday SMS',
  RESULT: 'Result SMS',
  ENROLLMENT_NOTICE: 'Enrollment SMS',
};

export const tabItems = [
  { value: 'templates', label: 'Templates', icon: Save },
  { value: 'gateway', label: 'Settings', icon: Settings },
  { value: 'logs', label: 'History', icon: History },
  { value: 'reports', label: 'Reports', icon: FileText },
];

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

export function formatBdt(value: string | number | null | undefined) {
  const amount = Number(value || 0);
  return `৳${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;
}

/** Primary display for wallet / remaining credit (BDT). */
export function formatRemainingBdt(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    const trimmed = String(value).trim();
    if (trimmed.startsWith('৳')) return trimmed;
    return trimmed || '—';
  }
  return formatBdt(amount);
}

export function formatSmsCredits(value: string | number | null | undefined) {
  const count = Number(value || 0);
  return `${Number.isFinite(count) ? count.toLocaleString() : '0'} SMS`;
}

export function smsBalanceValue(balanceCount: string | number | null | undefined, rate: string | number | null | undefined) {
  const count = Number(balanceCount || 0);
  const price = Number(rate || 0);
  return Number.isFinite(count) && Number.isFinite(price) ? count * price : 0;
}

/** Internal ledger units → BDT for branch/org pools (single purchase rate). */
export function ledgerBalanceToBdt(balanceCount: string | number | null | undefined, pricePerSms: string | number | null | undefined) {
  return smsBalanceValue(balanceCount, pricePerSms);
}

export function parseProviderBalanceBdt(
  balanceText: string | null | undefined,
  balanceBdt?: number | null,
): number | null {
  if (balanceBdt != null && Number.isFinite(balanceBdt)) return balanceBdt;
  if (!balanceText?.trim()) return null;
  const stripped = balanceText.replace(/[^\d.-]/g, '');
  const parsed = Number(stripped);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatProviderRemainingCredit(
  balanceText: string | null | undefined,
  balanceBdt?: number | null,
  unavailableLabel = 'Unavailable',
) {
  const bdt = parseProviderBalanceBdt(balanceText, balanceBdt);
  if (bdt != null) return formatRemainingBdt(bdt);
  if (!balanceText?.trim() || balanceText === '-' || balanceText === 'Unavailable') return unavailableLabel;
  if (balanceText === 'Gateway not configured') return balanceText;
  return formatRemainingBdt(balanceText);
}

export function smsLengthInfo(value: string) {
  const hasUnicode = /[^\x00-\x7F]/.test(value);
  const singleLimit = hasUnicode ? 70 : 160;
  const multiLimit = hasUnicode ? 67 : 153;
  const length = value.length;
  const segments = length <= singleLimit ? (length ? 1 : 0) : Math.ceil(length / multiLimit);
  return { length, segments, encoding: hasUnicode ? 'Unicode' : 'GSM' };
}

export function renderSmsPreview(template: string, row?: Record<string, unknown>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = row?.[key];
    return value == null ? '' : String(value);
  });
}

export function settingKey(type: string, scope: 'ORG' | 'BRANCH', branchId?: string | null) {
  return `${scope}:${branchId || 'central'}:${type}`;
}

export function defaultSystemSetting(
  type: string,
  scope: 'ORG' | 'BRANCH' = 'ORG',
  branchId?: string | null,
): SmsSystemSetting {
  return {
    id: `default-${settingKey(type, scope, branchId)}`,
    type,
    scope,
    branchId: scope === 'BRANCH' ? branchId || null : null,
    isEnabled: true,
    balanceSource: 'ORG',
    isMasking: true,
    templateKey: null,
  };
}

export function Panel({
  title,
  children,
  action,
  className = '',
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white ${className}`}>
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Metric({
  label,
  value,
  description,
  tone = 'slate',
}: {
  label: string;
  value: string | number;
  description?: string;
  tone?: 'emerald' | 'blue' | 'amber' | 'slate';
}) {
  const toneClass = {
    emerald: 'text-emerald-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    slate: 'text-slate-900',
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</p>
      {description ? <p className="mt-1 text-xs font-medium text-slate-500">{description}</p> : null}
    </div>
  );
}

export function SmsWarningBanner({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-bold">{title}</p>
      <div className="mt-1 text-amber-800">{children}</div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">{children}</p>;
}

export function SmsComposer({
  label,
  value,
  onChange,
  rows = 5,
  variables = [],
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  variables?: string[];
}) {
  const info = smsLengthInfo(value);

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <Label>{label}</Label>
        <span className="text-xs font-semibold text-slate-500">
          {info.length} chars · {info.segments} segment{info.segments === 1 ? '' : 's'} · {info.encoding}
        </span>
      </div>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} className="resize-y bg-white" />
      {variables.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {variables.map((variable) => (
            <button
              key={variable}
              type="button"
              onClick={() => onChange(`${value}${value && !value.endsWith(' ') ? ' ' : ''}${variable}`)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              {variable}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
