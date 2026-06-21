'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { SmsRecipient } from '@/lib/api/sms';
import { Panel } from '../../sms-shared';
import { recipientKey } from '../send-workspace/utils';

function fmtNum(n: number) {
  return new Intl.NumberFormat('en-BD').format(Math.round(n));
}

function fmtCur(n: number) {
  return `৳ ${fmtNum(n)}`;
}

function dueSubtitle(recipient: SmsRecipient) {
  const parts = [
    recipient.variables?.amount ? `৳${recipient.variables.amount}` : '',
    recipient.variables?.course ? String(recipient.variables.course) : '',
    recipient.variables?.due_date ? `due ${recipient.variables.due_date}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}

export function DueRecipientReviewPanel({
  recipients,
  selectedKeys,
  alreadyRemindedIds,
  onSelectionChange,
}: {
  recipients: SmsRecipient[];
  selectedKeys: string[];
  alreadyRemindedIds: string[];
  onSelectionChange: (keys: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const remindedSet = useMemo(() => new Set(alreadyRemindedIds), [alreadyRemindedIds]);
  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const filteredRecipients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return recipients;
    return recipients.filter((recipient, index) => {
      const haystack = [
        recipient.name,
        recipient.phone,
        recipient.variables?.name,
        recipient.variables?.amount,
        recipient.variables?.course,
        recipientKey(recipient, index),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query, recipients]);

  const selectedCount = selectedKeys.length;
  const willSendCount = recipients.filter((recipient, index) => {
    const key = recipientKey(recipient, index);
    return selectedSet.has(key) && !remindedSet.has(recipient.id || key);
  }).length;
  const skippedCount = recipients.filter((recipient, index) => {
    const key = recipientKey(recipient, index);
    return selectedSet.has(key) && remindedSet.has(recipient.id || key);
  }).length;
  const totalDue = recipients.reduce((sum, recipient, index) => {
    const key = recipientKey(recipient, index);
    if (!selectedSet.has(key)) return sum;
    const amount = Number(String(recipient.variables?.amount || '0').replace(/,/g, ''));
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
  const allFilteredSelected = filteredRecipients.length > 0 && filteredRecipients.every((recipient, index) => {
    const sourceIndex = recipients.indexOf(recipient);
    const key = recipientKey(recipient, sourceIndex >= 0 ? sourceIndex : index);
    return selectedSet.has(key);
  });

  function toggleKey(key: string) {
    onSelectionChange(selectedSet.has(key) ? selectedKeys.filter((item) => item !== key) : [...selectedKeys, key]);
  }

  function toggleAllFiltered() {
    const filteredKeys = filteredRecipients.map((recipient, index) => {
      const sourceIndex = recipients.indexOf(recipient);
      return recipientKey(recipient, sourceIndex >= 0 ? sourceIndex : index);
    });
    if (allFilteredSelected) {
      onSelectionChange(selectedKeys.filter((key) => !filteredKeys.includes(key)));
      return;
    }
    onSelectionChange([...new Set([...selectedKeys, ...filteredKeys])]);
  }

  return (
    <Panel title="Review Recipients">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <StatCard label="Selected" value={fmtNum(selectedCount)} />
          <StatCard label="Will Send" value={fmtNum(willSendCount)} tone="emerald" />
          <StatCard label="Already Reminded" value={fmtNum(skippedCount)} tone="amber" />
          <StatCard label="Selected Due" value={fmtCur(totalDue)} tone="rose" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, mobile, course, amount"
              className="h-9 pl-9"
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={toggleAllFiltered}>
            {allFilteredSelected ? 'Deselect Visible' : 'Select Visible'}
          </Button>
        </div>

        <div className="max-h-[420px] overflow-auto rounded-lg border border-slate-200">
          {filteredRecipients.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">No recipients match your search.</p>
          ) : filteredRecipients.map((recipient, index) => {
            const sourceIndex = recipients.indexOf(recipient);
            const key = recipientKey(recipient, sourceIndex >= 0 ? sourceIndex : index);
            const recipientId = recipient.id || key;
            const checked = selectedSet.has(key);
            const alreadyReminded = remindedSet.has(recipientId);
            const subtitle = dueSubtitle(recipient);

            return (
              <label
                key={`${key}-${index}`}
                className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50"
              >
                <span className="flex min-w-0 items-start gap-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleKey(key)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{String(recipient.name || recipient.variables?.name || 'Recipient')}</span>
                      {alreadyReminded ? (
                        <Badge className="rounded-full bg-amber-100 text-[10px] font-black uppercase tracking-wide text-amber-800 hover:bg-amber-100">
                          Already reminded
                        </Badge>
                      ) : null}
                    </span>
                    {subtitle ? <span className="mt-0.5 block text-xs text-slate-500">{subtitle}</span> : null}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-slate-500">{recipient.phone}</span>
              </label>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

function StatCard({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: string;
  tone?: 'slate' | 'emerald' | 'amber' | 'rose';
}) {
  const toneClass = tone === 'emerald'
    ? 'text-emerald-700'
    : tone === 'amber'
      ? 'text-amber-700'
      : tone === 'rose'
        ? 'text-rose-700'
        : 'text-slate-950';

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
