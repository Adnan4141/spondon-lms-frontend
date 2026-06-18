'use client';

import type { LedgerEntry } from '@/lib/api/accounting';
import type { LedgerReferenceData } from '../types';
import { LedgerEntryForm } from '../LedgerEntryForm';
import { LedgerEntryDialogShell } from './LedgerEntryDialogShell';

type Props = LedgerReferenceData & {
  entry: LedgerEntry | null;
  onClose: () => void;
  onEntryUpdated: () => void | Promise<void>;
};

export function LedgerEditEntryDialog({
  entry,
  accounts,
  branches,
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
          branches={branches}
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
