'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PublicBookCard } from '@/components/books/PublicBookCard';
import { getBookCategories, getPublicBooksCatalog, type BookCategory, type PublicCatalogBook } from '@/lib/api/books';

export default function CategoryBooksPage() {
  const params = useParams<{ categories: string }>();
  const categorySlug = decodeURIComponent(String(params?.categories || ''));

  const [category, setCategory] = useState<BookCategory | null>(null);
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [books, setBooks] = useState<PublicCatalogBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadCategoryPage() {
      try {
        setLoading(true);
        setError(null);

        const categoriesRes = await getBookCategories();
        if (!categoriesRes.success || !categoriesRes.data) {
          throw new Error('বইয়ের ক্যাটাগরি লোড করা যায়নি।');
        }

        const allCategories = categoriesRes.data;
        const matchedCategory = allCategories.find((item) => item.slug === categorySlug) || null;

        if (!matchedCategory) {
          throw new Error('জনসাধারণের ক্যাটালগে এই ক্যাটাগরি পাওয়া যায়নি।');
        }

        const booksRes = await getPublicBooksCatalog({ categoryId: matchedCategory.id, limit: 300 });

        if (!isActive) return;
        setCategories(allCategories);
        setCategory(matchedCategory);
        setBooks(booksRes.success && booksRes.data ? booksRes.data : []);
      } catch (loadError) {
        if (!isActive) return;
        setError(loadError instanceof Error ? loadError.message : 'এই ক্যাটাগরি লোড করা যায়নি।');
      } finally {
        if (isActive) setLoading(false);
      }
    }

    void loadCategoryPage();
    return () => {
      isActive = false;
    };
  }, [categorySlug]);

  const relatedCategories = useMemo(() => {
    return categories.filter((item) => item.slug !== categorySlug).slice(0, 6);
  }, [categories, categorySlug]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-emerald-100">
      <Header />

      <main className="pb-20 pt-28 sm:pt-0">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <section className="relative overflow-hidden rounded-[38px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,#ecfeff_0%,#ffffff_42%,#fefce8_100%)] px-6 py-10 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-size-[44px_44px] opacity-40" />
            <div className="relative space-y-5">
              <Button asChild variant="ghost" className="h-10 rounded-2xl px-3 text-slate-600 hover:bg-white">
                <Link href="/books">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  সব বইয়ে ফিরে যান
                </Link>
              </Button>

              {loading ? (
                <div className="flex items-center gap-3 text-slate-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  ক্যাটাগরি লোড হচ্ছে…
                </div>
              ) : error || !category ? (
                <div className="rounded-[28px] border border-rose-200 bg-white p-6 text-sm text-rose-700 shadow-sm">
                  {error || 'ক্যাটাগরি পাওয়া যায়নি।'}
                </div>
              ) : (
                <>
                  <Badge className="rounded-full border border-emerald-200 bg-white/90 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700 shadow-sm">
                    ক্যাটাগরি শেলফ
                  </Badge>
                  <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">{category.name}</h1>
                  <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                    {category.description?.trim() ||
                      'মূল বই ক্যাটালগের সাথে সামঞ্জস্যপূর্ণ জনসাধারণের ক্যাটাগরি শেলফ।'}
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm font-bold text-slate-500">
                    <span>{books.length} টি বই</span>
                    <span>স্লাগ: {category.slug}</span>
                  </div>
                </>
              )}
            </div>
          </section>

          {!loading && !error && category ? (
            <>
              <section className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {books.length > 0 ? (
                  books.map((book) => <PublicBookCard key={book.id} book={book} showCategory={false} />)
                ) : (
                  <div className="col-span-full rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
                    এই ক্যাটাগরিতে এখনো কোনো বই প্রকাশিত হয়নি।
                  </div>
                )}
              </section>

              {relatedCategories.length > 0 ? (
                <section className="mt-14 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">আরও ব্রাউজ করুন</p>
                      <h2 className="mt-2 text-2xl font-black text-slate-950">অন্যান্য ক্যাটাগরি</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {relatedCategories.map((item) => (
                        <Button key={item.id} asChild variant="outline" className="rounded-full">
                          <Link href={`/books/categories/${item.slug}`}>{item.name}</Link>
                        </Button>
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}