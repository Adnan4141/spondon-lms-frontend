'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { resolveMediaImageUrl } from '@/lib/image-url';
import type { LandingLibraryBook } from '@/lib/api/landing-data';

const BOOK_PLACEHOLDER = 'https://placehold.co/400x600?text=Book';

export function LandingBookCard({ book }: { book: LandingLibraryBook }) {
  const [imgSrc, setImgSrc] = useState(
    resolveMediaImageUrl(book.thumbnailUrl, BOOK_PLACEHOLDER),
  );

  return (
    <div className="group relative h-full">
      <div className="absolute inset-0 rounded-[48px] bg-emerald-500/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
      <Link
        href={`/books/${book.id}`}
        className="relative block h-full rounded-[48px] outline-none transition-all duration-500 focus-visible:ring-2 focus-visible:ring-emerald-400/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1C]"
      >
        <div className="relative flex h-full items-center gap-6 rounded-[48px] border border-white/[0.08] bg-[#111827]/80 p-6 backdrop-blur-md transition-all duration-500 group-hover:border-emerald-500/40 group-hover:bg-[#161F31]">
          <div className="pointer-events-none relative aspect-[3/4.5] w-2/5 shrink-0 overflow-hidden rounded-[28px] border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:scale-105 group-hover:-rotate-1">
            <Image
              src={imgSrc}
              alt={book.name}
              fill
              sizes="160px"
              loading="lazy"
              className="object-contain"
              onError={() => setImgSrc(BOOK_PLACEHOLDER)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
          <div className="flex h-full min-w-0 flex-1 flex-col py-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Online / Offline Book
                </span>
              </div>
              <h4 className="line-clamp-2 text-base font-black leading-tight text-white transition-colors group-hover:text-emerald-400 sm:text-lg">
                {book.name}
              </h4>
              <p className="line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-400">
                {book.description || 'রম্বস পাবলিকেশনসের অনলাইন ও অফলাইন বই সংগ্রহ।'}
              </p>
            </div>
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/5 pt-6">
              <div className="flex min-w-0 flex-col">
                <span className="text-lg font-black tracking-tighter text-emerald-400 sm:text-xl md:text-2xl">
                  {Number(book.price) <= 0 ? 'FREE' : `৳${Number(book.price || 0).toLocaleString()}`}
                </span>
                <span className="truncate text-[10px] font-bold text-slate-500">বিস্তারিত দেখুন</span>
              </div>
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0A0F1C] shadow-xl transition-all duration-300 group-hover:bg-emerald-500 group-hover:text-white"
                aria-hidden
              >
                <ArrowRight className="h-6 w-6" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
