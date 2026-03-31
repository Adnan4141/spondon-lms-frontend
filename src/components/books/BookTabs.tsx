'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type BookTabId = 'overview' | 'contents' | 'reviews';

interface BookTabsProps {
  active: BookTabId;
  onChange: (tab: BookTabId) => void;
  sticky?: boolean;
}

const tabs: { id: BookTabId; label: string }[] = [
  { id: 'overview', label: 'ওভারভিউ' },
  { id: 'contents', label: 'বিষয়বস্তু' },
  { id: 'reviews', label: 'রিভিউ' },
];

export function BookTabs({ active, onChange, sticky = true }: BookTabsProps) {
  return (
    <div
      className={cn(
        'z-20 bg-white/80 backdrop-blur-xl',
        sticky && 'sticky top-0',
      )}
    >
      <nav className="flex items-center gap-8 overflow-x-auto py-4 scrollbar-hide" aria-label="Book sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              'relative shrink-0 py-2 text-sm font-black uppercase tracking-widest transition-all duration-300',
              active === t.id
                ? 'text-indigo-600'
                : 'text-slate-400 hover:text-slate-600',
            )}
          >
            {t.label}
            {active === t.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-4 left-0 right-0 h-1 rounded-full bg-indigo-600 shadow-[0_4px_12px_rgba(79,70,229,0.4)]"
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
