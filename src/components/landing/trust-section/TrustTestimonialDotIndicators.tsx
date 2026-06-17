'use client';

import { cn } from '@/lib/utils';

type Props = {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function TrustTestimonialDotIndicators({ count, activeIndex, onSelect }: Props) {
  return (
    <div className="mt-5 flex justify-center gap-1.5 sm:mt-6 sm:gap-2 md:mt-8">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 touch-manipulation"
          aria-label={`Go to testimonial ${i + 1}`}
        >
          <span
            className={cn(
              'block h-2.5 rounded-full transition-all duration-300',
              activeIndex === i ? 'w-8 bg-[#d63384]' : 'w-2.5 bg-slate-300'
            )}
          />
        </button>
      ))}
    </div>
  );
}
