'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { SmsRecipient } from '@/lib/api/sms';
import { EmptyState, Panel } from '../../sms-shared';
import { recipientKey } from './utils';

function recipientSubtitle(recipient: SmsRecipient, variant: 'default' | 'due') {
  if (variant === 'due') {
    const parts = [
      recipient.variables?.amount ? `৳${recipient.variables.amount}` : '',
      recipient.variables?.course ? String(recipient.variables.course) : '',
      recipient.variables?.due_date ? `due ${recipient.variables.due_date}` : '',
    ].filter(Boolean);
    return parts.join(' · ');
  }
  return String(recipient.variables?.roll || recipient.variables?.course || recipient.variables?.branch || '');
}

export function RecipientPreview({
  recipients,
  selected,
  locked,
  onSelectionChange,
  variant = 'default',
}: {
  recipients: SmsRecipient[];
  selected: string[];
  locked: boolean;
  onSelectionChange: (ids: string[]) => void;
  variant?: 'default' | 'due';
}) {
  const [query, setQuery] = useState('');
  const allSelected = recipients.length > 0 && selected.length === recipients.length;
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
        recipient.variables?.due_date,
        recipientKey(recipient, index),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query, recipients]);

  return (
    <Panel title="Recipients">
      {recipients.length ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800">
              {locked
                ? `${recipients.length} recipient${recipients.length === 1 ? '' : 's'} will receive this SMS`
                : `${selected.length ? selected.length : recipients.length} selected from ${recipients.length}`}
            </p>
            {!locked ? (
              <Button type="button" variant="outline" size="sm" onClick={() => onSelectionChange(allSelected ? [] : recipients.map((recipient, index) => recipientKey(recipient, index)))}>
                {allSelected ? 'Deselect All' : 'Select All'}
              </Button>
            ) : null}
          </div>
          {recipients.length > 8 ? (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, mobile, course, or amount"
                className="h-9 pl-9"
              />
            </div>
          ) : null}
          <div className="max-h-72 overflow-auto rounded-md border border-slate-200">
            {filteredRecipients.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-slate-500">No recipients match your search.</p>
            ) : filteredRecipients.slice(0, 150).map((recipient, index) => {
              const sourceIndex = recipients.indexOf(recipient);
              const key = recipientKey(recipient, sourceIndex >= 0 ? sourceIndex : index);
              const checked = locked || !selected.length || selected.includes(key);
              const subtitle = recipientSubtitle(recipient, variant);
              return (
                <label key={`${key}-${index}`} className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-0 hover:bg-slate-50">
                  <span className="flex min-w-0 items-center gap-2">
                    {!locked ? (
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => onSelectionChange(selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key])}
                      />
                    ) : null}
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-slate-800">{String(recipient.name || recipient.variables?.name || 'Recipient')}</span>
                      {subtitle ? <span className="block truncate text-xs text-slate-500">{subtitle}</span> : null}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-slate-500">{recipient.phone}</span>
                </label>
              );
            })}
          </div>
          {recipients.length > 150 ? (
            <p className="text-xs text-slate-500">Showing first 150 of {recipients.length} recipients. All will still receive SMS.</p>
          ) : null}
        </div>
      ) : (
        <EmptyState>Resolve or enter recipients to preview the final audience.</EmptyState>
      )}
    </Panel>
  );
}

export function RenderedPreview({ preview, recipient }: { preview: string; recipient?: SmsRecipient }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-950">Message Preview</h2>
        {recipient ? <span className="truncate text-xs text-slate-500">{recipient.name || recipient.phone}</span> : null}
      </div>
      <div className="p-4">
        {preview ? (
          <p className="min-h-28 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800">{preview}</p>
        ) : (
          <div className="flex min-h-28 items-center gap-2 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
            <AlertCircle className="h-4 w-4" />
            Message preview will appear here.
          </div>
        )}
      </div>
    </section>
  );
}
