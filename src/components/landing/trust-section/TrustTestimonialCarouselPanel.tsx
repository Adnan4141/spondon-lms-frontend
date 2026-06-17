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
      className="relative z-10 mx-auto w-full max-w-5xl"
      onPointerEnter={() => onCarouselHoverChange(true)}
      onPointerLeave={() => onCarouselHoverChange(false)}
    >
      <div className="relative rounded-xl bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.1)] sm:rounded-2xl sm:p-6 md:p-7 lg:rounded-[2rem] lg:p-8">
        <TrustTestimonialNavButtons onPrev={goPrev} onNext={goNext} />

        <div className="grid items-center gap-5 px-2 sm:gap-6 sm:px-6 md:grid-cols-12 md:gap-8 md:px-8 lg:gap-10 lg:px-10">
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
