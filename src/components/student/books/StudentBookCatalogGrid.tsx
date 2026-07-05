import { BookMarked } from 'lucide-react';
import type { Book } from '@/lib/api/books';
import { StudentBookCatalogCard } from './StudentBookCatalogCard';

type Props = {
  books: Book[];
  ownedBookIds: Set<string>;
  purchasingId: string | null;
  onBuy: (book: Book) => void;
  searchQuery?: string;
};

export function StudentBookCatalogGrid({
  books,
  ownedBookIds,
  purchasingId,
  onBuy,
  searchQuery,
}: Props) {
  if (books.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-6 py-14 text-center">
        <BookMarked className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="font-bold text-slate-600">
          {searchQuery?.trim()
            ? `No books match "${searchQuery.trim()}"`
            : 'No books available in the catalog'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {searchQuery?.trim()
            ? 'Try a different search or clear your filters.'
            : 'Check back later for new titles.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {books.map((book) => (
        <StudentBookCatalogCard
          key={book.id}
          book={book}
          owned={ownedBookIds.has(book.id)}
          purchasing={purchasingId === book.id}
          onBuy={onBuy}
        />
      ))}
    </div>
  );
}
