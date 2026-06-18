'use client';

import type { BookCategory, PublicCatalogBook } from '@/lib/api/books';
import { CategorySectionsEmpty } from './_components/CategorySectionsEmpty';
import { CategoryShelfSection } from './_components/CategoryShelfSection';

export default function CategorySections({
  categories,
  books,
  selectedCategory = 'all',
}: {
  categories: BookCategory[];
  books: PublicCatalogBook[];
  selectedCategory?: string;
}) {
  const visibleCategories = categories.filter((category) => {
    if (selectedCategory !== 'all' && selectedCategory !== category.id) return false;
    return books.some((book) => book.categoryId === category.id);
  });

  if (visibleCategories.length === 0) {
    return <CategorySectionsEmpty />;
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      {visibleCategories.map((category, index) => (
        <CategoryShelfSection key={category.id} category={category} books={books} shelfIndex={index} />
      ))}
    </div>
  );
}
