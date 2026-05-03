'use client';

import { PublicBookCard } from '@/components/books/PublicBookCard';
import type { PublicCatalogBook } from '@/lib/api/books';

type BooksFeaturedSectionProps = {
  books: PublicCatalogBook[];
};

export function BooksFeaturedSection({ books }: BooksFeaturedSectionProps) {
  if (books.length === 0) return null;

  return (
    <section className="space-y-5">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-600">নির্বাচিত বই</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">ক্যাটালগ থেকে আলাদা করে রাখা বই</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {books.map((book) => (
          <PublicBookCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}
