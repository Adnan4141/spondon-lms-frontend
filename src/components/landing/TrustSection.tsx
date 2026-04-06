'use client';

import React from 'react';
import { Testimonial } from './types';
import { cn } from '@/lib/utils';
import { StudentReviewTestimonialSection } from './StudentReviewTestimonialSection';

const trustFeatures = [
  { title: 'অভিজ্ঞ শিক্ষক প্যানেল', icon: '👨‍🏫', color: 'text-blue-600', bg: 'bg-blue-50' },
  { title: 'Auto এসএমএস ফলাফল', icon: '📩', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { title: 'মানসম্মত স্টাডি ম্যাটেরিয়ালস', icon: '📚', color: 'text-amber-600', bg: 'bg-amber-50' },
  { title: 'অনলাইন/অফলাইন কার্যক্রম', icon: '💻', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { title: 'সকল শাখায় একই সার্ভিস', icon: '🏫', color: 'text-rose-600', bg: 'bg-rose-50' },
  { title: 'মাসিক/সাপ্তাহিক পরীক্ষা', icon: '📝', color: 'text-violet-600', bg: 'bg-violet-50' },
];

interface Props {
  testimonials: Testimonial[];
  testimonialIndex: number;
  setTestimonialIndex: (index: number) => void;
}

export const TrustSection: React.FC<Props> = ({
  testimonials,
  testimonialIndex,
  setTestimonialIndex,
}) => {
  return (
    <>
      <section className="py-24 sm:py-32 bg-white overflow-hidden relative">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 left-0 w-72 h-72 bg-indigo-50 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-20 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-12 relative z-10">
          <div className="">
            {/* Left Side: Stats & Info */}
            <div className="space-y-10">
              <div className="space-y-4 text-center">
               
                <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
                  কেন <span className="text-indigo-600">স্পন্দন</span> অনন্য?
                </h2>
                <p className="text-lg font-medium text-slate-500 leading-relaxed max-w-md mx-auto">
                  আধুনিক শিক্ষা প্রযুক্তি, অভিজ্ঞ শিক্ষক এবং উন্নত মূল্যায়ন পদ্ধতির মাধ্যমে শিক্ষার্থীদের সর্বোচ্চ প্রস্তুতি নিশ্চিত করি আমরা।
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mx-auto">
                {trustFeatures.map((item, i) => (
                  <div
                    key={i}
                    className="bg-white border flex flex-col items-center justify-center border-slate-100 rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1"
                  >
                    <div className={cn("text-2xl w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", item.bg)}>
                      {item.icon}
                    </div>
                    <span className="text-slate-900 font-bold text-sm leading-tight block">
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <StudentReviewTestimonialSection
        testimonials={testimonials}
        testimonialIndex={testimonialIndex}
        setTestimonialIndex={setTestimonialIndex}
      />
    </>
  );
};
