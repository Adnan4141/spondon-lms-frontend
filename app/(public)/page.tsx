import { Suspense } from 'react';
import type { Metadata } from 'next';
import { HeroCarousel } from '@/components/landing/HeroCarousel';
import { ProgramsCTASection } from '@/components/landing/ProgramsCTASection';
import { getLandingCriticalData } from '@/lib/api/landing-data';
import { buildHomeMetadata } from '@/lib/seo-brand';
import { PublicContentSkeleton } from '@/components/layout/PublicContentSkeleton';
import {
  LandingCoursesSection,
  LandingLibrarySection,
  LandingPartnersSection,
  LandingPaymentSection,
  LandingTeachersSection,
  LandingTrustSection,
} from './landing-sections';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return buildHomeMetadata();
}

function SectionSkeleton({ className = 'h-64' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse bg-slate-100 ${className}`} />;
}

/** Streams hero/programs so the shell is never stuck on a blank white main. */
async function LandingHeroAndPrograms() {
  const { heroSlides, programCards, programs, siteSettings } = await getLandingCriticalData();

  return (
    <>
      <HeroCarousel slides={heroSlides} />
      <ProgramsCTASection
        cards={programCards}
        programs={programs}
        label={siteSettings['programs_cta.label']}
        title={siteSettings['programs_cta.title']}
        buttonText={siteSettings['programs_cta.button']}
      />
    </>
  );
}

/** Home content only — Header/Footer come from `(public)/layout`. */
export default function LandingPage() {
  return (
    <div className="overflow-x-hidden selection:bg-indigo-100">
      <Suspense fallback={<PublicContentSkeleton />}>
        <LandingHeroAndPrograms />
      </Suspense>

      <Suspense fallback={<SectionSkeleton className="h-[600px]" />}>
        <LandingCoursesSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="h-[480px]" />}>
        <LandingTrustSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="h-72" />}>
        <LandingTeachersSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="h-96 bg-slate-900" />}>
        <LandingLibrarySection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="h-56" />}>
        <LandingPartnersSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="h-64" />}>
        <LandingPaymentSection />
      </Suspense>
    </div>
  );
}
