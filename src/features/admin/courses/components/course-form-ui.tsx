import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const field =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all';

export function SectionCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{children}</p>;
}

export function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
      {children}
      {required ? <span className="ml-1 text-rose-400">*</span> : null}
    </label>
  );
}

export const sectionLabel = 'mb-1.5 block text-xs font-semibold text-slate-600';

export function Toggle({
  checked,
  onChange,
  label,
  description,
  accent = 'indigo',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  accent?: 'indigo' | 'rose' | 'emerald';
}) {
  const ring =
    accent === 'rose' ? 'bg-rose-500' : accent === 'emerald' ? 'bg-emerald-500' : 'bg-indigo-500';
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-left transition-colors hover:border-slate-200 hover:bg-white"
    >
      <div
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? ring : 'bg-slate-200',
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        {description ? <p className="mt-0.5 text-[10px] text-slate-400">{description}</p> : null}
      </div>
    </button>
  );
}
