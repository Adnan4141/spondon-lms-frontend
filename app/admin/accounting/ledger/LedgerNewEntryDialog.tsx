'use client';

import type { Account } from '@/lib/api/accounting';
import type { DistributionChannel, StockSource } from '@/lib/api/books';
import { LedgerEntryForm } from '../LedgerEntryForm';
import { LedgerEntryDialogShell } from './LedgerEntryDialogShell';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  stockSources: StockSource[];
  channels: DistributionChannel[];
  onEntryCreated: () => void | Promise<void>;
};

export function LedgerNewEntryDialog({
  open,
  onOpenChange,
  accounts,
  stockSources,
  channels,
  onEntryCreated,
}: Props) {
  return (
    <LedgerEntryDialogShell open={open} onOpenChange={onOpenChange} title="New Daily Entry">
      <LedgerEntryForm
        accounts={accounts}
        stockSources={stockSources}
        channels={channels}
        onSuccess={async () => {
          onOpenChange(false);
          await onEntryCreated();
        }}
        onCancel={() => onOpenChange(false)}
      />
    </LedgerEntryDialogShell>
  );
}
