'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SectionHeader } from './shared/SectionHeader';
import { CourseCard } from './shared/CourseCard';
import type { Course } from '@/types/course';

interface Props {
  courses: Course[];
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>, text?: string) => void;
  badge?: string;
  title?: string;
  titleHighlight?: string;
  subtitle?: string;
  buttonText?: string;
}

export const CoursesSection: React.FC<Props> = ({
  courses,
  handleImageError,
  badge = 'Premium Learning',
  title = 'আমাদের সবচেয়ে ',
  titleHighlight = 'জনপ্রিয় কোর্সসমূহ',
  subtitle = 'নিজেদের প্রস্তুত করুন আগামী দিনের চ্যালেঞ্জ মোকাবিলায়।',
  buttonText = 'সকল কোর্স দেখুন',
}) => (
  <section id="courses" className="py-16 sm:py-24 md:py-32 relative overflow-hidden bg-gradient-to-br from-white via-amber-50/40 to-white">
    <div className="pointer-events-none absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-[120px] mix-blend-multiply opacity-70" />
    <div className="pointer-events-none absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-gradient-to-tr from-emerald-100/50 to-teal-100/50 rounded-full blur-[120px] mix-blend-multiply opacity-70" />
   
    <div className="mx-auto max-w-7xl px-6 lg:px-12 relative z-10">
      <div className="flex flex-col items-center gap-4 sm:gap-6 mb-1 sm:mb-1 text-center">
        <SectionHeader
          badge={badge}
          title={title}
          gradientTitle={titleHighlight}
          subtitle={subtitle}
          className="text-center mx-auto"
        />
         <div className='flex justify-center items-center -mt-10 mb-10 pb-5'>
      <Link href="/courses" className="cursor-pointer">
          <button className="group flex text-center items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 text-slate-900 font-black uppercase text-[10px] sm:text-[11px] tracking-widest hover:bg-[#5C2D91] hover:text-white transition-all shadow-sm mb-4 cursor-pointer">
            {buttonText}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </Link>
     </div>
      </div>

      <motion.div
        initial="visible"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
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
        className="grid gap-6 sm:gap-8 md:gap-10 sm:grid-cols-2 lg:grid-cols-3"
      >
        {courses.length > 0 ? (
          courses.map((course) => (
            <CourseCard key={course.id} course={course} handleImageError={handleImageError} />
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
