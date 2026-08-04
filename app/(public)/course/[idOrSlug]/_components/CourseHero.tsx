'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { BookOpen, Award, Clock } from 'lucide-react';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { API_ORIGIN } from '@/lib/api';
import type { CourseDetails } from '@/types/course';

type Props = {
  course: CourseDetails;
  heroHeading: string;
};

export function CourseHero({ course, heroHeading }: Props) {
  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  } as const;

  return (
    <div className="relative overflow-hidden bg-[#070913] pb-12 pt-20 md:pb-16 md:pt-24">
      {/* Background Mesh Glows */}
      <div className="absolute right-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute left-[-5%] bottom-[-10%] h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute left-[30%] top-[20%] h-[300px] w-[300px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-2 md:gap-16 lg:px-12">
        {/* Left Column - Content */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-start text-left"
        >
          {/* Badge row */}
          <motion.div variants={itemVariants} className="mb-6 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-300 backdrop-blur-xs">
              {course.program?.name || 'Academic Program'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300 backdrop-blur-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {course.type === 'ONLINE' ? 'Online Admission' : 'On-Campus Admission'}
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            variants={itemVariants}
            className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent"
          >
            {heroHeading}
          </motion.h1>

          {/* Description */}
          <motion.div
            variants={itemVariants}
            className="prose prose-invert mb-10 max-w-xl text-base font-normal leading-relaxed text-slate-400 md:text-lg"
            dangerouslySetInnerHTML={{
              __html: course.description || 'আপনার স্বপ্ন পূরণের যাত্রায় আমরা আছি আপনার পাশে। সেরা মেন্টরদের সাথে আজই প্রস্তুতি শুরু করুন।',
            }}
          />

         
        </motion.div>

        {/* Right Column - Thumbnail with Interactive Overlay */}
        {course.thumbnail ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full relative group"
          >
            {/* Outer Glow Effect on Hover */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 opacity-20 blur-xl transition duration-500 group-hover:opacity-40 group-hover:duration-200" />
            
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl md:rounded-3xl">
              <Image
                src={resolveAttachmentUrl(course.thumbnail, API_ORIGIN)}
                alt={course.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-103"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
