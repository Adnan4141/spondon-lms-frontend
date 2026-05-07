'use client';

import type { BookStockMovement, BookStockMovementType } from '@/lib/api/books';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, FileText, Pencil, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const movementColors: Record<BookStockMovementType, string> = {
  RECEIVE: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  RETURN: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  ADJUSTMENT: 'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  DISTRIBUTE: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400',
  TRANSFER: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400',
  SALE: 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400',
};

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function signedQuantity(movement: BookStockMovement) {
  if (movement.movementType === 'SALE' || movement.movementType === 'DISTRIBUTE' || movement.movementType === 'TRANSFER') return `-${movement.quantity}`;
  return `+${movement.quantity}`;
}

function formatBalance(movement: BookStockMovement) {
  const source = movement.sourceBalanceAfter == null ? null : `Source after ${movement.sourceBalanceAfter}`;
  const destination = movement.destinationBalanceAfter == null ? null : `Destination after ${movement.destinationBalanceAfter}`;
  return [source, destination].filter(Boolean).join(' | ') || '-';
}

export function StockMovementCard({
  movement,
  canCorrect,
  onCorrect,
}: {
  movement: BookStockMovement;
  canCorrect: boolean;
  onCorrect: (movement: BookStockMovement) => void;
}) {
  const isCorrection = movement.referenceType === 'StockMovementCorrection';
  const isCorrectedOriginal = !isCorrection && Number(movement.correctionCount || 0) > 0;

  return (
    <article className={cn(
      'rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors',
      isCorrection && 'border-blue-500/30 bg-blue-500/5',
      isCorrectedOriginal && 'border-amber-500/30 bg-amber-500/5',
    )}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em]', movementColors[movement.movementType])}>
              {movement.movementType}
            </span>
            {isCorrection ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Correction
              </span>
            ) : null}
            {isCorrectedOriginal ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Corrected
              </span>
            ) : null}
          </div>

          <div>
            <p className="truncate text-sm font-semibold text-foreground">{movement.book?.name || movement.bookId}</p>
            {movement.book?.sku ? <p className="text-xs text-muted-foreground">SKU: {movement.book.sku}</p> : null}
          </div>

          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{movement.sourceName || movement.sourceType || 'Unknown'}</span>
            <ArrowRight className="h-4 w-4" />
            <span>{movement.destinationName || movement.destinationType || 'Unknown'}</span>
          </p>

          <p className="text-sm text-muted-foreground">Balance: <span className="font-semibold text-foreground">{formatBalance(movement)}</span></p>

          {movement.referenceType || movement.referenceId ? (
            <p className="inline-flex max-w-full items-center gap-2 rounded-lg bg-muted px-3 py-1 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{movement.referenceType || 'Reference'}: {movement.referenceId || '-'}</span>
            </p>
          ) : null}

          {movement.remarks ? <p className="text-sm text-muted-foreground">{movement.remarks}</p> : null}
        </div>

        <div className="min-w-[150px] text-left sm:text-right">
          <p className={cn('text-2xl font-black', signedQuantity(movement).startsWith('-') ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
            {signedQuantity(movement)}
          </p>
          <p className="text-sm font-semibold text-foreground">Entry: {formatDateTime(movement.movementDate)}</p>
          <p className="text-xs text-muted-foreground">Recorded: {formatDateTime(movement.createdAt)}</p>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">By {movement.createdByUserId || 'System'}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 rounded-xl"
            onClick={() => onCorrect(movement)}
            disabled={!canCorrect}
          >
            <Pencil className="mr-2 h-3.5 w-3.5" />
            {isCorrectedOriginal ? 'Corrected' : isCorrection ? 'Correction' : 'Correct'}
          </Button>
        </div>
      </div>
    </article>
  );
}
