'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, LibraryBig } from 'lucide-react';
import type { BookCategory } from '@/lib/api/books';

type BooksQuickBrowseProps = {
  categories: BookCategory[];
};

const cardColors = [
  'from-emerald-50 via-white to-teal-50 border-emerald-100 text-emerald-600',
  'from-blue-50 via-white to-sky-50 border-blue-100 text-blue-600',
  'from-purple-50 via-white to-fuchsia-50 border-purple-100 text-purple-600',
  'from-amber-50 via-white to-orange-50 border-amber-100 text-amber-600',
  'from-rose-50 via-white to-pink-50 border-rose-100 text-rose-600',
  'from-cyan-50 via-white to-indigo-50 border-cyan-100 text-cyan-600',
];

export function BooksQuickBrowse({ categories }: BooksQuickBrowseProps) {
  if (categories.length === 0) return null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/80 bg-white p-3 shadow-[0_18px_55px_rgba(15,23,42,0.09)] ring-1 ring-slate-950/5 sm:rounded-[24px] sm:p-4">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-emerald-400 via-sky-400 to-fuchsia-400" />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-sky-500 text-white shadow-lg shadow-emerald-500/20">
            <LibraryBig className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
              দ্রুত ব্রাউজ
            </p>

            <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950 sm:text-xl">
              আপনার প্রয়োজনীয় বইয়ের ক্যাটাগরি বেছে নিন
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-[13px]">
              জনপ্রিয় ক্যাটাগরিগুলো ছোট করে সাজানো হলো, যাতে দ্রুত শেলফে ঢোকা যায়।
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-3 grid gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3 xl:grid-cols-6">
        {categories.map((category, index) => {
          const color = cardColors[index % cardColors.length];

          return (
            <Link
              key={category.id}
              href={`/books/categories/${category.slug}`}
              className={`group relative overflow-hidden rounded-xl border bg-linear-to-br ${color} p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 shadow-sm">
                    <BookOpen className="h-4 w-4" />
                  </div>

                  <h3 className="line-clamp-2 min-h-9 text-sm font-black leading-tight text-slate-950">
                    {category.name}
                  </h3>

                  <p className="mt-1 line-clamp-1 text-[11px] leading-snug text-slate-600">
                    {category.description?.trim() ||
                      'এই ক্যাটাগরির সব বই একসাথে দেখুন এবং বিস্তারিত তথ্য জেনে নিন।'}
                  </p>
                </div>

                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </div>

              <div className="relative mt-2 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-black text-slate-600 sm:text-[11px]">
                বইগুলো দেখুন →
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
