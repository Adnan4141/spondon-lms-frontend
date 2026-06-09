import type { BookStockMovement } from '@/lib/api/books';

const LOCKED_REFERENCE_TYPES = new Set(['BookSaleItem', 'StockMovementCorrection', 'StockMovementDeletion']);

export function canModifyStockMovement(movement: BookStockMovement, correctedOriginalIds: Set<string>) {
  if (!movement) return false;
  if (movement.referenceType && LOCKED_REFERENCE_TYPES.has(movement.referenceType)) return false;
  if (correctedOriginalIds.has(movement.id)) return false;
  if (Number(movement.correctionCount || 0) > 0) return false;
  return true;
}
