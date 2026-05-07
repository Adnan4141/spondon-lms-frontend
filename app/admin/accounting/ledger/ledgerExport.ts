import type { LedgerEntry } from '@/lib/api/accounting';
import { accountCategory, entryFlowLabel, fmtDate } from '../utils';

export function ledgerExportColumns(): Array<{
  header: string;
  value: (row: LedgerEntry) => string | number | boolean | null | undefined;
}> {
  return [
    { header: 'Entry Date', value: (row) => fmtDate(row.entryDate) },
    { header: 'Voucher No', value: (row) => row.voucherNo || '' },
    { header: 'Account Code', value: (row) => row.account?.code || '' },
    { header: 'Account Name', value: (row) => row.account?.name || '' },
    { header: 'Category', value: (row) => accountCategory(row.account || null) },
    { header: 'Type', value: (row) => entryFlowLabel(row) },
    { header: 'Amount', value: (row) => Number(row.amount || 0) },
    { header: 'Source Type', value: (row) => row.sourceType || '' },
    { header: 'Source', value: (row) => row.sourceLabel || row.sourceId || '' },
    { header: 'Purpose', value: (row) => row.purpose || '' },
    { header: 'Description', value: (row) => row.description || '' },
    { header: 'Reference Type', value: (row) => row.refType || '' },
    { header: 'Reference Id', value: (row) => row.refId || '' },
  ];
}
