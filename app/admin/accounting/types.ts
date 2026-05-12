import type { LucideIcon } from 'lucide-react';

export type TabKey = 'summary' | 'ledger' | 'accounts';
export type SourceTypeValue = 'NONE' | 'BRANCH' | 'STOCK_SOURCE' | 'DISTRIBUTION_CHANNEL' | 'OTHER';

export type LedgerLineForm = {
  id: string;
  accountId: string;
  debitCredit: 'DEBIT' | 'CREDIT';
  amount: string;
  description: string;
};

export type TabDef = { key: TabKey; label: string; icon: LucideIcon };
