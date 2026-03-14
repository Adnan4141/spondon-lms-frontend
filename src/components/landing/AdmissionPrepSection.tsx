'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { GraduationCap, Layers3, ArrowRight } from 'lucide-react';
import { SectionHeader } from './shared/SectionHeader';
import { TabItem } from './shared/TabItem';
import { ProductCard } from './shared/ProductCard';
import { staggerContainer } from '@/lib/animations/landing';
import type { Program } from '@/types/course';
import type { Book } from '@/lib/api/books';

interface Props {
  programs: Program[];
  admissionBooks: Book[];
  activeAdmissionTab: string;
  setActiveAdmissionTab: (name: string) => void;
  loading: boolean;
}

export const AdmissionPrepSection: React.FC<Props> = ({
  programs,
  admissionBooks,
  activeAdmissionTab,
  setActiveAdmissionTab,
  loading,
}) => (
  <section
    id="admission-prep"
    className="relative py-32 overflow-hidden bg-white"
  >

    {/* TOP RADIAL LIGHT */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-r from-emerald-200 via-indigo-200 to-sky-200 blur-[120px] opacity-60 rounded-full"></div>

    {/* LEFT GLOW */}
    <div className="absolute top-40 -left-40 w-[500px] h-[500px] bg-indigo-300/30 blur-[140px] rounded-full"></div>

    {/* RIGHT GLOW */}
    <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] bg-emerald-300/30 blur-[140px] rounded-full"></div>

    <div className="relative mx-auto max-w-7xl px-6 lg:px-12">

      <SectionHeader
        badge="Premium Preparation"
        title="ভর্তি পরীক্ষার"
        gradientTitle="সম্পূর্ণ প্রস্তুতি"
        subtitle="মেডিকেল, ইঞ্জিনিয়ারিং ও ভার্সিটি ভর্তি পরীক্ষার জন্য সম্পূর্ণ প্রস্তুতি নিন রম্বস পাবলিকেশনসের সাথে"
      />

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-6 mb-20">
        {programs.map((prog) => (
          <div key={prog.id} onClick={() => setActiveAdmissionTab(prog.name)}>
            <TabItem
              icon={GraduationCap}
              title={prog.name}
              count={String(prog._count?.courses || 0)}
              isActive={activeAdmissionTab === prog.name}
            />
          </div>
        ))}

        <TabItem
          icon={Layers3}
          title="প্রশ্নব্যাংক"
          count={String(admissionBooks.length)}
        />
      </div>

      {/* Header Row */}
      <div className="flex items-center justify-between mb-14 border-b border-slate-200 pb-6">
        <h3 className="text-3xl font-black text-slate-800 tracking-tight">

          {activeAdmissionTab}

          <span className="ml-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500">
            বান্ডেল
          </span>

        </h3>

        <Link
          href="#"
          className="text-sm font-bold text-indigo-600 hover:text-emerald-500 transition flex items-center gap-2"
        >
          সবগুলো দেখুন
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Books Grid */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-10"
      >
        {admissionBooks.map((book) => (
          <ProductCard
            key={book.id}
            image={book.thumbnailUrl || ''}
            title={book.name}
            subtext={book.description || ''}
            price={`৳${book.price}`}
            previousPrice="৳300"
          />
        ))}

        {admissionBooks.length === 0 && !loading && (
          <div className="col-span-full py-24 rounded-[36px] border border-dashed border-slate-200 flex flex-col items-center justify-center bg-white/70 backdrop-blur-lg">
            <Layers3 className="h-16 w-16 text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold text-xl">
              এই ক্যাটাগরিতে কোনো বই পাওয়া যায়নি
            </p>
          </div>
        )}
      </motion.div>

    </div>
  </section>
);