'use client';

import React, { useMemo, useState } from 'react';
import type { Testimonial } from '../types';
import { resolveVideoSource } from './resolve-video-source';
import { useTestimonialAutoplay } from './use-testimonial-autoplay';
import { TestimonialQuotePanel } from './TestimonialQuotePanel';
import { TestimonialThumbnailPanel } from './TestimonialThumbnailPanel';
import { TestimonialVideoModal } from './TestimonialVideoModal';
import { TestimonialNavArrows } from './TestimonialNavArrows';
import { TestimonialDotIndicators } from './TestimonialDotIndicators';

export interface StudentReviewTestimonialSectionProps {
  testimonials: Testimonial[];
  testimonialIndex: number;
  setTestimonialIndex: React.Dispatch<React.SetStateAction<number>>;
}

export function StudentReviewTestimonialSection({
  testimonials,
  testimonialIndex,
  setTestimonialIndex,
}: StudentReviewTestimonialSectionProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const count = testimonials.length;

  useTestimonialAutoplay({
    count,
    currentIndex: testimonialIndex,
    setIndex: setTestimonialIndex,
    paused: isVideoOpen,
  });

  const activeTestimonial = count > 0 ? testimonials[testimonialIndex] : undefined;
  const activeVideo = useMemo(() => resolveVideoSource(activeTestimonial?.videoUrl), [activeTestimonial?.videoUrl]);

  const goNext = () => setTestimonialIndex((i) => (i + 1) % testimonials.length);
  const goPrev = () => setTestimonialIndex((i) => (i - 1 + testimonials.length) % testimonials.length);

  if (!count || !activeTestimonial) return null;

  return (
    <section className="relative -mt-16 bg-white pb-16 sm:-mt-20 sm:pb-20 lg:-mt-24 lg:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="relative mx-auto max-w-4xl rounded-[1.9rem] border border-slate-100 bg-white px-5 py-5 shadow-[0_28px_60px_-24px_rgba(15,23,42,0.22)] sm:px-8 sm:py-8 lg:max-w-5xl lg:px-9 lg:py-9">
          <TestimonialNavArrows onPrev={goPrev} onNext={goNext} />

          <div className="grid items-center gap-6 lg:grid-cols-[1.18fr_0.82fr] lg:gap-8">
            <TestimonialQuotePanel testimonial={activeTestimonial} testimonialIndex={testimonialIndex} />
            <TestimonialThumbnailPanel
              testimonial={activeTestimonial}
              testimonialIndex={testimonialIndex}
              onPlayVideo={() => setIsVideoOpen(true)}
            />
          </div>

          <TestimonialDotIndicators count={count} activeIndex={testimonialIndex} onSelect={setTestimonialIndex} />
        </div>
      </div>

      <TestimonialVideoModal
        open={isVideoOpen}
        onOpenChange={setIsVideoOpen}
        activeVideo={activeVideo}
        speakerName={activeTestimonial?.name}
      />
    </section>
  );
}
