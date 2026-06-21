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
import {
  DUE_RECIPIENT_ROW_HEIGHT,
  recipientHasInvalidMobile,
} from './due-reminder-utils';
import { VirtualList } from './VirtualList';

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

type IndexedRecipient = {
  recipient: SmsRecipient;
  key: string;
  sourceIndex: number;
};

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
  const [hideInvalidMobile, setHideInvalidMobile] = useState(false);
  const remindedSet = useMemo(() => new Set(alreadyRemindedIds), [alreadyRemindedIds]);
  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const indexedRecipients = useMemo<IndexedRecipient[]>(
    () => recipients.map((recipient, index) => ({
      recipient,
      key: recipientKey(recipient, index),
      sourceIndex: index,
    })),
    [recipients],
  );

  const invalidMobileCount = useMemo(
    () => indexedRecipients.filter(({ recipient }) => recipientHasInvalidMobile(recipient)).length,
    [indexedRecipients],
  );

  const filteredRecipients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return indexedRecipients.filter(({ recipient, key }) => {
      if (hideInvalidMobile && recipientHasInvalidMobile(recipient)) return false;
      if (!normalized) return true;
      const haystack = [
        recipient.name,
        recipient.phone,
        recipient.variables?.name,
        recipient.variables?.amount,
        recipient.variables?.course,
        key,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [hideInvalidMobile, indexedRecipients, query]);

  const selectedCount = selectedKeys.length;
  const willSendCount = indexedRecipients.filter(({ recipient, key }) => {
    return selectedSet.has(key)
      && !remindedSet.has(recipient.id || key)
      && !recipientHasInvalidMobile(recipient);
  }).length;
  const skippedCount = indexedRecipients.filter(({ recipient, key }) => {
    return selectedSet.has(key) && remindedSet.has(recipient.id || key);
  }).length;
  const invalidSelectedCount = indexedRecipients.filter(({ recipient, key }) => {
    return selectedSet.has(key) && recipientHasInvalidMobile(recipient);
  }).length;
  const totalDue = indexedRecipients.reduce((sum, { recipient, key }) => {
    if (!selectedSet.has(key)) return sum;
    const amount = Number(String(recipient.variables?.amount || '0').replace(/,/g, ''));
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
  const allFilteredSelected = filteredRecipients.length > 0 && filteredRecipients.every(({ key }) => selectedSet.has(key));

  function toggleKey(key: string) {
    onSelectionChange(selectedSet.has(key) ? selectedKeys.filter((item) => item !== key) : [...selectedKeys, key]);
  }

  function toggleAllFiltered() {
    const filteredKeys = filteredRecipients.map(({ key }) => key);
    if (allFilteredSelected) {
      onSelectionChange(selectedKeys.filter((key) => !filteredKeys.includes(key)));
      return;
    }
    onSelectionChange([...new Set([...selectedKeys, ...filteredKeys])]);
  }

  function deselectInvalidMobile() {
    const invalidKeys = indexedRecipients
      .filter(({ recipient }) => recipientHasInvalidMobile(recipient))
      .map(({ key }) => key);
    onSelectionChange(selectedKeys.filter((key) => !invalidKeys.includes(key)));
  }

  return (
    <Panel title="Review Recipients">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Selected" value={fmtNum(selectedCount)} />
          <StatCard label="Will Send" value={fmtNum(willSendCount)} tone="emerald" />
          <StatCard label="Already Reminded" value={fmtNum(skippedCount)} tone="amber" />
          <StatCard label="Invalid Mobile" value={fmtNum(invalidSelectedCount)} tone="rose" />
          <StatCard label="Selected Due" value={fmtCur(totalDue)} tone="rose" />
        </div>

        {invalidMobileCount > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <p>
              <strong>{fmtNum(invalidMobileCount)}</strong> recipient{invalidMobileCount === 1 ? ' has an' : 's have'} invalid mobile number{invalidMobileCount === 1 ? '' : 's'}.
              They cannot receive SMS.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setHideInvalidMobile((prev) => !prev)}>
                {hideInvalidMobile ? 'Show Invalid' : 'Hide Invalid'}
              </Button>
              {invalidSelectedCount > 0 ? (
                <Button type="button" size="sm" variant="outline" onClick={deselectInvalidMobile}>
                  Deselect Invalid
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

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

        <VirtualList
          items={filteredRecipients}
          rowHeight={DUE_RECIPIENT_ROW_HEIGHT}
          getKey={(item) => item.key}
          emptyState={<p className="px-4 py-10 text-center text-sm text-slate-500">No recipients match your search.</p>}
          renderRow={({ recipient, key }) => {
            const recipientId = recipient.id || key;
            const checked = selectedSet.has(key);
            const alreadyReminded = remindedSet.has(recipientId);
            const invalidMobile = recipientHasInvalidMobile(recipient);
            const subtitle = dueSubtitle(recipient);

            return (
              <label className="flex h-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 hover:bg-slate-50">
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
                      {invalidMobile ? (
                        <Badge className="rounded-full bg-rose-100 text-[10px] font-black uppercase tracking-wide text-rose-800 hover:bg-rose-100">
                          Invalid mobile
                        </Badge>
                      ) : null}
                    </span>
                    {subtitle ? <span className="mt-0.5 block truncate text-xs text-slate-500">{subtitle}</span> : null}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-slate-500">{recipient.phone || '—'}</span>
              </label>
            );
          }}
        />

        {filteredRecipients.length > 0 ? (
          <p className="text-xs text-slate-500">
            Showing {fmtNum(filteredRecipients.length)} of {fmtNum(recipients.length)} recipients with virtual scrolling.
          </p>
        ) : null}
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
