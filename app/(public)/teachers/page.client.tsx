'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import type { PublicTeacher } from '@/lib/api/teachers';
import { cn } from '@/lib/utils';

type Props = {
  initialTeachers: PublicTeacher[];
};

export default function TeachersPageClient({ initialTeachers }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return initialTeachers;
    return initialTeachers.filter((teacher) => {
      const haystack = [
        teacher.fullName,
        teacher.designation,
        teacher.institute,
        ...(teacher.courses?.map((course) => course.name) ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [initialTeachers, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
      <div className="relative overflow-hidden bg-[#0F172A] pb-20 pt-32">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 text-center lg:px-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-4xl font-black tracking-tighter text-white md:text-6xl"
          >
            আমাদের{' '}
            <span className="bg-linear-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              শিক্ষকমণ্ডলী
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-2xl text-lg font-medium text-slate-400"
          >
            স্পন্দনের অভিজ্ঞ মেন্টরদের সাথে SSC, HSC ও অ্যাডমিশন প্রস্তুতি নিন।
          </motion.p>
        </div>
      </div>

      <div className="mx-auto mb-20 max-w-[85rem] px-6 py-16 lg:px-12">
        <div className="mx-auto mb-16 max-w-2xl">
          <div className="group relative">
            <Search className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#5C2D91]" />
            <input
              type="text"
              placeholder="শিক্ষকের নাম, বিষয় বা প্রতিষ্ঠান দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-20 w-full rounded-[28px] border border-slate-100 bg-white pl-16 pr-8 text-lg font-bold text-slate-700 shadow-xl shadow-slate-200/20 outline-none transition-all placeholder:text-slate-300 focus:border-[#5C2D91] focus:ring-4 focus:ring-[#5C2D91]/5"
            />
          </div>
        </div>

        {filteredTeachers.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
            }}
            className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {filteredTeachers.map((teacher, index) => (
              <motion.div
                key={teacher.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <TeacherCard teacher={teacher} priority={index < 4} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-8 py-16 text-center">
            <p className="text-lg font-bold text-slate-700">কোনো শিক্ষক পাওয়া যায়নি</p>
            <p className="mt-2 text-sm text-slate-500">অন্য কীওয়ার্ড দিয়ে আবার চেষ্টা করুন।</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TeacherCard({ teacher, priority = false }: { teacher: PublicTeacher; priority?: boolean }) {
  const img = teacher.profileImage ? resolveAttachmentUrl(teacher.profileImage, API_ORIGIN) : null;
  const subtitle = [teacher.designation, teacher.institute].filter(Boolean).join(' · ');

  return (
    <Link
      href={`/teachers/${teacher.id}`}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white',
        'shadow-md shadow-slate-200/60 transition-all duration-300 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/80',
      )}
    >
      <div className="relative aspect-4/5 w-full overflow-hidden bg-linear-to-br from-indigo-50 via-white to-violet-50">
        {img ? (
          <Image
            src={img}
            alt={teacher.fullName}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 280px"
            priority={priority}
            loading={priority ? undefined : 'lazy'}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl font-black text-indigo-200 select-none">
            {teacher.fullName.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="text-base font-black leading-snug text-slate-900 sm:text-lg">{teacher.fullName}</h2>
        {subtitle ? (
          <p className="line-clamp-2 text-xs font-medium italic leading-relaxed text-slate-600">{subtitle}</p>
        ) : null}
        {teacher.experienceYears != null ? (
          <p className="text-[11px] font-semibold text-slate-500">{teacher.experienceYears} বছরের অভিজ্ঞতা</p>
        ) : null}
        <span className="mt-auto inline-flex w-full items-center justify-center rounded-xl bg-indigo-50 py-2 text-center text-[10px] font-black uppercase tracking-wide text-indigo-700 ring-1 ring-indigo-100 transition-colors group-hover:bg-indigo-100 group-hover:ring-indigo-200">
          প্রোফাইল ও ক্লাস
        </span>
      </div>
    </Link>
  );
}
