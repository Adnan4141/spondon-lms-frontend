'use client';

import React from 'react';
import { Globe2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/animations/landing';
import type { ProgramCard } from '@/lib/api/site-content';

// ─── Static fallback data ─────────────────────────────────────────────────

const STATIC_CARDS: ProgramCard[] = [
  { id: 'p1', title: 'SSC একাডেমিক + মডেল টেস্ট', subtitle: 'বেসিক যত্ন শক্ত, প্রস্তুতি তখন পাকাপোক্ত', bgColor: 'bg-indigo-50', sortOrder: 0, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'p2', title: 'HSC একাডেমিক + মডেল টেস্ট', subtitle: 'স্বপ্ন দেখার শুরু এখন থেকেই', bgColor: 'bg-emerald-50', sortOrder: 1, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'p3', title: 'ইঞ্জিনিয়ারিং ভর্তি প্রোগ্রাম', subtitle: 'স্বপ্ন যখন প্রকৌশলী হওয়া, সঙ্গে আছি পথচলার', bgColor: 'bg-orange-50', sortOrder: 2, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'p4', title: 'ভর্তি কোচিং + ভর্তি প্রোগ্রাম', subtitle: 'প্রিয় ক্যাম্পাসে পৌঁছে যেতে, প্রস্তুতি হোক টপলেভেলের সাথে', bgColor: 'bg-cyan-50', sortOrder: 3, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'p5', title: 'ক্যাডেট অ্যাকাডেমি', subtitle: 'আনন্দময় অ্যাকাডেমি আর সাথে শৃঙ্খল', bgColor: 'bg-rose-50', sortOrder: 4, isActive: true, createdAt: '', updatedAt: '' },
];

// ─── Component ────────────────────────────────────────────────────────────

interface Props {
  cards?: ProgramCard[];
  label?: string;
  title?: string;
  buttonText?: string;
}

export const ProgramsCTASection: React.FC<Props> = ({
  cards,
  label = 'আমাদের প্রোগ্রামসমূহ',
  title = 'সেরা প্রোগ্রামের, সেরা কোর্সে যুক্ত হন আজই',
  buttonText = 'সবকটি কোর্স দেখুন',
}) => {
  const displayCards = cards && cards.length > 0 ? cards : STATIC_CARDS;

  return (
    <section className="py-12 sm:py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <p className="text-xs sm:text-sm font-bold text-indigo-500">{label}</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 leading-tight mt-2">
            {title}
          </h2>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 justify-items-center"
        >
          {displayCards.map((item) => (
            <motion.div
              key={item.id}
              variants={fadeInUp}
              className={`${item.bgColor} w-full max-w-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 flex items-start gap-3 sm:gap-4`}
            >
              <div className="h-12 w-12 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-inner border border-slate-100">
                <Globe2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">{item.title}</h3>
                <p className="text-xs sm:text-sm font-medium text-slate-500 leading-snug">{item.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-10 flex justify-center">
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm border border-indigo-100 hover:bg-indigo-100 transition-colors">
            {buttonText}
            <Globe2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
