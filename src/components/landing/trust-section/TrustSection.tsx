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
    <section className="bg-white py-10 sm:py-12 md:py-16 lg:pt-36">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 pb-10 sm:pb-12 md:pb-16 lg:pb-40">
        <div className="relative rounded-2xl bg-[#3b4a97] px-4 pt-10 pb-6 shadow-sm sm:rounded-3xl sm:px-6 sm:pt-12 sm:pb-8 md:rounded-[2rem] md:px-10 md:pt-14 md:pb-10 lg:rounded-[2.5rem] lg:px-20 lg:pt-20 lg:pb-40">
          <div className="grid gap-8 sm:gap-10 md:gap-12 lg:grid-cols-2 lg:items-start">
            <TrustSectionHeader title={sectionTitle} subtitle={sectionSubtitle} />
            <TrustFeatureCards features={visibleFeatures} />
          </div>

          {hasTestimonials ? (
            <TrustTestimonialCarouselPanel
              testimonials={testimonials}
              testimonialIndex={testimonialIndex}
              setTestimonialIndex={setTestimonialIndex}
              onCarouselHoverChange={setPaused}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
};
