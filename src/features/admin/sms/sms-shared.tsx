'use client';

import type { ReactNode } from 'react';
import { FileText, History, Save, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

export const paymentSmsSources = [
  { value: '', label: 'All payment SMS' },
  { value: 'ADMIN', label: 'Admin recorded' },
  { value: 'GATEWAY_INVOICE', label: 'Student bKash (invoice)' },
  { value: 'SELF_CHECKOUT', label: 'Self-checkout enrollment' },
] as const;

export const paymentSmsSourceLabels: Record<string, string> = {
  ADMIN: 'Admin recorded',
  GATEWAY_INVOICE: 'Student bKash',
  SELF_CHECKOUT: 'Self-checkout',
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

/** balanceCount is stored as BDT taka in the ledger. */
export function ledgerBalanceToBdt(balanceCount: string | number | null | undefined, _pricePerSms?: string | number | null | undefined) {
  return Number(balanceCount || 0);
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

/** Sample values for segment/cost preview when templates still contain placeholders. */
export const SMS_PREVIEW_SAMPLE_VARS: Record<string, string> = {
  name: 'Karim Ahmed',
  phone: '8801712345678',
  roll: 'S-1024',
  course: 'HSC Physics',
  batch: 'Batch A',
  amount: '2500',
  month: 'Jun 2026',
  due_date: '30 Jun',
  dueDate: '30 Jun',
  date: '21 Jun',
  exam: 'Model Test 1',
  grade: '85/100',
  marks: '85',
  total: '100',
  rank: '12',
  institute: 'Spondon',
  program: 'HSC Physics',
  otp: '123456',
  invoiceNo: 'INV-1001',
  paymentDate: '21 Jun',
};

export function renderSmsMessage(template: string, vars: Record<string, unknown> = SMS_PREVIEW_SAMPLE_VARS) {
  return template.replace(/\{\{?\s*([a-zA-Z0-9_]+)\s*\}?\}/g, (_match, key) => {
    const value = vars[key];
    return value == null ? '' : String(value);
  });
}

export function smsLengthInfoForTemplate(template: string, vars?: Record<string, unknown>) {
  return smsLengthInfo(renderSmsMessage(template, vars));
}

export function renderSmsPreview(template: string, row?: Record<string, unknown>) {
  return renderSmsMessage(template, row ?? SMS_PREVIEW_SAMPLE_VARS);
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

// ─── Status badge (queue / delivery statuses) ────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  QUEUED:    'border-blue-200 bg-blue-50 text-blue-700',
  SENDING:   'border-amber-200 bg-amber-50 text-amber-700',
  DELIVERED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  FAILED:    'border-red-200 bg-red-50 text-red-700',
  SENT:      'border-emerald-200 bg-emerald-50 text-emerald-700',
  PENDING:   'border-slate-200 bg-slate-50 text-slate-600',
  CANCELLED: 'border-slate-200 bg-slate-100 text-slate-500',
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'border-slate-200 text-slate-600';
  return (
    <Badge variant="outline" className={cls}>
      {status}
    </Badge>
  );
}

// ─── Section divider ─────────────────────────────────────────────────────────
export function SectionDivider({ label }: { label?: string }) {
  if (!label) return <hr className="border-slate-200" />;
  return (
    <div className="flex items-center gap-3">
      <hr className="flex-1 border-slate-200" />
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <hr className="flex-1 border-slate-200" />
    </div>
  );
}

// ─── Shared rate card (BDT formatted, used by Gateway + System tabs) ─────────
export function RateCard({
  label,
  description,
  value,
  disabled = false,
  onChange,
}: {
  label: string;
  description: string;
  value: string | number;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const numeric = Number(value);
  const formatted = `৳${Number.isFinite(numeric) ? numeric.toFixed(2) : '0.00'}`;
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <Label className="text-slate-600">{label}</Label>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-sm font-bold tabular-nums text-slate-700">
          {formatted}
        </span>
      </div>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">৳</span>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="bg-slate-50 pl-7"
        />
      </div>
      <p className="mt-1.5 text-xs text-slate-400">{description}</p>
    </div>
  );
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
  const info = smsLengthInfoForTemplate(value);

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
