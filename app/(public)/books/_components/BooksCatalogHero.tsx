'use client';

import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type CatalogHighlight = {
  label: string;
  value: number;
  icon: string;
};

type BooksCatalogHeroProps = {
  format: 'all' | 'ebook' | 'print';
  onFormatChange: (format: 'all' | 'ebook' | 'print') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  catalogHighlights: CatalogHighlight[];
};

export function BooksCatalogHero({
  format,
  onFormatChange,
  searchQuery,
  onSearchChange,
  catalogHighlights,
}: BooksCatalogHeroProps) {
  return (
    <section className="border-b border-slate-200/80 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,#ecfdf5_0%,#f8fafc_45%,#ffffff_100%)]">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-14 sm:pt-12 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">ম্যাথল্যাব বই ক্যাটালগ</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-[2.65rem]">
            প্রিন্ট ও ডিজিটাল — এক জায়গায়
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
            ম্যাথল্যাব LMS থেকে বেছে নিন আপনার কোর্স ও পরীক্ষার বই। দ্রুত সার্চ, ফরম্যাট ফিল্টার, এবং ক্যাটাগরি অনুযায়ী সাজানো
            তালিকা — সবই এখানে।
          </p>

          <div className="relative mx-auto mt-8 max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="বই বা লেখকের নাম খুঁজুন…"
              className="h-12 rounded-2xl border-slate-200 bg-white pl-10 pr-4 text-center shadow-sm placeholder:text-slate-400 focus-visible:ring-emerald-500/30"
              aria-label="ক্যাটালগে খুঁজুন"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant={format === 'all' ? 'default' : 'outline'}
              className="rounded-full px-5"
              onClick={() => onFormatChange('all')}
            >
              সব
            </Button>
            <Button
              type="button"
              variant={format === 'ebook' ? 'default' : 'outline'}
              className="rounded-full px-5"
              onClick={() => onFormatChange('ebook')}
            >
              ই-বুক
            </Button>
            <Button
              type="button"
              variant={format === 'print' ? 'default' : 'outline'}
              className="rounded-full px-5"
              onClick={() => onFormatChange('print')}
            >
              প্রিন্ট
            </Button>
          </div>
        </div>

        <ul className="mx-auto mt-10 flex max-w-xl flex-wrap items-stretch justify-center gap-3 sm:gap-4">
          {catalogHighlights.map((item) => (
            <li
              key={item.label}
              className="flex min-w-30 flex-1 flex-col items-center justify-center rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-3 text-center shadow-sm sm:min-w-34 sm:py-4"
            >
              <span className="text-lg sm:text-xl" aria-hidden>
                {item.icon}
              </span>
              <span className="mt-1 text-xl font-black tabular-nums text-slate-950 sm:text-2xl">{item.value}</span>
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
