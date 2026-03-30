'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star, Sparkles } from 'lucide-react';
import { Testimonial } from './types';
import { cn } from '@/lib/utils';

const trustFeatures = [
  { title: 'অভিজ্ঞ শিক্ষক প্যানেল', icon: '👨‍🏫', color: 'text-blue-600', bg: 'bg-blue-50' },
  { title: 'Auto এসএমএস ফলাফল', icon: '📩', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { title: 'মানসম্মত স্টাডি ম্যাটেরিয়ালস', icon: '📚', color: 'text-amber-600', bg: 'bg-amber-50' },
  { title: 'অনলাইন/অফলাইন কার্যক্রম', icon: '💻', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { title: 'সকল শাখায় একই সার্ভিস', icon: '🏫', color: 'text-rose-600', bg: 'bg-rose-50' },
  { title: 'মাসিক/সাপ্তাহিক পরীক্ষা', icon: '📝', color: 'text-violet-600', bg: 'bg-violet-50' },
];

interface Props {
  testimonials: Testimonial[];
  testimonialIndex: number;
  setTestimonialIndex: (index: number) => void;
}

export const TrustSection: React.FC<Props> = ({
  testimonials,
  testimonialIndex,
  setTestimonialIndex,
}) => {
  const next = () => setTestimonialIndex((testimonialIndex + 1) % testimonials.length);
  const prev = () => setTestimonialIndex((testimonialIndex - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="py-24 sm:py-32 bg-white overflow-hidden relative">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-20 left-0 w-72 h-72 bg-indigo-50 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-20 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-5 gap-16 items-start">
          
          {/* Left Side: Stats & Info */}
          <div className="lg:col-span-2 space-y-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                <Sparkles className="h-3 w-3" />
                Trusted by thousands
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
                কেন <span className="text-indigo-600">স্পন্দন</span> অনন্য?
              </h2>
              <p className="text-lg font-medium text-slate-500 leading-relaxed max-w-md">
                আধুনিক শিক্ষা প্রযুক্তি, অভিজ্ঞ শিক্ষক এবং উন্নত মূল্যায়ন পদ্ধতির মাধ্যমে শিক্ষার্থীদের সর্বোচ্চ প্রস্তুতি নিশ্চিত করি আমরা।
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {trustFeatures.map((item, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1"
                >
                  <div className={cn("text-2xl w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", item.bg)}>
                    {item.icon}
                  </div>
                  <span className="text-slate-900 font-bold text-sm leading-tight block">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Premium Testimonial Card */}
          <div className="lg:col-span-3">
            <div className="relative">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/5 rounded-full blur-2xl" />
              
              <div className="bg-white rounded-[3rem] border border-slate-200 p-8 sm:p-12 lg:p-16 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                  <Quote className="w-48 h-48 rotate-12" />
                </div>

                <div className="relative z-10 space-y-8">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={testimonialIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="min-h-[160px]"
                    >
                      <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight italic">
                        &ldquo;{testimonials[testimonialIndex]?.quote}&rdquo;
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-xl text-indigo-600 shadow-sm">
                        {testimonials[testimonialIndex]?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-lg font-black text-slate-900 leading-none">
                          {testimonials[testimonialIndex]?.name}
                        </p>
                        <p className="text-sm font-bold text-slate-400 mt-1">
                          {testimonials[testimonialIndex]?.info}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={prev}
                        className="w-12 h-12 rounded-2xl border border-slate-200 bg-white hover:bg-indigo-600 hover:border-indigo-600 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={next}
                        className="w-12 h-12 rounded-2xl border border-slate-200 bg-white hover:bg-indigo-600 hover:border-indigo-600 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Dots */}
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTestimonialIndex(i)}
                    className={cn(
                      "h-1.5 transition-all duration-300 rounded-full",
                      i === testimonialIndex ? "w-8 bg-indigo-600" : "w-2 bg-slate-200"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
