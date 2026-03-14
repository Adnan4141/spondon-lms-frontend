'use client';

import React from 'react';
import { Counter } from './Counter';
import { cn } from '@/lib/utils';

export interface StatItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
  bg: string;
}

export const StatItem: React.FC<StatItemProps> = ({ icon, value, label, color, bg }) => (
  <div className="flex flex-col items-center text-center space-y-4 group">
    <div className={cn('h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm', bg, color)}>
      {React.isValidElement(icon)
        ? React.cloneElement(icon as React.ReactElement<any>, { size: 28 })
        : icon}
    </div>
    <div>
      <h3 className={cn('text-3xl font-black tracking-tighter', color)}>
        <Counter value={value} />
      </h3>
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
    </div>
  </div>
);
