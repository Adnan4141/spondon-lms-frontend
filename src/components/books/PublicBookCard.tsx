'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PublicCatalogBook } from '@/lib/api/books';

function stripHtml(html?: string | null) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function PublicBookCard({
  book,
  className,
  showCategory = true,
}: {
  book: PublicCatalogBook;
  className?: string;
  showCategory?: boolean;
}) {
  const description = stripHtml(book.description);

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_24px_70px_rgba(15,23,42,0.14)]',
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/70 via-white to-blue-50/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative h-[250px] overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-blue-50 sm:h-[270px]">
        <Image
          src={book.thumbnailUrl || 'https://placehold.co/600x800?text=%E0%A6%AC%E0%A6%88'}
          alt={book.name}
          fill
          unoptimized
          className="object-contain p-5 transition duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/80 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <Badge className="rounded-full border-white/80 bg-white/90 px-3 py-1 font-bold text-slate-700 shadow-sm backdrop-blur">
            {book.isEbook ? (
              <>
                <FileText className="mr-1 h-3 w-3 text-blue-600" />
                ই-বুক
              </>
            ) : (
              <>
                <BookOpen className="mr-1 h-3 w-3 text-emerald-600" />
                প্রিন্ট
              </>
            )}
          </Badge>

          {book.featured ? (
            <Badge className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 font-bold text-amber-700 shadow-sm">
              <Sparkles className="mr-1 h-3 w-3" />
              জনপ্রিয়
            </Badge>
          ) : null}
        </div>

        <div className="absolute bottom-4 right-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-lg font-black text-white shadow-lg">
          ৳{Number(book.price).toLocaleString()}
        </div>
      </div>

      <div className="relative space-y-4 p-5">
        <div>
          {showCategory && book.category?.name ? (
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">
              {book.category.name}
            </p>
          ) : null}

          <h3 className="line-clamp-2 text-lg font-black leading-tight text-slate-950">
            {book.name}
          </h3>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            {book.author || 'স্পন্দন পাবলিকেশনস'}
          </p>
        </div>

        <p className="line-clamp-2 min-h-12 text-sm leading-6 text-slate-600">
          {description ||
            'পরিকল্পিত অধ্যায়ভিত্তিক কনটেন্ট, সহজ ব্যাখ্যা ও পরীক্ষাভিত্তিক প্রস্তুতির জন্য উপযোগী বই।'}
        </p>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
            {book.isEbook ? 'তাৎক্ষণিক পড়ার সুবিধা' : 'মুদ্রিত সংস্করণ'}
          </div>

          <Button
            asChild
            className="rounded-2xl bg-slate-950 px-4 font-bold text-white hover:bg-emerald-600"
          >
            <Link href={`/books/${book.id}`}>
              বিস্তারিত
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}