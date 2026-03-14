'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Users, Clock, BookOpen } from 'lucide-react';
import type { Course } from '@/types/course';

interface Props {
  course: Course;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>, text?: string) => void;
}

export const CourseListCard: React.FC<Props> = ({ course, handleImageError }) => (
  <motion.div 
    variants={{
      hidden: { opacity: 0, x: -20 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.4, ease: 'easeOut' },
      },
    }} 
    className="group relative w-full mb-6"
  >
    <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 rounded-[32px] opacity-0 group-hover:opacity-100 blur-[2px] transition-opacity duration-500" />
    <div className="relative bg-white rounded-[32px] overflow-hidden flex flex-col md:flex-row transition-all duration-500 group-hover:translate-y-[-4px] border border-slate-100 shadow-sm hover:shadow-xl">
      
      {/* Thumbnail Container */}
      <div className="relative w-full md:w-72 h-48 md:h-auto overflow-hidden flex-shrink-0">
        <img
          src={course.thumbnail || ''}
          alt={course.name}
          className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
          onError={(e) => handleImageError(e, 'Course')}
        />
        <div className="absolute top-4 left-4">
          <div className="backdrop-blur-md bg-black/20 border border-white/30 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
            {course.type === 'ONLINE' ? '• Online' : '• Offline'}
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-6 md:p-8 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-tight group-hover:text-[#5C2D91] transition-colors line-clamp-1">
              {course.name}
            </h3>
            <div className="bg-[#5C2D91]/5 px-4 py-2 rounded-xl border border-[#5C2D91]/10 flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-bold uppercase leading-none mb-1">Fee</span>
              <span className="text-xl font-black text-[#5C2D91]">৳{String(course.fee)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-500 mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-bold">০৫ টি ব্যাচ</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-bold text-red-500">১৫ দিন বাকি</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-bold">১২০০+ শিক্ষার্থী</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href={`/course/${course.id}`} className="w-full sm:w-auto">
            <button className="relative px-8 h-12 rounded-xl bg-slate-900 transition-all duration-300 cursor-pointer overflow-hidden group/btn w-full sm:w-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-emerald-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center gap-2 text-white font-black uppercase text-[10px] tracking-widest">
                ভর্তি সংক্রান্ত তথ্য <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </div>
            </button>
          </Link>
          <button className="h-12 px-6 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer w-full sm:w-auto">
            বিস্তারিত দেখুন
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);
