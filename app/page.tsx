'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Cast, ClipboardCheck, ExternalLink, FileText, Globe, GraduationCap, HelpCircle, PieChart, Sparkles, Video } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getCourses } from '@/lib/api/courses';
import { getPrograms } from '@/lib/api/programs';
import { getBooks, Book } from '@/lib/api/books';
import { getSystemStats, SystemStatsData } from '@/lib/api/reports';
import { getPublicTestimonials } from '@/lib/api/testimonials';
import { getPublicPartners, Partner } from '@/lib/api/partners';
import { getPublicTeachers, PublicTeacher } from '@/lib/api/teachers';
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
        setPartnersLoadResolved(true);
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
      <PartnerCarouselSection
        partners={dynamicPartners}
        loadResolved={partnersLoadResolved}
        onSelect={(p) => setSelectedPartner(p as Partner)}
      />
      <PaymentSection handleImageError={handleImageError} />
      <Dialog open={!!selectedPartner} onOpenChange={(open) => !open && setSelectedPartner(null)}>
        <DialogContent className="sm:max-w-3xl overflow-hidden border-none p-0 bg-white/95 backdrop-blur-xl shadow-2xl">
          <div className="relative h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
             <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
             <div className="absolute -bottom-12 left-8 p-1 rounded-2xl bg-white shadow-xl border border-slate-100">
                {selectedPartner?.logo ? (
                  <img src={resolveAttachmentUrl(selectedPartner.logo, API_ORIGIN)} alt={selectedPartner.name} className="h-24 w-24 object-contain rounded-xl" />
                ) : (
                  <div className="h-24 w-24 bg-slate-50 rounded-xl flex items-center justify-center">
                    <Globe className="h-10 w-10 text-slate-300" />
                  </div>
                )}
             </div>
          </div>
          
          <div className="pt-16 px-8 pb-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  {selectedPartner?.name}
                  {selectedPartner?.type && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider">
                      {selectedPartner.type}
                    </span>
                  )}
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
                  {selectedPartner?.description || 'আমাদের সম্মানিত পার্টনার প্রতিষ্ঠানের সাথে আপনার শেখার যাত্রা হোক আরও আনন্দদায়ক।'}
                </p>
              </div>
              
              {selectedPartner?.websiteUrl && (
                <a 
                  href={selectedPartner.websiteUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-slate-200"
                >
                  <ExternalLink className="h-4 w-4" />
                  ওয়েবসাইট দেখুন
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">প্রস্তাবিত কোর্সসমূহ</h4>
                </div>
                <div className="grid gap-3">
                  {courses.slice(0, 3).map((c) => (
                    <div key={c.id} className="group relative rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-md hover:border-indigo-100 cursor-default">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{c.name}</p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{c.code}</p>
                        </div>
                        <Sparkles className="h-4 w-4 text-indigo-200 group-hover:text-indigo-400 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 ring-1 ring-rose-200">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">ডিজিটাল প্রোডাক্ট</h4>
                </div>
                <div className="grid gap-3">
                  {dynamicEbooks.slice(0, 3).map((b) => (
                    <div key={b.id} className="group relative rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-md hover:border-rose-100 cursor-default">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-800 group-hover:text-rose-600 transition-colors">{b.name}</p>
                          <p className="text-[10px] font-bold text-rose-500 uppercase">৳{b.price}</p>
                        </div>
                        <div className="h-1.5 w-1.5 rounded-full bg-rose-200 group-hover:scale-150 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}
