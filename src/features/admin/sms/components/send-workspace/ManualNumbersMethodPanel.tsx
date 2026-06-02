'use client';

import { useEffect, useMemo, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import type { SmsRecipient } from '@/lib/api/sms';
import { EmptyState, Metric, Panel } from '../../sms-shared';
import { validateSmsNumbers } from '../../utils/sms-number';

export function ManualNumbersMethodPanel({ onResolved }: { onResolved: (recipients: SmsRecipient[]) => void }) {
  const [value, setValue] = useState('');
  const parsed = useMemo(() => validateSmsNumbers(value), [value]);
  const validKey = parsed.valid.join('|');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const phones = validKey ? validKey.split('|').filter(Boolean) : [];
      onResolved(phones.map((phone) => ({ phone, variables: { phone } })));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [onResolved, validKey]);

  return (
    <Panel title="Manual Numbers">
      <div className="space-y-4">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={9}
          className="resize-y bg-white"
          placeholder={'01711234567\n01811234568, 01911234569\n+8801611234570'}
        />
        <p className="text-xs text-slate-500">Accepts comma, space, or newline separated numbers. Valid numbers are normalized to 8801x format before queueing.</p>
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Valid" value={parsed.valid.length} tone="emerald" />
          <Metric label="Invalid" value={parsed.invalid.length} tone="amber" />
          <Metric label="Duplicate" value={parsed.duplicates.length} tone="slate" />
        </div>
        {parsed.invalid.length ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
            <p className="text-xs font-bold uppercase text-rose-700">Invalid numbers</p>
            <p className="mt-2 text-sm text-rose-700">{parsed.invalid.slice(0, 20).join(', ')}</p>
          </div>
        ) : (
          <EmptyState>Enter one or more numbers to prepare recipients.</EmptyState>
        )}
      </div>
    </Panel>
  );
}
