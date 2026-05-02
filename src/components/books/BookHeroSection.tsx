'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, BookOpen, FileText, ArrowRight, ShoppingCart, CheckCircle2, Layers3, ShieldCheck, Tags } from 'lucide-react';
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
  onOpenSamplePreview: () => void;
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
  onOpenSamplePreview,
}: BookHeroSectionProps) {
  const courseCount = book.courseBooks?.length || 0;
  const collaboratorCount = book.collaborators?.length || 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
      <div className="space-y-5">
        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <div className="relative mx-auto aspect-3/4 w-full max-w-[300px] overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 shadow-2xl">
            <Image
              src={book.thumbnailUrl || 'https://placehold.co/600x800?text=Book'}
              alt={book.name}
              fill
              className="object-cover"
              unoptimized
              priority
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="h-12 rounded-2xl border-emerald-200 px-6 text-emerald-700 hover:bg-emerald-50" onClick={onOpenSamplePreview}>
            <FileText className="mr-2 h-4 w-4" />
            পড়ে দেখুন
          </Button>
          {book.isEbook && !showRead ? (
            <Button asChild variant="outline" className="h-12 rounded-2xl border-slate-200 px-6">
              <Link href={`/login?redirect=${encodeURIComponent(`/books/${bookId}`)}`}>
                লগইন করুন
              </Link>
            </Button>
          ) : null}
          <button
            type="button"
            onClick={onToggleBookmark}
            className={`flex h-12 items-center justify-center rounded-2xl border px-4 transition-all ${
              bookmarked
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            <Bookmark className={`h-5 w-5 ${bookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="border-rose-200 bg-rose-50 text-rose-700">{book.category?.name || 'Academic'}</Badge>
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">{book.isEbook ? 'Digital edition' : 'Print edition'}</Badge>
            {book.isEbook ? (
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Instant access
              </Badge>
            ) : null}
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">{book.name}</h1>
          <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm sm:max-w-sm">
            <p className="text-sm font-black text-slate-900">{book.author || 'Rhombus Publications'}</p>
            <p className="text-xs font-medium text-slate-500">{categoryLabel || 'Academic publication'}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <BookOpen className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Format</p>
              <p className="text-sm font-bold text-slate-800">{book.isEbook ? 'Interactive PDF' : 'Printed book'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
            <Tags className="h-4 w-4 text-amber-600" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-500">Category</p>
              <p className="text-sm font-bold text-amber-900">{book.category?.name || 'Academic series'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[20px] border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
            <Layers3 className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-500">Course Links</p>
              <p className="text-sm font-bold text-blue-900">{courseCount} linked course{courseCount === 1 ? '' : 's'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-500">Support</p>
              <p className="text-sm font-bold text-emerald-900">{collaboratorCount} contributor{collaboratorCount === 1 ? '' : 's'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Current price</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-4xl font-black text-slate-950">{isFree ? 'FREE' : `৳${Number(book.price).toLocaleString()}`}</p>
                {!isFree && book.mrp && Number(book.mrp) > Number(book.price) ? (
                  <p className="text-lg font-bold text-slate-400 line-through">৳{Number(book.mrp).toLocaleString()}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {showRead && readUrl ? (
                <Button className="h-12 rounded-2xl bg-emerald-600 px-6 font-black text-white hover:bg-emerald-700" onClick={onStartReading}>
                  <FileText className="mr-2 h-4 w-4" />
                  পড়া শুরু করুন
                </Button>
              ) : (
                <Button className="h-12 rounded-2xl bg-emerald-600 px-6 font-black text-white hover:bg-emerald-700" onClick={onBuy}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {book.isEbook ? 'Buy now' : 'অর্ডার করুন'}
                </Button>
              )}
              <Button variant="outline" className="h-12 rounded-2xl border-slate-200 px-6" onClick={onOpenSamplePreview}>
                Sample PDF
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {purchaseHint ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {purchaseHint}
          </div>
        ) : null}
      </div>
    </div>
  );
}