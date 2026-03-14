'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Course } from '@/types/course';

interface Props {
  course: Course;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>, text?: string) => void;
}

export const CourseCard: React.FC<Props> = ({ course, handleImageError }) => (
  <motion.div 
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: 'easeOut' },
      },
    }} 
    className="group relative h-full"
  >
    <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 rounded-[32px] opacity-0 group-hover:opacity-100 blur-[2px] transition-opacity duration-500" />
    <div className="relative h-full bg-white rounded-[32px] overflow-hidden flex flex-col transition-all duration-500 group-hover:translate-y-[-8px] border border-slate-100">
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={course.thumbnail || ''}
          alt={course.name}
          className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
          onError={(e) => handleImageError(e, 'Course')}
        />
        <div className="absolute top-4 left-4">
          <div className="backdrop-blur-md bg-black/20 border border-white/30 text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">
            {course.type === 'ONLINE' ? '• Online' : '• Offline'}
          </div>
        </div>
        <div className="absolute bottom-4 right-4 bg-white px-3 py-1.5 rounded-xl shadow-2xl flex flex-col items-center border border-slate-50">
          <span className="text-[9px] text-slate-400 font-bold uppercase leading-none mb-0.5">Fee</span>
          <span className="text-lg font-black text-[#5C2D91]">৳{String(course.fee)}</span>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="text-xl font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">{course.name}</h3>
          <div className="flex items-center gap-4 mt-4 py-3 border-y border-slate-50">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">ব্যাচ সংখ্যা</span>
              <span className="text-xs font-bold text-slate-700">০৫ টি</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-100" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">ভর্তি শেষ</span>
              <span className="text-xs font-bold text-red-500">১৫ দিন বাকি</span>
            </div>
          </div>
        </div>
        <Link href={`/course/${course.id}`} className="mt-6 block cursor-pointer">
          <button className="relative w-full group/btn overflow-hidden h-12 rounded-xl bg-slate-900 transition-all duration-300 cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-emerald-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center justify-center gap-2 text-white font-black uppercase text-[10px] tracking-widest">
              ভর্তি সংক্রান্ত তথ্য <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </div>
          </button>
        </Link>
      </div>
    </div>
  </motion.div>
);
