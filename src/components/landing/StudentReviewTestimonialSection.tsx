'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Testimonial } from './types';

interface Props {
  testimonials: Testimonial[];
  testimonialIndex: number;
  setTestimonialIndex: (index: number) => void;
}

export const StudentReviewTestimonialSection: React.FC<Props> = ({
  testimonials,
  testimonialIndex,
  setTestimonialIndex,
}) => {
  if (!testimonials.length) return null;

  const next = () => setTestimonialIndex((testimonialIndex + 1) % testimonials.length);
  const prev = () => setTestimonialIndex((testimonialIndex - 1 + testimonials.length) % testimonials.length);

  const activeTestimonial = testimonials[testimonialIndex];
  const rating = activeTestimonial?.rating ?? 5;

  return (
    <section className="pb-24 sm:pb-32 bg-white overflow-hidden relative">
      <div className="mx-auto max-w-7xl px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-14 items-stretch">

          {/* Left: student image */}
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full bg-indigo-100/60 blur-2xl" />
            <div className="absolute -bottom-8 -right-4 w-32 h-32 rounded-full bg-blue-100/60 blur-2xl" />

            <AnimatePresence mode="wait">
              <motion.div
                key={`img-${testimonialIndex}`}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4 }}
                className="relative h-full min-h-90 sm:min-h-115 rounded-[2.2rem] overflow-hidden border border-slate-200 shadow-[0_28px_60px_-20px_rgba(0,0,0,0.2)]"
              >
                {activeTestimonial?.thumbnailUrl ? (
                  <Image
                    src={activeTestimonial.thumbnailUrl}
                    alt={activeTestimonial.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-indigo-100 via-blue-50 to-slate-100 flex items-center justify-center">
                    <span className="text-[8rem] font-black text-indigo-200 select-none">
                      {activeTestimonial?.name?.charAt(0) || 'S'}
                    </span>
                  </div>
                )}
                {/* Subtle bottom gradient with name */}
                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Student Review</p>
                  <p className="mt-1 text-lg font-black leading-snug">
                    {activeTestimonial?.name}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: review card */}
          <div className="relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/5 rounded-full blur-2xl" />

            <div className="bg-white rounded-[3rem] border border-slate-200 p-8 sm:p-12 lg:p-14 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] relative overflow-hidden h-full flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <Quote className="w-48 h-48 rotate-12" />
              </div>

              <div className="relative z-10 space-y-8">
                {/* Stars */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        'w-5 h-5 transition-colors',
                        s <= rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'
                      )}
                    />
                  ))}
                </div>

                {/* Quote */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={testimonialIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="min-h-40"
                  >
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight italic">
                      &ldquo;{activeTestimonial?.quote}&rdquo;
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Author + nav */}
                <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                  <div>
                    <p className="text-lg font-black text-slate-900 leading-none">
                      {activeTestimonial?.name}
                    </p>
                    {activeTestimonial?.info && (
                      <p className="text-sm font-bold text-slate-400 mt-1">
                        {activeTestimonial.info}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={prev}
                      className="w-12 h-12 rounded-2xl border border-slate-200 bg-white hover:bg-indigo-600 hover:border-indigo-600 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95"
                      aria-label="Previous testimonial"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={next}
                      className="w-12 h-12 rounded-2xl border border-slate-200 bg-white hover:bg-indigo-600 hover:border-indigo-600 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95"
                      aria-label="Next testimonial"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center lg:justify-start gap-2 mt-8">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIndex(i)}
                  className={cn(
                    'h-1.5 transition-all duration-300 rounded-full',
                    i === testimonialIndex ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'
                  )}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};