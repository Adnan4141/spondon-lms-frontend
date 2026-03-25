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
  <section className="py-12 sm:py-20 md:py-28 bg-[#0A1A3A] overflow-hidden">
    <div className="mx-auto max-w-7xl px-6 lg:px-12">

      {/* TOP SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-gradient-to-br from-[#1F3E76] via-[#3B4D9A] to-[#5C2D91] 
        rounded-[32px] sm:rounded-[48px] px-6 sm:px-8 lg:px-16 py-12 sm:py-16 lg:py-20 shadow-[0_40px_100px_-20px_rgba(31,62,118,0.35)]"
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* TEXT SIDE */}
          <div className="text-white space-y-6 sm:space-y-8 max-w-xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight">
              কেন <span className="text-[#FF2D8C]">"স্পন্দন"</span> অনন্য?
            </h2>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 leading-relaxed">
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

      {/* TESTIMONIAL CAROUSEL */}
      {testimonials.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 sm:mt-20"
        >
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center mb-10">
            শিক্ষার্থীদের মতামত
          </h3>

          <div className="relative max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 sm:p-10 text-center">
              <Quote className="w-10 h-10 text-[#FF2D8C] mx-auto mb-4 opacity-60" />
              <p className="text-white/90 text-base sm:text-lg md:text-xl leading-relaxed italic mb-6">
                &ldquo;{testimonials[testimonialIndex]?.quote}&rdquo;
              </p>
              <p className="text-white font-bold text-sm sm:text-base">
                {testimonials[testimonialIndex]?.name}
              </p>
              {testimonials[testimonialIndex]?.info && (
                <p className="text-white/60 text-xs sm:text-sm mt-1">
                  {testimonials[testimonialIndex].info}
                </p>
              )}
            </div>

            {testimonials.length > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() => setTestimonialIndex(testimonialIndex === 0 ? testimonials.length - 1 : testimonialIndex - 1)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTestimonialIndex(i)}
                      className={`w-2.5 h-2.5 rounded-full transition ${i === testimonialIndex ? 'bg-[#FF2D8C]' : 'bg-white/30'}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setTestimonialIndex(testimonialIndex === testimonials.length - 1 ? 0 : testimonialIndex + 1)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

    </div>
  </section>
);