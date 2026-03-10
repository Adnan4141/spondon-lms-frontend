'use client';

import { ReactNode } from 'react';

export type CourseStat = {
  label: string;
  value: ReactNode;
  color: string;
};

const sectionLabel = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40';

type Props = {
  stats: CourseStat[];
};

export function CourseStats({ stats }: Props) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <article
          key={item.label}
          className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.05] p-4 shadow-xl backdrop-blur-xl"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${item.color}`} />
          <div className="relative">
            <p className={sectionLabel}>{item.label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-white">{item.value}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

