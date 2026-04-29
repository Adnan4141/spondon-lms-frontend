'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  onPrev: () => void;
  onNext: () => void;
};

export function TestimonialNavArrows({ onPrev, onNext }: Props) {
  return (
    <>
      <button
        type="button"
        onClick={onPrev}
        className="absolute left-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-indigo-500 shadow-[0_14px_34px_-18px_rgba(15,23,42,0.4)] transition-all hover:scale-105 hover:text-indigo-700 sm:-left-11 sm:h-14 sm:w-14"
        aria-label="Previous testimonial"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        type="button"
        onClick={onNext}
        className="absolute right-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-indigo-500 shadow-[0_14px_34px_-18px_rgba(15,23,42,0.4)] transition-all hover:scale-105 hover:text-indigo-700 sm:-right-11 sm:h-14 sm:w-14"
        aria-label="Next testimonial"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </>
  );
}
