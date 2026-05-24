import type { LucideIcon } from 'lucide-react';
import type { Account } from '@/lib/api/accounting';
import type { Branch } from '@/lib/api/branches';
import type { DistributionChannel, StockSource } from '@/lib/api/books';

export type TabKey = 'summary' | 'ledger' | 'accounts';
export type SourceTypeValue = 'NONE' | 'BRANCH' | 'STOCK_SOURCE' | 'DISTRIBUTION_CHANNEL' | 'OTHER';

export type LedgerReferenceData = {
  accounts: Account[];
  branches: Branch[];
  stockSources: StockSource[];
  channels: DistributionChannel[];
};

export type TabDef = { key: TabKey; label: string; icon: LucideIcon };
