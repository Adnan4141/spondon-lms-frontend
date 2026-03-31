'use client';

import { BookOpen, Layers, ListVideo, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookContentOutline } from '@/lib/api/books';

interface BookOverviewSectionProps {
  description: string | null | undefined;
  outline: BookContentOutline | undefined;
}

export function BookOverviewSection({ description, outline }: BookOverviewSectionProps) {
  const totals = outline?.totals;

  return (
    <div className="space-y-12 py-4">
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">বিস্তারিত বিবরণ</h2>
        <div className="prose prose-slate max-w-none">
          <p className="whitespace-pre-wrap text-lg leading-relaxed text-slate-500 font-medium">
            {description?.trim() || 'এই সংস্করণে কোর্স কন্টেন্টের সাথে সামঞ্জস্যপূর্ণ ডিজিটাল রিসোর্স।'}
          </p>
        </div>
      </div>

      {totals && totals.segments > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="h-px flex-1 bg-slate-100"></div>
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">রিসোর্স হাইলাইট</h3>
             <div className="h-px flex-1 bg-slate-100"></div>
          </div>
          
          <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'বিষয়', value: totals.subjects, icon: Layers, color: 'bg-indigo-50 text-indigo-600' },
              { label: 'অধ্যায়', value: totals.chapters, icon: BookOpen, color: 'bg-emerald-50 text-emerald-600' },
              { label: 'ভিডিও', value: totals.videos, icon: ListVideo, color: 'bg-rose-50 text-rose-600' },
              { label: 'নোট / পিডিএফ', value: totals.notes, icon: FileText, color: 'bg-amber-50 text-amber-600' },
            ].map((stat, i) => (
              <div key={i} className="group rounded-[32px] border border-slate-50 bg-slate-50/30 p-8 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-100">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="text-3xl font-black text-slate-900 mb-1">{stat.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
