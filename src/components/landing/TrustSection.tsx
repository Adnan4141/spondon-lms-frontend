'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Quote } from 'lucide-react';
import { Testimonial } from './types';

const trustFeatures = [
  { title: 'অভিজ্ঞ শিক্ষক প্যানেল', icon: '👨‍🏫' },
  { title: 'Auto এসএমএস ফলাফল', icon: '📩' },
  { title: 'মানসম্মত স্টাডি ম্যাটেরিয়ালস', icon: '📚' },
  { title: 'অনলাইন/অফলাইন কার্যক্রম', icon: '💻' },
  { title: 'সকল শাখায় একই সার্ভিস', icon: '🏫' },
  { title: 'মাসিক/সাপ্তাহিক পরীক্ষা', icon: '📝' },
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
}) => (
  <section className="py-28 bg-[#0A1A3A] overflow-hidden">
    <div className="mx-auto max-w-7xl px-6 lg:px-12">

      {/* TOP SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-gradient-to-br from-[#1F3E76] via-[#3B4D9A] to-[#5C2D91] 
        rounded-[48px] px-8 lg:px-16 py-20 shadow-[0_40px_100px_-20px_rgba(31,62,118,0.35)]"
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* TEXT SIDE */}
          <div className="text-white space-y-8 max-w-xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
              কেন <span className="text-[#FF2D8C]">"স্পন্দন"</span> অনন্য?
            </h2>

            <p className="text-lg md:text-xl text-white/80 leading-relaxed">
              আধুনিক শিক্ষা প্রযুক্তি, অভিজ্ঞ শিক্ষক এবং উন্নত মূল্যায়ন পদ্ধতির মাধ্যমে 
              শিক্ষার্থীদের সর্বোচ্চ প্রস্তুতি নিশ্চিত করে স্পন্দন।
            </p>
          </div>

          {/* FEATURES GRID */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {trustFeatures.map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -6, scale: 1.04 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 
                rounded-3xl p-6 flex flex-col items-center text-center gap-4 
                shadow-xl transition-all duration-300"
              >
                <div className="text-3xl w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner">
                  {item.icon}
                </div>

                <span className="text-white font-bold text-sm md:text-base leading-tight">
                  {item.title}
                </span>
              </motion.div>
            ))}
          </div>

        </div>
      </motion.div>

 

    </div>
  </section>
);