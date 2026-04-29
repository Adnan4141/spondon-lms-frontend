import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';

const DEFAULT_MS = 5000;

type Params = {
  count: number;
  currentIndex: number;
  setIndex: Dispatch<SetStateAction<number>>;
  paused: boolean;
  intervalMs?: number;
};

/** Advances carousel on an interval when there are multiple items and not paused (e.g. video modal open). */
export function useTestimonialAutoplay({
  count,
  currentIndex,
  setIndex,
  paused,
  intervalMs = DEFAULT_MS,
}: Params) {
  useEffect(() => {
    if (count <= 1 || paused) return;

    const timer = window.setTimeout(() => {
      setIndex((currentIndex + 1) % count);
    }, intervalMs);

    return () => window.clearTimeout(timer);
  }, [count, currentIndex, paused, setIndex, intervalMs]);
}
