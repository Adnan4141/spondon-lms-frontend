'use client';

import { cn } from '@/lib/utils';
import { TAB_CONFIG, type ActiveTab } from '../questions-page-utils';

type Props = {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onTabPrefetch?: (tab: ActiveTab) => void;
  variant?: 'sidebar' | 'mobile';
};

export function QuestionsTypeTabs({ activeTab, onTabChange, onTabPrefetch, variant = 'sidebar' }: Props) {
  if (variant === 'mobile') {
    return (
      <div className="no-scrollbar flex gap-2 overflow-x-auto rounded-[20px] border border-slate-200/60 bg-white p-2 shadow-sm lg:hidden">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              onMouseEnter={() => onTabPrefetch?.(tab.id)}
              onFocus={() => onTabPrefetch?.(tab.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1 rounded-[24px] border border-slate-100 bg-white p-3 shadow-sm">
      <p className="px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
        Question Type
      </p>
      {TAB_CONFIG.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            onMouseEnter={() => onTabPrefetch?.(tab.id)}
            onFocus={() => onTabPrefetch?.(tab.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200',
              isActive
                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors',
                isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500',
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className={cn('truncate text-sm font-bold leading-tight', isActive && 'text-indigo-700')}>
                {tab.label}
              </p>
              <p className="truncate text-[10px] text-slate-400">{tab.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
