'use client';

import { motion } from 'framer-motion';
import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { PublicCatalogBook } from '@/lib/api/books';
import { staggerContainer, fadeInUp } from '@/lib/animations/landing';
import { Button } from '@/components/ui/button';

interface Props {
  dynamicEbooks: PublicCatalogBook[];
}

export const DigitalLibrarySection: React.FC<Props> = ({ dynamicEbooks }) => {
  return (
    <section className="relative py-16 sm:py-24 md:py-32 overflow-hidden bg-[#0A0F1C]">
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute top-[-15%] right-[-10%] w-[80%] h-[80%] bg-[#10B981] rounded-full blur-[150px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 18, repeat: Infinity, delay: 1 }}
          className="absolute bottom-[-15%] left-[-10%] w-[70%] h-[70%] bg-indigo-500 rounded-full blur-[150px]"
        />
        <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-12 relative z-10">
        <div className="text-center mb-12 sm:mb-20 space-y-4 sm:space-y-6">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="inline-block px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]"
          >
            E-Learning Resource
          </motion.span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight tracking-tighter">
            স্মার্ট ডিজিটাল{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">লাইব্রেরি</span>
          </h2>
    
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6 p-8 bg-white/[0.03] backdrop-blur-3xl rounded-[40px] border border-white/[0.1] shadow-2xl">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="h-10 sm:h-14 w-1.5 bg-emerald-500 rounded-full shadow-[0_0_20px_#10B981]" />
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">সব বুকগুলো</h3>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1">বিস্তারিত ও কেনাকাটা</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
              <span className="text-sm font-bold text-slate-400">কালেকশন:</span>
              <span className="text-white font-black text-lg">
                {dynamicEbooks.length}{' '}
                <span className="text-xs text-emerald-400 font-bold tracking-widest ml-1">BOOKS</span>
              </span>
            </div>
            <Button
              asChild
              className="rounded-2xl bg-emerald-500 font-black uppercase text-[1২px] py-6 tracking-widest text-white hover:bg-emerald-400"
            >
              <Link href="/books">সকল বই দেখুন</Link>
            </Button>
         
          </div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-10"
        >
          {dynamicEbooks.length === 0 ? (
            <div className="col-span-full rounded-[40px] border border-white/10 bg-white/[0.04] px-8 py-16 text-center backdrop-blur-md">
              <p className="text-lg font-black text-white">ই-বুক শীঘ্রই যুক্ত হবে</p>
              <p className="mt-2 text-sm font-medium text-slate-500 max-w-md mx-auto">
                ক্যাটালগ লোড হচ্ছে না বা এখনও কোনো ই-বুক নেই।{' '}
                <Link href="/books" className="text-emerald-400 underline-offset-2 hover:underline">
                  সকল বই দেখুন
                </Link>
              </p>
            </div>
          ) : null}
          {dynamicEbooks.map((book) => (
            <motion.div key={book.id} variants={fadeInUp} className="group relative h-full">
              <div className="absolute inset-0 bg-emerald-500/10 rounded-[48px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Link
                href={`/books/${book.id}`}
                className="relative block h-full rounded-[48px] outline-none transition-all duration-500 focus-visible:ring-2 focus-visible:ring-emerald-400/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1C]"
              >
                <div className="relative bg-[#111827]/80 backdrop-blur-md border border-white/[0.08] rounded-[48px] p-6 flex gap-6 items-center h-full transition-all duration-500 group-hover:border-emerald-500/40 group-hover:bg-[#161F31]">
                  <div className="w-2/5 aspect-[3/4.5] rounded-[28px] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] shrink-0 transition-all duration-700 group-hover:scale-105 group-hover:-rotate-3 border border-white/10 relative pointer-events-none">
                    <img
                      src={book.thumbnailUrl || 'https://placehold.co/400x600?text=Book'}
                      alt={book.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/400x600?text=Book';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                  <div className="flex-1 flex flex-col h-full py-2 min-w-0">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Digital Book</span>
                      </div>
                      <h4 className="font-black text-white text-base sm:text-lg leading-tight group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {book.name}
                      </h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2 font-medium">
                        {book.description || 'রম্বস পাবলিকেশনসের আধুনিক ডিজিটাল রিসোর্স।'}
                      </p>
                    </div>
                    <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/5 gap-3">
                      <div className="flex flex-col min-w-0">
                        <span className="text-emerald-400 font-black text-lg sm:text-xl md:text-2xl tracking-tighter">
                          {Number(book.price) <= 0 ? 'FREE' : `৳${Number(book.price || 0).toLocaleString()}`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 truncate">বিস্তারিত দেখুন</span>
                      </div>
                      <span
                        className="h-12 w-12 shrink-0 rounded-2xl bg-white text-[#0A0F1C] flex items-center justify-center shadow-xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300"
                        aria-hidden
                      >
                        <ArrowRight className="h-6 w-6" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};
