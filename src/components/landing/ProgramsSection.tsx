'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Monitor } from 'lucide-react';
import Link from 'next/link';
import { SectionHeader } from './shared/SectionHeader';
import { staggerContainer, fadeInUp } from '@/lib/animations/landing';
import type { Program } from '@/types/course';

interface Props {
  programs: Program[];
}

export const ProgramsSection: React.FC<Props> = ({ programs }) => (
  <section
    id="programs"
    className="relative py-32 overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-sky-50"
  >
    {/* Gradient Blur Blobs */}
    <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-200/40 blur-[120px] rounded-full"></div>
    <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-sky-200/40 blur-[120px] rounded-full"></div>

    <div className="relative mx-auto max-w-7xl px-6 lg:px-12">

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
        className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4"
      >
        {programs.map((prog) => (
          <motion.div
            key={prog.id}
            variants={fadeInUp}
            whileHover={{ y: -10, scale: 1.03 }}
            className="group relative rounded-[44px] p-[2px] bg-gradient-to-br from-indigo-300 via-blue-300 to-sky-300 shadow-xl"
          >
            {/* Glass Card */}
            <div className="relative h-full bg-white/80 backdrop-blur-xl rounded-[42px] p-10 border border-white/40 transition-all duration-500 group-hover:shadow-2xl">

              {/* Decorative Shape */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/40 rounded-full -mr-16 -mt-16 transition-all duration-500 group-hover:scale-150" />

              {/* Icon */}
              <div className="relative mb-8 h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-[#5C2D91] group-hover:text-white transition-all duration-500 shadow-inner">
                <Monitor className="h-8 w-8" />
              </div>

              {/* Title */}
              <h3 className="relative text-2xl font-black text-slate-900 mb-4 leading-tight">
                {prog.name}
              </h3>

              {/* Link */}
              <Link
                href="#courses"
                className="relative inline-flex items-center gap-3 text-xs font-black uppercase text-indigo-600 hover:gap-5 transition-all"
              >
                বিস্তারিত দেখুন <ArrowRight className="h-4 w-4" />
              </Link>

              {/* Glow Hover */}
              <div className="absolute inset-0 rounded-[42px] opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br from-indigo-200/20 via-blue-200/20 to-sky-200/20 blur-2xl"></div>

            </div>
          </motion.div>
        ))}
      </motion.div>

    </div>
  </section>
);