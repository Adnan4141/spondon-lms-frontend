import type { Book } from '@/lib/api/books';
import type { MyBookPurchaseRow } from '@/components/student/MyBookPurchasesPanel';

export type BookSortOption = 'recent' | 'name' | 'price-low' | 'price-high';
export type BookTypeFilter = 'all' | 'ebook' | 'print';

export function sortBooks(books: Book[], sort: BookSortOption): Book[] {
  const copy = [...books];
  if (sort === 'name') {
    return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
  if (sort === 'price-low') {
    return copy.sort((a, b) => Number(a.price) - Number(b.price));
  }
  if (sort === 'price-high') {
    return copy.sort((a, b) => Number(b.price) - Number(a.price));
  }
  return copy.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function filterBooks(
  books: Book[],
  search: string,
  typeFilter: BookTypeFilter,
  categoryId: string,
): Book[] {
  const q = search.trim().toLowerCase();
  return books.filter((book) => {
    if (typeFilter === 'ebook' && !book.isEbook) return false;
    if (typeFilter === 'print' && book.isEbook) return false;
    if (categoryId !== 'all' && book.categoryId !== categoryId) return false;
    if (!q) return true;
    return (
      book.name.toLowerCase().includes(q) ||
      (book.author?.toLowerCase().includes(q) ?? false) ||
      (book.category?.name.toLowerCase().includes(q) ?? false)
    );
  });
}

export function deriveCategories(books: Book[]): Array<{ id: string; name: string }> {
  const map = new Map<string, { id: string; name: string }>();
  for (const book of books) {
    if (book.category) {
      map.set(book.category.id, { id: book.category.id, name: book.category.name });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function computeBookStats(purchases: MyBookPurchaseRow[], catalogCount: number) {
  let ebookCount = 0;
  let pendingPayments = 0;
  const ownedBookIds = new Set<string>();

  for (const sale of purchases) {
    for (const item of sale.items) {
      ownedBookIds.add(item.book.id);
      if (item.book.isEbook) ebookCount += 1;
    }
    const due = sale.invoice ? Number(sale.invoice.dueAmount) : 0;
    if (due > 0) pendingPayments += 1;
  }

  return {
    orderCount: purchases.length,
    ebookCount,
    pendingPayments,
    catalogCount,
    ownedBookIds,
  };
}
