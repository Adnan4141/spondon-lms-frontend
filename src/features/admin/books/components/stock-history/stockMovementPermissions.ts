import type { BookStockMovement } from '@/lib/api/books';

const LOCKED_FOR_CORRECT = new Set(['BookSaleItem', 'StockMovementCorrection', 'StockMovementDeletion']);
const LOCKED_FOR_DELETE = new Set(['BookSaleItem', 'StockMovementDeletion']);

export function canModifyStockMovement(movement: BookStockMovement, correctedOriginalIds: Set<string>) {
  if (!movement) return false;
  if (movement.referenceType && LOCKED_FOR_CORRECT.has(movement.referenceType)) return false;
  if (correctedOriginalIds.has(movement.id)) return false;
  if (Number(movement.correctionCount || 0) > 0) return false;
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
