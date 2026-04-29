'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import type { Testimonial } from '../types';

type Props = {
  testimonial: Testimonial;
  testimonialIndex: number;
  onPlayVideo: () => void;
};

export function TestimonialThumbnailPanel({ testimonial, testimonialIndex, onPlayVideo }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`thumb-${testimonialIndex}`}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.32 }}
        className="relative h-56 overflow-hidden rounded-[1.45rem] border border-indigo-100 bg-indigo-50 shadow-[0_18px_36px_-18px_rgba(67,56,202,0.35)] sm:h-64 lg:h-72"
      >
        {testimonial.thumbnailUrl ? (
          <>
            <Image
              src={testimonial.thumbnailUrl}
              alt={testimonial.name}
              fill
              sizes="(max-width: 1024px) 100vw, 420px"
              className="object-cover object-center"
            />
            {testimonial.videoUrl && (
              <button
                type="button"
                onClick={onPlayVideo}
                className="absolute inset-0 flex items-center justify-center bg-indigo-950/20 transition-colors hover:bg-indigo-950/30"
                aria-label={`Play video testimonial from ${testimonial.name}`}
              >
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/95 text-white shadow-xl">
                  <Play className="ml-0.5 h-6 w-6 fill-current" />
                </span>
              </button>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-indigo-100 to-blue-50">
            <span className="text-7xl font-black text-indigo-300">{testimonial.name?.charAt(0) || 'S'}</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
