'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Quote } from 'lucide-react';
import type { Testimonial } from '../types';

type Props = {
  testimonial: Testimonial;
  testimonialIndex: number;
};

export function TestimonialQuotePanel({ testimonial, testimonialIndex }: Props) {
  return (
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
          &ldquo;{testimonial.quote}&rdquo;
        </p>

        <div className="pt-2">
          <p className="text-2xl font-extrabold text-indigo-900 sm:text-[2rem]">{testimonial.name}</p>
          <p className="mt-2 max-w-xl text-xs font-medium leading-relaxed text-slate-400 sm:text-sm">
            {testimonial.info || testimonial.instituteName || 'শিক্ষার্থী'}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
