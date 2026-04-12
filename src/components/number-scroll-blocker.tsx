'use client';

import { useEffect } from 'react';

/** Prevents scroll-to-change on all <input type="number"> elements (including raw ones not using the Input component). */
export function NumberScrollBlocker() {
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'number') {
        (target as HTMLInputElement).blur();
      }
    };
    document.addEventListener('wheel', handler, { passive: true });
    return () => document.removeEventListener('wheel', handler);
  }, []);
  return null;
}
