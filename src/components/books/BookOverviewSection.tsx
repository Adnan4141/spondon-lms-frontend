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

      
    </div>
  );
}
