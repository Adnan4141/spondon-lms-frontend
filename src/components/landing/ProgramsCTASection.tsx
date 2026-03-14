'use client';

import React from 'react';
import { Globe2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/animations/landing';

const programs = [
  {
    title: 'SSC একাডেমিক + মডেল টেস্ট',
    subtitle: 'বেসিক যত্ন শক্ত, প্রস্তুতি তখন পাকাপোক্ত',
    bg: 'bg-indigo-50',
  },
  {
    title: 'HSC একাডেমিক + মডেল টেস্ট',
    subtitle: 'স্বপ্ন দেখার শুরু এখন থেকেই',
    bg: 'bg-emerald-50',
  },
  {
    title: 'ইঞ্জিনিয়ারিং ভর্তি প্রোগ্রাম',
    subtitle: 'স্বপ্ন যখন প্রকৌশলী হওয়া, সঙ্গে আছি পথচলার',
    bg: 'bg-orange-50',
  },
  {
    title: 'ভর্তি কোচিং + ভর্তি প্রোগ্রাম',
    subtitle: 'প্রিয় ক্যাম্পাসে পৌঁছে যেতে, প্রস্তুতি হোক টপলেভেলের সাথে',
    bg: 'bg-cyan-50',
  },
  {
    title: 'ক্যাডেট অ্যাকাডেমি',
    subtitle: 'আনন্দময় অ্যাকাডেমি আর সাথে শৃঙ্খল',
    bg: 'bg-rose-50',
  },
];

export const ProgramsCTASection = () => (
  <section className="py-24">
    <div className="mx-auto max-w-6xl px-4">
      <div className="text-center mb-12">
        <p className="text-sm font-bold text-indigo-500">আমাদের প্রোগ্রামসমূহ</p>
        <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight mt-2">
          সেরা প্রোগ্রামের, সেরা কোর্সে যুক্ত হন আজই
        </h2>
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 justify-items-center"
      >
        {programs.map((item, idx) => (
          <motion.div
            key={item.title}
            variants={fadeInUp}
            className={`${item.bg} w-full max-w-sm rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4`}
          >
            <div className="h-12 w-12 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-inner border border-slate-100">
              <Globe2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 leading-snug">{item.title}</h3>
              <p className="text-sm font-medium text-slate-500 leading-snug">{item.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-10 flex justify-center">
        <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm border border-indigo-100 hover:bg-indigo-100 transition-colors">
          সবকটি কোর্স দেখুন
          <Globe2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  </section>
);
