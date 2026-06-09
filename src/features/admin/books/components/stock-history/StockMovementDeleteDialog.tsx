'use client';

import type { BookStockMovement } from '@/lib/api/books';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function StockMovementDeleteDialog({
  movement,
  open,
  saving,
  onClose,
  onConfirm,
}: {
  movement: BookStockMovement | null;
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) setReason('');
  }, [open, movement?.id]);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    await onConfirm(reason.trim());
  };

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !saving) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete stock movement?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                This will reverse inventory impact, remove the ledger entry
                {movement?.referenceType === 'BookDistribution' ? ', and delete the linked distribution record' : ''}.
                The action is recorded in audit history.
              </p>
              {movement ? (
                <div className="rounded-xl border border-border bg-muted/40 p-3 text-foreground">
                  <p className="font-semibold">{movement.book?.name || movement.bookId}</p>
                  <p>{movement.movementType} · Qty {movement.quantity}</p>
                  <p>{movement.sourceName || movement.sourceType || 'Unknown'} → {movement.destinationName || movement.destinationType || 'Unknown'}</p>
                </div>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="stock-delete-reason">Reason for deletion</Label>
          <Textarea
            id="stock-delete-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Wrong book, duplicate entry, entered by mistake..."
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={saving || !reason.trim()}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            {saving ? 'Deleting...' : 'Delete movement'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
