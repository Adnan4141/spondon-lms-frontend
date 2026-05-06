import type { AccountingSummary } from '@/lib/api/accounting';

type Row = AccountingSummary['recentAccountBalances'][number];

export function summaryExportColumns(): Array<{
  header: string;
  value: (row: Row) => string | number | boolean | null | undefined;
}> {
  return [
    { header: 'Account Code', value: (row) => row.accountCode },
    { header: 'Account Name', value: (row) => row.accountName },
    { header: 'Category', value: (row) => row.accountType },
    { header: 'Total Debit', value: (row) => row.totalDebit },
    { header: 'Total Credit', value: (row) => row.totalCredit },
    { header: 'Balance', value: (row) => row.balance },
  ];
}
