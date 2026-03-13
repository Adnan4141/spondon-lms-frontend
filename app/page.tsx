'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, animate } from 'framer-motion';
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
  Layers3,
  Download
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

// --- Animation Variants ---

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

// --- Sub-Components ---

const Counter = ({ value, duration = 2 }: { value: string, duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const numericValue = parseInt(value.replace(/\D/g, '')) || 0;
    const controls = animate(0, numericValue, {
      duration: duration,
      onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
    });
    return controls.stop;
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}{value.replace(/[0-9,]/g, '')}</span>;
};

const SectionHeader = ({ title, subtitle, centered = true, badge, gradientTitle, className }: { title: string, subtitle?: string, centered?: boolean, badge?: string, gradientTitle?: string, className?: string }) => (
  <motion.div 
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={fadeInUp}
    className={cn("mb-16 space-y-4", centered && "text-center", className)}
  >
    {badge && <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-4 shadow-sm">{badge}</Badge>}
    <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 leading-tight">
      {title} {gradientTitle && <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5C2D91] to-[#FF2D8C]">{gradientTitle}</span>}
    </h2>
    {subtitle && <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">{subtitle}</p>}
  </motion.div>
);

const StatItem = ({ icon, value, label, color, bg }: { icon: React.ReactNode, value: string, label: string, color: string, bg: string }) => (
  <div className="flex flex-col items-center text-center space-y-4 group">
    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm", bg, color)}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 28 }) : icon}
    </div>
    <div>
      <h3 className={cn("text-3xl font-black tracking-tighter", color)}>
        <Counter value={value} />
      </h3>
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
    </div>
  </div>
);

const TabItem = ({ icon: Icon, title, count, isActive }: { icon: React.ElementType, title: string, count: string, isActive?: boolean }) => (
  <div className={cn("flex flex-col items-center gap-3 p-5 rounded-[24px] border border-slate-100 min-w-[160px] cursor-pointer text-center transition-all duration-300", isActive ? "border-slate-800 bg-white shadow-2xl scale-105" : "hover:bg-white/50 hover:shadow-lg")}>
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
  const discount = previousPrice ? Math.round(((parseInt(previousPrice.replace(/\D/g,'')) - parseInt(price.replace(/\D/g,''))) / parseInt(previousPrice.replace(/\D/g,''))) * 100) : 0;

  return (
    <motion.div 
      variants={fadeInScale}
      className="group bg-white rounded-[24px] border border-slate-100 p-4 flex flex-col h-full shadow-sm hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500 ease-out"
    >
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
        {discount > 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
            {discount}% OFF
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 mt-5">
        <div className="space-y-2">
          <h3 className="font-black text-slate-800 text-base md:text-lg leading-tight line-clamp-2 group-hover:text-[#5C2D91] transition-colors">
            {title}
          </h3>
          <p className="text-slate-400 text-[13px] leading-snug line-clamp-2 italic">
            {subtext}
          </p>
        </div>

        <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-50">
          <div className="flex flex-col">
            <span className="text-slate-400 line-through text-[11px] font-bold">{previousPrice}</span>
            <span className="text-[#10B981] font-black text-xl tracking-tight">{price}</span>
          </div>
          <Button className="bg-[#10B981] hover:bg-slate-900 text-white text-xs font-bold px-5 h-10 rounded-xl transition-all shadow-md active:scale-95">
            Buy Now
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

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
    videoLabel: "বান্দরবান থেকে দুই বোন স্বপ্ন পূরণের লক্ষ্যে SpondonPro-তে!"
  }
];

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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#F0F7FF] via-white to-[#FDF2F8] text-slate-900 selection:bg-indigo-100 overflow-x-hidden">
      
      <Header />

      {/* 2. Hero Section - Redesigned & Animated */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        
        {/* Animated Separate Gradient Background */}
        <div className="absolute inset-0 z-0">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              opacity: [0.3, 0.5, 0.3] 
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -top-[10%] -right-[5%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,transparent_70%)] blur-[100px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2] 
            }}
            transition={{ duration: 15, repeat: Infinity, delay: 2 }}
            className="absolute bottom-0 -left-[10%] w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(79,70,229,0.1)_0%,transparent_70%)] blur-[120px]" 
          />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-center lg:text-left space-y-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-black uppercase tracking-widest shadow-sm">
                <Star className="h-3 w-3 fill-current" />
                দেশের সেরা লার্নিং প্ল্যাটফর্ম
              </div>

              <h1 className="text-5xl md:text-[80px] font-black text-slate-900 leading-[1.1] tracking-tighter">
                একাডেমিক থেকে <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5C2D91] via-[#FF2D8C] to-[#5C2D91] animate-gradient-x">
                  এডমিশন
                </span>
              </h1>

              <p className="text-xl md:text-2xl font-medium text-slate-500 leading-relaxed max-w-xl">
                সেরা মেন্টর ও স্মার্ট প্রযুক্তির সাথে শুরু করো তোমার স্বপ্নের জয়যাত্রা।
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5">
                <button className="h-16 px-10 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-[#5C2D91] transition-all active:scale-95 flex items-center gap-3 group">
                  কোর্সসমূহ দেখো
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button className="h-16 px-10 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-black uppercase text-xs tracking-[0.2em] flex items-center gap-3 hover:border-emerald-500 hover:text-emerald-600 transition-all group">
                  <PlayCircle className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                  শিখতে শুরু করো
                </button>
              </div>
            </motion.div>

            {/* Right: Visual Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* 3D Floating Elements */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-10 -left-10 z-20 bg-white p-5 rounded-3xl shadow-2xl border border-slate-50 flex items-center gap-4"
              >
                <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <UsersIcon 
 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">একটিভ ইউজার</p>
                  <p className="text-xl font-black text-slate-900"><Counter value="৫০০,০০০+" /></p>
                </div>
              </motion.div>

              <div className="relative z-10 rounded-[60px] overflow-hidden border-[12px] border-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] group">
                 <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  alt="Students"
                  onError={(e) => handleImageError(e, "Student Life")}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent" />
              </div>
              
              {/* Background Circle Decoration */}
              <div className="absolute -inset-10 border-2 border-dashed border-slate-200 rounded-full animate-[spin_60s_linear_infinite] -z-10" />
            </motion.div>
          </div>

          {/* Stats Section: Modern Card with Animation */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-24"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-[40px] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.08)] p-10 md:p-14 grid grid-cols-2 lg:grid-cols-4 gap-12 border border-white/50">
              <StatItem 
                icon={<UsersIcon />}
 
                value={systemStats ? `${systemStats.students}+` : "৩০ লক্ষ+"} 
                label="শিক্ষার্থী" 
                color="text-indigo-600" 
                bg="bg-indigo-50" 
              />
              <StatItem 
                icon={<Star />} 
                value={systemStats ? `${systemStats.teachers}+` : "২০ জন+"} 
                label="অভিজ্ঞ মেন্টর" 
                color="text-emerald-500" 
                bg="bg-emerald-50" 
              />
              <StatItem 
                icon={<Download />} 
                value="৪৫ লক্ষ+" 
                label="অ্যাপ ডাউনলোড" 
                color="text-blue-600" 
                bg="bg-blue-50" 
              />
              <StatItem 
                icon={<BookOpen />} 
                value={systemStats ? `${systemStats.contents}+` : "৫ লক্ষ+"} 
                label="লার্নিং মেটেরিয়াল" 
                color="text-amber-500" 
                bg="bg-amber-50" 
              />
            </div>
          </motion.div>
        </div>
      </section>

{/* 3. ডিজিটাল লাইব্রেরি সেকশন - Premium Dark Mode Aesthetic */}
<section className="py-32 relative overflow-hidden bg-[#0A0F1C]">
  
  {/* Separate Background Layer - Glowing Mesh Gradient */}
  <div className="absolute inset-0 z-0">
    <motion.div 
      animate={{ 
        scale: [1, 1.1, 1],
        opacity: [0.1, 0.2, 0.1] 
      }}
      transition={{ duration: 12, repeat: Infinity }}
      className="absolute top-[-15%] right-[-10%] w-[80%] h-[80%] bg-[#10B981] rounded-full blur-[150px]" 
    />
    <motion.div 
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.05, 0.15, 0.05] 
      }}
      transition={{ duration: 18, repeat: Infinity, delay: 1 }}
      className="absolute bottom-[-15%] left-[-10%] w-[70%] h-[70%] bg-indigo-500 rounded-full blur-[150px]" 
    />
    {/* Subtle Grid Pattern for Technical Feel */}
    <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
  </div>

  <div className="mx-auto max-w-7xl px-6 lg:px-12 relative z-10">
    
    {/* Custom Header with White/Light Text */}
    <div className="text-center mb-20 space-y-6">
      <motion.span 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="inline-block px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em]"
      >
        E-Learning Resource
      </motion.span>
      <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter">
        স্মার্ট ডিজিটাল <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">লাইব্রেরি</span>
      </h2>
      <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
        রম্বস পাবলিকেশনসের আধুনিক ই-বুক সংগ্রহ নিয়ে তোমার প্রস্তুতি হবে আরও সহজ এবং স্মার্ট।
      </p>
    </div>

    {/* Filter Header - Pure Glassmorphism */}
    <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6 p-8 bg-white/[0.03] backdrop-blur-3xl rounded-[40px] border border-white/[0.1] shadow-2xl">
      <div className="flex items-center gap-5">
        <div className="h-14 w-1.5 bg-emerald-500 rounded-full shadow-[0_0_20px_#10B981]" />
        <div>
           <h3 className="text-2xl font-black text-white tracking-tight">সবগুলো ই-বুক</h3>
           <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1">Access Excellence</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
        <span className="text-sm font-bold text-slate-400">কলেকশন:</span>
        <span className="text-white font-black text-lg">
          {dynamicEbooks.length} <span className="text-xs text-emerald-400 font-bold tracking-widest ml-1">BOOKS</span>
        </span>
      </div>
    </div>

    {/* Grid with Neon-Glow Cards */}
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      className="grid md:grid-cols-2 lg:grid-cols-3 gap-10"
    >
      {dynamicEbooks.map((book) => (
        <motion.div 
          key={book.id}
          variants={fadeInUp}
          className="group relative h-full"
        >
          {/* Outer Card Glow */}
          <div className="absolute inset-0 bg-emerald-500/10 rounded-[48px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative bg-[#111827]/80 backdrop-blur-md border border-white/[0.08] rounded-[48px] p-6 flex gap-6 items-center h-full transition-all duration-500 group-hover:border-emerald-500/40 group-hover:bg-[#161F31]">
            
            {/* Book Cover with 3D Effect */}
            <div className="w-2/5 aspect-[3/4.5] rounded-[28px] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex-shrink-0 transition-all duration-700 group-hover:scale-105 group-hover:-rotate-3 border border-white/10 relative">
              <img 
                src={book.thumbnailUrl || ""} 
                alt={book.name} 
                className="w-full h-full object-cover" 
                onError={(e) => (e.currentTarget.src = "https://placehold.co/400x600?text=Book")} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Content Section - Pure Light Text */}
            <div className="flex-1 flex flex-col h-full py-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Digital Book</span>
                </div>
                
                <h4 className="font-black text-white text-lg leading-tight group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {book.name}
                </h4>

                <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2 font-medium">
                  {book.description || "রম্বস পাবলিকেশনসের আধুনিক ডিজিটাল রিসোর্স।"}
                </p>
              </div>

              {/* Price & CTA Area */}
              <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/5">
                <div className="flex flex-col">
                    <span className="text-emerald-400 font-black text-2xl tracking-tighter">
                      {book.price === 0 ? "FREE" : `৳${book.price}`}
                    </span>
                </div>
                
                <button className="h-12 w-12 rounded-2xl bg-white text-[#0A0F1C] flex items-center justify-center shadow-xl hover:bg-emerald-500 hover:text-white transition-all duration-300 active:scale-90">
                   <ArrowRight className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>

    {/* Bottom Ghost Button */}
    <div className="mt-24 text-center">
        <button className="px-12 py-5 rounded-3xl bg-transparent border border-white/10 text-white font-black uppercase text-xs tracking-[0.3em] hover:bg-white hover:text-slate-900 transition-all duration-500 group">
            এক্সপ্লোর লাইব্রেরি 
            <ArrowRight className="inline-block ml-3 h-4 w-4 transition-transform group-hover:translate-x-2" />
        </button>
    </div>
  </div>
</section>

      {/* 4. Academic Programs - Staggered Entry */}
      <section id="programs" className="py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <SectionHeader 
            badge="Academic Tracks" 
            title="কৌশলী একাডেমিক" 
            gradientTitle="প্রোগ্রাম" 
            subtitle="বোর্ড পরীক্ষা এবং প্রতিযোগিতামূলক ভর্তি পরীক্ষায় সাফল্যের জন্য আমাদের বিশেষ লার্নিং ট্র্যাক।" 
          />
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {programs.map((prog) => (
              <motion.div 
                key={prog.id} 
                variants={fadeInUp}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative overflow-hidden rounded-[48px] bg-white border border-slate-100 p-10 shadow-sm hover:shadow-2xl transition-all duration-500"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 transition-all duration-500 group-hover:scale-150" />
                <div className="relative mb-10 h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-[#5C2D91] group-hover:text-white transition-all duration-500 shadow-inner">
                  <Monitor className="h-8 w-8" />
                </div>
                <h3 className="relative text-2xl font-black text-slate-900 mb-4 leading-tight">{prog.name}</h3>
                <Link href={`#courses`} className="relative inline-flex items-center gap-3 text-xs font-black uppercase text-indigo-600 hover:gap-5 transition-all">বিস্তারিত দেখুন <ArrowRight className="h-4 w-4" /></Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 5. Interactive Feature Section - Smooth Content Transitions */}
      <section className="py-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-[#111827] text-white overflow-hidden rounded-[64px] mx-4 lg:mx-12 my-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)]"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-12 py-24">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-black">একাডেমিক প্রোগ্রামে <span className="text-[#FF2D8C]">যা যা থাকছে</span></h2>
              <p className="text-slate-400 text-lg">ক্লাসের পড়ায় ও বোর্ড পরীক্ষার প্রস্তুতিতে এগিয়ে থাকতে আমাদের প্রোগ্রামে রয়েছে-</p>
            </div>
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-3">
                {interactiveFeatures.map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item)} 
                    className={cn(
                      "w-full flex items-center justify-between p-6 rounded-2xl transition-all duration-300 relative group",
                      activeTab.id === item.id ? "bg-white text-[#1F3E76] shadow-2xl scale-[1.02]" : "bg-white/5 text-white hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div className={cn("p-3 rounded-xl transition-colors", activeTab.id === item.id ? "bg-indigo-50 text-[#5C2D91]" : "bg-white/10 group-hover:bg-white/20")}>{item.icon}</div>
                      <span className="text-lg font-bold">{item.title}</span>
                    </div>
                    {activeTab.id === item.id && <motion.div layoutId="tab-arrow" className="absolute -right-3 top-1/2 -translate-y-1/2 border-t-[10px] border-t-transparent border-l-[12px] border-l-white border-b-[10px] border-b-transparent hidden lg:block" />}
                  </button>
                ))}
              </div>
              
              <div className="relative flex justify-center lg:justify-end">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={activeTab.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="relative w-full max-w-[520px] aspect-[4/3] bg-gradient-to-br from-slate-800 to-slate-900 rounded-[40px] overflow-hidden border-[12px] border-slate-800 shadow-2xl"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                       <div className="w-full h-full bg-[#0D1117] rounded-[24px] relative overflow-hidden shadow-inner">
                          <div className="p-5 flex items-center justify-between bg-white/5 text-[11px] text-slate-400 font-bold border-b border-white/5">
                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> এনামুল ইসলাম রিহান</span>
                          </div>
                          <img 
                            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400" 
                            className="h-full object-contain mx-auto mt-4 grayscale-[20%]" 
                            alt="Instructor"
                            onError={(e) => handleImageError(e, "Instructor")} 
                          />
                          <div className="absolute bottom-6 left-6 right-6 flex justify-between text-[11px] font-bold">
                             <span className="bg-indigo-600/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5" /> চ্যাট</span>
                             <span className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full"><UsersIcon className="h-3.5 w-3.5 inline mr-1" /> ৫৫৪ জন যুক্ত</span>
                          </div>
                       </div>
                       <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -left-8 bottom-12 w-[280px] bg-white rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-l-8 border-[#5C2D91] text-slate-900"
                       >
                          <p className="text-[10px] font-black text-[#5C2D91] mb-2 uppercase tracking-[0.2em]">লেকচার ক্লাস</p>
                          <h4 className="text-base font-black text-slate-800 mb-2 leading-tight">{activeTab.previewTitle}</h4>
                          <p className="text-[11px] text-slate-400 font-bold mb-5 flex items-center gap-2"><CalendarDays className="h-3 w-3" /> {activeTab.previewTime}</p>
                          <Button className="w-full h-10 bg-gradient-to-r from-[#5C2D91] to-[#FF2D8C] text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95">এখনই জয়েন করো</Button>
                       </motion.div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 6. Admission Preparation Section - Refined with Glassmorphism */}
      <section id="admission-prep" className="py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <SectionHeader 
            badge="Premium Preparation" 
            title="ভর্তি পরীক্ষার" 
            gradientTitle="সম্পূর্ণ প্রস্তুতি" 
            subtitle="মেডিকেল, ইঞ্জিনিয়ারিং ও ভার্সিটি ভর্তি পরীক্ষার জন্য সম্পূর্ণ প্রস্তুতি নিন রম্বস পাবলিকেশনসের সাথে" 
          />

          <div className="flex flex-wrap items-center justify-center gap-6 mb-20">
            {programs.map((prog) => (
              <div key={prog.id} onClick={() => setActiveAdmissionTab(prog.name)}>
                <TabItem 
                  icon={GraduationCap} 
                  title={prog.name} 
                  count={String(prog._count?.courses || 0)} 
                  isActive={activeAdmissionTab === prog.name} 
                />
              </div>
            ))}
            <TabItem icon={Layers3} title="প্রশ্নব্যাংক" count={String(admissionBooks.length)} />
          </div>

          <div className="flex items-center justify-between mb-12 border-b border-slate-100 pb-6">
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">
              {activeAdmissionTab} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] to-emerald-600">বান্ডেল</span>
            </h3>
            <Link href="#" className="text-sm font-bold text-[#5C2D91] hover:text-[#FF2D8C] transition-colors flex items-center gap-2">সবগুলো দেখুন <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {admissionBooks.map((book) => (
              <ProductCard 
                key={book.id}
                image={book.thumbnailUrl || ""}
                title={book.name}
                subtext={book.description || ""}
                price={`৳${book.price}`}
                previousPrice="৳300"
              />
            ))}
            {admissionBooks.length === 0 && !loading && (
              <div className="col-span-full py-24 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-white/50">
                <Layers3 className="h-16 w-16 text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold text-xl">এই ক্যাটাগরিতে কোনো বই পাওয়া যায়নি</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* 7. Trust & Testimonial Section - Enhanced Blue Gradient */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#1F3E76] via-[#3B4D9A] to-[#5C2D91] rounded-[60px] pt-20 pb-40 px-10 lg:px-20 relative shadow-[0_40px_100px_-20px_rgba(31,62,118,0.3)]"
          >
            <div className="grid lg:grid-cols-2 gap-20 items-start">
              <div className="text-white space-y-8">
                <h2 className="text-4xl md:text-6xl font-extrabold leading-tight">কেন <span className="text-[#FF2D8C]">SpondonPro</span>-তে আস্থা রাখবে?</h2>
                <p className="text-xl text-white/80 font-medium leading-relaxed max-w-lg">সেরা মেন্টর ও সর্বাধুনিক প্রযুক্তির সাথে সারাদেশের ৩০ লক্ষ+ শিক্ষার্থীর মানসম্মত পড়ালেখা ও পরীক্ষা প্রস্তুতির নির্ভরযোগ্য প্রতিষ্ঠান!</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {trustFeatures.map((item, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ y: -5, scale: 1.05 }}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[32px] p-8 flex flex-col items-center text-center gap-4 shadow-xl cursor-default transition-all duration-300"
                  >
                    <div className="text-4xl bg-white/10 w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner">{item.icon}</div>
                    <span className="text-white font-black text-base leading-tight">{item.title}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-full max-w-5xl px-6 lg:px-0 flex items-center justify-center gap-6">
              <button onClick={() => setTestimonialIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))} className="hidden md:flex h-14 w-14 rounded-full bg-white shadow-2xl items-center justify-center text-[#3B4D9A] hover:bg-[#FF2D8C] hover:text-white transition-all duration-300 z-40 active:scale-90"><ChevronLeft className="h-7 w-7" /></button>
              <motion.div key={testimonialIndex} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[48px] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.2)] p-10 lg:p-14 flex flex-col md:flex-row gap-12 items-center border border-slate-50 z-30">
                <div className="flex-1 space-y-8">
                  <div className="bg-[#F3E8FF] w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner"><Quote className="h-8 w-8 text-[#A855F7] fill-[#A855F7]" /></div>
                  <p className="text-xl lg:text-2xl font-bold text-slate-800 leading-relaxed italic">"{testimonials[testimonialIndex].quote}"</p>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black text-[#1F3E76]">{testimonials[testimonialIndex].name}</h4>
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">{testimonials[testimonialIndex].info}</p>
                  </div>
                </div>
                <div className="relative w-full md:w-[420px] aspect-[16/10] rounded-[32px] overflow-hidden group shadow-2xl">
                  <img src={testimonials[testimonialIndex].videoThumb} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Student" />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all duration-500 flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500"><Play className="h-8 w-8 fill-current ml-1" /></div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent"><p className="text-white text-[13px] font-black leading-tight text-center tracking-wide">{testimonials[testimonialIndex].videoLabel}</p></div>
                </div>
              </motion.div>
              <button onClick={() => setTestimonialIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))} className="hidden md:flex h-14 w-14 rounded-full bg-white shadow-2xl items-center justify-center text-[#3B4D9A] hover:bg-[#FF2D8C] hover:text-white transition-all duration-300 z-40 active:scale-90"><ChevronRight className="h-7 w-7" /></button>
            </div>
          </motion.div>
        </div>
        <div className="h-40" />
      </section>

      {/* 8. Course Plans - Staggered Grid */}
      <section id="courses" className="py-32 relative overflow-hidden">
        {/* Dynamic Background Orbs */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-gradient-to-tr from-emerald-100/50 to-teal-100/50 rounded-full blur-[120px]" />

        <div className="mx-auto max-w-7xl px-6 lg:px-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <SectionHeader 
                  badge="Premium Learning" 
                  title="আমাদের চলমান" 
                  gradientTitle="কোর্সসমূহ" 
                  subtitle="নিজেদের প্রস্তুত করুন আগামী দিনের চ্যালেঞ্জ মোকাবিলায়।" 
                  className="text-left mx-0"
              />
              <div className="hidden md:flex gap-3 mb-4">
                  <div className="px-5 py-2 rounded-full border border-slate-200 bg-white shadow-sm text-sm font-bold text-slate-600">
                      সবগুলো ({courses.length})
                  </div>
              </div>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3"
          >
            {courses.length > 0 ? courses.map((course) => (
              <motion.div 
                key={course.id} 
                variants={fadeInUp}
                className="group relative h-full"
              >
                <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 rounded-[40px] opacity-0 group-hover:opacity-100 blur-[2px] transition-opacity duration-500" />
                
                <div className="relative h-full bg-white rounded-[40px] overflow-hidden flex flex-col transition-all duration-500 group-hover:translate-y-[-8px]">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={course.thumbnail || ""} alt={course.name} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" />
                    <div className="absolute top-5 left-5">
                      <div className="backdrop-blur-md bg-black/20 border border-white/30 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                         {course.type === 'ONLINE' ? '• Online' : '• Offline'}
                      </div>
                    </div>
                    <div className="absolute bottom-5 right-5 bg-white px-4 py-2 rounded-2xl shadow-2xl flex flex-col items-center border border-slate-50">
                      <span className="text-[10px] text-slate-400 font-bold uppercase leading-none mb-1">Fee</span>
                      <span className="text-xl font-black text-[#5C2D91]">৳{String(course.fee)}</span>
                    </div>
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{course.name}</h3>
                      <div className="flex items-center gap-6 mt-6 py-4 border-y border-slate-50">
                          <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ব্যাচ সংখ্যা</span>
                              <span className="text-sm font-bold text-slate-700">০৫ টি</span>
                          </div>
                          <div className="h-8 w-[1px] bg-slate-100" />
                          <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ভর্তি শেষ</span>
                              <span className="text-sm font-bold text-red-500">১৫ দিন বাকি</span>
                          </div>
                      </div>
                    </div>
                    <Link href={`/course/${course.id}`} className="mt-8 block">
                      <button className="relative w-full group/btn overflow-hidden h-14 rounded-2xl bg-slate-900 transition-all duration-300">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-emerald-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                          <div className="relative flex items-center justify-center gap-2 text-white font-black uppercase text-xs tracking-widest">
                              ভর্তি সংক্রান্ত তথ্য
                              <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                          </div>
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )) : [1,2,3].map(i => (
                <div key={i} className="h-[550px] rounded-[40px] bg-white animate-pulse border border-slate-100 shadow-sm" />
            ))}
          </motion.div>
        </div>
      </section>

      {/* 9. Payment Partners - Simplified & Elegant */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="flex flex-col items-center gap-12">
            <div className="text-center space-y-3">
              <Badge className="bg-blue-50 text-blue-600 border-blue-100 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-sm">Secure Checkout</Badge>
              <h3 className="text-3xl font-black text-slate-800">পেমেন্ট পার্টনার</h3>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="w-full max-w-4xl bg-slate-50/50 backdrop-blur-sm rounded-[48px] p-10 md:p-16 border border-slate-100 flex items-center justify-center transition-all duration-500 hover:shadow-2xl hover:bg-white hover:scale-[1.01]"
            >
              <img 
                src="/images/SSL-Commerz-Pay-With-logo-All-Size-01-570x213.png" 
                alt="SSLCommerz Payment Partners" 
                className="max-w-full h-auto object-contain filter drop-shadow-2xl grayscale-[0.2] hover:grayscale-0 transition-all duration-500"
                onError={(e) => handleImageError(e, "Payment Gateway")}
              />
            </motion.div>

            <div className="flex items-center gap-4 text-slate-300">
              <div className="h-px w-16 bg-slate-200" />
              <p className="text-[11px] font-black uppercase tracking-[0.3em]">Verified by SSLCOMMERZ</p>
              <div className="h-px w-16 bg-slate-200" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
