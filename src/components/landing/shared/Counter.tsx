'use client';

import { animate, useInView } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';

export interface CounterProps {
  value: string;
  duration?: number;
}

export const Counter: React.FC<CounterProps> = ({ value, duration = 2 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  useEffect(() => {
    if (!isInView) return;
    const numericValue = parseInt(value.replace(/\D/g, '')) || 0;
    const controls = animate(0, numericValue, {
      duration,
      onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
    });
    return controls.stop;
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {displayValue.toLocaleString()}
      {value.replace(/[0-9,]/g, '')}
    </span>
  );
};
