'use client';

import { useState } from 'react';
import type { FaqPublic } from '@/lib/api/faq';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

function FaqAccordionItem({ item, index }: { item: FaqPublic; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-slate-50/70"
      >
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-600">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-base font-bold leading-snug text-slate-800">{item.question}</span>
        </div>
        <ChevronDown
          size={18}
          className={cn('shrink-0 text-slate-400 transition-transform duration-300', open && 'rotate-180')}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          open ? 'max-h-[min(80vh,2400px)] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="border-t border-slate-100 px-6 pb-6 pt-1">
          <p className="ml-12 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-600">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

type Props = {
  items: FaqPublic[];
  loadError: boolean;
};

export default function FaqPageClient({ items, loadError }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="relative overflow-hidden bg-[#0F172A] pb-16 pt-32">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center lg:px-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-amber-400">
            <HelpCircle size={14} /> FAQ
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">সচরাচর জিজ্ঞাসা</h1>
          <p className="mt-4 text-lg font-medium text-slate-400">আপনার সাধারণ প্রশ্নগুলোর উত্তর এখানে পাবেন</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-16 lg:px-12">
        {loadError ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <HelpCircle className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-bold text-slate-700">Unable to load FAQs</p>
            <p className="mt-2 text-sm text-slate-500">Please try again later.</p>
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, i) => (
              <FaqAccordionItem key={item.id} item={item} index={i} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
            <HelpCircle className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-bold text-slate-700">No FAQ Available</p>
            <p className="mt-2 text-sm font-medium text-slate-600">No Frequently Asked Questions Found</p>
            <p className="mt-2 text-sm text-slate-500">এখনো কোনো সচরাচর জিজ্ঞাসা যোগ করা হয়নি। পরে আবার দেখুন।</p>
          </div>
        )}
      </div>
    </div>
  );
}
