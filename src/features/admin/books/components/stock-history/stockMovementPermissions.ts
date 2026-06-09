import type { BookStockMovement } from '@/lib/api/books';

const LOCKED_FOR_CORRECT = new Set(['BookSaleItem', 'StockMovementDeletion']);
const LOCKED_FOR_DELETE = new Set(['BookSaleItem', 'StockMovementDeletion']);

export function isCorrectionReversalMovement(movement: BookStockMovement) {
  if (movement.correctionRole === 'REVERSAL') return true;
  if (movement.correctionRole === 'REPLACEMENT') return false;
  return String(movement.remarks || '').startsWith('Correction reversal');
}

export function isCorrectionReplacementMovement(movement: BookStockMovement) {
  return movement.referenceType === 'StockMovementCorrection' && !isCorrectionReversalMovement(movement);
}

export function getCorrectionAnchorId(movement: BookStockMovement) {
  if (movement.referenceType === 'StockMovementCorrection' && movement.referenceId) {
    return movement.referenceId;
  }
  return movement.id;
}

export function buildLatestReplacementByAnchor(movements: BookStockMovement[]) {
  const latestByAnchor = new Map<string, { id: string; round: number; createdAt: string }>();

  for (const movement of movements) {
    if (!isCorrectionReplacementMovement(movement) || !movement.referenceId) continue;
    const anchorId = movement.referenceId;
    const round = movement.correctionRound ?? 0;
    const existing = latestByAnchor.get(anchorId);
    if (!existing || round > existing.round || (round === existing.round && movement.createdAt > existing.createdAt)) {
      latestByAnchor.set(anchorId, { id: movement.id, round, createdAt: movement.createdAt });
    }
  }

  return new Map([...latestByAnchor.entries()].map(([anchorId, value]) => [anchorId, value.id]));
}

export function findLatestReplacementForAnchor(movements: BookStockMovement[], anchorId: string) {
  return movements
    .filter((movement) => isCorrectionReplacementMovement(movement) && movement.referenceId === anchorId)
    .sort((left, right) => {
      const leftRound = left.correctionRound ?? 0;
      const rightRound = right.correctionRound ?? 0;
      if (leftRound !== rightRound) return rightRound - leftRound;
      return right.createdAt.localeCompare(left.createdAt);
    })[0] ?? null;
}

export function canModifyStockMovement(
  movement: BookStockMovement,
  latestReplacementByAnchor: Map<string, string>,
) {
  if (!movement) return false;
  if (movement.referenceType && LOCKED_FOR_CORRECT.has(movement.referenceType)) return false;

  if (movement.referenceType === 'StockMovementCorrection') {
    if (isCorrectionReversalMovement(movement) || !movement.referenceId) return false;
    return latestReplacementByAnchor.get(movement.referenceId) === movement.id;
  }

  return true;
}

export function canDeleteStockMovement(movement: BookStockMovement) {
  if (!movement) return false;
  if (movement.referenceType && LOCKED_FOR_DELETE.has(movement.referenceType)) return false;
  return true;
}

export function deletesEntireCorrectionBundle(movement: BookStockMovement) {
  return movement.referenceType === 'StockMovementCorrection' || Number(movement.correctionCount || 0) > 0;
}

export function getNextCorrectionRound(movement: BookStockMovement) {
  return Number(movement.correctionCount || 0) + 1;
}
