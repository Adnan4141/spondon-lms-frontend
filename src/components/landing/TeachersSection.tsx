'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import type { PublicTeacher } from '@/lib/api/teachers';

interface Props {
  teachers: PublicTeacher[];
}

export const TeachersSection: React.FC<Props> = ({ teachers }) => {
  if (!teachers.length) return null;

  return (
    <section className="py-12 sm:py-20 bg-linear-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.5em] mb-4">
            OUR TEACHERS
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            আমাদের শিক্ষকমণ্ডলী
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {teachers.map((teacher, i) => (
            <motion.div
              key={teacher.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Photo */}
              <div className="relative w-full aspect-square bg-linear-to-br from-indigo-100 to-purple-100 overflow-hidden">
                {teacher.profileImage ? (
                  <Image
                    src={resolveAttachmentUrl(teacher.profileImage, API_ORIGIN)}
                    alt={teacher.fullName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-5xl text-indigo-200 font-black select-none">
                    {teacher.fullName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col flex-1 p-4 gap-3">
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug">
                    {teacher.fullName}
                  </h3>
                  {(teacher.designation || teacher.institute) && (
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      {[teacher.designation, teacher.institute].filter(Boolean).join(' , ')}
                    </p>
                  )}
                  {teacher.experienceYears != null && (
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Experience: {teacher.experienceYears} Years
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <div className="mt-auto">
                  <Link
                    href={`/teachers/${teacher.id}`}
                    className="block w-full text-center rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[11px] font-black tracking-tight py-2.5 px-3 transition-all duration-200 shadow-sm"
                  >
                    স্যারের ভিডিও ক্লাস দেখতে ক্লিক করুন
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
