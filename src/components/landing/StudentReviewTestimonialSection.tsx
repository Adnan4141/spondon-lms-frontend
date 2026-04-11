'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Quote } from 'lucide-react';
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

  return (
    <section className="relative -mt-16 bg-white pb-16 sm:-mt-20 sm:pb-20 lg:-mt-24 lg:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="relative mx-auto max-w-4xl rounded-[1.9rem] border border-slate-100 bg-white px-5 py-5 shadow-[0_28px_60px_-24px_rgba(15,23,42,0.22)] sm:px-8 sm:py-8 lg:max-w-5xl lg:px-9 lg:py-9">
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-indigo-500 shadow-[0_14px_34px_-18px_rgba(15,23,42,0.4)] transition-all hover:scale-105 hover:text-indigo-700 sm:-left-11 sm:h-14 sm:w-14"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={next}
            className="absolute right-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-indigo-500 shadow-[0_14px_34px_-18px_rgba(15,23,42,0.4)] transition-all hover:scale-105 hover:text-indigo-700 sm:-right-11 sm:h-14 sm:w-14"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="grid items-center gap-6 lg:grid-cols-[1.18fr_0.82fr] lg:gap-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`quote-${testimonialIndex}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.32, ease: 'easeOut' }}
                className="space-y-4 px-3 sm:px-5 lg:px-6"
              >
                <div className="flex items-center gap-2 text-indigo-500">
                  <Quote className="h-9 w-9 fill-fuchsia-500/20 text-fuchsia-500" />
                </div>

                <p className="max-w-xl text-lg font-medium leading-[1.75] text-slate-500 sm:text-xl lg:text-[1.12rem]">
                  &ldquo;{activeTestimonial?.quote}&rdquo;
                </p>

                <div className="pt-2">
                  <p className="text-2xl font-extrabold text-indigo-900 sm:text-[2rem]">{activeTestimonial?.name}</p>
                  <p className="mt-2 max-w-xl text-xs font-medium leading-relaxed text-slate-400 sm:text-sm">
                    {activeTestimonial?.info || activeTestimonial?.instituteName || 'শিক্ষার্থী'}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`thumb-${testimonialIndex}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.32 }}
                className="relative h-44 overflow-hidden rounded-[1.45rem] border border-indigo-100 bg-indigo-50 shadow-[0_18px_36px_-18px_rgba(67,56,202,0.35)] sm:h-52 lg:h-48"
              >
                {activeTestimonial?.thumbnailUrl ? (
                  <>
                    <Image
                      src={activeTestimonial.thumbnailUrl}
                      alt={activeTestimonial.name}
                      fill
                      className="object-cover"
                    />
                    {activeTestimonial?.videoUrl && (
                      <a
                        href={activeTestimonial.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-indigo-950/20 transition-colors hover:bg-indigo-950/30"
                      >
                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/95 text-white shadow-xl">
                          <Play className="ml-0.5 h-6 w-6 fill-current" />
                        </span>
                      </a>
                    )}
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-indigo-100 to-blue-50">
                    <span className="text-7xl font-black text-indigo-300">
                      {activeTestimonial?.name?.charAt(0) || 'S'}
                    </span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-7 flex justify-center gap-2.5">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonialIndex(i)}
                className={cn(
                  'h-2.5 rounded-full transition-all duration-300',
                  i === testimonialIndex ? 'w-7 bg-fuchsia-500' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                )}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};