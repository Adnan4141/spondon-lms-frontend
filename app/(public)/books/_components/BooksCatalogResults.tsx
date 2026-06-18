'use client';

import type { BookCategory, PublicCatalogBook } from '@/lib/api/books';
import CategorySections from '../categories/[categories]/CateogriesSections';
import { BooksBrowseMore } from './BooksBrowseMore';
import { BooksCatalogEmpty } from './BooksCatalogEmpty';
import { BooksCatalogLoading } from './BooksCatalogLoading';
import { BooksFeaturedSection } from './BooksFeaturedSection';
import { BooksMatchingGrid } from './BooksMatchingGrid';

type BooksCatalogResultsProps = {
  loading: boolean;
  filteredBooks: PublicCatalogBook[];
  featuredBooks: PublicCatalogBook[];
  categories: BookCategory[];
  selectedCategory: string;
};

export function BooksCatalogResults({
  loading,
  filteredBooks,
  featuredBooks,
  categories,
  selectedCategory,
}: BooksCatalogResultsProps) {
  if (loading) {
    return <BooksCatalogLoading />;
  }

  if (filteredBooks.length === 0) {
    return <BooksCatalogEmpty />;
  }

  return (
    <>
      {/* <BooksFeaturedSection books={featuredBooks} /> */}
      <CategorySections categories={categories} books={filteredBooks} selectedCategory={selectedCategory} />
 
    
    </>
  );
}
