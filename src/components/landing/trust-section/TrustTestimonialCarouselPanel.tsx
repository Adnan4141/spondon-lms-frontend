'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { Testimonial } from '../types';
import { TrustTestimonialMedia } from './TrustTestimonialMedia';
import { TrustTestimonialNavButtons } from './TrustTestimonialNavButtons';
import { TrustTestimonialQuoteColumn } from './TrustTestimonialQuoteColumn';
import { TrustTestimonialDotIndicators } from './TrustTestimonialDotIndicators';

type Props = {
  testimonials: Testimonial[];
  testimonialIndex: number;
  setTestimonialIndex: Dispatch<SetStateAction<number>>;
  onCarouselHoverChange: (paused: boolean) => void;
};

export function TrustTestimonialCarouselPanel({
  testimonials,
  testimonialIndex,
  setTestimonialIndex,
  onCarouselHoverChange,
}: Props) {
  const activeTestimonial = testimonials[testimonialIndex];
  if (!activeTestimonial) return null;

  const goPrev = () =>
    setTestimonialIndex((testimonialIndex - 1 + testimonials.length) % testimonials.length);
  const goNext = () => setTestimonialIndex((testimonialIndex + 1) % testimonials.length);

  return (
    <div
      className="relative z-10 mx-auto mt-8 w-full max-w-5xl px-2 sm:mt-10 sm:px-4 md:mt-12 lg:absolute lg:mt-0 lg:-bottom-112 lg:left-0 lg:right-0 lg:px-4"
      onPointerEnter={() => onCarouselHoverChange(true)}
      onPointerLeave={() => onCarouselHoverChange(false)}
    >
      <div className="relative rounded-xl bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.1)] sm:rounded-2xl sm:p-6 md:p-8 lg:rounded-[2rem] lg:p-10">
        <TrustTestimonialNavButtons onPrev={goPrev} onNext={goNext} />

        <div className="grid min-h-0 items-center gap-6 px-10 sm:gap-8 sm:px-12 md:grid-cols-12 md:gap-8 md:px-10 lg:gap-10 lg:px-12">
          <TrustTestimonialQuoteColumn testimonial={activeTestimonial} />
          <div className="md:col-span-5">
            <TrustTestimonialMedia testimonial={activeTestimonial} />
          </div>
        </div>
      </div>

      <TrustTestimonialDotIndicators
        count={testimonials.length}
        activeIndex={testimonialIndex}
        onSelect={setTestimonialIndex}
      />
    </div>
  );
}
