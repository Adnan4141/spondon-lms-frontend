'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SectionHeader } from './shared/SectionHeader';
import { staggerContainer, fadeInUp } from '@/lib/animations/landing';
import type { Course } from '@/types/course';

interface Props {
  courses: Course[];
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>, text?: string) => void;
}

export const CoursesSection: React.FC<Props> = ({ courses, handleImageError }) => (
  <section id="courses" className="py-32 relative overflow-hidden bg-gradient-to-br from-white via-amber-50/40 to-white">
    <div className="pointer-events-none absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-[120px] mix-blend-multiply opacity-70" />
    <div className="pointer-events-none absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-gradient-to-tr from-emerald-100/50 to-teal-100/50 rounded-full blur-[120px] mix-blend-multiply opacity-70" />
    <div className="mx-auto max-w-7xl px-6 lg:px-12 relative z-10">
      <div className="flex flex-col items-center gap-6 mb-16">
        <SectionHeader
          badge="Premium Learning"
          title="আমাদের সবচেয়ে "
          gradientTitle="জনপ্রিয় কোর্সসমূহ"
          subtitle="নিজেদের প্রস্তুত করুন আগামী দিনের চ্যালেঞ্জ মোকাবিলায়।"
          className="text-center mx-auto"
        />
        
      </div>

      <motion.div
        initial="visible"
        whileInView="visible"
        viewport={{ once: true, margin: "400px 0px" }}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05,
              delayChildren: 0,
            },
          },
        }}
        className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3"
      >
        {courses.length > 0 ? (
          courses.map((course) => (
            <motion.div 
              key={course.id} 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.4, ease: 'easeOut' },
                },
              }} 
              className="group relative h-full"
            >
              <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 rounded-[40px] opacity-0 group-hover:opacity-100 blur-[2px] transition-opacity duration-500" />
              <div className="relative h-full bg-white rounded-[40px] overflow-hidden flex flex-col transition-all duration-500 group-hover:translate-y-[-8px]">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={course.thumbnail || ''}
                    alt={course.name}
                    className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                    onError={(e) => handleImageError(e, 'Course')}
                  />
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
                        ভর্তি সংক্রান্ত তথ্য <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-[550px] rounded-[40px] bg-white animate-pulse border border-slate-100 shadow-sm" />
          ))
        )}
      </motion.div>
    </div>
  </section>
);
