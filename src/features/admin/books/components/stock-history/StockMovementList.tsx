'use client';

import type { BookStockMovement } from '@/lib/api/books';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, PackageSearch } from 'lucide-react';
import { StockMovementCard } from './StockMovementCard';
import { canDeleteStockMovement, canModifyStockMovement } from './stockMovementPermissions';

export function StockMovementList({
  movements,
  loading,
  loadingMore,
  error,
  hasMore,
  onLoadMore,
  onRetry,
  onCorrect,
  onDelete,
  canCorrectMovements,
  canDeleteMovements,
}: {
  movements: BookStockMovement[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  onCorrect: (movement: BookStockMovement) => void;
  onDelete: (movement: BookStockMovement) => void;
  canCorrectMovements: boolean;
  canDeleteMovements: boolean;
}) {
  const correctedOriginalIds = new Set(
    movements
      .filter((movement) => movement.referenceType === 'StockMovementCorrection' && movement.referenceId)
      .map((movement) => movement.referenceId as string),
  );

  if (loading) {
    return (
      <section className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-2xl border border-border bg-muted/40" />
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <AlertCircle className="mx-auto h-9 w-9 text-destructive" />
        <h3 className="mt-3 text-base font-semibold text-foreground">Could not load stock history</h3>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-4 rounded-xl" variant="outline" onClick={onRetry}>Try again</Button>
      </section>
    );
  }

  if (!movements.length) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <PackageSearch className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-3 text-base font-semibold text-foreground">No stock movements found</h3>
        <p className="mt-1 text-sm text-muted-foreground">Adjust filters or record a new movement to start the ledger.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {movements.map((movement) => {
        const canModify = canModifyStockMovement(movement, correctedOriginalIds);
        const canCorrect = canModify && canCorrectMovements;
        const canDelete = canDeleteStockMovement(movement) && canDeleteMovements;
        return (
          <StockMovementCard
            key={movement.id}
            movement={movement}
            canCorrect={canCorrect}
            canDelete={canDelete}
            onCorrect={onCorrect}
            onDelete={onDelete}
          />
        );
      })}

      {hasMore ? (
        <div className="flex justify-center pt-2">
          <Button className="rounded-xl" variant="outline" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loadingMore ? 'Loading...' : 'Load more movements'}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
