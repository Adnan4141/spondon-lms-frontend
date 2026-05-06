import type { Account } from '@/lib/api/accounting';
import { accountCategory } from '../utils';

export function accountsExportColumns(): Array<{
  header: string;
  value: (row: Account) => string | number | boolean | null | undefined;
}> {
  return [
    { header: 'Code', value: (row) => row.code },
    { header: 'Name', value: (row) => row.name },
    { header: 'Category', value: (row) => accountCategory(row) },
    { header: 'Branch Id', value: (row) => row.branchId || '' },
    { header: 'Status', value: (row) => (row.isActive ? 'Active' : 'Inactive') },
  ];
}
