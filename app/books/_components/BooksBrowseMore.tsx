'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { BookCategory } from '@/lib/api/books';

type BooksBrowseMoreProps = {
  categories: BookCategory[];
};

export function BooksBrowseMore({ categories }: BooksBrowseMoreProps) {
  const links = categories.slice(0, 6);
  if (links.length === 0) return null;

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[30px] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">আরও ক্যাটাগরি</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">ক্যাটাগরি অনুযায়ী পাতা</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {links.map((category) => (
            <Button key={category.id} asChild variant="outline" className="rounded-full">
              <Link href={`/books/categories/${category.slug}`}>{category.name}</Link>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
