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

];

export function BookTabs({ active, onChange, sticky = true }: BookTabsProps) {
  return (
    <div
      className={cn(
        'z-20 bg-white/90 backdrop-blur-xl',
        sticky && 'sticky top-0',
      )}
    >
      <nav className="flex items-center gap-10 overflow-x-auto py-6 scrollbar-hide" aria-label="বইয়ের বিভাগ">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              'relative shrink-0 text-sm font-black uppercase tracking-[0.2em] transition-all duration-300',
              active === t.id
                ? 'text-indigo-600'
                : 'text-slate-400 hover:text-slate-600',
            )}
          >
            <span className="relative z-10">{t.label}</span>
            {active === t.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-[25px] left-0 right-0 h-1.5 rounded-full bg-indigo-600 shadow-[0_4px_20px_rgba(79,70,229,0.5)]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
