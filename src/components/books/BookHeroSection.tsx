'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, BookOpen, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PublicBook } from '@/lib/api/books';

interface BookHeroSectionProps {
  book: PublicBook;
  bookId: string;
  categoryLabel: string | null;
  isFree: boolean;
  showRead: boolean;
  readUrl: string | null;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  onBuy: () => void;
  purchaseHint: string | null;
  onStartReading: () => void;
}

export function BookHeroSection({
  book,
  bookId,
  categoryLabel,
  isFree,
  showRead,
  readUrl,
  bookmarked,
  onToggleBookmark,
  onBuy,
  purchaseHint,
  onStartReading,
}: BookHeroSectionProps) {
  return (
    <div className="p-0 sm:p-4 lg:p-0">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-center">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-[340px] group lg:mx-0">
          <div className="absolute inset-0 bg-indigo-500 rounded-[32px] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
          <div className="relative h-full w-full overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]">
            <Image
              src={book.thumbnailUrl || 'https://placehold.co/600x800?text=Book'}
              alt={book.name}
              fill
              className="object-contain p-6"
              unoptimized
              priority
            />
          </div>
        </div>

        <div className="min-w-0 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest shadow-sm">
                {book.isEbook ? 'Digital E-Book' : 'Print Version'}
              </span>
              {categoryLabel && (
                <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  {categoryLabel}
                </span>
              )}
            </div>

            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1] tracking-tighter">
              {book.name}
            </h1>
            
            {book.author && (
              <p className="text-xl font-bold text-slate-400">
                <span className="text-indigo-500/50 mr-2">—</span> {book.author}
              </p>
            )}
          </div>

          <div className="flex items-center gap-8 py-6 border-y border-white/5">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">মূল্য</p>
              <p className="text-4xl font-black text-white">
                {isFree ? 'FREE' : `৳${Number(book.price).toLocaleString()}`}
              </p>
            </div>
            <div className="h-10 w-px bg-white/10"></div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">ফরম্যাট</p>
              <p className="text-lg font-bold text-slate-300">
                {book.isEbook ? 'পিডিএফ / অনলাইন' : 'সফটকভার'}
              </p>
            </div>
          </div>

          {purchaseHint && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400">
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></div>
              <p className="text-sm font-bold">{purchaseHint}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            {showRead && readUrl ? (
              <Button
                className="h-16 px-10 rounded-[20px] bg-white text-slate-900 font-black text-lg hover:bg-slate-100 shadow-xl shadow-white/5 transition-all active:scale-95"
                onClick={onStartReading}
              >
                <FileText className="mr-3 h-6 w-6 text-indigo-600" />
                পড়া শুরু করুন
              </Button>
            ) : book.isEbook && !isFree ? (
              <Button
                className="h-16 px-10 rounded-[20px] bg-indigo-600 text-white font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
                onClick={onBuy}
              >
                এখনই কিনুন <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            ) : isFree && book.isEbook ? (
              <Button asChild variant="outline" className="h-16 px-10 rounded-[20px] border-white/10 text-white font-black text-lg hover:bg-white/5 backdrop-blur-sm">
                <Link href={`/login?redirect=${encodeURIComponent(`/books/${bookId}`)}`}>পড়তে লগইন করুন</Link>
              </Button>
            ) : null}

            <button
              type="button"
              onClick={onToggleBookmark}
              className={`flex items-center justify-center h-16 w-16 rounded-[20px] border transition-all active:scale-90 ${
                bookmarked 
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-500 shadow-lg shadow-amber-500/10' 
                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white backdrop-blur-sm'
              }`}
            >
              <Bookmark className={`h-6 w-6 ${bookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
            <div className="flex -space-x-2">
               {[1,2,3].map(i => (
                 <div key={i} className="h-6 w-6 rounded-full border-2 border-[#0F172A] bg-slate-800 flex items-center justify-center text-[8px] font-black text-slate-400">
                   {i}
                 </div>
               ))}
            </div>
            <span>১০০০+ শিক্ষার্থী এই বইটি পড়েছেন</span>
          </div>
        </div>
      </div>
    </div>
  );
}
