'use client';

import { OmrScanReviewPanel } from '../components/OmrScanReviewPanel';

export function OmrResultsTab({
  examId,
  branchId,
  onFinalized,
}: {
  examId: string;
  branchId: string | null;
  onFinalized: () => void;
}) {
  return (
    <OmrScanReviewPanel
      examId={examId}
      branchId={branchId}
      onFinalized={onFinalized}
    />
  );
}
