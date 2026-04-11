'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';

interface PartnerItem {
  name: string;
  logo?: string | null;
  websiteUrl?: string | null;
  description?: string | null;
}

interface Props {
  /** Active partners from API (homepage only lists `isActive` from backend). */
  partners: PartnerItem[];
  /** After the first public API response (even if empty). */
  loadResolved: boolean;
  onSelect?: (partner: PartnerItem) => void;
  badge?: string;
  title?: string;
  subtitle?: string;
}

export const PartnerCarouselSection: React.FC<Props> = ({
  partners,
  loadResolved,
  onSelect,
  badge = 'TRUSTED BY',
  title = 'আমাদের পার্টনারসমূহ',
  subtitle = 'যেসব প্রতিষ্ঠান ও ব্র্যান্ডের সাথে আমরা কাজ করি — তালিকা অ্যাডমিন প্যানেল থেকে আপডেট করা যায়।',
}) => {
  const scrollContent = partners.length > 0 ? [...partners, ...partners] : [];

  return (
    <section className="relative py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
      
      {/* Section Header */}
      <div className="mx-auto max-w-7xl px-6 mb-10 sm:mb-16 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-bold text-indigo-600 uppercase tracking-[0.5em] mb-4"
        >
          TRUSTED BY
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight"
        >
          আমাদের পার্টনারসমূহ
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="mx-auto mt-3 max-w-2xl text-sm font-medium text-slate-500"
        >
          যেসব প্রতিষ্ঠান ও ব্র্যান্ডের সাথে আমরা কাজ করি — তালিকা অ্যাডমিন প্যানেল থেকে আপডেট করা যায়।
        </motion.p>
      </div>

      {!loadResolved ? (
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-6 overflow-hidden py-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 w-48 shrink-0 animate-pulse rounded-3xl bg-slate-200/60 md:h-32 md:w-60"
              />
            ))}
          </div>
        </div>
      ) : partners.length === 0 ? (
        <div className="mx-auto max-w-lg px-6 text-center">
          <p className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-10 text-sm font-semibold text-slate-600 shadow-sm">
            এখনও কোনো সক্রিয় পার্টনার যোগ করা হয়নি।{' '}
            <Link href="/admin/partners" className="font-black text-indigo-600 underline-offset-2 hover:underline">
              অ্যাডমিন → Partners
            </Link>{' '}
            থেকে লোগো ও লিংক যোগ করুন।
          </p>
        </div>
      ) : null}

      {/* Carousel Container */}
      {loadResolved && partners.length > 0 ? (
      <div className="relative flex items-center overflow-hidden">
        
        {/* Advanced Edge Masks (Glassy feel) */}
        <div className="absolute left-0 top-0 bottom-0 w-24 md:w-64 bg-gradient-to-r from-white via-white/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 md:w-64 bg-gradient-to-l from-white via-white/80 to-transparent z-20 pointer-events-none" />

        <motion.div
          className="flex gap-8 md:gap-12 items-center py-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 35, // Adjust speed here (higher = slower)
          }}
        >
          {scrollContent.map((partner, index) => (
            <motion.button
              type="button"
              key={`${partner.name}-${index}`}
              onClick={() => onSelect?.(partner)}
              className="group relative flex-shrink-0 w-48 h-28 md:w-60 md:h-32 bg-white rounded-3xl border border-slate-200 flex items-center justify-center p-8 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)] hover:border-indigo-300 hover:-translate-y-1 focus:outline-none"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <div className="relative w-full h-full">
                <Image
                  src={resolveAttachmentUrl(partner.logo, API_ORIGIN) || 'https://placehold.co/240x128?text=Logo'}
                  alt={`${partner.name} logo`}
                  fill
                  sizes="(max-width: 768px) 192px, 240px"
                  className="object-contain transition-all duration-500 group-hover:scale-110"
                  priority={index < 4}
                />
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
      ) : null}
      
      {/* Bottom Border Accent */}
      <div className="mt-12 mx-auto max-w-xs h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

    </section>
  );
};
