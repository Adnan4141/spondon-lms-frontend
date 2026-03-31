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
import { getBooks, getPublicBooksCatalog, type Book, type PublicCatalogBook } from '@/lib/api/books';
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
          getPublicBooksCatalog({ isEbook: true, limit: 6 }).catch(() => ({
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
        ]);

        const courseRes = results[0].status === 'fulfilled' ? results[0].value : empty;
        const programRes = results[1].status === 'fulfilled' ? results[1].value : empty;
        const ebookRes = results[2].status === 'fulfilled' ? results[2].value : { success: false, data: [] };
        const bookRes = results[3].status === 'fulfilled' ? results[3].value : { success: false, data: [] };
        const statsRes = results[4].status === 'fulfilled' ? results[4].value : { success: false, data: null };
        const testimonialRes = results[5].status === 'fulfilled' ? results[5].value : { success: false, data: [] };
        const partnerRes = results[6].status === 'fulfilled' ? results[6].value : { success: false, data: [] };
        const teacherRes = results[7].status === 'fulfilled' ? results[7].value : { success: false, data: [] };

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
        <DialogContent className="sm:max-w-4xl overflow-hidden border-none p-0 bg-white/95 backdrop-blur-2xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.15)] rounded-3xl">
          <div className="relative h-44 bg-[#f8fafc]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent"></div>
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
            
            <div className="absolute -bottom-16 left-10 p-1.5 rounded-[2.5rem] bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100/50 backdrop-blur-sm">
              <div className="relative h-32 w-32 rounded-[2.2rem] overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100">
                {selectedPartner?.logo ? (
                  <img 
                    src={resolveAttachmentUrl(selectedPartner.logo, API_ORIGIN)} 
                    alt={selectedPartner.name} 
                    className="h-full w-full object-contain p-4 transition-transform duration-500 hover:scale-110" 
                  />
                ) : (
                  <Globe className="h-12 w-12 text-slate-300" />
                )}
              </div>
            </div>

            <div className="absolute top-6 right-10 flex gap-3">
              {selectedPartner?.websiteUrl && (
                <a 
                  href={selectedPartner.websiteUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 hover:bg-white text-slate-900 rounded-2xl text-sm font-bold transition-all hover:shadow-xl hover:shadow-indigo-500/10 active:scale-95 border border-slate-200/50 backdrop-blur-md"
                >
                  <ExternalLink className="h-4 w-4 text-indigo-600" />
                  ওয়েবসাইট
                </a>
              )}
            </div>
          </div>
          
          <div className="pt-20 px-10 pb-10 space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {selectedPartner?.type && (
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-[0.15em] border border-indigo-100/50">
                    {selectedPartner.type}
                  </span>
                )}
                <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent"></div>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {selectedPartner?.name}
                </h2>
                <p className="text-slate-500 text-lg leading-relaxed max-w-2xl font-medium">
                  {selectedPartner?.description || 'আমাদের সম্মানিত পার্টনার প্রতিষ্ঠানের সাথে আপনার শেখার যাত্রা হোক আরও আনন্দদায়ক।'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Courses Column */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-200">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">প্রস্তাবিত কোর্সসমূহ</h4>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg">Top Rated</span>
                </div>
                
                <div className="space-y-3">
                  {courses.slice(0, 3).map((c) => (
                    <div 
                      key={c.id} 
                      className="group relative rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-indigo-100 hover:-translate-y-1 cursor-default"
                    >
                      <div className="flex justify-between items-center">
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">{c.code}</p>
                          <p className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug">{c.name}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                          <Sparkles className="h-5 w-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Digital Products Column */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-200">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">ডিজিটাল প্রোডাক্ট</h4>
                  </div>
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-lg">Popular</span>
                </div>

                <div className="space-y-3">
                  {dynamicEbooks.slice(0, 3).map((b) => (
                    <div 
                      key={b.id} 
                      className="group relative rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-rose-100 hover:-translate-y-1 cursor-default"
                    >
                      <div className="flex justify-between items-center">
                        <div className="space-y-1.5">
                          <p className="text-base font-bold text-slate-800 group-hover:text-rose-600 transition-colors leading-snug">{b.name}</p>
                          <div className="flex items-center gap-2">
                             <div className="h-1 w-1 rounded-full bg-rose-400"></div>
                             <p className="text-[11px] font-black text-rose-500 uppercase tracking-wider">৳{b.price}</p>
                          </div>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-rose-50 transition-colors">
                           <div className="h-2 w-2 rounded-full bg-rose-200 group-hover:scale-150 transition-transform duration-300" />
                        </div>
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
