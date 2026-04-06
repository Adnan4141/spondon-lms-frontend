'use client';

import React, { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getBooks, type Book } from '@/lib/api/books';
import { Search, SlidersHorizontal, X, Filter, Check, BookOpen, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function readCatalogUser(): { id?: string; role?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as { id?: string; role?: string }) : null;
  } catch {
    return null;
  }
}

export default function BooksCatalogPage() {
  const router = useRouter();
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

  const handleBuyClick = (bookId: string, e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const u = readCatalogUser();
    if (!u?.id) {
      router.push(`/login?redirect=${encodeURIComponent(`/books/${bookId}`)}`);
      return;
    }
    router.push(`/books/${bookId}`);
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
                ? 'border-indigo-500/20 bg-indigo-500/5 font-bold text-indigo-600'
                : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
            )}
          >
            <span className="text-sm">{opt.label}</span>
            <div
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border transition-all',
                value === opt.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-200 group-hover:border-slate-400'
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
    <div className="min-h-screen bg-[#FDFDFF]   text-slate-900 selection:bg-indigo-100">
      <Header />

      {/* Hero Header - Compact Version of Courses Style */}
      <div className="bg-[#0F172A] pt-24 pb-16 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.05] pointer-events-none"></div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300"
          >
            Digital library
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter"
          >
            আমাদের সকল <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">বইসমূহ</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mx-auto max-w-2xl text-slate-400 text-base font-medium leading-relaxed"
          >
            আপনার পছন্দের ই-বুক এবং প্রিন্ট ভার্সন খুঁজে নিন। বিস্তারিত ও কেনার জন্য বই কার্ডে ক্লিক করুন।
          </motion.p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-10 mb-20 lg:gap-12">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden w-full shrink-0 lg:block lg:w-80">
            <div className="sticky top-28 space-y-2 rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between border-b border-slate-50 pb-4">
                <div className="flex items-center gap-2">
               
                  <h3 className="text-lg font-black">ফিল্টার</h3>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
              
              <FilterSection
                title="ফরম্যাট"
                value={format}
                onChange={setFormat}
                options={[
                  { id: 'all', label: 'সকল ফরম্যাট' },
                  { id: 'ebook', label: 'ই-বুক' },
                  { id: 'print', label: 'প্রিন্ট কপি' },
                ]}
              />
              
              <FilterSection
                title="মূল্য"
                value={priceBand}
                onChange={setPriceBand}
                options={[
                  { id: 'all', label: 'সকল মূল্য' },
                  { id: 'free', label: 'বিনামূল্যে' },
                  { id: 'paid', label: 'পেইড' },
                ]}
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="min-w-0 flex-1 ">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="search"
                  placeholder="বইয়ের নাম, লেখক লিখে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 font-bold text-slate-900 shadow-sm outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 placeholder:text-slate-300"
                />
              </div>
              <button
                type="button"
                className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 font-black text-slate-700 shadow-sm lg:hidden"
                onClick={() => setMobileFilterOpen(true)}
              >
          
                ফিল্টার
              </button>
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white animate-pulse border border-slate-100 shadow-sm h-[350px] rounded-[28px]" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-[32px] border border-dashed border-slate-200 bg-white py-20 text-center">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <p className="font-bold text-slate-600">কোনো বই মেলেনি।</p>
                <button onClick={clearFilters} className="mt-4 text-indigo-600 font-bold hover:underline">ফিল্টার ক্লিয়ার করুন</button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((b, idx) => (
               <motion.div
  key={b.id}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: (idx % 4) * 0.05 }}
>
  <Link href={`/books/${b.id}`} className="block h-full">
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white border border-slate-200/70 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">

      {/* IMAGE */}
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">

        {b.thumbnailUrl ? (
          <img
            src={b.thumbnailUrl}
            alt={b.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <BookOpen className="h-10 w-10" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60" />

        {/* Format badge */}
        <span className="absolute top-3 left-3 rounded-full bg-white/90 backdrop-blur px-3 py-1 text-[10px] font-bold text-slate-700 shadow-sm">
          {b.isEbook ? 'ই-বুক' : 'প্রিন্ট'}
        </span>

        {/* Price floating */}
        <div className="absolute bottom-3 right-3 rounded-xl bg-white/90 backdrop-blur px-3 py-1.5 text-sm font-black text-indigo-600 shadow">
          ৳{Number(b.price).toLocaleString()}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">

        <h3 className="line-clamp-2 text-base sm:text-lg font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition">
          {b.name}
        </h3>

        {b.author && (
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            {b.author}
          </p>
        )}

        {/* CTA */}
        <div className="mt-auto pt-4 flex items-center gap-2">

          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-10 rounded-xl border-slate-200 text-slate-700 text-xs sm:text-sm"
            onClick={(e) => handleBuyClick(b.id, e)}
          >
            <ShoppingBag className="h-4 w-4 mr-1" />
            কিনুন
          </Button>

          <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-900 text-white group-hover:bg-indigo-600 transition">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </div>
  </Link>
</motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm lg:hidden cursor-pointer"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-[110] flex w-[85%] max-w-sm flex-col bg-white p-8 lg:hidden shadow-2xl overflow-y-auto"
            >
              <div className="mb-8 flex items-center justify-between border-b border-slate-50 pb-4">
                <h3 className="text-2xl font-black text-slate-900">ফিল্টার</h3>
                <button type="button" onClick={() => setMobileFilterOpen(false)} className="rounded-full p-2 bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <FilterSection
                title="ফরম্যাট"
                value={format}
                onChange={setFormat}
                options={[
                  { id: 'all', label: 'সকল ফরম্যাট' },
                  { id: 'ebook', label: 'ই-বুক' },
                  { id: 'print', label: 'প্রিন্ট কপি' },
                ]}
              />
              <FilterSection
                title="মূল্য"
                value={priceBand}
                onChange={setPriceBand}
                options={[
                  { id: 'all', label: 'সকল মূল্য' },
                  { id: 'free', label: 'বিনামূল্যে' },
                  { id: 'paid', label: 'পেইড' },
                ]}
              />
              <div className="mt-auto space-y-3 pt-10">
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-100"
                >
                  ফলাফল দেখুন
                </button>
                <button
                  onClick={() => {
                    clearFilters();
                    setMobileFilterOpen(false);
                  }}
                  className="w-full py-4 border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-slate-50 transition-all"
                >
                  রিসেট করুন
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
