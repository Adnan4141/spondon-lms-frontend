'use client';

import React, { useEffect, useState } from 'react';
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
import { Testimonial } from '@/components/landing/types';
import type { Course, Program } from '@/types/course';
import { getCourses } from '@/lib/api/courses';
import { getPrograms } from '@/lib/api/programs';
import { getPublicBooksCatalog, type PublicCatalogBook } from '@/lib/api/books';
import { getPublicTestimonials } from '@/lib/api/testimonials';
import { getPublicPartners, Partner } from '@/lib/api/partners';
import { getPublicTeachers, PublicTeacher } from '@/lib/api/teachers';
import { getProgramCards, getSiteSettings, type HeroSlide, type ProgramCard } from '@/lib/api/site-content';

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: 'লাইভ ক্লাসে অ্যাডভান্সড প্রবলেম সলভিংও করায়, এতে এডমিশন টেস্টের প্রশ্ন কলেজ লাইফেই শিখে যাচ্ছি',
    name: 'ইশরাত',
    info: "বান্দরবান থেকে স্বপ্ন পূরণের লক্ষ্যে HSC '26 একাডেমিক প্রোগ্রামে",
    rating: 5,
  },
];

export default function LandingPageClient({ initialHeroSlides }: { initialHeroSlides: HeroSlide[] }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [heroSlides] = useState<HeroSlide[]>(initialHeroSlides);
  const [programCards, setProgramCards] = useState<ProgramCard[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [dynamicEbooks, setDynamicEbooks] = useState<PublicCatalogBook[]>([]);
  const [dynamicTestimonials, setDynamicTestimonials] = useState<Testimonial[]>([]);
  const [dynamicPartners, setDynamicPartners] = useState<Partner[]>([]);
  const [partnersLoadResolved, setPartnersLoadResolved] = useState(false);
  const [teachers, setTeachers] = useState<PublicTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, text: string = 'No Image') => {
    e.currentTarget.src = `https://placehold.co/600x400/5C2D91/white?text=${text}`;
  };

  useEffect(() => {
    async function loadData() {
      const empty = { success: false as const, data: [] as never[] };
      try {
        const results = await Promise.allSettled([
          getCourses({ limit: 6, websiteVisible: true, featured: true, status: 'ACTIVE' }).catch(() => empty),
          getPrograms().catch(() => empty),
          getPublicBooksCatalog({ featured: true, limit: 6 }).catch(() => ({
            success: false as const,
            data: [] as PublicCatalogBook[],
          })),
          getPublicTestimonials({ type: 'HOME' }).catch(() => ({ success: false, data: [] })),
          getPublicPartners().catch(() => ({ success: false, data: [] })),
          getPublicTeachers().catch(() => ({ success: false, data: [] })),
          getProgramCards().catch(() => ({ success: false, data: [] as ProgramCard[] })),
          getSiteSettings().catch(() => ({ success: false, data: [] })),
        ]);

        const courseRes = results[0].status === 'fulfilled' ? results[0].value : empty;
        const programRes = results[1].status === 'fulfilled' ? results[1].value : empty;
        const ebookRes = results[2].status === 'fulfilled' ? results[2].value : { success: false, data: [] };
        const testimonialRes = results[3].status === 'fulfilled' ? results[3].value : { success: false, data: [] };
        const partnerRes = results[4].status === 'fulfilled' ? results[4].value : { success: false, data: [] };
        const teacherRes = results[5].status === 'fulfilled' ? results[5].value : { success: false, data: [] };
        const programCardRes = results[6].status === 'fulfilled' ? results[6].value : { success: false, data: [] as ProgramCard[] };
        const settingsRes = results[7].status === 'fulfilled' ? results[7].value : { success: false, data: [] };

        if (courseRes.success) setCourses(courseRes.data || []);
        if (programRes.success) setPrograms(programRes.data || []);
        if (ebookRes.success) setDynamicEbooks(ebookRes.data || []);
        if (testimonialRes.success && testimonialRes.data?.length) {
          setDynamicTestimonials(
            testimonialRes.data.map((t) => ({
              id: t.id,
              quote: t.quote,
              name: t.name,
              info: t.info || '',
              instituteName: t.institute || '',
              thumbnailUrl: t.thumbnailUrl || undefined,
              videoUrl: t.videoUrl || undefined,
              mediaCaptionTitle: t.mediaCaptionTitle || undefined,
              mediaCaptionSubtitle: t.mediaCaptionSubtitle || undefined,
              rating: t.rating ?? 5,
            }))
          );
        }
        if (partnerRes.success) setDynamicPartners(partnerRes.data || []);
        if (teacherRes.success) setTeachers(teacherRes.data || []);
        if (programCardRes.success && programCardRes.data?.length) setProgramCards(programCardRes.data);
        if (settingsRes.success && settingsRes.data) {
          const map: Record<string, string> = {};
          for (const s of settingsRes.data as { key: string; value: string }[]) map[s.key] = s.value;
          setSiteSettings(map);
        }
      } catch (error) {
        console.error('Data load error', error);
      } finally {
        setLoading(false);
        setPartnersLoadResolved(true);
      }
    }
    loadData();
  }, []);

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
        loading={loading}
        handleImageError={handleImageError}
        badge={siteSettings['courses.badge']}
        title={siteSettings['courses.title']}
        titleHighlight={siteSettings['courses.titleHighlight']}
        subtitle={siteSettings['courses.subtitle']}
        buttonText={siteSettings['courses.button']}
      />
      <TrustSection
        testimonials={dynamicTestimonials.length > 0 ? dynamicTestimonials : testimonials}
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
        dynamicEbooks={dynamicEbooks}
        badge={siteSettings['library.badge']}
        title={siteSettings['library.title']}
        titleHighlight={siteSettings['library.titleHighlight']}
        buttonText={siteSettings['library.button']}
      />
      <PartnerCarouselSection
        partners={dynamicPartners}
        loadResolved={partnersLoadResolved}
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
