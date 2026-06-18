'use client';

import { useMemo } from 'react';
import type { BookCategory, PublicCatalogBook } from '@/lib/api/books';
import { BooksCatalogResults } from './_components/BooksCatalogResults';
import { BooksQuickBrowse } from './_components/BooksQuickBrowse';

type Props = {
  initialBooks: PublicCatalogBook[];
  initialCategories: BookCategory[];
};

export default function BooksCatalogPageClient({ initialBooks, initialCategories }: Props) {
  const featuredBooks = useMemo(
    () => initialBooks.filter((book) => book.featured).slice(0, 3),
    [initialBooks],
  );

  const quickBrowseCategories = useMemo(() => initialCategories.slice(0, 6), [initialCategories]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f0fdfa_0%,#f8fafc_34%,#eef2ff_100%)] text-slate-900 selection:bg-emerald-100">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 sm:pb-32 lg:max-w-[90rem] lg:px-12">
        {quickBrowseCategories.length > 0 ? (
          <BooksQuickBrowse categories={quickBrowseCategories} />
        ) : null}

        <BooksCatalogResults
          loading={false}
          filteredBooks={initialBooks}
          featuredBooks={featuredBooks}
          categories={initialCategories}
          selectedCategory="all"
        />
      </main>
    </div>
  );
}
