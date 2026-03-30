'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface Teacher {
  id: string;
  fullName: string;
  profileImage?: string | null;
  courses: Array<{ id: string; name: string; code?: string }>;
}

interface Props {
  teachers: Teacher[];
}

export const TeachersSection: React.FC<Props> = ({ teachers }) => {
  if (!teachers.length) return null;

  return (
    <section className="py-12 sm:py-20 bg-gradient-to-b from-slate-50 to-white">
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

        <div className=" grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {teachers.map((teacher, i) => (
            <motion.div
              key={teacher.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="relative w-full aspect-square bg-gradient-to-br from-indigo-100 to-purple-100">
                {teacher.profileImage ? (
                  <Image
                    src={teacher.profileImage}
                    alt={teacher.fullName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl text-indigo-300">
                    👨‍🏫
                  </div>
                )}
              </div>
              <div className="p-4 text-center">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {teacher.fullName}
                </h3>
                {teacher.courses.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {teacher.courses.map(c => c.name).join(', ')}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
