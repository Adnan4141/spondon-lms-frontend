'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { PublicCatalogBook } from '@/lib/api/books';
import { shelfGradientClass } from './shelfGradients';

type CategoryShelfBookCardProps = {
  book: PublicCatalogBook;
  shelfIndex?: number;
};

function formatPrice(n: number): string {
  return new Intl.NumberFormat('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

export function CategoryShelfBookCard({ book, shelfIndex = 0 }: CategoryShelfBookCardProps) {
  const seriesTitle = book.category?.name?.trim() || 'ম্যাথল্যাব প্রকাশনা';
  const mrp = book.mrp != null && book.mrp > book.price ? book.mrp : null;
  const accentClass = shelfGradientClass(shelfIndex);

  return (
    <Link
      href={`/books/${book.id}`}
      className="group flex min-h-[118px] overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-950/3 transition hover:-translate-y-0.5 hover:border-slate-300/90 hover:shadow-md focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500/40 sm:min-h-[128px]"
    >
      <div className="relative h-full min-h-[118px] w-[38%] max-w-[140px] shrink-0 bg-slate-100 sm:min-h-[128px] sm:w-[36%] sm:max-w-none">
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-1 bg-linear-to-b ${accentClass} opacity-90`}
          aria-hidden
        />
        <Image
          src={book.thumbnailUrl || 'https://placehold.co/600x800?text=%E0%A6%AC%E0%A6%88'}
          alt={book.name}
          fill
          unoptimized
          sizes="(max-width: 640px) 38vw, 160px"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute right-1.5 top-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm sm:right-2 sm:top-2 sm:text-[10px]">
          {book.isEbook ? 'ই-বই' : 'প্রিন্ট'}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-3 sm:p-3.5 sm:pl-4">
        <div className="min-w-0 space-y-1">
          <p className="line-clamp-1 text-[11px] font-bold leading-tight text-slate-900 sm:text-xs">{seriesTitle}</p>
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800 sm:text-sm">{book.name}</h3>
        </div>

        <div className="h-px shrink-0 bg-slate-100" />

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[15px] font-black tabular-nums text-slate-950 sm:text-base">
            ৳{formatPrice(book.price)}
          </span>
          {mrp != null ? (
            <span className="text-xs font-medium tabular-nums text-slate-400 line-through sm:text-[13px]">
              ৳{formatPrice(mrp)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
