import type { Batch, BatchStatusType } from '@/lib/api/batches';

export const BATCH_STATUS_OPTIONS: (BatchStatusType | 'all')[] = [
  'all',
  'ACTIVE',
  'INACTIVE',
  'COMPLETED',
  'ARCHIVED',
];

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export function getStatusBadgeClass(status: string): string {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black';
  if (status === 'COMPLETED') return 'bg-blue-50 text-blue-700 border-blue-100 font-black';
  if (status === 'INACTIVE') return 'bg-amber-50 text-amber-700 border-amber-100 font-black';
  return 'bg-slate-100 text-slate-600 border-slate-200 font-black';
}

export function filterBatchesByQuery(batches: Batch[], query: string): Batch[] {
  const q = query.trim().toLowerCase();
  if (!q) return batches;
  return batches.filter(
    (batch) =>
      batch.name.toLowerCase().includes(q) ||
      batch.course?.name.toLowerCase().includes(q) ||
      batch.branch?.name.toLowerCase().includes(q),
  );
}
