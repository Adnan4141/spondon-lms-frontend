import { BarChart3, ListOrdered, BookOpen } from 'lucide-react';
import type { SourceTypeValue, TabDef } from './types';

export const TABS: TabDef[] = [
  { key: 'summary', label: 'Account Summary', icon: BarChart3 },
  { key: 'ledger', label: 'Daily Entries', icon: ListOrdered },
  { key: 'accounts', label: 'Accounts', icon: BookOpen },
];

export const ACCOUNT_CATEGORIES = ['Cash', 'Bank', 'Mobile Banking', 'Income', 'Expense'];
export const ACCOUNT_TYPES = ACCOUNT_CATEGORIES;

export const INTERNAL_CATEGORY_LABELS: Record<string, string> = {
  ASSET: 'Cash / Bank',
  CASH: 'Cash',
  BANK: 'Bank',
  'MOBILE BANKING': 'Mobile Banking',
  INCOME: 'Income',
  EXPENSE: 'Expense',
  LIABILITY: 'Other',
  EQUITY: 'Opening Balance',
  'OPENING BALANCE': 'Opening Balance',
};

export const FLOW_TYPES = [
  { value: 'CREDIT', label: 'Credit' },
  { value: 'DEBIT', label: 'Debit' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'OPENING_BALANCE', label: 'Opening Balance' },
] as const;

export const SOURCE_TYPES: Array<{ value: SourceTypeValue; label: string }> = [
  { value: 'NONE', label: 'None' },
  { value: 'BRANCH', label: 'Branch' },
  { value: 'STOCK_SOURCE', label: 'Source' },
  { value: 'DISTRIBUTION_CHANNEL', label: 'Channel' },
  { value: 'OTHER', label: 'Other / Manual' },
];

export const TYPE_COLORS: Record<string, string> = {
  Cash: 'bg-slate-100 text-slate-700 border-slate-200',
  Bank: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Mobile Banking': 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'Cash / Bank': 'bg-sky-100 text-sky-700 border-sky-200',
  'Opening Balance': 'bg-purple-100 text-purple-700 border-purple-200',
  Other: 'bg-slate-100 text-slate-700 border-slate-200',
  INCOME: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  EXPENSE: 'bg-rose-100 text-rose-700 border-rose-200',
  ASSET: 'bg-sky-100 text-sky-700 border-sky-200',
  LIABILITY: 'bg-amber-100 text-amber-700 border-amber-200',
  EQUITY: 'bg-purple-100 text-purple-700 border-purple-200',
  JOURNAL: 'bg-slate-100 text-slate-700 border-slate-200',
  TRANSFER: 'bg-slate-100 text-slate-700 border-slate-200',
  ADJUSTMENT: 'bg-orange-100 text-orange-700 border-orange-200',
};

export const POSTING_COLORS: Record<string, string> = {
  DEBIT: 'bg-amber-100 text-amber-700 border-amber-200',
  CREDIT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};
