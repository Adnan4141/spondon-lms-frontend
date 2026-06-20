'use client';

import React from 'react';
import { Globe2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ProgramCard } from '@/lib/api/site-content';

// ─── Static fallback data ─────────────────────────────────────────────────

const STATIC_CARDS: ProgramCard[] = [
  { id: 'p1', title: 'SSC একাডেমিক + মডেল টেস্ট', subtitle: 'বেসিক যত্ন শক্ত, প্রস্তুতি তখন পাকাপোক্ত', bgColor: 'bg-indigo-50', sortOrder: 0, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'p2', title: 'HSC একাডেমিক + মডেল টেস্ট', subtitle: 'স্বপ্ন দেখার শুরু এখন থেকেই', bgColor: 'bg-emerald-50', sortOrder: 1, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'p3', title: 'ইঞ্জিনিয়ারিং ভর্তি প্রোগ্রাম', subtitle: 'স্বপ্ন যখন প্রকৌশলী হওয়া, সঙ্গে আছি পথচলার', bgColor: 'bg-orange-50', sortOrder: 2, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'p4', title: 'ভর্তি কোচিং + ভর্তি প্রোগ্রাম', subtitle: 'প্রিয় ক্যাম্পাসে পৌঁছে যেতে, প্রস্তুতি হোক টপলেভেলের সাথে', bgColor: 'bg-cyan-50', sortOrder: 3, isActive: true, createdAt: '', updatedAt: '' },
  { id: 'p5', title: 'ক্যাডেট অ্যাকাডেমি', subtitle: 'আনন্দময় অ্যাকাডেমি আর সাথে শৃঙ্খল', bgColor: 'bg-rose-50', sortOrder: 4, isActive: true, createdAt: '', updatedAt: '' },
];

// ─── Component ────────────────────────────────────────────────────────────

interface Props {
  cards?: ProgramCard[];
  programs?: Array<{ id: string; name: string }>;
  label?: string;
  title?: string;
  buttonText?: string;
}

export const ProgramsCTASection: React.FC<Props> = ({
  cards,
  programs = [],
  label = 'আমাদের প্রোগ্রামসমূহ',
  title = 'সেরা প্রোগ্রামের, সেরা কোর্সে যুক্ত হন আজই',
  buttonText = 'সবকটি কোর্স দেখুন',
}) => {
  const router = useRouter();
  const displayCards = cards && cards.length > 0 ? cards : STATIC_CARDS;

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/\+/g, ' ')
      .replace(/[^a-z0-9\u0980-\u09ff\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const resolveProgramId = (cardTitle: string) => {
    const nCard = normalize(cardTitle);
    const exact = programs.find((p) => normalize(p.name) === nCard);
    if (exact) return exact.id;
    const broad = programs.find((p) => {
      const nName = normalize(p.name);
      return nCard.includes(nName) || nName.includes(nCard);
    });
    return broad?.id;
  };

  const handleProgramClick = (card: ProgramCard) => {
    const programId = resolveProgramId(card.title);
    if (programId) {
      router.push(`/courses?programId=${encodeURIComponent(programId)}`);
      return;
    }
    router.push(`/courses?program=${encodeURIComponent(card.title)}`);
  };

  return (
    <section className="py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <p className="text-xs sm:text-sm font-bold text-indigo-500">{label}</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 leading-tight mt-2">
            {title}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 justify-items-center">
          {displayCards.map((item) => (
            <div
              key={item.id}
              className={`${item.bgColor} w-full max-w-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 flex items-start gap-3 sm:gap-4 cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => handleProgramClick(item)}
            >
              <div className="h-12 w-12 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-inner border border-slate-100">
                <Globe2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">{item.title}</h3>
                <p className="text-xs sm:text-sm font-medium text-slate-500 leading-snug">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
