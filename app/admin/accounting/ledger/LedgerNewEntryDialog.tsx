'use client';

import type { Account } from '@/lib/api/accounting';
import type { Branch } from '@/lib/api/branches';
import type { DistributionChannel, StockSource } from '@/lib/api/books';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { LedgerEntryForm } from '../LedgerEntryForm';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  branches: Branch[];
  stockSources: StockSource[];
  channels: DistributionChannel[];
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // DialogContent defaults include sm:max-w-lg; override at sm+ so wide layouts apply.
          'sm:max-w-6xl',
        )}
      >
        <DialogHeader>
          <DialogTitle className="font-black">New Daily Entry</DialogTitle>
        </DialogHeader>
        <LedgerEntryForm
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
      </DialogContent>
    </Dialog>
  );
}
