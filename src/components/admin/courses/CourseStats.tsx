'use client';

import { ReactNode } from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CourseStat = {
  label: string;
  value: ReactNode;
  color: string;
  icon?: LucideIcon;
};

type Props = {
  stats: CourseStat[];
};

export function CourseStats({ stats }: Props) {
  return (
    <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div 
            key={i} 
            className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-indigo-100"
          >
             <div className="flex items-center justify-between">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform group-hover:scale-110",
                  stat.color
                )}>
                   {Icon ? <Icon className="h-6 w-6" /> : <div className="h-6 w-6 rounded-full bg-white/20" />}
                </div>
                <ArrowRight className="h-4 w-4 text-slate-200 group-hover:text-indigo-500 transition-colors" />
             </div>
             
             <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{stat.label}</p>
                <p className="mt-1 text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
             </div>

             {/* Decorative Background Element */}
             <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity -z-0 pointer-events-none" />
          </div>
        );
      })}
    </section>
  );
}
