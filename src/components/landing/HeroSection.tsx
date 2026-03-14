'use client';

import { motion } from 'framer-motion';
import React from 'react';
import { ArrowRight, BookOpen, Download, PlayCircle, Star, Users as UsersIcon } from 'lucide-react';
import { StatItem } from './shared/StatItem';
import { Counter } from './shared/Counter';
import { SystemStatsData } from '@/lib/api/reports';

interface Props {
  systemStats: SystemStatsData | null;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>, text?: string) => void;
}

export const HeroSection: React.FC<Props> = ({ systemStats, handleImageError }) => (
  <section className="relative pt-20 pb-32 overflow-hidden bg-gradient-to-br from-white via-[#F0F7FF] to-[#FDF2F8]">
    <div className="absolute inset-0 z-0">
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 20, repeat: Infinity }}
        className="absolute -top-[10%] -right-[5%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,transparent_70%)] blur-[100px]"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 15, repeat: Infinity, delay: 2 }}
        className="absolute bottom-0 -left-[10%] w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(79,70,229,0.1)_0%,transparent_70%)] blur-[120px]"
      />
    </div>

    <div className="mx-auto max-w-7xl px-6 lg:px-12 relative z-10">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center lg:text-left space-y-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-black uppercase tracking-widest shadow-sm">
            <Star className="h-3 w-3 fill-current" />
            দেশের সেরা লার্নিং প্ল্যাটফর্ম
          </div>

          <h1 className="text-5xl md:text-[80px] font-black text-slate-900 leading-[1.1] tracking-tighter">
            একাডেমিক থেকে <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5C2D91] via-[#FF2D8C] to-[#5C2D91] animate-gradient-x">এডমিশন</span>
          </h1>

          <p className="text-xl md:text-2xl font-medium text-slate-500 leading-relaxed max-w-xl">
            সেরা মেন্টর ও স্মার্ট প্রযুক্তির সাথে শুরু করো তোমার স্বপ্নের জয়যাত্রা।
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5">
            <button className="h-16 px-10 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-[#5C2D91] transition-all active:scale-95 flex items-center gap-3 group">
              কোর্সসমূহ দেখো
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="h-16 px-10 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-black uppercase text-xs tracking-[0.2em] flex items-center gap-3 hover:border-emerald-500 hover:text-emerald-600 transition-all group">
              <PlayCircle className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
              শিখতে শুরু করো
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-10 -left-10 z-20 bg-white p-5 rounded-3xl shadow-2xl border border-slate-50 flex items-center gap-4"
          >
            <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <UsersIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">একটিভ ইউজার</p>
              <p className="text-xl font-black text-slate-900"><Counter value="৫০০,০০০+" /></p>
            </div>
          </motion.div>

          <div className="relative z-10 rounded-[60px] overflow-hidden border-[12px] border-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] group">
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              alt="Students"
              onError={(e) => handleImageError(e, 'Student Life')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent" />
          </div>
          <div className="absolute -inset-10 border-2 border-dashed border-slate-200 rounded-full animate-[spin_60s_linear_infinite] -z-10" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="mt-24"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-[40px] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.08)] p-10 md:p-14 grid grid-cols-2 lg:grid-cols-4 gap-12 border border-white/50">
          <StatItem icon={<UsersIcon />} value={systemStats ? `${systemStats.students}+` : '৩০ লক্ষ+'} label="শিক্ষার্থী" color="text-indigo-600" bg="bg-indigo-50" />
          <StatItem icon={<Star />} value={systemStats ? `${systemStats.teachers}+` : '২০ জন+'} label="অভিজ্ঞ মেন্টর" color="text-emerald-500" bg="bg-emerald-50" />
          <StatItem icon={<Download />} value="৪৫ লক্ষ+" label="অ্যাপ ডাউনলোড" color="text-blue-600" bg="bg-blue-50" />
          <StatItem icon={<BookOpen />} value={systemStats ? `${systemStats.contents}+` : '৫ লক্ষ+'} label="লার্নিং মেটেরিয়াল" color="text-amber-500" bg="bg-amber-50" />
        </div>
      </motion.div>
    </div>
  </section>
);
