'use client';

import React, { useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { getPublicPartnerById, type PublicPartnerDetail } from '@/lib/api/partners';
import { PartnerDetailModal } from './PartnerDetailModal';

interface PartnerItem {
  id?: string;
  name: string;
  logo?: string | null;
  websiteUrl?: string | null;
  description?: string | null;
  type?: string | null;
}

interface Props {
  /** Active partners from API (homepage only lists `isActive` from backend). */
  partners: PartnerItem[];
  /** After the first public API response (even if empty). */
  loadResolved: boolean;
  badge?: string;
  title?: string;
  subtitle?: string;
}

export const PartnerCarouselSection: React.FC<Props> = ({
  partners,
  loadResolved,
  badge = 'TRUSTED BY',
  title = 'আমাদের পার্টনারসমূহ',
  subtitle = 'যেসব প্রতিষ্ঠান ও ব্র্যান্ডের সাথে আমরা কাজ করি — তালিকা অ্যাডমিন প্যানেল থেকে আপডেট করা যায়।',
}) => {
  const scrollContent = useMemo(() => (partners.length > 0 ? [...partners, ...partners] : []), [partners]);

  const durationSec = useMemo(() => {
    const n = partners.length;
    return Math.min(85, Math.max(26, 20 + n * 8));
  }, [partners.length]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<PublicPartnerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);

  const loadPartnerDetail = useCallback(async (partnerId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await getPublicPartnerById(partnerId);
      if (res.success && res.data) setDetail(res.data);
      else setDetailError(res.message || 'Could not load partner.');
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : 'Could not load partner.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openPartnerModal = useCallback(
    async (partnerId: string) => {
      setActivePartnerId(partnerId);
      setDetailOpen(true);
      setDetail(null);
      await loadPartnerDetail(partnerId);
    },
    [loadPartnerDetail],
  );

  const closeModal = useCallback(() => {
    setDetailOpen(false);
    setDetail(null);
    setDetailError(null);
    setActivePartnerId(null);
  }, []);

  const retryPartnerDetail = useCallback(() => {
    if (activePartnerId) void loadPartnerDetail(activePartnerId);
  }, [activePartnerId, loadPartnerDetail]);

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
          {badge}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight"
        >
          {title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="mx-auto mt-3 max-w-2xl text-sm font-medium text-slate-500"
        >
          {subtitle}
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

      {/* Carousel: CSS infinite marquee (translate3d), pause on hover */}
      {loadResolved && partners.length > 0 ? (
        <div className="partners-marquee-wrap relative">
          {/* Soft metallic edge fades */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20 bg-gradient-to-r from-white via-slate-100/70 to-transparent md:w-56"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-20 w-20 bg-gradient-to-l from-white via-slate-100/70 to-transparent md:w-56"
            aria-hidden
          />

          <div className="overflow-hidden px-2 sm:px-4">
            <div
              className="partners-marquee-track gap-8 md:gap-12 items-center py-4"
              style={
                {
                  '--partners-marquee-duration': `${durationSec}s`,
                } as React.CSSProperties
              }
            >
              {scrollContent.map((partner, i) => (
                <button
                  type="button"
                  key={`${partner.id ?? partner.name}-${i}`}
                  onClick={() => partner.id && void openPartnerModal(partner.id)}
                  disabled={!partner.id}
                  className="group relative h-28 w-48 shrink-0 rounded-3xl border border-slate-200/90 bg-white bg-gradient-to-b from-white to-slate-50/80 p-8 shadow-sm shadow-slate-200/40 flex items-center justify-center transition-all duration-500 hover:-translate-y-1 hover:border-indigo-300/80 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-default md:h-32 md:w-60"
                  aria-label={partner.id ? `View details: ${partner.name}` : partner.name}
                >
                  <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-50/40 via-transparent to-slate-100/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative h-full w-full">
                    <Image
                      src={resolveAttachmentUrl(partner.logo, API_ORIGIN) || 'https://placehold.co/240x128?text=Logo'}
                      alt={`${partner.name} logo`}
                      fill
                      sizes="(max-width: 768px) 192px, 240px"
                      className="object-contain transition-transform duration-500 group-hover:scale-110"
                      priority={i < 4}
                      loading={i < 4 ? undefined : 'lazy'}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <PartnerDetailModal
        open={detailOpen}
        detail={detail}
        loading={detailLoading}
        error={detailError}
        onClose={closeModal}
        onRetry={retryPartnerDetail}
      />

      {/* Bottom Border Accent */}
      <div className="mt-12 mx-auto max-w-xs h-px bg-gradient-to-r from-transparent via-slate-300/80 to-transparent" />
    </section>
  );
};
