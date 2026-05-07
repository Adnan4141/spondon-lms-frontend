import type { BookStockMovement, BookStockMovementType, StockLocationType, StockLocationPayload } from '@/lib/api/books';

export type StockLocationOption = { id: string; name: string };
export type StockLocationOptions = Record<StockLocationType, StockLocationOption[]>;

export type StockMovementFormState = {
  bookId: string;
  movementType: BookStockMovementType;
  quantity: number;
  remarks: string;
  sourceType: StockLocationType;
  sourceId: string;
  destinationType: StockLocationType;
  destinationId: string;
  entryDate: Date;
};

export const STOCK_MOVEMENT_TYPES: BookStockMovementType[] = ['RECEIVE', 'TRANSFER', 'DISTRIBUTE', 'SALE', 'RETURN', 'ADJUSTMENT'];
export const STOCK_LOCATION_TYPES: StockLocationType[] = ['SOURCE', 'CENTRAL', 'BRANCH', 'CHANNEL', 'CUSTOMER', 'OTHER'];

export const movementTypeDescriptions: Record<BookStockMovementType, string> = {
  RECEIVE: 'New printed stock enters central warehouse.',
  TRANSFER: 'Move stock between inventory locations.',
  DISTRIBUTE: 'Send stock from warehouse or branch to branch/channel.',
  SALE: 'Manual sale movement. Prefer Offline Sales POS for student purchases.',
  RETURN: 'Returned books come back into branch or central stock.',
  ADJUSTMENT: 'Audit adjustment for damaged, missing, or reconciled stock.',
};

const movementPresets: Record<BookStockMovementType, Pick<StockMovementFormState, 'sourceType' | 'sourceId' | 'destinationType' | 'destinationId'>> = {
  RECEIVE: { sourceType: 'SOURCE', sourceId: '', destinationType: 'CENTRAL', destinationId: 'central' },
  TRANSFER: { sourceType: 'CENTRAL', sourceId: 'central', destinationType: 'BRANCH', destinationId: '' },
  DISTRIBUTE: { sourceType: 'CENTRAL', sourceId: 'central', destinationType: 'CHANNEL', destinationId: '' },
  SALE: { sourceType: 'BRANCH', sourceId: '', destinationType: 'CUSTOMER', destinationId: 'customer' },
  RETURN: { sourceType: 'CUSTOMER', sourceId: 'customer', destinationType: 'BRANCH', destinationId: '' },
  ADJUSTMENT: { sourceType: 'OTHER', sourceId: 'other', destinationType: 'CENTRAL', destinationId: 'central' },
};

const sourceRules: Record<BookStockMovementType, StockLocationType[]> = {
  RECEIVE: ['SOURCE', 'OTHER'],
  TRANSFER: ['CENTRAL', 'BRANCH', 'CHANNEL'],
  DISTRIBUTE: ['CENTRAL', 'BRANCH'],
  SALE: ['BRANCH'],
  RETURN: ['CUSTOMER', 'BRANCH'],
  ADJUSTMENT: ['CENTRAL', 'BRANCH', 'CHANNEL', 'OTHER'],
};

const destinationRules: Record<BookStockMovementType, StockLocationType[]> = {
  RECEIVE: ['CENTRAL'],
  TRANSFER: ['CENTRAL', 'BRANCH', 'CHANNEL'],
  DISTRIBUTE: ['BRANCH', 'CHANNEL'],
  SALE: ['CUSTOMER'],
  RETURN: ['BRANCH', 'CENTRAL'],
  ADJUSTMENT: ['CENTRAL', 'BRANCH', 'CHANNEL', 'OTHER'],
};

export function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function defaultLocationId(type?: StockLocationType | null) {
  if (type === 'CENTRAL') return 'central';
  if (type === 'CUSTOMER') return 'customer';
  if (type === 'OTHER') return 'other';
  return '';
}

export function defaultStockMovementForm(): StockMovementFormState {
  return {
    bookId: '',
    movementType: 'RECEIVE',
    quantity: 1,
    remarks: '',
    sourceType: 'SOURCE',
    sourceId: '',
    destinationType: 'CENTRAL',
    destinationId: 'central',
    entryDate: startOfToday(),
  };
}

export function movementToForm(movement: BookStockMovement): StockMovementFormState {
  return {
    bookId: movement.bookId,
    movementType: movement.movementType,
    quantity: movement.quantity,
    remarks: movement.remarks || '',
    sourceType: (movement.sourceType || 'SOURCE') as StockLocationType,
    sourceId: movement.sourceId || defaultLocationId(movement.sourceType),
    destinationType: (movement.destinationType || 'CENTRAL') as StockLocationType,
    destinationId: movement.destinationId || defaultLocationId(movement.destinationType),
    entryDate: movement.movementDate ? new Date(movement.movementDate) : startOfToday(),
  };
}

export function applyMovementPreset(form: StockMovementFormState, movementType: BookStockMovementType): StockMovementFormState {
  return { ...form, movementType, ...movementPresets[movementType] };
}

export function allowedSourceTypes(movementType: BookStockMovementType) {
  return sourceRules[movementType];
}

export function allowedDestinationTypes(movementType: BookStockMovementType) {
  return destinationRules[movementType];
}

export function locationPayload(type: StockLocationType, id: string, name: string): StockLocationPayload {
  if (type === 'CENTRAL') return { type };
  return { type, id, name };
}

export function validateStockMovementForm(form: StockMovementFormState, editing: boolean) {
  if (!form.bookId) return 'Select a book first.';
  if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) <= 0) return 'Quantity must be a positive whole number.';
  if (form.entryDate.getTime() > Date.now()) return 'Entry date cannot be in the future.';
  if (!allowedSourceTypes(form.movementType).includes(form.sourceType)) return `${form.sourceType} is not a valid source for ${form.movementType}.`;
  if (!allowedDestinationTypes(form.movementType).includes(form.destinationType)) return `${form.destinationType} is not a valid destination for ${form.movementType}.`;
  if (['SOURCE', 'BRANCH', 'CHANNEL'].includes(form.sourceType) && !form.sourceId) return `Select a ${form.sourceType.toLowerCase()} source.`;
  if (['SOURCE', 'BRANCH', 'CHANNEL'].includes(form.destinationType) && !form.destinationId) return `Select a ${form.destinationType.toLowerCase()} destination.`;
  if (form.sourceType === form.destinationType && (form.sourceId || defaultLocationId(form.sourceType)) === (form.destinationId || defaultLocationId(form.destinationType))) {
    return 'Source and destination cannot be the same location.';
  }
  if (form.movementType === 'SALE' && !editing) return 'Use Offline Sales POS for student purchases. Manual sale movement is reserved for corrections.';
  if (editing && !form.remarks.trim()) return 'Correction remarks are required.';
  return null;
}
