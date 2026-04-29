import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';

const INTERVAL_MS = 7000;

type Params = {
  testimonialsLength: number;
  paused: boolean;
  setTestimonialIndex: Dispatch<SetStateAction<number>>;
};

/** Rotates trust testimonials on a fixed interval when multiple items exist and carousel is not hovered. */
export function useTrustTestimonialAutoplay({ testimonialsLength, paused, setTestimonialIndex }: Params) {
  useEffect(() => {
    const hasMultiple = testimonialsLength > 1;
    if (!hasMultiple || paused) return;

    const id = window.setInterval(() => {
      setTestimonialIndex((i) => (i + 1) % testimonialsLength);
    }, INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [testimonialsLength, paused, setTestimonialIndex]);
}
