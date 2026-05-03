import { parseISO } from 'date-fns';
import type { CreateBookDto } from '@/lib/api/books';

export function initialCreateState(): CreateBookDto {
  return {
    name: '',
    sku: '',
    price: 0,
    centralQty: 0,
    mrp: undefined,
    author: '',
    description: '',
    isEbook: false,
    featured: false,
    programId: undefined,
    categoryId: undefined,
  };
}

export function bookDateToPickerDate(iso: string | null | undefined): Date | undefined {
  if (!iso) return undefined;
  const normalized = iso.length <= 10 ? `${iso}T12:00:00` : iso;
  const d = parseISO(normalized);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function pickerDateToIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
