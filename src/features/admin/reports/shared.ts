'use client';

export type TabKey = 'finance' | 'enrollment' | 'course-transactions' | 'book-sales' | 'due-collection' | 'ledger';
export type NamedEntity = { id: string; name: string };
export type BranchOption = { id: string; name: string };

export function fmtNum(n: number) {
  return new Intl.NumberFormat('en-BD').format(Math.round(n));
}

export function fmtCur(n: number) {
  return '৳ ' + fmtNum(n);
}

export function normalizeSingleDateRange(from?: string, to?: string) {
  return {
    from: from || to || undefined,
    to: to || from || undefined,
  };
}

export function exportFilename(prefix: string) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  return `${prefix}-${stamp}`;
}

export async function exportRows<Row>(args: {
  format: import('@/lib/export').ExportFormat;
  filename: string;
  sheetName: string;
  rows: Row[];
  columns: Array<{ header: string; value: (row: Row) => string | number | boolean | null | undefined }>;
}) {
  const { downloadTableExport } = await import('@/lib/export');
  await downloadTableExport(args);
}
