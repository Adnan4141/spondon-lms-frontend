'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getPublicFaqs, type FaqPublic } from '@/lib/api/faq';
import { getSiteSettings } from '@/lib/api/site-content';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

function FaqAccordionItem({ item, index }: { item: FaqPublic; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50/70 transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          <span className="h-8 w-8 shrink-0 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="font-bold text-slate-800 text-base leading-snug">{item.question}</span>
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
        <div className="px-6 pb-6 pt-1 border-t border-slate-100">
          <p className="text-slate-600 leading-relaxed font-medium text-sm ml-12 whitespace-pre-wrap">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function FaqPage() {
  const [items, setItems] = useState<FaqPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError(false);
      try {
        const [faqRes, settingsRes] = await Promise.all([getPublicFaqs(), getSiteSettings()]);
        if (cancelled) return;
        if (faqRes.success && faqRes.data) {
          setItems(faqRes.data);
        } else {
          setItems([]);
        }
        if (settingsRes.success && settingsRes.data) {
          const map: Record<string, string> = {};
          for (const s of settingsRes.data) map[s.key] = s.value;
          setSiteSettings(map);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <div className="relative bg-[#0F172A] pt-32 pb-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
        <div className="max-w-4xl mx-auto px-6 lg:px-12 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest mb-6">
            <HelpCircle size={14} /> FAQ
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">সচরাচর জিজ্ঞাসা</h1>
          <p className="text-slate-400 mt-4 text-lg font-medium">আপনার সাধারণ প্রশ্নগুলোর উত্তর এখানে পাবেন</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-16">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : loadError ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
            <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-700 font-bold text-lg">Unable to load FAQs</p>
            <p className="text-slate-500 text-sm mt-2">Please try again later.</p>
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, i) => (
              <FaqAccordionItem key={item.id} item={item} index={i} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center shadow-sm">
            <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-700 font-bold text-lg">No FAQ Available</p>
            <p className="text-slate-600 font-medium text-sm mt-2">No Frequently Asked Questions Found</p>
            <p className="text-slate-500 text-sm mt-2">এখনো কোনো সচরাচর জিজ্ঞাসা যোগ করা হয়নি। পরে আবার দেখুন।</p>
          </div>
        )}
      </div>

      <div className="mt-16">
        <Footer siteSettings={siteSettings} />
      </div>
    </div>
  );
}
