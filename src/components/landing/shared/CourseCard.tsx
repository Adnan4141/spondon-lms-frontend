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
<Link href={`/course/${course.slug || course.id}`} className="block h-full">
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
          src={course.thumbnail || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%235C2D91'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='28' font-family='sans-serif'%3ECourse%3C/text%3E%3C/svg%3E"}
          alt={course.name}
          className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
          onError={(e) => handleImageError(e, 'Course')}
        />
        <div className="absolute top-4 left-4">
          <div className="backdrop-blur-md bg-black/20 border border-white/30 text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">
            {course.type === 'ONLINE' ? '• Online' : '• Offline'}
          </div>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
            {course.name}
          </h3>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fee</span>
            {course.offerPrice != null && Number(course.offerPrice) < Number(course.fee) ? (
              <>
                <span className="text-lg sm:text-xl font-black text-[#5C2D91]">৳{Number(course.offerPrice).toLocaleString()}</span>
                <span className="text-sm text-slate-400 line-through font-medium">৳{Number(course.fee).toLocaleString()}</span>
                <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  🔥 {Math.round(((Number(course.fee) - Number(course.offerPrice)) / Number(course.fee)) * 100)}% OFF
                </span>
              </>
            ) : (
              <span className="text-lg sm:text-xl font-black text-[#5C2D91]">৳{Number(course.fee).toLocaleString()}</span>
            )}
          </div>
        </div>
        <button className="mt-6 relative w-full group/btn overflow-hidden h-12 rounded-xl bg-slate-900 transition-all duration-300 cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-emerald-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-center gap-2 text-white font-black uppercase text-[10px] tracking-widest">
            ভর্তি সংক্রান্ত তথ্য <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  </motion.div>

</Link>
);
