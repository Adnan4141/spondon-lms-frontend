'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroCarousel } from '@/components/landing/HeroCarousel';
import { ProgramsCTASection } from '@/components/landing/ProgramsCTASection';
import { DigitalLibrarySection } from '@/components/landing/DigitalLibrarySection';
import { TrustSection } from '@/components/landing/TrustSection';
import { CoursesSection } from '@/components/landing/CoursesSection';
import { PaymentSection } from '@/components/landing/PaymentSection';
import { PartnerCarouselSection } from '@/components/landing/PartnerCarouselSection';
import { TeachersSection } from '@/components/landing/TeachersSection';
import type { LandingPageData } from '@/lib/api/landing-data';

export default function LandingPageClient({
  heroSlides,
  programCards,
  siteSettings,
  courses,
  programs,
  ebooks,
  testimonials,
  partners,
  teachers,
}: LandingPageData) {
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, text: string = 'No Image') => {
    e.currentTarget.src = `https://placehold.co/600x400/5C2D91/white?text=${text}`;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 overflow-x-hidden">
      <Header />
      <HeroCarousel slides={heroSlides} />
      <ProgramsCTASection
        cards={programCards}
        programs={programs}
        label={siteSettings['programs_cta.label']}
        title={siteSettings['programs_cta.title']}
        buttonText={siteSettings['programs_cta.button']}
      />

      <CoursesSection
        courses={courses}
        loading={false}
        handleImageError={handleImageError}
        badge={siteSettings['courses.badge']}
        title={siteSettings['courses.title']}
        titleHighlight={siteSettings['courses.titleHighlight']}
        subtitle={siteSettings['courses.subtitle']}
        buttonText={siteSettings['courses.button']}
      />
      <TrustSection
        testimonials={testimonials}
        testimonialIndex={testimonialIndex}
        setTestimonialIndex={setTestimonialIndex}
        sectionTitle={siteSettings['trust.title']}
        sectionSubtitle={siteSettings['trust.subtitle']}
      />
      <TeachersSection
        teachers={teachers}
        badge={siteSettings['teachers.badge']}
        title={siteSettings['teachers.title']}
      />
      <DigitalLibrarySection
        dynamicEbooks={ebooks}
        badge={siteSettings['library.badge']}
        title={siteSettings['library.title']}
        titleHighlight={siteSettings['library.titleHighlight']}
        buttonText={siteSettings['library.button']}
      />
      <PartnerCarouselSection
        partners={partners}
        loadResolved
        badge={siteSettings['partners.badge']}
        title={siteSettings['partners.title']}
        subtitle={siteSettings['partners.subtitle']}
      />
      <PaymentSection
        handleImageError={handleImageError}
        badge={siteSettings['payment.badge']}
        title={siteSettings['payment.title']}
        subtitle={siteSettings['payment.subtitle']}
        footerText={siteSettings['payment.footer']}
      />
      <Footer siteSettings={siteSettings} />
    </div>
  );
}
