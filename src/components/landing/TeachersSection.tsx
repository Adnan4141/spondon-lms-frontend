'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import type { PublicTeacher } from '@/lib/api/teachers';
import { cn } from '@/lib/utils';

interface Props {
  teachers: PublicTeacher[];
  badge?: string;
  title?: string;
}

function TeacherMarqueeCard({ teacher }: { teacher: PublicTeacher }) {
  const img = teacher.profileImage ? resolveAttachmentUrl(teacher.profileImage, API_ORIGIN) : null;
  const subtitle = [teacher.designation, teacher.institute].filter(Boolean).join(' · ');
  const primaryCourse = teacher.courses?.[0]?.name;

  return (
    <Link
      href={`/teachers/${teacher.id}`}
      className={cn(
        'group flex w-[240px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white',
        'shadow-md shadow-slate-200/60 transition-all duration-300 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/80 sm:w-[280px]'
      )}
    >
      <div className="relative aspect-4/5 w-full overflow-hidden bg-linear-to-br from-indigo-50 via-white to-violet-50">
        {img ? (
          <Image
            src={img}
            alt={teacher.fullName}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="280px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl font-black text-indigo-200 select-none">
            {teacher.fullName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-900/20 via-transparent to-transparent" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {primaryCourse ? (
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">{primaryCourse}</p>
        ) : null}
        <h3 className="text-base font-black leading-snug text-slate-900 sm:text-lg">{teacher.fullName}</h3>
        {subtitle ? (
          <p className="line-clamp-2 text-xs font-medium italic leading-relaxed text-slate-600">{subtitle}</p>
        ) : null}
        {teacher.experienceYears != null ? (
          <p className="text-[11px] font-semibold text-slate-500">
            {teacher.experienceYears} বছরের অভিজ্ঞতা
          </p>
        ) : null}
        <span className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-indigo-50 py-2 text-center text-[10px] font-black uppercase tracking-wide text-indigo-700 ring-1 ring-indigo-100 transition-colors group-hover:bg-indigo-100 group-hover:ring-indigo-200">
          প্রোফাইল ও ক্লাস
        </span>
      </div>
    </Link>
  );
}

export const TeachersSection: React.FC<Props> = ({
  teachers,
  badge = 'OUR TEACHERS',
  title = 'আমাদের শিক্ষকমণ্ডলী',
}) => {
  const durationSec = useMemo(() => {
    const n = teachers.length;
    return Math.min(90, Math.max(28, 22 + n * 9));
  }, [teachers.length]);

  if (!teachers.length) return null;

  return (
    <section className="overflow-hidden bg-linear-to-b from-slate-50 via-white to-slate-50 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center sm:mb-14"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.45em] text-indigo-600">{badge}</p>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl md:text-4xl">{title}</h2>
        </motion.div>
      </div>

      {/* Full-bleed marquee row */}
      <div className="teachers-marquee-wrap relative">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-slate-50 via-white/90 to-transparent sm:w-28"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-slate-50 via-white/90 to-transparent sm:w-28"
          aria-hidden
        />

        <div className="overflow-hidden px-2 sm:px-4">
          <div
            className="teachers-marquee-track gap-4 sm:gap-5 py-1"
            style={
              {
                '--teachers-marquee-duration': `${durationSec}s`,
              } as React.CSSProperties
            }
          >
            {teachers.map((teacher) => (
              <TeacherMarqueeCard key={teacher.id} teacher={teacher} />
            ))}
            {teachers.map((teacher) => (
              <TeacherMarqueeCard key={`${teacher.id}-marquee-dup`} teacher={teacher} />
            ))}
          </div>
        </div>
      </div>

     
    </section>
  );
};
