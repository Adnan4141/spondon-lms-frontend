'use client';

import { OmrScanReviewPanel } from '../components/OmrScanReviewPanel';

export function OmrResultsTab({
  examId,
  branchId,
  examBranchId,
  branches,
  showBranchPicker,
  onBranchIdChange,
  onFinalized,
}: {
  examId: string;
  branchId: string | null;
  examBranchId?: string | null;
  branches?: Array<{ id: string; name: string }>;
  showBranchPicker?: boolean;
  onBranchIdChange?: (branchId: string) => void;
  onFinalized: () => void;
}) {
  return (
    <OmrScanReviewPanel
      examId={examId}
      branchId={branchId}
      examBranchId={examBranchId}
      branches={branches}
      showBranchPicker={showBranchPicker}
      onBranchIdChange={onBranchIdChange}
      onFinalized={onFinalized}
    />
  );
}
