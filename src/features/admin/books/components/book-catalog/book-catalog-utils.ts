import type { Book } from '@/lib/api/books';

export function stripCatalogHtml(html?: string | null) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function bookStockState(book: Book): { label: string; className: string } {
  if (book.isEbook) return { label: 'Digital', className: 'border-sky-200 bg-sky-50 text-sky-700' };
  const qty = Number(book.centralQty || 0);
  if (qty <= 0) return { label: 'Out of stock', className: 'border-rose-200 bg-rose-50 text-rose-700' };
  if (qty <= 10) return { label: 'Low stock', className: 'border-amber-200 bg-amber-50 text-amber-700' };
  return { label: 'In stock', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
}
