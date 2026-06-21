'use client';

import type { ElementType } from 'react';
import {
  AlignLeft,
  BookOpenCheck,
  Database,
  Layers,
  PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type StatItem = {
  label: string;
  value: number;
  color: string;
  icon: ElementType;
};

type Props = {
  totalQuestions: number;
  simpleMcq: number;
  passageCount: number;
  cqCount: number;
  shortCount: number;
  isLoading?: boolean;
};

export function QuestionsStatsGrid({
  totalQuestions,
  simpleMcq,
  passageCount,
  cqCount,
  shortCount,
  isLoading = false,
}: Props) {
  const stats: StatItem[] = [
    {
      label: 'Total Questions',
      value: totalQuestions,
      color: 'from-blue-600 to-cyan-500',
      icon: BookOpenCheck,
    },
    { label: 'Simple MCQ', value: simpleMcq, color: 'from-indigo-600 to-purple-600', icon: Database },
    { label: 'Passages', value: passageCount, color: 'from-violet-600 to-indigo-500', icon: Layers },
    { label: 'Creative (CQ)', value: cqCount, color: 'from-rose-600 to-pink-600', icon: PenLine },
    { label: 'Short Questions', value: shortCount, color: 'from-sky-600 to-teal-500', icon: AlignLeft },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="group relative overflow-hidden rounded-[28px] border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/30 transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform group-hover:scale-110',
                stat.color,
              )}
            >
              <stat.icon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className="mt-0.5 text-2xl font-black text-slate-900">
              {isLoading ? '—' : stat.value}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
