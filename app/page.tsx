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
import { Feature, Testimonial } from '@/components/landing/types';
import type { Course, Program } from '@/types/course';
import { getCourses } from '@/lib/api/courses';
import { getPrograms } from '@/lib/api/programs';
import { getBooks, Book } from '@/lib/api/books';
import { getSystemStats, SystemStatsData } from '@/lib/api/reports';
import { getPublicTestimonials } from '@/lib/api/testimonials';
import { getPublicPartners, Partner } from '@/lib/api/partners';
import { getPublicTeachers, PublicTeacher } from '@/lib/api/teachers';

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
    videoThumb: 'https://images.unsplash.com/photo-1517673132405-a56a62b18acc?w=600',
    videoLabel: 'বান্দরবান থেকে দুই বোন স্বপ্ন পূরণের লক্ষ্যে SpondonPro-তে!',
  },
];

export default function LandingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [dynamicEbooks, setDynamicEbooks] = useState<Book[]>([]);
  const [admissionBooks, setAdmissionBooks] = useState<Book[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStatsData | null>(null);
  const [dynamicTestimonials, setDynamicTestimonials] = useState<Testimonial[]>([]);
  const [dynamicPartners, setDynamicPartners] = useState<Partner[]>([]);
  const [teachers, setTeachers] = useState<PublicTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(interactiveFeatures[0]);
  const [activeAdmissionTab, setActiveAdmissionTab] = useState('ভার্সিটি');
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, text: string = 'No Image') => {
    e.currentTarget.src = `https://placehold.co/600x400/5C2D91/white?text=${text}`;
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [courseRes, programRes, ebookRes, bookRes, statsRes, testimonialRes, partnerRes, teacherRes] = await Promise.all([
          getCourses({ limit: 6, websiteVisible: true, featured: true, status: 'ACTIVE' }),
          getPrograms(),
          getBooks({ isEbook: true, limit: 3 }),
          getBooks({ isEbook: false, limit: 4 }),
          getSystemStats(),
          getPublicTestimonials().catch(() => ({ success: false, data: [] })),
          getPublicPartners().catch(() => ({ success: false, data: [] })),
          getPublicTeachers().catch(() => ({ success: false, data: [] })),
        ]);
        if (courseRes.success) setCourses(courseRes.data || []);
        if (programRes.success) setPrograms(programRes.data || []);
        if (ebookRes.success) setDynamicEbooks(ebookRes.data || []);
        if (bookRes.success) setAdmissionBooks(bookRes.data || []);
        if (statsRes.success) setSystemStats(statsRes.data);
        if (testimonialRes.success && testimonialRes.data?.length) {
          setDynamicTestimonials(testimonialRes.data.map((t: any, i: number) => ({
            id: i + 1,
            quote: t.quote,
            name: t.name,
            info: t.info || '',
            videoThumb: t.thumbnailUrl || '',
            videoLabel: t.videoUrl || '',
          })));
        }
        if (partnerRes.success) setDynamicPartners(partnerRes.data || []);
        if (teacherRes.success) setTeachers(teacherRes.data || []);
      } catch (error) {
        console.error('Data load error', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 overflow-x-hidden">
      <Header />
      <HeroCarousel />
      <ProgramsCTASection />
      {/* <StatsSection systemStats={systemStats} /> */}
 
      <CoursesSection courses={courses} handleImageError={handleImageError} />
      <TrustSection testimonials={dynamicTestimonials.length > 0 ? dynamicTestimonials : testimonials} testimonialIndex={testimonialIndex} setTestimonialIndex={setTestimonialIndex} />
      <TeachersSection teachers={teachers} />
      <DigitalLibrarySection dynamicEbooks={dynamicEbooks} />
      <PartnerCarouselSection partners={dynamicPartners} />
      <PaymentSection handleImageError={handleImageError} />
      <Footer />
    </div>
  );
}
