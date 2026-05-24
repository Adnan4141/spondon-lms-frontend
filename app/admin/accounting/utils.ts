import { downloadTableExport, type ExportFormat } from '@/lib/export';
import { INTERNAL_CATEGORY_LABELS } from './constants';
import type { Account, LedgerEntry } from '@/lib/api/accounting';

export function fmtCur(n: number) {
  return '৳ ' + new Intl.NumberFormat('en-BD', { maximumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0);
}

export function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'export';
}

export function exportFilename(prefix: string) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  return `${slugify(prefix)}-${stamp}`;
}

export function parseAmount(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function accountCategory(account?: Pick<Account, 'type' | 'name' | 'code'> | null) {
  if (!account) return 'Other';
  const normalized = (account.type || '').trim().toUpperCase();
  if (INTERNAL_CATEGORY_LABELS[normalized]) return INTERNAL_CATEGORY_LABELS[normalized];
  const haystack = `${account.name || ''} ${account.code || ''}`.toLowerCase();
  if (/bkash|b-kash|nagad|rocket|mobile/.test(haystack)) return 'bKash';
  if (/bank|dbbl|brac|city|islami|dutch/.test(haystack)) return 'Bank';
  if (/cash/.test(haystack)) return 'Cash';
  return account.type || 'Other';
}

export function isMoneyAccount(account?: Pick<Account, 'type' | 'name' | 'code'> | null) {
  return ['Cash', 'Bank', 'bKash'].includes(accountCategory(account));
}

export function entryFlowLabel(entry: Pick<LedgerEntry, 'flowType' | 'entryType'>) {
  const flow = entry.flowType || (
    entry.entryType === 'INCOME'
      ? 'CREDIT'
      : entry.entryType === 'EXPENSE'
        ? 'DEBIT'
        : entry.entryType
  );
  if (flow === 'CREDIT') return 'Credit';
  if (flow === 'DEBIT') return 'Debit';
  if (flow === 'TRANSFER') return 'Transfer';
  if (flow === 'OPENING_BALANCE') return 'Opening Balance';
  return 'Entry';
}

export async function runExport<Row>(args: {
  format: ExportFormat;
  filename: string;
  sheetName: string;
  rows: Row[];
  columns: Array<{ header: string; value: (row: Row) => string | number | boolean | null | undefined }>;
}) {
  await downloadTableExport(args);
}
