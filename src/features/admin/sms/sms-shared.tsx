'use client';

import type { ReactNode } from 'react';
import { Activity, Bell, FileSpreadsheet, History, Save, Settings, Wallet } from 'lucide-react';
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
  { value: 'overview', label: 'Overview', icon: Activity },
  { value: 'system', label: 'System SMS', icon: Bell },
  { value: 'bulk', label: 'Bulk SMS', icon: FileSpreadsheet },
  { value: 'templates', label: 'Templates', icon: Save },
  { value: 'balances', label: 'Balances', icon: Wallet },
  { value: 'reports', label: 'Reports', icon: History },
  { value: 'gateway', label: 'Gateway', icon: Settings },
];

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
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
  tone = 'slate',
}: {
  label: string;
  value: string | number;
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
