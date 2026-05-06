'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  onToggleCollapse: () => void;
};

export function SidebarCollapseIconButton({ onToggleCollapse, className }: Props & { className?: string }) {
  return (
    <button
      type="button"
      onClick={onToggleCollapse}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:border-indigo-200 hover:text-indigo-600',
        className
      )}
      aria-label="Collapse sidebar"
    >
      <PanelLeftClose className="h-4 w-4" />
    </button>
  );
}

export function SidebarExpandIconButton({ onToggleCollapse, className }: Props & { className?: string }) {
  return (
    <button
      type="button"
      onClick={onToggleCollapse}
      className={cn(
        'inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:text-indigo-600',
        className
      )}
      aria-label="Expand sidebar"
    >
      <PanelLeftOpen className="h-5 w-5" />
    </button>
  );
}

/** Expanded rail footer: collapse + Live (shared admin / student pattern). */
export function SidebarCollapseRow({ onToggleCollapse }: Props) {
  return (
    <div className="flex items-center justify-end px-2">
      <div className="flex items-center gap-3">
        <div className="hidden lg:block">
          <SidebarCollapseIconButton onToggleCollapse={onToggleCollapse} />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Live</span>
        </div>
      </div>
    </div>
  );
}

/** Collapsed rail footer: large expand button (shared admin / student pattern). */
export function SidebarExpandFooterButton({ onToggleCollapse }: Props) {
  return (
    <div className="hidden lg:flex lg:justify-center">
      <SidebarExpandIconButton onToggleCollapse={onToggleCollapse} />
    </div>
  );
}
