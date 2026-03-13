'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Star, 
  Users as UsersIcon, 
  Video, 
  ArrowRight,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
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
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getCourses } from '@/lib/api/courses';
import { getPrograms } from '@/lib/api/programs';
import { getBranches } from '@/lib/api/branches';

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

const ebooks = [
  {
    id: 1,
    title: "SUST প্রশ্নব্যাংক ২০২৫ সংস্করণ",
    desc: "সাস্ট ভর্তি পরীক্ষায় সর্বোচ্চ সাফল্য নিশ্চিত করতে সাথে রাখো Rhombus Publications-এর সাস্ট প্রশ্নব্যাংক বইটি!",
    price: 77,
    oldPrice: 300,
    tag: "ই-বুক",
    image: "https://placehold.co/150x200/0D9488/white?text=SUST"
  },
  {
    id: 2,
    title: "মেডিক্যাল প্রশ্নব্যাংক ২০২৫ সংস্করণ",
    desc: "Medical প্রশ্নব্যাংক (২০০৯-১০ থেকে ২০২৪-২৫) হলো মেডিকেল ভর্তিচ্ছু শিক্ষার্থীদের জন্য গত ১৫+ বছরের ভর্তি পরীক্ষার প্রশ্নসমূহের একটি সুবিন্যস্ত...",
    price: 0, // 0 means Free
    oldPrice: 300,
    tag: "ই-বুক",
    image: "https://placehold.co/150x200/1E3A8A/white?text=Medical"
  },
  {
    id: 3,
    title: "IUT প্রশ্নব্যাংক ২০২৫ সংস্করণ",
    desc: "IUT ভর্তি পরীক্ষায় সর্বোচ্চ সাফল্য নিশ্চিত করতে সাথে রাখো Rhombus Publications-এর IUT প্রশ্নব্যাংক বইটি!",
    price: 77,
    oldPrice: 300,
    tag: "ই-বুক",
    image: "https://placehold.co/150x200/991B1B/white?text=IUT"
  }
];

const testimonials = [
  {
    id: 1,
    quote: "লাইভ ক্লাসে অ্যাডভান্সড প্রবলেম সলভিংও করায়, এতে এডমিশন টেস্টের প্রশ্ন কলেজ লাইফেই শিখে যাচ্ছি",
    name: "ইশরাত",
    info: "বান্দরবান থেকে স্বপ্ন পূরণের লক্ষ্যে HSC '26 একাডেমিক প্রোগ্রামে",
    videoThumb: "https://images.unsplash.com/photo-1517673132405-a56a62b18acc?w=600",
    videoLabel: "বান্দরবান থেকে দুই বোন স্বপ্ন পূরণের লক্ষ্যে SpondonPro-তে!"
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

// --- Main Page ---

export default function LandingPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(interactiveFeatures[0]);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  // Global Image Error Handler for Dummy Image
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, text: string = "No Image") => {
    e.currentTarget.src = `https://placehold.co/600x400/5C2D91/white?text=${text}`;
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [courseRes, programRes, branchRes] = await Promise.all([
          getCourses({ limit: 6, websiteVisible: true, featured: true }),
          getPrograms(),
          getBranches()
        ]);
        if (courseRes.success) setCourses(courseRes.data);
        if (programRes.success) setPrograms(programRes.data);
        if (branchRes.success) setBranches(branchRes.data);
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
      
      {/* 1. Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-1 group">
              <div className="text-3xl font-black tracking-tighter text-[#5C2D91] flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-[#5C2D91] flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-500">
                  <Zap className="h-6 w-6 fill-white" />
                </div>
                স্পন্দন
              </div>
            </Link>
            <div className="hidden lg:flex items-center gap-6">
              {['স্কুল', 'একাডেমিক', 'লক্ষ্য জিপিএ-৫', 'ভর্তি প্রস্তুতি'].map((item) => (
                <button key={item} className="flex items-center gap-1 text-[15px] font-bold text-slate-600 hover:text-[#5C2D91]">
                  {item} <ChevronDown className="h-4 w-4" />
                </button>
              ))}
              <Link href="#branches" className="text-[15px] font-bold text-slate-600 hover:text-[#5C2D91]">ব্রাঞ্চসমূহ</Link>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" className="rounded-xl border-[#5C2D91] text-[#5C2D91] font-bold px-6">লগ ইন / সাইন আপ</Button>
            </Link>
          </div>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2"><Menu /></button>
        </div>
      </nav>

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
            <StatItem count="৩০ লক্ষ+" label="শিক্ষার্থী" color="text-[#FF2D8C]" />
            <StatItem count="২০ জন+" label="অভিজ্ঞ মেন্টর" color="text-[#10B981]" />
            <StatItem count="৪৫ লক্ষ+" label="অ্যাপ ডাউনলোড" color="text-[#1F3E76]" />
            <StatItem count="৫ লক্ষ+" label="লার্নিং মেটেরিয়াল" color="text-[#FBBF24]" />
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
              ৩ টি বই
            </Badge>
          </div>

          {/* E-book Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ebooks.map((book) => (
              <motion.div 
                key={book.id}
                whileHover={{ y: -5 }}
                className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all flex gap-4 items-start"
              >
                {/* Book Cover */}
                <div className="w-1/3 aspect-[3/4] rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                  <img 
                    src={book.image} 
                    alt={book.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => handleImageError(e, "বই")}
                  />
                </div>

                {/* Book Details */}
                <div className="flex-1 flex flex-col justify-between h-full py-1">
                  <div>
                    <h4 className="font-black text-slate-800 text-sm md:text-base leading-tight mb-2">
                      {book.title}
                    </h4>
                    <div className="inline-flex items-center gap-1 bg-[#10B981]/10 text-[#10B981] px-2 py-0.5 rounded-md text-[10px] font-bold mb-2">
                      <BookOpen className="h-3 w-3" /> {book.tag}
                    </div>
                    <p className="text-slate-400 text-[10px] md:text-xs leading-relaxed line-clamp-3 mb-4">
                      {book.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[#10B981] font-black text-sm md:text-base">
                        {book.price === 0 ? "ফ্রি" : `৳${book.price}`}
                      </span>
                      <span className="text-slate-300 line-through text-[10px] font-bold">
                        ৳{book.oldPrice}
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

      {/* 7. Course Plans */}
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
                      <span className="text-lg leading-none">{course.fee}</span>
                   </div>
                   <img 
                    src={course.image || ""} 
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

      {/* 8. Payment Partners */}
      <section className="py-12 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6 min-w-fit">
              <span className="text-blue-600 font-black text-sm uppercase tracking-widest">পেমেন্ট করুন</span>
              <div className="h-20 w-px bg-slate-200 hidden lg:block" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex flex-wrap justify-center gap-6 lg:gap-8">
                {paymentMethods.map((method, i) => (
                  <div key={i} className="w-20 h-12 flex items-center justify-center grayscale hover:grayscale-0 transition-all">
                    <img 
                      src={method.url} 
                      alt={method.name} 
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => handleImageError(e, method.name)} 
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-6 min-w-fit">
              <div className="h-20 w-px bg-slate-200 hidden lg:block" />
              <div className="text-center lg:text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ভেরিফাইড বাই</p>
                <div className="bg-[#005BAB] text-white px-4 py-2 rounded font-black text-sm italic tracking-tight">SSLCOMMERZ</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="bg-[#1F3E76] text-white pt-20 pb-10 rounded-t-[64px] mx-4 lg:mx-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center md:text-left">
          <div className="flex flex-col md:flex-row justify-between items-center border-b border-white/10 pb-12 gap-8">
            <div className="text-3xl font-black tracking-tighter">স্পন্দন<span className="text-[#FF2D8C]">প্রো।</span></div>
            <div className="flex flex-wrap justify-center gap-8 font-bold text-sm">
              <Link href="#" className="hover:text-[#FF2D8C] transition-colors">শর্তাবলী</Link>
              <Link href="#" className="hover:text-[#FF2D8C] transition-colors">গোপনীয়তা নীতি</Link>
              <Link href="#" className="hover:text-[#FF2D8C] transition-colors">যোগাযোগ</Link>
              <Link href="#branches" className="hover:text-[#FF2D8C] transition-colors">ব্রাঞ্চ ম্যাপ</Link>
            </div>
          </div>
          <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-6">
             <p className="text-white/50 text-xs font-bold uppercase tracking-widest leading-relaxed">© ২০২৬ স্পন্দন প্রো টেকনোলজিস লিমিটেড। সর্বস্বত্ব সংরক্ষিত।</p>
             <div className="flex gap-4">
                {[Twitter, Linkedin, Facebook, Instagram].map((Icon, i) => (
                  <Icon key={i} className="h-5 w-5 text-white/40 hover:text-white cursor-pointer transition-all hover:scale-110" />
                ))}
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}