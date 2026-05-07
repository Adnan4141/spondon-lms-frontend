'use client';

import type { Account, LedgerEntry } from '@/lib/api/accounting';
import type { DistributionChannel, StockSource } from '@/lib/api/books';
import { LedgerEntryForm } from '../LedgerEntryForm';
import { LedgerEntryDialogShell } from './LedgerEntryDialogShell';

type Props = {
  entry: LedgerEntry | null;
  accounts: Account[];
  stockSources: StockSource[];
  channels: DistributionChannel[];
  onClose: () => void;
  onEntryUpdated: () => void | Promise<void>;
};

export function LedgerEditEntryDialog({
  entry,
  accounts,
  stockSources,
  channels,
  onClose,
  onEntryUpdated,
}: Props) {
  return (
    <LedgerEntryDialogShell
      open={Boolean(entry)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Edit Daily Entry"
    >
      {entry ? (
        <LedgerEntryForm
          key={entry.id}
          mode="edit"
          initialEntry={entry}
          accounts={accounts}
          stockSources={stockSources}
          channels={channels}
          onCancel={onClose}
          onSuccess={async () => {
            onClose();
            await onEntryUpdated();
          }}
        />
      ) : null}
    </LedgerEntryDialogShell>
  );
}
