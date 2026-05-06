import type { StudentResults } from '@/types/academic';

export function countResultRows(data: StudentResults | null): number {
  if (!data) return 0;
  const official = (data.officialExamResults ?? []).filter(
    (r) => r.batchApprovalStatus === 'APPROVED_BY_CENTRAL',
  );
  return (
    (data.onlineAttempts?.length ?? 0) +
    (data.offlineResults?.length ?? 0) +
    (data.academicRecords?.length ?? 0) +
    official.length
  );
}
