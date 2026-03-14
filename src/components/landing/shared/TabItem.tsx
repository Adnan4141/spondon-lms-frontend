'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItemProps {
  icon: React.ElementType;
  title: string;
  count: string;
  isActive?: boolean;
}

export const TabItem: React.FC<TabItemProps> = ({ icon: Icon, title, count, isActive }) => (
  <div
    className={cn(
      'flex flex-col items-center gap-3 p-5 rounded-[24px] border border-slate-100 min-w-[160px] cursor-pointer text-center transition-all duration-300',
      isActive ? 'border-slate-800 bg-white shadow-2xl scale-105' : 'hover:bg-white/50 hover:shadow-lg'
    )}
  >
    <div
      className={cn(
        'h-16 w-16 rounded-[20px] bg-slate-100 flex items-center justify-center transition-colors',
        isActive && 'bg-[#5C2D91] text-white'
      )}
    >
      <Icon className="h-8 w-8" />
    </div>
    <div className="flex flex-col items-center gap-1">
      <span className="font-bold text-slate-800 text-sm">{title}</span>
      <span className="font-bold text-slate-400 text-xs">{count} টি আইটেম</span>
    </div>
  </div>
);
