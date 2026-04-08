'use client';

import React, { useEffect, useState } from 'react';
import { Cast, ClipboardCheck, FileText, HelpCircle, PieChart, Video } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroCarousel } from '@/components/landing/HeroCarousel';
import { StatsSection } from '@/components/landing/StatsSection';
import { ProgramsCTASection } from '@/components/landing/ProgramsCTASection';
import { DigitalLibrarySection } from '@/components/landing/DigitalLibrarySection';
// import { ProgramsSection } from '@/components/landing/ProgramsSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { CoursesSection } from '@/components/landing/CoursesSection';
import { PaymentSection } from '@/components/landing/PaymentSection';
import { PartnerCarouselSection } from '@/components/landing/PartnerCarouselSection';
import { TeachersSection } from '@/components/landing/TeachersSection';
import { PartnerDetailsDialog } from '@/components/landing/PartnerDetailsDialog';
import { Feature, Testimonial } from '@/components/landing/types';
import type { Course, Program } from '@/types/course';
import { getCourses } from '@/lib/api/courses';
import { getPrograms } from '@/lib/api/programs';
import { getBooks, getPublicBooksCatalog, type Book, type PublicCatalogBook } from '@/lib/api/books';
import { getSystemStats, SystemStatsData } from '@/lib/api/reports';
import { getPublicTestimonials } from '@/lib/api/testimonials';
import { getPublicPartners, Partner } from '@/lib/api/partners';
import { getPublicTeachers, PublicTeacher } from '@/lib/api/teachers';
import { getHeroSlides, getProgramCards, type HeroSlide, type ProgramCard } from '@/lib/api/site-content';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';

const interactiveFeatures: Feature[] = [
  { id: 'live', title: 'লাইভ এবং রেকর্ডড ক্লাস', icon: <Cast className="h-5 w-5" />, previewTitle: 'জীববিজ্ঞান ৯ম- অধ্যায় ১: কোষ ও কলা', previewTime: 'রাত ৮:৩০ - ৯:৩০ | ৩০ মিনিট' },
  { id: 'animated', title: 'অ্যানিমেটেড ভিডিও', icon: <Video className="h-5 w-5" />, previewTitle: 'পদার্থবিজ্ঞান: গতির সূত্রসমূহ (অ্যানিমেশন)', previewTime: '১০ মিনিট' },
  { id: 'mcq-practice', title: 'প্র্যাকটিস MCQ টেস্ট', icon: <HelpCircle className="h-5 w-5" />, previewTitle: 'রসায়ন অধ্যায় ৪: পর্যায় সারণি', previewTime: '১৫ মিনিট' },
  { id: 'mcq-live', title: 'লাইভ MCQ টেস্ট', icon: <ClipboardCheck className="h-5 w-5" />, previewTitle: 'উচ্চতর গণিত: সাপ্তাহিক লাইভ কুইজ', previewTime: 'রাত ৯:০০ | ২০ মিনিট' },
  { id: 'notes', title: 'লেকচার নোট', icon: <FileText className="h-5 w-5" />, previewTitle: 'ইতিহাস: লেকচার ১ এর বিস্তারিত নোট', previewTime: 'পিডিএফ ফাইল' },
  { id: 'smart-notes', title: 'স্মার্ট নোট', icon: <FileText className="h-5 w-5 text-yellow-500" />, previewTitle: 'স্মার্ট লার্নিং: শর্টকাট টেকনিকস', previewTime: 'ইন্টারেক্টিভ' },
  { id: 'report', title: 'অগ্রগতি রিপোর্ট', icon: <PieChart className="h-5 w-5 text-blue-500" />, previewTitle: 'আপনার মাসিক অগ্রগতির রিপোর্ট', previewTime: 'বিস্তারিত এনালাইটিক্স' },
];

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: 'লাইভ ক্লাসে অ্যাডভান্সড প্রবলেম সলভিংও করায়, এতে এডমিশন টেস্টের প্রশ্ন কলেজ লাইফেই শিখে যাচ্ছি',
    name: 'ইশরাত',
    info: "বান্দরবান থেকে স্বপ্ন পূরণের লক্ষ্যে HSC '26 একাডেমিক প্রোগ্রামে",
    rating: 5,
  },
];

export default function LandingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [programCards, setProgramCards] = useState<ProgramCard[]>([]);
  const [dynamicEbooks, setDynamicEbooks] = useState<PublicCatalogBook[]>([]);
  const [admissionBooks, setAdmissionBooks] = useState<Book[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStatsData | null>(null);
  const [dynamicTestimonials, setDynamicTestimonials] = useState<Testimonial[]>([]);
  const [dynamicPartners, setDynamicPartners] = useState<Partner[]>([]);
  const [partnersLoadResolved, setPartnersLoadResolved] = useState(false);
  const [teachers, setTeachers] = useState<PublicTeacher[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(interactiveFeatures[0]);
  const [activeAdmissionTab, setActiveAdmissionTab] = useState('ভার্সিটি');
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
          getPublicBooksCatalog({ limit: 6 }).catch(() => ({
            success: false as const,
            data: [] as PublicCatalogBook[],
          })),
          getBooks({ isEbook: false, limit: 4 }).catch(() => ({
            success: false as const,
            data: [] as PublicCatalogBook[],
          })),
          getSystemStats().catch(() => ({ success: false as const, data: null as null })),
          getPublicTestimonials().catch(() => ({ success: false, data: [] })),
          getPublicPartners().catch(() => ({ success: false, data: [] })),
          getPublicTeachers().catch(() => ({ success: false, data: [] })),
          getHeroSlides().catch(() => ({ success: false, data: [] as HeroSlide[] })),
          getProgramCards().catch(() => ({ success: false, data: [] as ProgramCard[] })),
        ]);

        const courseRes = results[0].status === 'fulfilled' ? results[0].value : empty;
        const programRes = results[1].status === 'fulfilled' ? results[1].value : empty;
        const ebookRes = results[2].status === 'fulfilled' ? results[2].value : { success: false, data: [] };
        const bookRes = results[3].status === 'fulfilled' ? results[3].value : { success: false, data: [] };
        const statsRes = results[4].status === 'fulfilled' ? results[4].value : { success: false, data: null };
        const testimonialRes = results[5].status === 'fulfilled' ? results[5].value : { success: false, data: [] };
        const partnerRes = results[6].status === 'fulfilled' ? results[6].value : { success: false, data: [] };
        const teacherRes = results[7].status === 'fulfilled' ? results[7].value : { success: false, data: [] };
        const heroRes = results[8].status === 'fulfilled' ? results[8].value : { success: false, data: [] as HeroSlide[] };
        const programCardRes = results[9].status === 'fulfilled' ? results[9].value : { success: false, data: [] as ProgramCard[] };

        if (courseRes.success) setCourses(courseRes.data || []);
        if (programRes.success) setPrograms(programRes.data || []);
        if (ebookRes.success) setDynamicEbooks(ebookRes.data || []);
        if (bookRes.success) setAdmissionBooks(bookRes.data || []);
        if (statsRes.success && statsRes.data) setSystemStats(statsRes.data);
        if (testimonialRes.success && testimonialRes.data?.length) {
          setDynamicTestimonials(testimonialRes.data.map((t: any, i: number) => ({
            id: i + 1,
            quote: t.quote,
            name: t.name,
            info: t.info || '',
            instituteName: t.institute || '',
            thumbnailUrl: t.thumbnailUrl ? resolveAttachmentUrl(t.thumbnailUrl, API_ORIGIN) : undefined,
            rating: t.rating ?? 5,
          })));
        }
        if (partnerRes.success) setDynamicPartners(partnerRes.data || []);
        if (teacherRes.success) setTeachers(teacherRes.data || []);
        if (heroRes.success && heroRes.data?.length) setHeroSlides(heroRes.data);
        if (programCardRes.success && programCardRes.data?.length) setProgramCards(programCardRes.data);
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
      <ProgramsCTASection cards={programCards} />
      {/* <StatsSection systemStats={systemStats} /> */}
 
      <CoursesSection courses={courses} handleImageError={handleImageError} />
      <TrustSection testimonials={dynamicTestimonials.length > 0 ? dynamicTestimonials : testimonials} testimonialIndex={testimonialIndex} setTestimonialIndex={setTestimonialIndex} />
      <TeachersSection teachers={teachers} />
      <DigitalLibrarySection dynamicEbooks={dynamicEbooks} />
      <PartnerCarouselSection
        partners={dynamicPartners}
        loadResolved={partnersLoadResolved}
        onSelect={(p) => setSelectedPartner(p as Partner)}
      />
      <PaymentSection handleImageError={handleImageError} />
      <PartnerDetailsDialog
        selectedPartner={selectedPartner}
        setSelectedPartner={setSelectedPartner}
        courses={courses}
        dynamicEbooks={dynamicEbooks}
      />
      <Footer />
    </div>
  );
}
