'use client';

import type { Book, BookStockMovement, BookStockMovementType, StockLocationType } from '@/lib/api/books';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { BookAdminModal } from '../BookAdminModal';
import {
  STOCK_LOCATION_TYPES,
  STOCK_MOVEMENT_TYPES,
  allowedDestinationTypes,
  allowedSourceTypes,
  applyMovementPreset,
  defaultLocationId,
  movementTypeDescriptions,
  type StockLocationOptions,
  type StockMovementFormState,
} from './stockMovementRules';

export function StockMovementFormDialog({
  open,
  editingMovement,
  books,
  sourceOptions,
  form,
  saving,
  onClose,
  onFormChange,
  onSubmit,
}: {
  open: boolean;
  editingMovement: BookStockMovement | null;
  books: Book[];
  sourceOptions: StockLocationOptions;
  form: StockMovementFormState;
  saving: boolean;
  onClose: () => void;
  onFormChange: (form: StockMovementFormState) => void;
  onSubmit: () => void;
}) {
  const priorCorrectionCount = editingMovement
    ? Number(editingMovement.correctionCount || 0) > 0
      ? Number(editingMovement.correctionCount)
      : Number(editingMovement.correctionRound || 0)
    : 0;
  const nextCorrectionRound = priorCorrectionCount + 1;

  const sourceTypes = allowedSourceTypes(form.movementType);
  const destinationTypes = allowedDestinationTypes(form.movementType);
  const availableSourceOptions = sourceOptions[form.sourceType] || [];
  const availableDestinationOptions = sourceOptions[form.destinationType] || [];

  const updateMovementType = (movementType: BookStockMovementType) => {
    onFormChange(applyMovementPreset(form, movementType));
  };

  const updateSourceType = (sourceType: StockLocationType) => {
    onFormChange({ ...form, sourceType, sourceId: defaultLocationId(sourceType) });
  };

  const updateDestinationType = (destinationType: StockLocationType) => {
    onFormChange({ ...form, destinationType, destinationId: defaultLocationId(destinationType) });
  };

  return (
    <BookAdminModal
      open={open}
      onClose={onClose}
      title={editingMovement ? 'Correct Stock Movement' : 'Record Stock Movement'}
      subtitle={editingMovement ? 'Creates one audit-safe reversal and replacement movement.' : 'Record physical stock changes with source, destination, and audit remarks.'}
      maxWidth="max-w-4xl"
      bodyClassName="p-4 sm:p-6 md:p-7"
    >
      <div className="space-y-5">
        {editingMovement ? (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
            <div className="flex gap-2 font-semibold">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              This will not overwrite history.
            </div>
            <p className="mt-1 text-amber-800/80 dark:text-amber-200/80">
              {priorCorrectionCount > 0
                ? `This movement has been corrected ${priorCorrectionCount} time${priorCorrectionCount === 1 ? '' : 's'} before. The system will reverse the current effective entry and create correction #${nextCorrectionRound}.`
                : 'The system will reverse the current effective entry and create the first corrected replacement.'}
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Book</Label>
            <Select value={form.bookId} onValueChange={(value) => onFormChange({ ...form, bookId: value })}>
              <SelectTrigger><SelectValue placeholder="Select printed book" /></SelectTrigger>
              <SelectContent>{books.map((book) => <SelectItem key={book.id} value={book.id}>{book.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Movement Type</Label>
            <Select value={form.movementType} onValueChange={(value) => updateMovementType(value as BookStockMovementType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STOCK_MOVEMENT_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{movementTypeDescriptions[form.movementType]}</p>
          </div>

          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min={1}
              step={1}
              value={String(form.quantity)}
              onChange={(event) => onFormChange({ ...form, quantity: Number(event.target.value || 0) })}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Entry Date</Label>
            <DatePicker
              date={form.entryDate}
              setDate={(date) => onFormChange({ ...form, entryDate: date || form.entryDate })}
              placeholder="Select entry date"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Source Type</Label>
            <Select value={form.sourceType} onValueChange={(value) => updateSourceType(value as StockLocationType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STOCK_LOCATION_TYPES.filter((type) => sourceTypes.includes(type)).map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Source</Label>
            <Select value={form.sourceId || defaultLocationId(form.sourceType)} onValueChange={(value) => onFormChange({ ...form, sourceId: value })}>
              <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent>{availableSourceOptions.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Destination Type</Label>
            <Select value={form.destinationType} onValueChange={(value) => updateDestinationType(value as StockLocationType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STOCK_LOCATION_TYPES.filter((type) => destinationTypes.includes(type)).map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Destination</Label>
            <Select value={form.destinationId || defaultLocationId(form.destinationType)} onValueChange={(value) => onFormChange({ ...form, destinationId: value })}>
              <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
              <SelectContent>{availableDestinationOptions.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>{editingMovement ? 'Correction remarks' : 'Remarks'}</Label>
            <Input
              value={form.remarks}
              onChange={(event) => onFormChange({ ...form, remarks: event.target.value })}
              placeholder={editingMovement ? 'Why is this movement being corrected?' : 'Purchase receive, transfer note, damaged return...'}
            />
          </div>
        </div>
      </div>

      <DialogFooter className="mt-6 border-t border-border bg-muted/30 px-0 pt-5 sm:mt-8 sm:pt-6">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} disabled={saving}>{saving ? 'Saving...' : editingMovement ? 'Save Correction' : 'Record Movement'}</Button>
      </DialogFooter>
    </BookAdminModal>
  );
}
