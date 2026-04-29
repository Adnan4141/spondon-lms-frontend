'use client';

import { cn } from '@/lib/utils';

type Props = {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function TestimonialDotIndicators({ count, activeIndex, onSelect }: Props) {
  if (count <= 0) return null;

  return (
    <div className="mt-7 flex justify-center gap-2.5">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className={cn(
            'h-2.5 rounded-full transition-all duration-300',
            i === activeIndex ? 'w-7 bg-fuchsia-500' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
          )}
          aria-label={`Go to testimonial ${i + 1}`}
        />
      ))}
    </div>
  );
}
