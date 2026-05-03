'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BookCategory } from '@/lib/api/books';

type CategoryShelfHeaderProps = {
  category: BookCategory;
  /** Row index for coordinated shelf styling (reserved). */
  shelfIndex?: number;
};

export function CategoryShelfHeader({ category }: CategoryShelfHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">ক্যাটাগরি শেলফ</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">{category.name}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          {category.description?.trim() ||
            'ক্যাটালগ থেকে সরাসরি এই ক্যাটাগরির বইগুলো দেখানো হচ্ছে—বিস্তারিত পেতে ক্যাটাগরি পাতায় যান।'}
        </p>
      </div>
      <Button asChild variant="outline" className="w-full rounded-2xl sm:w-auto">
        <Link href={`/books/categories/${category.slug}`}>
          সব দেখুন
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
