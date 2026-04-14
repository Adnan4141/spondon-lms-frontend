'use client';

import Image from 'next/image';
import React, { useEffect, useMemo, useState } from 'react';
import type { Testimonial } from './types';
import { cn } from '@/lib/utils';
import { getTrustFeatures, type TrustFeature } from '@/lib/api/site-content';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { getYoutubeEmbedSrc, isLikelyDirectVideoUrl } from '@/lib/media-embed';

interface Props {
  testimonials: Testimonial[];
  testimonialIndex: number;
  setTestimonialIndex: React.Dispatch<React.SetStateAction<number>>;
  sectionTitle?: string;
  sectionSubtitle?: string;
}

function resolveUrl(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined;
  const t = url.trim();
  if (t.startsWith('http')) return t;
  return resolveAttachmentUrl(t, API_ORIGIN);
}

function TestimonialMedia({ t }: { t: Testimonial }) {
  const videoSrc = t.videoUrl?.trim() || '';
  const thumbSrc = resolveUrl(t.thumbnailUrl);
  const embed = videoSrc ? getYoutubeEmbedSrc(videoSrc) : null;
  const directVideo = videoSrc && !embed && isLikelyDirectVideoUrl(videoSrc);
  const resolvedVideo = videoSrc ? (resolveUrl(videoSrc) || videoSrc) : '';

  const overlayTitle = t.mediaCaptionTitle?.trim();
  const overlaySubtitle = t.mediaCaptionSubtitle?.trim();
  const showOverlay = Boolean(overlayTitle || overlaySubtitle);

  if (embed) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900 shadow-inner ring-1 ring-slate-200/60">
        <iframe
          title="Testimonial video"
          src={`${embed}?rel=0`}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        {showOverlay ? (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 bg-linear-to-t from-black/85 via-black/40 to-transparent p-4">
            {overlayTitle ? <p className="text-sm font-bold text-white">{overlayTitle}</p> : null}
            {overlaySubtitle ? <p className="text-xs text-white/85">{overlaySubtitle}</p> : null}
          </div>
        ) : null}
      </div>
    );
  }

  if (directVideo && resolvedVideo) {
    return (
      <div className="group relative aspect-video overflow-hidden rounded-2xl bg-slate-900 shadow-inner ring-1 ring-slate-200/60">
        <video
          className="h-full w-full object-cover"
          controls
          playsInline
          poster={thumbSrc}
          preload="metadata"
        >
          <source src={resolvedVideo} />
        </video>
      </div>
    );
  }

  if (thumbSrc) {
    return (
      <div className="group relative aspect-video overflow-hidden rounded-2xl bg-slate-100 shadow-inner ring-1 ring-slate-200/60">
        <Image
          src={thumbSrc}
          alt={t.name || 'Testimonial'}
          fill
          className="object-cover h-full transition-transform duration-500 group-hover:scale-[1.02]"
     
        />
        {videoSrc ? (
          <a
            href={videoSrc.startsWith('http') ? videoSrc : resolveUrl(videoSrc) || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors hover:bg-black/35"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3b4a97] text-white shadow-xl ring-4 ring-white/30">
              <Play className="ml-0.5" fill="currentColor" size={24} />
            </span>
          </a>
        ) : null}
        {showOverlay ? (
          <div className="pointer-events-none absolute bottom-0 left-0 w-full bg-linear-to-t from-black/80 to-transparent p-4">
            {overlayTitle ? <p className="text-sm font-bold text-white">{overlayTitle}</p> : null}
            {overlaySubtitle ? <p className="text-xs text-white/80">{overlaySubtitle}</p> : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm font-medium text-slate-400">
      কোনো ছবি বা ভিডিও যুক্ত নেই
    </div>
  );
}

export const TrustSection: React.FC<Props> = ({
  testimonials,
  testimonialIndex,
  setTestimonialIndex,
  sectionTitle = 'কেন Shikho-তে আস্থা রাখবে?',
  sectionSubtitle = 'সেরা মেন্টর ও সর্বাধুনিক প্রযুক্তির সাথে সারাদেশের ৩০ লক্ষ+ শিক্ষার্থীর মানসম্মত পড়ালেখা ও পরীক্ষা প্রস্তুতির নির্ভরযোগ্য প্রতিষ্ঠান Shikho!',
}) => {
  const [features, setFeatures] = useState<TrustFeature[]>([]);
  const [paused, setPaused] = useState(false);

  const visibleFeatures = useMemo(() => {
    if (features.length > 0) return features.slice(0, 4);
    return [
      { id: 'content', title: 'সেরা কনটেন্ট ', icon: '💎' },
      { id: 'material', title: 'সহজ স্টাডি ম্যাটেরিয়াল', icon: '🎬' },
      { id: 'value', title: 'স্বল্প খরচে অনেক কিছু', icon: '📦' },
      { id: 'presentation', title: 'সাবলীল উপস্থাপনা', icon: '📚' },
    ] as TrustFeature[];
  }, [features]);

  const hasTestimonials = testimonials.length > 0;
  const activeTestimonial = hasTestimonials ? testimonials[testimonialIndex] : null;

  const goPrev = () =>
    setTestimonialIndex((testimonialIndex - 1 + testimonials.length) % testimonials.length);
  const goNext = () => setTestimonialIndex((testimonialIndex + 1) % testimonials.length);

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const response = await getTrustFeatures(false);
        if (response.success && response.data) setFeatures(response.data);
      } catch (e) {
        console.error(e);
      }
    };
    loadFeatures();
  }, []);

  useEffect(() => {
    if (!hasTestimonials || testimonials.length <= 1 || paused) return;
    const id = window.setInterval(() => {
      setTestimonialIndex((i) => (i + 1) % testimonials.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, [hasTestimonials, testimonials.length, paused, setTestimonialIndex]);

  return (
    <section className="bg-white py-10 sm:py-12 md:py-16 lg:pt-36">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 pb-10 sm:pb-12 md:pb-16 lg:min-h-screen lg:pb-40">
        <div className="relative rounded-2xl bg-[#3b4a97] px-4 pt-10 pb-6 shadow-sm sm:rounded-3xl sm:px-6 sm:pt-12 sm:pb-8 md:rounded-[2rem] md:px-10 md:pt-14 md:pb-10 lg:rounded-[2.5rem] lg:px-20 lg:pt-20 lg:pb-40">
          <div className="grid gap-8 sm:gap-10 md:gap-12 lg:grid-cols-2 lg:items-start">
            <div className="text-white">
              <h2 className="mb-4 text-2xl font-bold leading-tight sm:mb-5 sm:text-3xl md:mb-6 md:text-4xl lg:text-5xl">
                {sectionTitle}
              </h2>
              <p className="max-w-md text-sm leading-relaxed opacity-90 sm:text-base md:text-lg">
                {sectionSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {visibleFeatures.map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm transition-transform hover:scale-[1.02] sm:gap-4 sm:rounded-2xl sm:p-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-2xl sm:h-14 sm:w-14 sm:rounded-xl sm:text-3xl">
                    <span>{feature.icon}</span>
                  </div>
                  <span className="text-sm font-bold text-[#2d3a7d] sm:text-[1.05rem]">{feature.title}</span>
                </div>
              ))}
            </div>
          </div>

          {activeTestimonial && (
            <div
              className="relative z-10 mx-auto mt-8 w-full max-w-5xl px-2 sm:mt-10 sm:px-4 md:mt-12 lg:absolute lg:mt-0 lg:-bottom-112 lg:left-0 lg:right-0 lg:px-4"
              onPointerEnter={() => setPaused(true)}
              onPointerLeave={() => setPaused(false)}
            >
              <div className="relative rounded-xl bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.1)] sm:rounded-2xl sm:p-6 md:p-8 lg:rounded-[2rem] lg:p-10">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={goPrev}
                  className="absolute left-1 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full border border-slate-100 bg-white p-0 text-[#3b4a97] shadow-md hover:bg-slate-50 sm:left-2 sm:h-12 sm:w-12 md:-left-5 md:shadow-lg lg:-left-7 lg:h-14 lg:w-14"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={goNext}
                  className="absolute right-1 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full border border-slate-100 bg-white p-0 text-[#3b4a97] shadow-md hover:bg-slate-50 sm:right-2 sm:h-12 sm:w-12 md:-right-5 md:shadow-lg lg:-right-7 lg:h-14 lg:w-14"
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
                </Button>

                <div className="grid min-h-0 items-center gap-6 px-10 sm:gap-8 sm:px-12 md:grid-cols-12 md:gap-8 md:px-10 lg:gap-10 lg:px-12">
                  <div className="md:col-span-7">
                    <div className="mb-3 flex gap-1 sm:mb-4">
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-600/10 pt-1.5 font-serif text-3xl text-blue-600 sm:h-8 sm:w-8 sm:pt-2 sm:text-4xl">
                        “
                      </div>
                    </div>
                    <blockquote className="mb-4 line-clamp-10 text-base font-medium italic leading-relaxed text-slate-600 sm:mb-6 sm:text-lg">
                      &quot;{activeTestimonial.quote}&quot;
                    </blockquote>
                    <div>
                      <h4 className="text-lg font-bold text-[#2d3a7d] sm:text-xl md:text-2xl">
                        {activeTestimonial.name}
                      </h4>
                      <p className="text-xs font-medium text-slate-400 sm:text-sm">{activeTestimonial.info}</p>
                    </div>
                  </div>

                  <div className="md:col-span-5">
                    <TestimonialMedia t={activeTestimonial} />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-1.5 sm:mt-8 sm:gap-2 md:mt-10">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTestimonialIndex(i)}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 touch-manipulation"
                    aria-label={`Go to testimonial ${i + 1}`}
                  >
                    <span
                      className={cn(
                        'block h-2.5 rounded-full transition-all duration-300',
                        testimonialIndex === i ? 'w-8 bg-[#d63384]' : 'w-2.5 bg-slate-300'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
