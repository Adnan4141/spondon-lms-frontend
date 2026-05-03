'use client';

import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PublicBookCard } from '@/components/books/PublicBookCard';
import type { PublicCatalogBook } from '@/lib/api/books';

type BooksMatchingGridProps = {
  books: PublicCatalogBook[];
};

export function BooksMatchingGrid({ books }: BooksMatchingGridProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            মিলে যাওয়া সব বই
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">আপনার ফিল্টার অনুযায়ী ফলাফল</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            মোবাইল, ট্যাবলেট ও ডেস্কটপে সব বই পরিষ্কার গ্রিডে দেখানো হয়।
          </p>
        </div>
        <Badge className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-none">
          {books.length} টি বই দেখানো হচ্ছে
        </Badge>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {books.map((book) => (
          <PublicBookCard key={book.id} book={book} className="h-full" />
        ))}
      </div>
    </section>
  );
}
