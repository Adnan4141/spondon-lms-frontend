import { Suspense } from 'react';
import { HeroCarousel } from '@/components/landing/HeroCarousel';
import { ProgramsCTASection } from '@/components/landing/ProgramsCTASection';
import { getLandingCriticalData } from '@/lib/api/landing-data';
import {
  LandingCoursesSection,
  LandingLibrarySection,
  LandingPartnersSection,
  LandingPaymentSection,
  LandingTeachersSection,
  LandingTrustSection,
} from './landing-sections';

export const revalidate = 300;

function SectionSkeleton({ className = 'h-64' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse bg-slate-100 ${className}`} />;
}

export default async function LandingPage() {
  const { heroSlides, programCards, programs, siteSettings } = await getLandingCriticalData();

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 overflow-x-hidden">
      <HeroCarousel slides={heroSlides} />
      <ProgramsCTASection
        cards={programCards}
        programs={programs}
        label={siteSettings['programs_cta.label']}
        title={siteSettings['programs_cta.title']}
        buttonText={siteSettings['programs_cta.button']}
      />

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
