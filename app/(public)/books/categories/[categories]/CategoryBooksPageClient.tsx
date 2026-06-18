'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PublicBookCard } from '@/components/books/PublicBookCard';
import type { BookCategory, PublicCatalogBook } from '@/lib/api/books';

type Props = {
  category: BookCategory;
  categories: BookCategory[];
  books: PublicCatalogBook[];
};

export default function CategoryBooksPageClient({ category, categories, books }: Props) {
  const relatedCategories = useMemo(() => {
    return categories.filter((item) => item.slug !== category.slug).slice(0, 6);
  }, [categories, category.slug]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ecfeff_0%,#f8fafc_42%,#fefce8_100%)] text-slate-900 selection:bg-emerald-100">
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

              <Badge className="rounded-full border border-emerald-200 bg-white/90 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700 shadow-sm">
                ক্যাটাগরি শেলফ
              </Badge>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                {category.name}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                {category.description?.trim() ||
                  'মূল বই ক্যাটালগের সাথে সামঞ্জস্যপূর্ণ জনসাধারণের ক্যাটাগরি শেলফ।'}
              </p>
              <div className="flex flex-wrap gap-3 text-sm font-bold text-slate-500">
                <span>{books.length} টি বই</span>
                <span>স্লাগ: {category.slug}</span>
              </div>
            </div>
          </section>

          <section className="mt-10 rounded-[32px] border border-white/80 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-slate-950/5 sm:p-5 lg:p-6">
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {books.length > 0 ? (
                books.map((book) => <PublicBookCard key={book.id} book={book} showCategory={false} />)
              ) : (
                <div className="col-span-full rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
                  এই ক্যাটাগরিতে এখনো কোনো বই প্রকাশিত হয়নি।
                </div>
              )}
            </div>
          </section>

          {relatedCategories.length > 0 ? (
            <section className="mt-10 rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-slate-950/5">
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
        </div>
      </main>
    </div>
  );
}
