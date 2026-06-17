'use client';

import React, { useState } from 'react';
import type { TrustFeature } from '@/lib/api/site-content';
import type { Testimonial } from '../types';
import { TrustFeatureCards } from './TrustFeatureCards';
import { TrustSectionHeader } from './TrustSectionHeader';
import { TrustTestimonialCarouselPanel } from './TrustTestimonialCarouselPanel';
import { useTrustTestimonialAutoplay } from './useTrustTestimonialAutoplay';

export interface TrustSectionProps {
  testimonials: Testimonial[];
  trustFeatures: TrustFeature[];
  sectionTitle?: string;
  sectionSubtitle?: string;
}

export const TrustSection: React.FC<TrustSectionProps> = ({
  testimonials,
  trustFeatures,
  sectionTitle = 'কেন Shikho-তে আস্থা রাখবে?',
  sectionSubtitle = 'সেরা মেন্টর ও সর্বাধুনিক প্রযুক্তির সাথে সারাদেশের ৩০ লক্ষ+ শিক্ষার্থীর মানসম্মত পড়ালেখা ও পরীক্ষা প্রস্তুতির নির্ভরযোগ্য প্রতিষ্ঠান Shikho!',
}) => {
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const visibleFeatures = trustFeatures.slice(0, 4);
  const [paused, setPaused] = useState(false);

  const hasTestimonials = testimonials.length > 0;

  useTrustTestimonialAutoplay({
    testimonialsLength: testimonials.length,
    paused,
    setTestimonialIndex,
  });

  return (
    <section className="bg-white py-10 sm:py-12 md:py-16 lg:pt-28">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="relative overflow-visible rounded-2xl bg-[#3b4a97] px-4 pt-10 shadow-sm sm:rounded-3xl sm:px-6 sm:pt-12 md:rounded-[2rem] md:px-10 md:pt-14 lg:rounded-[2.5rem] lg:px-20 lg:pt-20">
          <div className="grid gap-8 sm:gap-10 md:gap-12 lg:grid-cols-2 lg:items-start">
            <TrustSectionHeader title={sectionTitle} subtitle={sectionSubtitle} />
            <TrustFeatureCards features={visibleFeatures} />
          </div>

          {hasTestimonials ? (
            <div className="h-10 sm:h-14 md:h-16 lg:h-20" aria-hidden />
          ) : (
            <div className="pb-6 sm:pb-8 md:pb-10" aria-hidden />
          )}
        </div>

        {hasTestimonials ? (
          <div className="relative z-10 -mt-8 px-1 sm:-mt-10 sm:px-2 md:-mt-12 lg:-mt-16">
            <TrustTestimonialCarouselPanel
              testimonials={testimonials}
              testimonialIndex={testimonialIndex}
              setTestimonialIndex={setTestimonialIndex}
              onCarouselHoverChange={setPaused}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
};
