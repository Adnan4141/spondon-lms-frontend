'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  onPrev: () => void;
  onNext: () => void;
};

export function TrustTestimonialNavButtons({ onPrev, onNext }: Props) {
  const btnClass =
    'absolute top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border border-slate-100 bg-white p-0 text-[#3b4a97] shadow-md hover:bg-slate-50 sm:h-11 sm:w-11 md:h-12 md:w-12 lg:h-14 lg:w-14';

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        onClick={onPrev}
        className={`${btnClass} left-0 sm:left-1 md:-left-4 lg:-left-6`}
        aria-label="Previous testimonial"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        onClick={onNext}
        className={`${btnClass} right-0 sm:right-1 md:-right-4 lg:-right-6`}
        aria-label="Next testimonial"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
    </>
  );
}
