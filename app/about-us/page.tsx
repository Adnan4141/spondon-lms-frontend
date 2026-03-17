'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { PlayCircle, Target, Users, Lightbulb } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';

const coreValues = [
  { title: 'LEARNER FIRST', img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800', color: 'bg-rose-50' },
  { title: 'EXECUTE AT SPEED', img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800', color: 'bg-orange-50' },
  { title: 'GROW 100X', img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800', color: 'bg-blue-50' },
  { title: 'SEIZE OWNERSHIP', img: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=800', color: 'bg-emerald-50' },
  { title: 'STRIVE FOR EXCELLENCE', img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800', color: 'bg-indigo-50' },
  { title: 'THINK DIFFERENT', img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800', color: 'bg-pink-50' },
];

export default function AboutUsPage() {
  return (
    <main className="bg-white min-h-screen">
      <Header />
      
      {/* --- Section 1: Hero Section --- */}
      <section className="relative min-h-[70vh] sm:min-h-[75vh] md:h-[80vh] flex items-center overflow-hidden">
        {/* Background Gradient & Image Overlay */}
        <div className="absolute inset-0 bg-[#0F172A] z-0" />
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-0" />
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-indigo-500/20 blur-[100px] sm:blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-emerald-500/10 blur-[80px] sm:blur-[100px] rounded-full" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 grid md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center pt-16 sm:pt-20 pb-12 sm:pb-0">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-white space-y-4 sm:space-y-6 md:space-y-8 order-2 md:order-1"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] sm:text-xs font-black uppercase tracking-widest backdrop-blur-sm">
              আমাদের লক্ষ্য
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.15] tracking-tighter">
              চিন্তার স্পন্দনে, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">স্বপ্নের সন্ধানে</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-400 leading-relaxed max-w-lg font-medium">
              স্পন্দন, শিক্ষার্থীদের চিন্তার জগৎকে আরও সুন্দর, সুদূরপ্রসারী ও বাস্তবে রূপ দিতে সর্বদা প্রতিজ্ঞাবদ্ধ। প্রতিটি শিক্ষার্থীর সুপ্ত প্রতিভা বিকাশই আমাদের মূল লক্ষ্য।
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group cursor-pointer order-1 md:order-2"
          >
            <div className="rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] overflow-hidden border-4 md:border-8 border-white/5 shadow-2xl relative aspect-video max-w-md mx-auto md:max-w-none">
              <Image 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200" 
                alt="Spondon Journey" 
                fill 
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500 flex items-center justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <PlayCircle className="text-white w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 fill-white/20" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Section 2: Our Story (আমাদের গল্প) --- */}
      <section className="py-16 sm:py-24 md:py-32 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 grid md:grid-cols-2 gap-10 sm:gap-16 md:gap-20 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-2xl border-2 sm:border-4 border-white aspect-[4/5] min-h-[280px]">
              <Image 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000" 
                alt="Our Team" 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {/* Floating Tag */}
            <div className="absolute -bottom-6 -right-4 sm:-bottom-10 sm:-right-6 bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-100 hidden sm:block max-w-[220px] sm:max-w-[280px]">
              <p className="text-[#5C2D91] font-black text-lg sm:text-2xl leading-tight">Caring the potentiality</p>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 sm:mt-2 font-bold uppercase tracking-widest">Our Core Philosophy</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6 sm:space-y-8"
          >
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-slate-900 leading-tight tracking-tighter">
                আমাদের <span className="text-[#5C2D91]">গল্প</span>
              </h2>
              <div className="h-1.5 sm:h-2 w-16 sm:w-24 bg-gradient-to-r from-[#5C2D91] to-[#FF2D8C] rounded-full" />
            </div>
            
            <div className="text-slate-600 space-y-4 sm:space-y-6 leading-relaxed text-sm sm:text-base md:text-lg lg:text-xl font-medium">
              <p>
                চিন্তার বিকাশের মাধ্যমে প্রতিনিয়ত এগিয়ে যাওয়া মানুষের চিন্তার জগতেই তার ভাবনাগুলো ফুটে ওঠে। আর ভাবনা গুলো নতুন নতুন পথে নিজেদের বিভিন্ন রঙ্গে মেলে বেড়ায়।
              </p>
              <p>
                স্পন্দনের প্রতিটি কার্যক্রম মূলত শিক্ষার্থীদের এই চিন্তার জগৎকে আরও সুন্দর, আরও সুদূরপ্রসারী ও বাস্তবে রূপ দেয়াতেই সর্বদা ব্যস্ত। প্রতিটি শিক্ষার্থীর সুপ্ত প্রতিভা বিকাশের মূল লক্ষ্য নিয়ে আমাদের পথচলা।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-6 sm:pt-8">
              <div className="flex items-center gap-4 sm:gap-5 p-4 sm:p-6 rounded-xl sm:rounded-[2rem] bg-white border border-slate-100 shadow-sm group hover:shadow-xl transition-all duration-500">
                <div className="bg-indigo-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-indigo-600 group-hover:bg-[#5C2D91] group-hover:text-white transition-all duration-500 shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div><p className="font-black text-slate-900 uppercase tracking-tight text-sm sm:text-base">এক্সপার্ট মেন্টর</p></div>
              </div>
              <div className="flex items-center gap-4 sm:gap-5 p-4 sm:p-6 rounded-xl sm:rounded-[2rem] bg-white border border-slate-100 shadow-sm group hover:shadow-xl transition-all duration-500">
                <div className="bg-rose-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-rose-600 group-hover:bg-[#FF2D8C] group-hover:text-white transition-all duration-500 shrink-0">
                  <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div><p className="font-black text-slate-900 uppercase tracking-tight text-sm sm:text-base">ক্রিয়েটিভ লজিক</p></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Section 3: Core Values (আমাদের মূল ভিত্তি) --- */}
      <section className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-12 sm:mb-16 md:mb-20 space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-slate-900 tracking-tighter">আমাদের মূল <span className="text-[#FF2D8C]">ভিত্তি</span></h2>
            <p className="text-slate-500 text-sm sm:text-base md:text-lg font-medium max-w-2xl mx-auto">এই আদর্শগুলোই আমাদের প্রতিদিনের পথচলার অনুপ্রেরণা এবং সফলতার চাবিকাঠি</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
            {coreValues.map((value, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className={`${value.color} rounded-[2rem] sm:rounded-[3rem] overflow-hidden group hover:shadow-2xl transition-all duration-500 border border-white relative`}
              >
                <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
                  <Image 
                    src={value.img || 'https://placehold.co/800x400?text=Image'} 
                    alt={value.title} 
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw" 
                    className="object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all duration-500" />
                </div>
                <div className="p-5 sm:p-6 md:p-8 text-center bg-white/80 backdrop-blur-md border-t border-white/50">
                  <h3 className="font-black text-slate-800 tracking-widest text-xs sm:text-sm uppercase">
                    {value.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Section 4: Mission/Vision Footer --- */}
      <section className="py-16 sm:py-24 md:py-32 bg-[#0F172A] mb-12 sm:mb-20 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-indigo-500/20 blur-[100px] sm:blur-[120px] rounded-full -mr-24 sm:-mr-48 -mt-24 sm:-mt-48" />
        <div className="absolute bottom-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-[#FF2D8C]/10 blur-[100px] sm:blur-[120px] rounded-full -ml-24 sm:-ml-48 -mb-24 sm:-mb-48" />
        
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-8 sm:space-y-10 md:space-y-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl mb-6 sm:mb-10">
              <Target className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-indigo-400" />
            </div>
          </motion.div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black leading-tight tracking-tight">
            "স্পন্দনের নামের সাথেই জড়িয়ে আছে প্রতিটি শিক্ষার্থীর জন্য <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Caring the potentiality</span>"
          </h2>
          <p className="text-slate-400 text-sm sm:text-base md:text-lg lg:text-xl font-medium opacity-80 max-w-2xl mx-auto">
            আমরা বিশ্বাস করি প্রতিটি প্রশ্নই নতুন একটি চিন্তার দুয়ার খুলে দেয় এবং প্রতিটি শিক্ষার্থীই আগামীর সম্পদ।
          </p>
          <div className="pt-6 sm:pt-10">
            <Link href="/login">
              <button className="h-12 sm:h-14 md:h-16 px-8 sm:px-10 md:px-12 rounded-xl sm:rounded-2xl bg-white text-[#0F172A] font-black uppercase text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all shadow-2xl cursor-pointer active:scale-95">
                আমাদের সাথে যুক্ত হোন
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
