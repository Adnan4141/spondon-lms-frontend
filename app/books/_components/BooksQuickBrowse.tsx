'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
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
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-md sm:rounded-[22px] sm:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(16,185,129,0.12),transparent_26%),radial-gradient(circle_at_90%_15%,rgba(59,130,246,0.12),transparent_26%),radial-gradient(circle_at_50%_100%,rgba(168,85,247,0.08),transparent_28%)]" />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
            📚 দ্রুত ব্রাউজ করুন
          </p>

          <h2 className="mt-1.5 text-lg font-black tracking-tight text-slate-950 sm:text-xl">
            আপনার প্রয়োজনীয় বইয়ের ক্যাটাগরি বেছে নিন
          </h2>

          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-[13px]">
            এইচএসসি, এসএসসি, ভর্তি কিংবা বিষয়ভিত্তিক বই—এক জায়গা থেকেই সহজে ক্যাটাগরি অনুযায়ী সব বই খুঁজে নিন।
          </p>
        </div>
      </div>

      <div className="relative mt-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        {categories.map((category, index) => {
          const color = cardColors[index % cardColors.length];

          return (
            <Link
              key={category.id}
              href={`/books/categories/${category.slug}`}
              className={`group relative overflow-hidden rounded-xl border bg-linear-to-br ${color} p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-4`}
            >
              <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/60 blur-xl transition group-hover:scale-110" />

              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                    <BookOpen className="h-4 w-4" />
                  </div>

                  <h3 className="text-sm font-black text-slate-950">{category.name}</h3>

                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-600">
                    {category.description?.trim() ||
                      'এই ক্যাটাগরির সব বই একসাথে দেখুন এবং বিস্তারিত তথ্য জেনে নিন।'}
                  </p>
                </div>

                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </div>

              <div className="relative mt-3 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-black text-slate-600 sm:text-[11px]">
                বইগুলো দেখুন →
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
