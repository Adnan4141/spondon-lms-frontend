'use client';

import type { LedgerReferenceData } from '../types';
import { LedgerEntryForm } from '../LedgerEntryForm';
import { LedgerEntryDialogShell } from './LedgerEntryDialogShell';

type Props = LedgerReferenceData & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntryCreated: () => void | Promise<void>;
};

export function LedgerNewEntryDialog({
  open,
  onOpenChange,
  accounts,
  branches,
  stockSources,
  channels,
  onEntryCreated,
}: Props) {
  return (
    <LedgerEntryDialogShell open={open} onOpenChange={onOpenChange} title="New Daily Entry">
      {open ? (
        <LedgerEntryForm
          key="new"
          accounts={accounts}
          branches={branches}
          stockSources={stockSources}
          channels={channels}
          onSuccess={async () => {
            onOpenChange(false);
            await onEntryCreated();
          }}
          onCancel={() => onOpenChange(false)}
        />
      ) : null}
    </LedgerEntryDialogShell>
  );
}
