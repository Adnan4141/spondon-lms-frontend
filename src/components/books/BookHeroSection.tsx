'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, BookOpen, FileText, ArrowRight, Sparkles, Star, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PublicBook } from '@/lib/api/books';
import { motion } from 'framer-motion';

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
    <div className="relative">
      <div className="grid gap-16 lg:grid-cols-[400px_1fr] lg:items-center">
        {/* Book Cover Container with 3D Effect */}
        <div className="relative group perspective-1000">
          <motion.div 
            initial={{ opacity: 0, y: 20, rotateY: 0 }}
            animate={{ opacity: 1, y: 0, rotateY: -15 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            whileHover={{ rotateY: -5, scale: 1.02 }}
            className="relative mx-auto aspect-[3/4] w-full max-w-[360px] preserve-3d transition-all duration-500"
          >
            {/* Shadow behind the book */}
            <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="relative h-full w-full overflow-hidden rounded-[16px] border-y border-r border-white/20 bg-white/5 backdrop-blur-sm shadow-[20px_20px_60px_rgba(0,0,0,0.5)] flex items-center justify-center">
              {/* Spine effect */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/40 via-white/10 to-transparent z-10 border-r border-white/5"></div>
              
              <Image
                src={book.thumbnailUrl || 'https://placehold.co/600x800?text=Book'}
                alt={book.name}
                fill
                className="object-cover"
                unoptimized
                priority
              />
              
              {/* Glossy overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none"></div>
            </div>

            {/* "Pages" effect on the right side */}
            <div className="absolute top-[2%] bottom-[2%] -right-2 w-4 bg-slate-200 rounded-r-sm shadow-inner flex flex-col justify-between py-2 opacity-80">
               {[...Array(10)].map((_, i) => (
                 <div key={i} className="h-px w-full bg-slate-400/20"></div>
               ))}
            </div>
          </motion.div>


        </div>

        {/* Book Details */}
        <div className="min-w-0 space-y-10">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <Badge className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/30 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {book.isEbook ? 'Digital Edition' : 'Premium Hardcover'}
              </Badge>
              {categoryLabel && (
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {categoryLabel}
                </Badge>
              )}
              {book.isEbook && (
                <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-black uppercase tracking-widest bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                  <CheckCircle2 className="h-3 w-3" />
                  ইন্সট্যান্ট এক্সেস
                </div>
              )}
            </div>

            <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.05] tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
              {book.name}
            </h1>
            
            {book.author && (
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-black text-slate-400">
                  {book.author.charAt(0)}
                </div>
                <p className="text-2xl font-bold text-slate-400">
                  {book.author}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-12 py-8 border-y border-white/10">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">বর্তমান মূল্য</p>
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-black text-white">
                  {isFree ? 'FREE' : `৳${Number(book.price).toLocaleString()}`}
                </p>
                {!isFree && book.mrp && Number(book.mrp) > Number(book.price) && (
                   <p className="text-xl text-slate-500 line-through font-bold opacity-50">৳{Number(book.mrp).toLocaleString()}</p>
                )}
              </div>
            </div>
            <div className="h-16 w-px bg-white/10"></div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">রিসোর্স ফরম্যাট</p>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-400" />
                <p className="text-xl font-black text-slate-200">
                  {book.isEbook ? 'Interactive PDF' : 'Standard Print'}
                </p>
              </div>
            </div>
          </div>

          {purchaseHint && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-4 text-rose-400"
            >
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></div>
              <p className="text-sm font-bold">{purchaseHint}</p>
            </motion.div>
          )}

          <div className="flex flex-wrap gap-6">
            {showRead && readUrl ? (
              <Button
                className="h-20 px-12 rounded-[24px] bg-white text-slate-900 font-black text-xl hover:bg-slate-100 shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all active:scale-95 group"
                onClick={onStartReading}
              >
                <FileText className="mr-3 h-7 w-7 text-indigo-600 transition-transform group-hover:scale-110" />
                পড়া শুরু করুন
              </Button>
            ) : book.isEbook && !isFree ? (
              <Button
                className="h-20 px-12 rounded-[24px] bg-indigo-600 text-white font-black text-xl hover:bg-indigo-700 shadow-[0_20px_40px_rgba(79,70,229,0.3)] transition-all active:scale-95 group"
                onClick={onBuy}
              >
                <ShoppingCart className="mr-3 h-6 w-6" />
                এখনই কিনুন 
                <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
              </Button>
            ) : isFree && book.isEbook ? (
              <Button asChild variant="outline" className="h-20 px-12 rounded-[24px] border-white/20 text-white font-black text-xl hover:bg-white/10 backdrop-blur-sm transition-all active:scale-95">
                <Link href={`/login?redirect=${encodeURIComponent(`/books/${bookId}`)}`}>পড়তে লগইন করুন</Link>
              </Button>
            ) : (
              <Button
                className="h-20 px-12 rounded-[24px] bg-indigo-600 text-white font-black text-xl hover:bg-indigo-700 shadow-[0_20px_40px_rgba(79,70,229,0.3)] transition-all active:scale-95 group"
                onClick={onBuy}
              >
                <ShoppingCart className="mr-3 h-6 w-6" />
                অর্ডার করুন
                <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
              </Button>
            )}

            <button
              type="button"
              onClick={onToggleBookmark}
              className={`flex items-center justify-center h-20 w-20 rounded-[24px] border transition-all active:scale-90 ${
                bookmarked 
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-500 shadow-lg shadow-amber-500/10' 
                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/30 hover:text-white backdrop-blur-sm'
              }`}
            >
              <Bookmark className={`h-8 w-8 ${bookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>

    
        </div>
      </div>
    </div>
  );
}
