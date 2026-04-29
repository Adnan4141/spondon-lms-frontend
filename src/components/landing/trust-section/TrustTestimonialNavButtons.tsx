'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  onPrev: () => void;
  onNext: () => void;
};

export function TrustTestimonialNavButtons({ onPrev, onNext }: Props) {
  const btnClass =
    'absolute top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full border border-slate-100 bg-white p-0 text-[#3b4a97] shadow-md hover:bg-slate-50 sm:h-12 sm:w-12 md:shadow-lg lg:h-14 lg:w-14';

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        onClick={onPrev}
        className={`${btnClass} left-1 sm:left-2 md:-left-5 lg:-left-7`}
        aria-label="Previous testimonial"
      >
        <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        onClick={onNext}
        className={`${btnClass} right-1 sm:right-2 md:-right-5 lg:-right-7`}
        aria-label="Next testimonial"
      >
        <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
      </Button>
    </>
  );
}
