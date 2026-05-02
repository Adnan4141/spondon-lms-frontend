'use client';

import { BookOpen, Layers, ListVideo, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookContentOutline } from '@/lib/api/books';
import { motion } from 'framer-motion';
import { sanitizeRichTextDisplayHtml } from '@/lib/sanitize-rich-text-display';

interface BookOverviewSectionProps {
  description: string | null | undefined;
  outline: BookContentOutline | undefined;
}

export function BookOverviewSection({ description, outline }: BookOverviewSectionProps) {
  const totals = outline?.totals;
  const descriptionHtml = sanitizeRichTextDisplayHtml(
    description?.trim() || 'এই সংস্করণে কোর্স কন্টেন্টের সাথে সামঞ্জস্যপূর্ণ ডিজিটাল রিসোর্স এবং বিস্তারিত গাইডলাইন অন্তর্ভুক্ত রয়েছে যা শিক্ষার্থীদের প্রস্তুতিতে সহায়ক হবে।',
  );

  return (
    <div className="space-y-16 py-4">
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-10 w-2 rounded-full bg-indigo-600"></div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">বিস্তারিত বিবরণ</h2>
        </div>
        <div
          className="prose prose-slate max-w-none text-base leading-8 text-slate-600 prose-headings:font-black prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-slate-900"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      </div>

      {totals && totals.segments > 0 && (
        <div className="space-y-10">
          <div className="flex items-center gap-6">
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 shrink-0">রিসোর্স হাইলাইট</h3>
             <div className="h-px flex-1 bg-linear-to-r from-slate-200 to-transparent"></div>
          </div>
          
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'বিষয়', value: totals.subjects, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
              { label: 'অধ্যায়', value: totals.chapters, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              { label: 'ভিডিও', value: totals.videos, icon: ListVideo, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
              { label: 'নোট / পিডিএফ', value: totals.notes, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -8 }}
                className={cn(
                  "group relative rounded-[40px] border bg-white p-10 transition-all hover:shadow-2xl hover:shadow-slate-200/50",
                  stat.border
                )}
              >
                <div className={cn("h-16 w-16 rounded-[24px] flex items-center justify-center mb-8 transition-transform group-hover:scale-110", stat.bg)}>
                  <stat.icon className={cn("h-8 w-8", stat.color)} />
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-black text-slate-900">{stat.value}</p>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">{stat.label}</p>
                </div>
                
                {/* Decorative element */}
                <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                   <CheckCircle2 className={cn("h-5 w-5", stat.color)} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
