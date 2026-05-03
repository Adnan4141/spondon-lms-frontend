'use client';

import type { Book } from '@/lib/api/books';
import { BookCatalogGridCard } from './BookCatalogGridCard';

type BookCatalogGridProps = {
  books: Book[];
  onOpenDetail: (book: Book) => void;
  onOpenEdit: (book: Book) => void;
  onPreviewPdf: (book: Book) => void;
};

export function BookCatalogGrid({ books, onOpenDetail, onOpenEdit, onPreviewPdf }: BookCatalogGridProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {books.map((book) => (
        <BookCatalogGridCard
          key={book.id}
          book={book}
          onOpenDetail={onOpenDetail}
          onOpenEdit={onOpenEdit}
          onPreviewPdf={onPreviewPdf}
        />
      ))}
    </section>
  );
}
