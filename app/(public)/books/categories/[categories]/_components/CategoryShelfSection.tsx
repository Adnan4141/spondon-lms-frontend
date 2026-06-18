'use client';

import type { BookCategory, PublicCatalogBook } from '@/lib/api/books';
import { CategoryShelfBookCard } from './CategoryShelfBookCard';
import { CategoryShelfHeader } from './CategoryShelfHeader';
import { shelfGradientClass } from './shelfGradients';

type CategoryShelfSectionProps = {
  category: BookCategory;
  books: PublicCatalogBook[];
  shelfIndex: number;
};

export function CategoryShelfSection({ category, books, shelfIndex }: CategoryShelfSectionProps) {
  const categoryBooks = books.filter((book) => book.categoryId === category.id);
  const gradientClass = shelfGradientClass(shelfIndex);

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-slate-950/5 sm:p-5 lg:p-6">
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-linear-to-r ${gradientClass}`} />
      <CategoryShelfHeader category={category} shelfIndex={shelfIndex} />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 md:items-stretch xl:grid-cols-3 2xl:grid-cols-4">
        {categoryBooks.slice(0, 3).map((book) => (
          <CategoryShelfBookCard key={book.id} book={book} shelfIndex={shelfIndex} />
        ))}
      </div>
    </section>
  );
}
