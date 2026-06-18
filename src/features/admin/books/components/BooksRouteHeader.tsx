'use client';

import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: ReactNode;
};

export function BooksRouteHeader({
  title,
  subtitle,
  eyebrow = 'Books',
  children,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-600">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        {children ? <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div> : null}
      </div>
    </section>
  );
}
