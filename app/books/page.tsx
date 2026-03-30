'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getBooks, type Book } from '@/lib/api/books';
import { Search, SlidersHorizontal, X, Filter, Check, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function BooksCatalogPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [format, setFormat] = useState<string>('all');
  const [priceBand, setPriceBand] = useState<string>('all');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBooks({ limit: 200, page: 1 });
      if (res.success && res.data) setBooks(res.data);
      else setBooks([]);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return books.filter((b) => {
      const desc = (b.description || '').toLowerCase();
      const author = (b.author || '').toLowerCase();
      const matchQ =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.sku.toLowerCase().includes(q) ||
        desc.includes(q) ||
        author.includes(q);
      const matchFmt =
        format === 'all' || (format === 'ebook' && b.isEbook) || (format === 'print' && !b.isEbook);
      const p = Number(b.price);
      const matchPrice =
        priceBand === 'all' ||
        (priceBand === 'free' && p <= 0) ||
        (priceBand === 'paid' && p > 0);
      return matchQ && matchFmt && matchPrice;
    });
  }, [books, searchQuery, format, priceBand]);

  const clearFilters = () => {
    setSearchQuery('');
    setFormat('all');
    setPriceBand('all');
  };

  const FilterSection = ({
    title,
    options,
    value,
    onChange,
  }: {
    title: string;
    options: { id: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="mb-8 space-y-4">
      <h4 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-400">{title}</h4>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              'flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-300 group',
              value === opt.id
                ? 'border-[#5C2D91]/20 bg-[#5C2D91]/5 font-bold text-[#5C2D91]'
                : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
            )}
          >
            <span className="text-sm">{opt.label}</span>
            <div
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border transition-all',
                value === opt.id ? 'border-[#5C2D91] bg-[#5C2D91]' : 'border-slate-200 group-hover:border-slate-400'
              )}
            >
              {value === opt.id && <Check className="h-3 w-3 text-white" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
      <Header />

      <div className="relative overflow-hidden bg-[#0F172A] pb-20 pt-32">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 text-center lg:px-12">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300"
          >
            Digital library
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl font-black tracking-tight text-white sm:text-5xl"
          >
            সকল বই
          </motion.h1>
          <p className="mx-auto mt-4 max-w-xl text-sm font-medium text-slate-400 sm:text-base">
            ই-বুক ও প্রিন্ট — ফিল্টার করে খুঁজে নিন। বিস্তারিত ও কেনার জন্য বই কার্ডে ক্লিক করুন।
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
          <aside className="hidden w-full shrink-0 lg:block lg:w-72">
            <div className="sticky top-28 space-y-2 rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-2 text-slate-900">
                <Filter className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-black">ফিল্টার</h3>
              </div>
              <FilterSection
                title="ফরম্যাট"
                value={format}
                onChange={setFormat}
                options={[
                  { id: 'all', label: 'সকল' },
                  { id: 'ebook', label: 'ই-বুক' },
                  { id: 'print', label: 'প্রিন্ট' },
                ]}
              />
              <FilterSection
                title="মূল্য"
                value={priceBand}
                onChange={setPriceBand}
                options={[
                  { id: 'all', label: 'সকল' },
                  { id: 'free', label: 'বিনামূল্যে / ৳০' },
                  { id: 'paid', label: 'পেইড' },
                ]}
              />
              <button
                type="button"
                onClick={clearFilters}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-xs font-black uppercase tracking-widest text-slate-500 transition-colors hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" /> রিসেট
              </button>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="নাম, SKU, লেখক…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 font-bold text-slate-900 shadow-sm outline-none ring-indigo-500/0 transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
              <button
                type="button"
                className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 font-black text-slate-700 shadow-sm lg:hidden"
                onClick={() => setMobileFilterOpen(true)}
              >
                <SlidersHorizontal className="h-5 w-5" />
                ফিল্টার
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-[32px] border border-dashed border-slate-200 bg-white py-20 text-center">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <p className="font-bold text-slate-600">কোনো বই মেলেনি।</p>
                <p className="mt-2 text-sm text-slate-400">ফিল্টার বা সার্চ পরিবর্তন করে আবার চেষ্টা করুন।</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((b) => (
                  <Link
                    key={b.id}
                    href={`/books/${b.id}`}
                    className="group flex flex-col overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/3] bg-slate-100">
                      {b.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300">
                          <BookOpen className="h-14 w-14" />
                        </div>
                      )}
                      <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur">
                        {b.isEbook ? 'ই-বুক' : 'প্রিন্ট'}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="line-clamp-2 text-lg font-black text-slate-900 group-hover:text-indigo-700">
                        {b.name}
                      </h3>
                      {b.author ? (
                        <p className="mt-1 text-sm font-semibold text-slate-500">{b.author}</p>
                      ) : null}
                      <p className="mt-4 text-2xl font-black text-[#5C2D91]">
                        ৳{Number(b.price).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileFilterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col bg-slate-900/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileFilterOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28 }}
              className="mt-auto max-h-[85vh] overflow-y-auto rounded-t-[32px] bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-black">ফিল্টার</h3>
                <button type="button" onClick={() => setMobileFilterOpen(false)} className="rounded-full p-2 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <FilterSection
                title="ফরম্যাট"
                value={format}
                onChange={setFormat}
                options={[
                  { id: 'all', label: 'সকল' },
                  { id: 'ebook', label: 'ই-বুক' },
                  { id: 'print', label: 'প্রিন্ট' },
                ]}
              />
              <FilterSection
                title="মূল্য"
                value={priceBand}
                onChange={setPriceBand}
                options={[
                  { id: 'all', label: 'সকল' },
                  { id: 'free', label: 'বিনামূল্যে' },
                  { id: 'paid', label: 'পেইড' },
                ]}
              />
              <button
                type="button"
                onClick={() => {
                  clearFilters();
                  setMobileFilterOpen(false);
                }}
                className="w-full rounded-2xl border border-slate-200 py-4 text-sm font-black uppercase tracking-widest"
              >
                রিসেট ও বন্ধ
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
