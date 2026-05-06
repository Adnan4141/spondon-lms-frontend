'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  getBookCategories,
  getPublicBooksCatalog,
  type BookCategory,
  type PublicCatalogBook,
} from '@/lib/api/books';
import { BooksCatalogResults } from './_components/BooksCatalogResults';
import { BooksQuickBrowse } from './_components/BooksQuickBrowse';

export default function BooksCatalogPage() {
  const [books, setBooks] = useState<PublicCatalogBook[]>([]);
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [booksRes, categoriesRes] = await Promise.all([
        getPublicBooksCatalog({ limit: 300 }),
        getBookCategories(),
      ]);

      setBooks(booksRes.success && booksRes.data ? booksRes.data : []);
      setCategories(categoriesRes.success && categoriesRes.data ? categoriesRes.data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const featuredBooks = useMemo(
    () => books.filter((book) => book.featured).slice(0, 3),
    [books],
  );

  const quickBrowseCategories = useMemo(() => categories.slice(0, 6), [categories]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f0fdfa_0%,#f8fafc_34%,#eef2ff_100%)] text-slate-900 selection:bg-emerald-100">
      <Header />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 sm:pb-32 lg:max-w-[90rem] lg:px-12">
        {quickBrowseCategories.length > 0 ? (
          <BooksQuickBrowse categories={quickBrowseCategories} />
        ) : null}

        <BooksCatalogResults
          loading={loading}
          filteredBooks={books}
          featuredBooks={featuredBooks}
          categories={categories}
          selectedCategory="all"
        />
      </main>

      <Footer />
    </div>
  );
}
