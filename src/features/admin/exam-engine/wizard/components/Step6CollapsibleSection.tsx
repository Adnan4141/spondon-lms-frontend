'use client';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function Step6CollapsibleSection({
  title,
  summary,
  defaultOpen = false,
  children,
  className,
}: Props) {
  return (
    <details
      className={cn('group rounded-xl border border-slate-200 bg-white shadow-sm', className)}
      open={defaultOpen || undefined}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none">
        <div className="min-w-0">
          <p className="font-serif text-base font-semibold text-[#0D1B35]">{title}</p>
          {summary ? <p className="mt-0.5 truncate text-xs text-slate-500">{summary}</p> : null}
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-slate-100 px-4 py-4">{children}</div>
    </details>
  );
}
