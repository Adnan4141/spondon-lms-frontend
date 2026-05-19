'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { API_ORIGIN } from '@/lib/api';
import type { CourseDetails } from '@/types/course';

type Props = {
  course: CourseDetails;
  heroHeading: string;
};

export function CourseHero({ course, heroHeading }: Props) {
  return (
    <div className="relative overflow-hidden bg-[#0F172A] pb-16 pt-28 md:pb-24">
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px]" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-6 md:grid-cols-2 md:gap-16 lg:px-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-400">
              {course.program?.name || 'Academic'}
            </span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400">
              {course.type === 'ONLINE' ? '• Online Course' : '• Offline Course'}
            </span>
          </div>

          <h1 className="mb-6 text-4xl font-black leading-tight tracking-tighter text-white md:text-5xl lg:text-6xl">
            {heroHeading}
          </h1>

          <div
            className="prose prose-invert mb-10 max-w-xl text-base font-medium leading-relaxed text-slate-400 md:text-lg"
            dangerouslySetInnerHTML={{
              __html: course.description || 'আপনার স্বপ্ন পূরণের যাত্রায় আমরা আছি আপনার পাশে।',
            }}
          />
        </motion.div>

        {course.thumbnail ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full"
          >
            <div className="relative aspect-video overflow-hidden rounded-2xl border-4 border-white/10 shadow-2xl md:rounded-3xl">
              <Image
                src={resolveAttachmentUrl(course.thumbnail, API_ORIGIN)}
                alt={course.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
