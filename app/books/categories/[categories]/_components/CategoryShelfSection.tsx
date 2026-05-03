'use client';

import type { BookCategory, PublicCatalogBook } from '@/lib/api/books';
import { CategoryShelfBookCard } from './CategoryShelfBookCard';
import { CategoryShelfFeaturedCard } from './CategoryShelfFeaturedCard';
import { CategoryShelfHeader } from './CategoryShelfHeader';
import { shelfGradientClass, shelfRingClass } from './shelfGradients';

type CategoryShelfSectionProps = {
  category: BookCategory;
  books: PublicCatalogBook[];
  shelfIndex: number;
};

export function CategoryShelfSection({ category, books, shelfIndex }: CategoryShelfSectionProps) {
  const categoryBooks = books.filter((book) => book.categoryId === category.id);
  const previews = categoryBooks.slice(0, 4);
  const gradientClass = shelfGradientClass(shelfIndex);
  const ringClass = shelfRingClass(shelfIndex);

  return (
    <section className="space-y-4 sm:space-y-5">
      <CategoryShelfHeader category={category} shelfIndex={shelfIndex} />

      {/* Featured spans full row on md–lg; 4-col band on xl so row heights stay even */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 md:items-stretch xl:grid-cols-4 xl:gap-4">
       

        {categoryBooks.slice(0, 3).map((book) => (
          <CategoryShelfBookCard key={book.id} book={book} shelfIndex={shelfIndex} />
        ))}
      </div>
    </section>
  );
}
