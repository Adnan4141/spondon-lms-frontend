'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, Loader2, Search, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  getBookCategories,
  getPublicBooksCatalog,
  type BookCategory,
  type PublicCatalogBook,
} from '@/lib/api/books';

type CategoryShelf = {
  id: string;
  label: string;
  books: PublicCatalogBook[];
};

const cardThemes = [
  'from-rose-500 to-pink-500',
  'from-sky-500 to-blue-500',
  'from-emerald-500 to-green-500',
  'from-orange-500 to-amber-500',
  'from-violet-500 to-purple-500',
  'from-cyan-500 to-teal-500',
];

function readCatalogUser(): { id?: string; role?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as { id?: string; role?: string }) : null;
  } catch {
    return null;
  }
}

function stripHtml(html?: string | null) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function BooksCatalogPage() {
  const router = useRouter();
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

  const searchFiltered = useMemo(() => {
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

      return matchesQuery && matchesFormat;
    });
  }, [books, format, searchQuery]);

  const shelves = useMemo<CategoryShelf[]>(() => {
    const rows: CategoryShelf[] = categories
      .map((category) => ({
        id: category.id,
        label: category.name,
        books: searchFiltered.filter((book) => book.categoryId === category.id),
      }))
      .filter((category) => category.books.length > 0);

    const uncategorized = searchFiltered.filter((book) => !book.categoryId);
    if (uncategorized.length) {
      rows.push({ id: '__none__', label: 'আরও বই', books: uncategorized });
    }

    return rows;
  }, [categories, searchFiltered]);

  const visibleShelves = selectedCategory === 'all'
    ? shelves
    : shelves.filter((shelf) => shelf.id === selectedCategory);

  const featuredBooks = useMemo(
    () => searchFiltered.filter((book) => book.featured).slice(0, 6),
    [searchFiltered],
  );

  const resetFilters = () => {
    setSearchQuery('');
    setFormat('all');
    setSelectedCategory('all');
  };

  const handleBuyClick = (bookId: string) => {
    const user = readCatalogUser();
    if (!user?.id) {
      router.push(`/login?redirect=${encodeURIComponent(`/books/${bookId}`)}`);
      return;
    }

    router.push(`/books/${bookId}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-emerald-100">
      <Header />

      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] pt-28 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(#0f172a_0.8px,transparent_0.8px)] bg-size-[26px_26px] opacity-[0.04]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">
                Book Categories
              </Badge>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                বই খুঁজুন <span className="text-emerald-600">ক্যাটাগরি</span> ধরে, সিরিজ ধরে, দ্রুত। 
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                HSC, SSC, admission, and custom publication shelves in one place. Browse by category first, then open the exact book details page for sample preview and purchase.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  { value: 'all', label: 'All formats' },
                  { value: 'ebook', label: 'E-Books' },
                  { value: 'print', label: 'Print books' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormat(option.value as 'all' | 'ebook' | 'print')}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-black transition-colors',
                      format === option.value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="বইয়ের নাম, লেখক, সিরিজ লিখে খুঁজুন"
                  className="h-14 rounded-2xl border-slate-200 pl-12 text-base"
                />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Books</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{books.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Shelves</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{shelves.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Featured</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{featuredBooks.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading books...
            </div>
          </div>
        ) : shelves.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-2xl font-black text-slate-900">No matching books found</h2>
            <p className="mt-2 text-sm text-slate-500">Try another search term or reset the category/format filters.</p>
            <Button className="mt-6 rounded-2xl" variant="outline" onClick={resetFilters}>
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            <section className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Category shelves</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">ক্যাটাগরি কম্পোনেন্ট ভিউ</h2>
                </div>
                {selectedCategory !== 'all' ? (
                  <Button variant="outline" className="rounded-2xl" onClick={() => setSelectedCategory('all')}>
                    সব ক্যাটাগরি দেখুন
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {shelves.map((shelf, index) => (
                  <button
                    key={shelf.id}
                    type="button"
                    onClick={() => setSelectedCategory(shelf.id)}
                    className={cn(
                      'overflow-hidden rounded-[28px] border bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg',
                      selectedCategory === shelf.id ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200',
                    )}
                  >
                    <div className={cn('relative overflow-hidden px-5 py-5 text-white', `bg-linear-to-r ${cardThemes[index % cardThemes.length]}`)}>
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,white_1px,transparent_1px)] bg-size-[16px_100%] opacity-10" />
                      <div className="relative flex items-start justify-between gap-4">
                        <div>
                          <p className="text-2xl font-black leading-tight">{shelf.label}</p>
                          <p className="mt-1 text-sm font-semibold text-white/80">{shelf.books[0]?.author || 'Category collection'}</p>
                        </div>
                        <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-black">{shelf.books.length} টি বই</div>
                      </div>
                    </div>
                    <div className="flex items-end justify-between gap-4 p-5">
                      <div className="flex min-w-0 items-end">
                        {shelf.books.slice(0, 4).map((book, previewIndex) => (
                          <div
                            key={book.id}
                            className={cn(
                              'relative h-20 w-14 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm',
                              previewIndex > 0 ? '-ml-3' : '',
                            )}
                          >
                            {book.thumbnailUrl ? (
                              <Image src={book.thumbnailUrl} alt={book.name} fill className="object-cover" unoptimized />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs font-black text-slate-300">{book.name.slice(0, 1)}</div>
                            )}
                          </div>
                        ))}
                        {shelf.books.length > 4 ? (
                          <div className="-ml-3 flex h-20 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-500 shadow-sm">
                            +{shelf.books.length - 4}
                          </div>
                        ) : null}
                      </div>
                      <div className="inline-flex items-center gap-2 text-sm font-black text-slate-700">
                        বিস্তারিত <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <div className="space-y-10">
              {visibleShelves.map((shelf) => (
                <section key={shelf.id} className="space-y-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-black tracking-tight text-slate-950">{shelf.label}</h3>
                      <p className="mt-1 text-sm text-slate-500">{shelf.books.length} curated {shelf.books.length === 1 ? 'book' : 'books'} in this shelf</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
                      <Sparkles className="h-4 w-4" />
                      Storefront selection
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {shelf.books.map((book) => (
                      <Link
                        key={book.id}
                        href={`/books/${book.id}`}
                        className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div className="relative aspect-4/5 overflow-hidden bg-slate-100">
                          {book.thumbnailUrl ? (
                            <Image src={book.thumbnailUrl} alt={book.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                          ) : (
                            <div className="flex h-full items-center justify-center text-4xl font-black text-slate-300">{book.name.slice(0, 1)}</div>
                          )}
                          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                            <Badge className="border-white/40 bg-white/85 text-slate-800">{book.isEbook ? 'E-Book' : 'Print'}</Badge>
                            {book.featured ? <Badge className="border-amber-200 bg-amber-50 text-amber-700">Featured</Badge> : null}
                          </div>
                        </div>
                        <div className="space-y-4 p-5">
                          <div>
                            <h4 className="line-clamp-2 text-lg font-black leading-tight text-slate-950 group-hover:text-emerald-600">{book.name}</h4>
                            {book.author ? <p className="mt-1 text-sm font-medium text-slate-500">{book.author}</p> : null}
                          </div>
                          <p className="line-clamp-3 text-sm leading-6 text-slate-500">
                            {stripHtml(book.description) || 'এই বইয়ের বিস্তারিত দেখতে ভিতরে প্রবেশ করুন।'}
                          </p>
                          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                            <div>
                              <p className="text-2xl font-black text-slate-950">{Number(book.price) <= 0 ? 'FREE' : `৳${Number(book.price).toLocaleString()}`}</p>
                              <p className="text-xs font-semibold text-slate-400">{book.category?.name || shelf.label}</p>
                            </div>
                            <Button
                              type="button"
                              className="rounded-2xl bg-emerald-600 px-4 text-white hover:bg-emerald-700"
                              onClick={(event) => {
                                event.preventDefault();
                                handleBuyClick(book.id);
                              }}
                            >
                              Buy
                            </Button>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}