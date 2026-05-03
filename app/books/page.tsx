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
import { stripHtml } from './_components/catalogUtils';

export default function BooksCatalogPage() {
  const [books, setBooks] = useState<PublicCatalogBook[]>([]);
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [format, setFormat] = useState<'all' | 'ebook' | 'print'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  const filteredBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return books.filter((book) => {
      const matchesQuery =
        !query ||
        book.name.toLowerCase().includes(query) ||
        (book.author || '').toLowerCase().includes(query) ||
        stripHtml(book.description).toLowerCase().includes(query);
      const matchesFormat =
        format === 'all' ||
        (format === 'ebook' && book.isEbook) ||
        (format === 'print' && !book.isEbook);
      const matchesCategory = selectedCategory === 'all' || book.categoryId === selectedCategory;

      return matchesQuery && matchesFormat && matchesCategory;
    });
  }, [books, format, searchQuery, selectedCategory]);

  const featuredBooks = useMemo(
    () => filteredBooks.filter((book) => book.featured).slice(0, 3),
    [filteredBooks],
  );

  const quickBrowseCategories = useMemo(() => categories.slice(0, 8), [categories]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-emerald-100">
      <Header />

     
      <main className="mx-auto max-w-7xl lg:max-w-[90rem] space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-10 lg:space-y-12 lg:px-12">
    
        {quickBrowseCategories.length > 0 ? (
          <BooksQuickBrowse categories={quickBrowseCategories} />
        ) : null}

        <BooksCatalogResults
          loading={loading}
          filteredBooks={filteredBooks}
          featuredBooks={featuredBooks}
          categories={categories}
          selectedCategory={selectedCategory}
        />
      </main>

      <Footer />
    </div>
  );
}
