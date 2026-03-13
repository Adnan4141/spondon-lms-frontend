'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Users as UsersIcon, 
  Video, 
  ArrowRight,
  Plus,
  Minus,
  PlayCircle,
  Zap,
  Monitor,
  Cast,
  HelpCircle,
  FileText,
  ClipboardCheck,
  PieChart,
  MessageCircle, 
  Play, 
  ChevronDown, 
  Quote, 
  ChevronLeft, 
  ChevronRight,
  GraduationCap,
  Sparkles,
  CreditCard,
  CalendarDays,
  BookOpen,
  Wrench,
  Heart,
  Layers3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getCourses } from '@/lib/api/courses';
import { getPrograms } from '@/lib/api/programs';
import { getBranches, Branch } from '@/lib/api/branches';
import { getBooks, Book } from '@/lib/api/books';
import { getSystemStats, SystemStatsData } from '@/lib/api/reports';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import type { Course, Program } from '@/types/course';

// --- Types & Data ---

interface Feature {
  id: string;
  title: string;
  icon: React.ReactNode;
  previewTitle: string;
  previewTime: string;
}

const trustPoints = [
  { img: "🎓", title: "দেশসেরা মেন্টর" },
  { img: "⚡", title: "স্মার্ট লার্নিং" },
  { img: "📊", title: "প্রগ্রেস রিপোর্ট" },
  { img: "🤝", title: "২৪/৭ সাপোর্ট" },
];

const trustFeatures = [
  { title: 'সেরা কন্টেন্ট', icon: '💎' },
  { title: 'সহজ স্টাডি ম্যাটেরিয়াল', icon: '🎬' },
  { title: 'স্বল্প খরচে অনেক কিছু', icon: '👛' },
  { title: 'সাবলীল উপস্থাপনা', icon: '🍎' },
];

const testimonials = [
  {
    id: 1,
    quote: "লাইভ ক্লাসে অ্যাডভান্সড প্রবলেম সলভিংও করায়, এতে এডমিশন টেস্টের প্রশ্ন কলেজ লাইফেই শিখে যাচ্ছি",
    name: "ইশরাত",
    info: "বান্দরবান থেকে স্বপ্ন পূরণের লক্ষ্যে HSC '26 একাডেমিক প্রোগ্রামে",
    videoThumb: "https://images.unsplash.com/photo-1517673132405-a56a62b18acc?w=600",
    videoLabel: "বান্দরবান থেকে দুই বোন স্বপ্ন পূরণের লক্ষ্যে Spondon-তে!"
  }
];

const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
};

const interactiveFeatures: Feature[] = [
  { id: 'live', title: 'লাইভ এবং রেকর্ডড ক্লাস', icon: <Cast className="h-5 w-5" />, previewTitle: 'জীববিজ্ঞান ৯ম- অধ্যায় ১: কোষ ও কলা', previewTime: 'রাত ৮:৩০ - ৯:৩০ | ৩০ মিনিট' },
  { id: 'animated', title: 'অ্যানিমেটেড ভিডিও', icon: <Video className="h-5 w-5" />, previewTitle: 'পদার্থবিজ্ঞান: গতির সূত্রসমূহ (অ্যানিমেশন)', previewTime: '১০ মিনিট' },
  { id: 'mcq-practice', title: 'প্র্যাকটিস MCQ টেস্ট', icon: <HelpCircle className="h-5 w-5" />, previewTitle: 'রসায়ন অধ্যায় ৪: পর্যায় সারণি', previewTime: '১৫ মিনিট' },
  { id: 'mcq-live', title: 'লাইভ MCQ টেস্ট', icon: <ClipboardCheck className="h-5 w-5" />, previewTitle: 'উচ্চতর গণিত: সাপ্তাহিক লাইভ কুইজ', previewTime: 'রাত ৯:০০ | ২০ মিনিট' },
  { id: 'notes', title: 'লেকচার নোট', icon: <FileText className="h-5 w-5" />, previewTitle: 'ইতিহাস: লেকচার ১ এর বিস্তারিত নোট', previewTime: 'পিডিএফ ফাইল' },
  { id: 'smart-notes', title: 'স্মার্ট নোট', icon: <FileText className="h-5 w-5 text-yellow-500" />, previewTitle: 'স্মার্ট লার্নিং: শর্টকাট টেকনিকস', previewTime: 'ইন্টারেক্টিভ' },
  { id: 'report', title: 'অগ্রগতি রিপোর্ট', icon: <PieChart className="h-5 w-5 text-blue-500" />, previewTitle: 'আপনার মাসিক অগ্রগতির রিপোর্ট', previewTime: 'বিস্তারিত এনালাইটিক্স' },
];

const paymentMethods = [
  { name: 'bKash', url: 'https://www.logo.wine/a/logo/BKash/BKash-Logo.wine.svg' },
  { name: 'Nagad', url: 'https://upload.wikimedia.org/wikipedia/bn/d/d0/Nagad_Logo.svg' },
  { name: 'Rocket', url: 'https://upload.wikimedia.org/wikipedia/bn/archive/8/8b/20210214151703%21Rocket_Logo.svg' },
  { name: 'Visa', url: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Visa_2014_logo_detail.svg' },
  { name: 'Mastercard', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg' },
  { name: 'Upay', url: 'https://upload.wikimedia.org/wikipedia/bn/4/4b/Upay_logo.svg' },
];

// --- Sub-Components ---

const SectionHeader = ({ title, subtitle, centered = true, badge }: { title: string, subtitle?: string, centered?: boolean, badge?: string }) => (
  <div className={cn("mb-16 space-y-4", centered && "text-center")}>
    {badge && <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-4">{badge}</Badge>}
    <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 leading-tight">{title}</h2>
    {subtitle && <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">{subtitle}</p>}
  </div>
);

const StatItem = ({ count, label, color }: { count: string, label: string, color: string }) => (
  <div className="text-center space-y-1">
    <div className={cn("text-3xl lg:text-4xl font-black tracking-tight", color)}>{count}</div>
    <div className="text-sm lg:text-base font-bold text-slate-400">{label}</div>
  </div>
);

const TabItem = ({ icon: Icon, title, count, isActive }: { icon: React.ElementType, title: string, count: string, isActive?: boolean }) => (
  <div className={cn("flex flex-col items-center gap-3 p-5 rounded-[24px] border border-slate-100 min-w-[160px] cursor-pointer text-center transition-all", isActive && "border-slate-800 bg-white shadow-xl scale-105")}>
    <div className={cn("h-16 w-16 rounded-[20px] bg-slate-100 flex items-center justify-center transition-colors", isActive && "bg-[#5C2D91] text-white")}>
      <Icon className="h-8 w-8" />
    </div>
    <div className="flex flex-col items-center gap-1">
      <span className="font-bold text-slate-800 text-sm">{title}</span>
      <span className="font-bold text-slate-400 text-xs">{count} টি আইটেম</span>
    </div>
  </div>
);

const ProductCard = ({ image, title, subtext, price, previousPrice, bundle }: { image: string, title: string, subtext: string, price: string, previousPrice: string, bundle?: boolean }) => {
  // Calculate discount percentage if possible
  const discount = previousPrice ? Math.round(((parseInt(previousPrice.replace(/\D/g,'')) - parseInt(price.replace(/\D/g,''))) / parseInt(previousPrice.replace(/\D/g,''))) * 100) : 0;

  return (
    <div className="group bg-white rounded-[24px] border border-slate-100 p-4 flex flex-col h-full shadow-sm hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-300 ease-out">
      
      {/* Image Container - Focused on Vertical Stack */}
      <div className={cn(
        "relative w-full overflow-hidden rounded-[20px] bg-slate-50 flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.02]",
        bundle ? "aspect-video" : "aspect-[3/4]"
      )}>
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-contain p-4 drop-shadow-xl"
          onError={(e) => e.currentTarget.src = "https://placehold.co/400x600?text=Book+Cover"} 
        />
        
        {/* Floating Badge */}
        {discount > 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
            {discount}% OFF
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 mt-5">
        <div className="space-y-2">
          <h3 className="font-black text-slate-800 text-base md:text-lg leading-tight line-clamp-2 group-hover:text-[#5C2D91] transition-colors">
            {title}
          </h3>
          <p className="text-slate-400 text-[13px] leading-snug line-clamp-2 italic">
            {subtext}
          </p>
        </div>

        {/* Price and Action Area */}
        <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-50">
          <div className="flex flex-col">
            <span className="text-slate-400 line-through text-[11px] font-bold">
              {previousPrice}
            </span>
            <span className="text-[#10B981] font-black text-xl tracking-tight">
              {price}
            </span>
          </div>
          
          <Button className="bg-[#10B981] hover:bg-slate-900 text-white text-xs font-bold px-5 h-10 rounded-xl transition-all shadow-md active:scale-95">
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---

export default function LandingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [dynamicEbooks, setDynamicEbooks] = useState<Book[]>([]);
  const [admissionBooks, setAdmissionBooks] = useState<Book[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(interactiveFeatures[0]);
  const [activeAdmissionTab, setActiveAdmissionTab] = useState('ভার্সিটি');
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  // Global Image Error Handler for Dummy Image
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, text: string = "No Image") => {
    e.currentTarget.src = `https://placehold.co/600x400/5C2D91/white?text=${text}`;
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [courseRes, programRes, branchRes, ebookRes, bookRes, statsRes] = await Promise.all([
          getCourses({ limit: 6, websiteVisible: true, featured: true }),
          getPrograms(),
          getBranches(),
          getBooks({ isEbook: true, limit: 3 }),
          getBooks({ isEbook: false, limit: 4 }),
          getSystemStats()
        ]);
        if (courseRes.success) setCourses(courseRes.data || []);
        if (programRes.success) setPrograms(programRes.data || []);
        if (branchRes.success) setBranches(branchRes.data || []);
        if (ebookRes.success) setDynamicEbooks(ebookRes.data || []);
        if (bookRes.success) setAdmissionBooks(bookRes.data || []);
        if (statsRes.success) setSystemStats(statsRes.data);
      } catch (error) {
        console.error("Data load error", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100">
      
      <Header />

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-[#E9F3FF] to-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left space-y-8 z-10">
              <h1 className="text-5xl md:text-7xl font-extrabold text-[#1F3E76] leading-tight tracking-tight">একাডেমিক থেকে এডমিশন</h1>
              <p className="text-2xl md:text-4xl font-bold text-[#FF2D8C]">প্রস্তুতি নাও দেশ সেরা শিক্ষক ও প্রযুক্তির সাথে</p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Button className="h-14 px-10 rounded-xl bg-[#CC2E88] text-white text-lg font-bold shadow-lg shadow-pink-200 transition-transform active:scale-95">কোর্সসমূহ দেখো</Button>
                <Button variant="outline" className="h-14 px-10 rounded-xl border-2 border-slate-200 bg-white text-[#5C2D91] text-lg font-bold flex items-center gap-2"><PlayCircle /> শিখতে শুরু করো</Button>
              </div>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute w-[500px] h-[500px] bg-indigo-100 rounded-full blur-3xl opacity-50 -z-10" />
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000" 
                className="w-full max-w-md rounded-[40px] shadow-2xl" 
                alt="Students"
                onError={(e) => handleImageError(e, "Student Life")}
              />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6 -mb-16 mt-16 lg:mt-24">
          <div className="bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] grid grid-cols-2 lg:grid-cols-4 p-8 lg:p-12 gap-8 border border-slate-50 relative z-20">
            <StatItem 
              count={systemStats ? `${systemStats.students}+` : "৩০ লক্ষ+"} 
              label="শিক্ষার্থী" 
              color="text-[#FF2D8C]" 
            />
            <StatItem 
              count={systemStats ? `${systemStats.teachers}+` : "২০ জন+"} 
              label="অভিজ্ঞ মেন্টর" 
              color="text-[#10B981]" 
            />
            <StatItem 
              count="৪৫ লক্ষ+" 
              label="অ্যাপ ডাউনলোড" 
              color="text-[#1F3E76]" 
            />
            <StatItem 
              count={systemStats ? `${systemStats.contents}+` : "৫ লক্ষ+"} 
              label="লার্নিং মেটেরিয়াল" 
              color="text-[#FBBF24]" 
            />
          </div>
        </div>
      </section>

      {/* 3. ডিজিটাল লাইব্রেরি সেকশন */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">
              ডিজিটাল <span className="text-[#10B981]">লাইব্রেরি</span>
            </h2>
            <p className="text-slate-500 font-medium text-lg italic">
              রম্বস পাবলিকেশনসের ই-বুক সেকশনে পাবে ডিজিটাল বইয়ের এক বিশাল সম্ভার
            </p>
          </div>

          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-800 border-l-4 border-[#10B981] pl-4">সব ই-বুক</h3>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold px-4 py-1 rounded-full text-xs">
              {dynamicEbooks.length} টি বই
            </Badge>
          </div>

          {/* E-book Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dynamicEbooks.map((book) => (
              <motion.div 
                key={book.id}
                whileHover={{ y: -5 }}
                className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all flex gap-4 items-start"
              >
                {/* Book Cover */}
                <div className="w-1/3 aspect-[3/4] rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                  <img 
                    src={book.thumbnailUrl || ""} 
                    alt={book.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => handleImageError(e, "বই")}
                  />
                </div>

                {/* Book Details */}
                <div className="flex-1 flex flex-col justify-between h-full py-1">
                  <div>
                    <h4 className="font-black text-slate-800 text-sm md:text-base leading-tight mb-2">
                      {book.name}
                    </h4>
                    <div className="inline-flex items-center gap-1 bg-[#10B981]/10 text-[#10B981] px-2 py-0.5 rounded-md text-[10px] font-bold mb-2">
                      <BookOpen className="h-3 w-3" /> ই-বুক
                    </div>
                    <p className="text-slate-400 text-[10px] md:text-xs leading-relaxed line-clamp-3 mb-4">
                      {book.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[#10B981] font-black text-sm md:text-base">
                        {book.price === 0 ? "ফ্রি" : `৳${book.price}`}
                      </span>
                    </div>
                    <Button className="bg-[#10B981] hover:bg-[#059669] text-white text-[10px] font-bold px-4 h-8 rounded-lg shadow-lg shadow-emerald-100">
                      Buy Now
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Academic Programs */}
      <section id="programs" className="py-32 bg-slate-50/40">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <SectionHeader badge="মূল পাঠ্যক্রম" title="কৌশলী একাডেমিক প্রোগ্রাম" subtitle="বোর্ড পরীক্ষা এবং প্রতিযোগিতামূলক ভর্তি পরীক্ষায় সাফল্যের জন্য আমাদের বিশেষ লার্নিং ট্র্যাক।" />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {programs.map((prog) => (
              <div key={prog.id} className="group relative overflow-hidden rounded-[48px] bg-white border border-slate-100 p-10 shadow-sm transition-all hover:shadow-xl hover:-translate-y-2">
                <div className="mb-10 h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                  <Monitor />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">{prog.name}</h3>
                <Link href={`#courses`} className="inline-flex items-center gap-3 text-xs font-black uppercase text-indigo-600">বিস্তারিত দেখুন <ArrowRight className="h-4 w-4" /></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Interactive Feature Section */}
      <section className="py-24 bg-[#111827] text-white overflow-hidden rounded-[64px] mx-4 lg:mx-12 my-12 shadow-2xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black">একাডেমিক প্রোগ্রামে যা যা থাকছে</h2>
            <p className="text-slate-400 text-lg">ক্লাসের পড়ায় ও বোর্ড পরীক্ষার প্রস্তুতিতে এগিয়ে থাকতে আমাদের প্রোগ্রামে রয়েছে-</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-3">
              {interactiveFeatures.map((item) => (
                <button key={item.id} onClick={() => setActiveTab(item)} className={`w-full flex items-center justify-between p-5 rounded-xl transition-all relative ${activeTab.id === item.id ? 'bg-white text-[#1F3E76] scale-[1.02]' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${activeTab.id === item.id ? 'bg-indigo-50 text-indigo-600' : 'bg-white/10'}`}>{item.icon}</div>
                    <span className="text-lg font-bold">{item.title}</span>
                  </div>
                  {activeTab.id === item.id && <div className="absolute -right-3 top-1/2 -translate-y-1/2 border-t-[10px] border-t-transparent border-l-[12px] border-l-white border-b-[10px] border-b-transparent hidden lg:block" />}
                </button>
              ))}
            </div>
            <div className="relative flex justify-center lg:justify-end">
               <div className="relative w-full max-w-[480px] aspect-[4/3] bg-[#7BA9C7] rounded-[32px] overflow-hidden border-8 border-[#262626]">
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                     <div className="w-full h-full bg-[#0D1117] rounded-2xl relative overflow-hidden">
                        <div className="p-4 flex items-center justify-between bg-white/5 text-[10px] text-slate-400 font-bold"><span>● এনামুল ইসলাম রিহান</span></div>
                        <img 
                          src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400" 
                          className="h-full object-contain mx-auto mt-4 grayscale-[20%]" 
                          alt="Instructor"
                          onError={(e) => handleImageError(e, "Instructor")} 
                        />
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] font-bold">
                           <span className="bg-white/10 px-3 py-1 rounded-full flex items-center gap-1"><MessageCircle className="h-3 w-3" /> চ্যাট</span>
                           <span><UsersIcon className="h-3 w-3 inline" /> ৫৫৪ জন যুক্ত</span>
                        </div>
                     </div>
                     <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-[240px] bg-white rounded-2xl p-5 shadow-2xl animate-in fade-in slide-in-from-left-4 border-l-4 border-indigo-500 text-slate-900">
                        <p className="text-[10px] font-black text-indigo-600 mb-1 uppercase tracking-widest">লেকচার ক্লাস</p>
                        <h4 className="text-sm font-black text-[#1F3E76] mb-2 leading-tight">{activeTab.previewTitle}</h4>
                        <p className="text-[10px] text-slate-400 font-bold mb-4">{activeTab.previewTime}</p>
                        <Button className="w-full h-8 bg-indigo-600 text-white font-bold text-[10px] rounded-lg transition-transform active:scale-95">এখনই জয়েন করো</Button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

   {/* 6. Admission Preparation Section */}
<section id="admission-prep" className="py-24 bg-gradient-to-b from-white to-slate-50/50">
  <div className="mx-auto max-w-7xl px-6 lg:px-12">
    
    {/* Header: Centered with a subtle accent */}
    <div className="text-center mb-16 space-y-4">
      <span className="inline-block px-4 py-1.5 rounded-full bg-purple-50 text-[#5C2D91] text-sm font-bold tracking-wide uppercase">
        Admission 2024-25
      </span>
      <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
        ভর্তি পরীক্ষার <span className="text-[#5C2D91] relative">
          সম্পূর্ণ প্রস্তুতি
          <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M0 5 Q 50 10 100 5" stroke="#5C2D91" strokeWidth="2" fill="none" opacity="0.3" />
          </svg>
        </span>
      </h2>
      <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl mx-auto">
        মেডিকেল, ইঞ্জিনিয়ারিং ও ভার্সিটি ভর্তি পরীক্ষার জন্য দেশের সেরা রিসোর্স এখন একই প্ল্যাটফর্মে।
      </p>
    </div>

    {/* Categorization Tabs: Pill-shaped & Floating */}
    <div className="flex flex-wrap items-center justify-center gap-4 mb-16 p-2 bg-slate-100/50 rounded-2xl w-fit mx-auto backdrop-blur-sm">
      {programs.map((prog) => (
        <button 
          key={prog.id} 
          onClick={() => setActiveAdmissionTab(prog.name)}
          className={`group flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 ${
            activeAdmissionTab === prog.name 
            ? "bg-white text-[#5C2D91] shadow-md scale-105" 
            : "text-slate-600 hover:bg-white/50"
          }`}
        >
          <GraduationCap className={`w-5 h-5 ${activeAdmissionTab === prog.name ? "text-[#5C2D91]" : "text-slate-400"}`} />
          <span className="font-bold">{prog.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeAdmissionTab === prog.name ? "bg-purple-100 text-[#5C2D91]" : "bg-slate-200 text-slate-500"
          }`}>
            {prog._count?.courses || 0}
          </span>
        </button>
      ))}
      
      {/* Question Bank Static Tab */}
      <button className="flex items-center gap-3 px-6 py-3 rounded-xl text-slate-600 hover:bg-white/50 transition-all group">
        <Layers3 className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
        <span className="font-bold text-slate-700">প্রশ্নব্যাংক</span>
      </button>
    </div>

    {/* Section Title with Indicator */}
    <div className="flex items-center justify-between mb-10">
      <div className="flex items-center gap-4">
        <div className="h-10 w-1.5 bg-[#10B981] rounded-full"></div>
        <h3 className="text-2xl md:text-3xl font-black text-slate-800">
          {activeAdmissionTab} <span className="font-normal text-slate-400">বান্ডেল</span>
        </h3>
      </div>
      <button className="text-sm font-bold text-[#5C2D91] hover:underline underline-offset-4">
        সবগুলো দেখুন →
      </button>
    </div>

    {/* Product Cards Grid: Enhanced Spacing */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {admissionBooks.map((book) => (
        <div key={book.id} className="group transition-transform duration-300 hover:-translate-y-2">
          <ProductCard 
            image={book.thumbnailUrl || ""}
            title={book.name}
            subtext={book.description || ""}
            price={`৳${book.price}`}
            previousPrice="৳300"
            // Ensure ProductCard has internal padding and rounded corners
          />
        </div>
      ))}
      
      {/* Empty State */}
      {admissionBooks.length === 0 && !loading && (
        <div className="col-span-full py-20 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-white">
          <div className="p-4 bg-slate-50 rounded-full mb-4">
            <Layers3 className="w-10 h-10 text-slate-300" />
          </div>
          <p className="text-slate-500 font-bold text-xl">এই ক্যাটাগরিতে কোনো বই পাওয়া যায়নি</p>
          <p className="text-slate-400">অন্য কোনো ক্যাটাগরি চেক করে দেখুন।</p>
        </div>
      )}
    </div>
  </div>
</section>

      {/* 7. Trust & Testimonial Section - FIXED ANIMATION */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          
          {/* Main Blue Container */}
          <div className="bg-[#3B4D9A] rounded-[40px] pt-16 pb-32 px-10 lg:px-20 relative">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              
              {/* Left Content */}
              <div className="text-white space-y-6">
                <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
                  কেন Spondon-তে আস্থা রাখবে?
                </h2>
                <p className="text-lg text-white/80 font-medium leading-relaxed max-w-lg">
                  সেরা মেন্টর ও সর্বাধুনিক প্রযুক্তির সাথে সারাদেশের ৩০ লক্ষ+ শিক্ষার্থীর 
                  মানসম্মত পড়ালেখা ও পরীক্ষা প্রস্তুতির নির্ভরযোগ্য প্রতিষ্ঠান Spondon!
                </p>
              </div>

              {/* Right Grid Features */}
              <div className="grid grid-cols-2 gap-4">
                {trustFeatures.map((item, i) => (
                  <div 
                    key={i} 
                    className="bg-white rounded-[20px] p-6 flex items-center gap-4 shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
                  >
                    <div className="text-3xl bg-slate-50 w-14 h-14 rounded-xl flex items-center justify-center shadow-inner">
                      {item.icon}
                    </div>
                    <span className="text-[#1F3E76] font-bold text-sm leading-tight">
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Testimonial Section */}
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-full max-w-5xl px-6 lg:px-0 flex items-center justify-center gap-4">
              
              {/* Nav Left */}
              <button 
                onClick={() => setTestimonialIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                className="hidden md:flex h-12 w-12 rounded-full bg-white shadow-xl items-center justify-center text-[#3B4D9A] hover:bg-slate-50 transition-colors z-40"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              {/* White Card */}
              <motion.div 
                key={testimonialIndex}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] p-8 lg:p-12 flex flex-col md:flex-row gap-10 items-center border border-slate-50 z-30"
              >
                {/* Text Side */}
                <div className="flex-1 space-y-6">
                  <div className="bg-[#F3E8FF] w-12 h-12 rounded-xl flex items-center justify-center">
                    <Quote className="h-6 w-6 text-[#A855F7] fill-[#A855F7]" />
                  </div>
                  <p className="text-lg lg:text-xl font-bold text-slate-800 leading-relaxed italic">
                    "{testimonials[testimonialIndex].quote}"
                  </p>
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-[#1F3E76]">{testimonials[testimonialIndex].name}</h4>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                      {testimonials[testimonialIndex].info}
                    </p>
                  </div>
                </div>

                {/* Video Side */}
                <div className="relative w-full md:w-[380px] aspect-[16/10] rounded-[24px] overflow-hidden group">
                  <img 
                    src={testimonials[testimonialIndex].videoThumb} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    alt="Student" 
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="h-14 w-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <Play className="h-6 w-6 fill-current ml-1" />
                    </div>
                  </div>
                  {/* Bottom Overlay Label */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-[12px] font-black leading-tight text-center">
                      {testimonials[testimonialIndex].videoLabel}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Nav Right */}
              <button 
                onClick={() => setTestimonialIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                className="hidden md:flex h-12 w-12 rounded-full bg-white shadow-xl items-center justify-center text-[#3B4D9A] hover:bg-slate-50 transition-colors z-40"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Spacer to allow the absolute card to have space below it */}
        <div className="h-32" />
      </section>

      {/* 8. Course Plans */}
      <section id="courses" className="py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <SectionHeader badge="এনরোলমেন্ট অপশন" title="চলমান কোর্সসমূহ" subtitle="আপনার প্রয়োজন অনুযায়ী অনলাইন বা অফলাইন ব্রাঞ্চ ব্যাচ বেছে নিন।" />
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {courses.length > 0 ? courses.map(course => (
              <div key={course.id} className="group rounded-[56px] bg-white border border-slate-100 overflow-hidden shadow-sm transition-all hover:shadow-2xl">
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                   <Badge className="absolute top-6 left-6 z-10 bg-indigo-600 text-white border-0">{course.type === 'ONLINE' ? 'অনলাইন' : 'অফলাইন'}</Badge>
                   <div className="absolute top-6 right-6 z-10 h-12 w-16 rounded-xl bg-white/95 flex flex-col items-center justify-center text-indigo-600 font-black shadow-lg">
                      <span className="text-[8px]">টাকা</span>
                      <span className="text-lg leading-none">{String(course.fee)}</span>
                   </div>
                   <img 
                    src={course.thumbnail || ""} 
                    alt={course.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => handleImageError(e, "Course")}
                   />
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
                </div>
                <div className="p-10 space-y-6">
                  <h3 className="text-2xl font-black text-slate-900 min-h-[4rem] leading-tight">{course.name}</h3>
                  <Button className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-black uppercase text-xs tracking-widest shadow-xl transition-all">ভর্তি হোন</Button>
                </div>
              </div>
            )) : [1,2,3].map(i => (
                <div key={i} className="h-96 rounded-[56px] bg-slate-50 animate-pulse" />
            ))}
          </div>
        </div>
      </section>

      {/* 9. Payment Partners */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="flex flex-col items-center gap-10">
            <div className="text-center space-y-2">
              <Badge className="bg-blue-50 text-blue-600 border-blue-100 px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-full">Secure Checkout</Badge>
              <h3 className="text-2xl font-black text-slate-800">পেমেন্ট পার্টনার</h3>
            </div>
            
            <div className="w-full max-w-4xl bg-slate-50/50 rounded-[32px] p-8 md:p-12 border border-slate-100 flex items-center justify-center transition-all hover:shadow-xl hover:bg-white">
              <img 
                src="/images/SSL-Commerz-Pay-With-logo-All-Size-01-570x213.png" 
                alt="SSLCommerz Payment Partners" 
                className="max-w-full h-auto object-contain drop-shadow-sm"
                onError={(e) => handleImageError(e, "Payment Gateway")}
              />
            </div>

            <div className="flex items-center gap-3 text-slate-400">
              <div className="h-px w-12 bg-slate-200" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Verified by SSLCOMMERZ</p>
              <div className="h-px w-12 bg-slate-200" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
