'use client';

import Image from 'next/image';
import React, { useEffect, useMemo, useState } from 'react';
import { Testimonial } from './types';
import { cn } from '@/lib/utils';
import { getTrustFeatures, type TrustFeature } from '@/lib/api/site-content';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

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
  const [features, setFeatures] = useState<TrustFeature[]>([]);
  const [loading, setLoading] = useState(true);

  const visibleFeatures = useMemo(() => {
    if (features.length > 0) return features.slice(0, 4);
    return [
      { id: 'content', title: 'সেরা কনটেন্ট', icon: '💎' },
      { id: 'material', title: 'সহজ স্টাডি ম্যাটেরিয়াল', icon: '🎬' },
      { id: 'value', title: 'স্বল্প খরচে অনেক কিছু', icon: '📦' },
      { id: 'presentation', title: 'সাবলীল উপস্থাপনা', icon: '📚' },
    ] as TrustFeature[];
  }, [features]);

  const hasTestimonials = testimonials.length > 0;
  const activeTestimonial = hasTestimonials ? testimonials[testimonialIndex] : null;

  const goPrev = () => setTestimonialIndex((testimonialIndex - 1 + testimonials.length) % testimonials.length);
  const goNext = () => setTestimonialIndex((testimonialIndex + 1) % testimonials.length);

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const response = await getTrustFeatures(false);
        if (response.success && response.data) setFeatures(response.data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    loadFeatures();
  }, []);

  return (
    <section className="bg-white py-16 lg:pt-36  ">
      <div className="mx-auto max-w-7xl px-4 md:min-h-screen lg:pb-40">
        {/* Main Blue Container */}
        <div className="relative  rounded-[2.5rem] bg-[#3b4a97] px-8 pt-16 pb-32 lg:px-20 lg:pt-20 lg:pb-40">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            
            {/* Left Content */}
            <div className="text-white">
              <h2 className="mb-6 text-4xl font-bold leading-tight lg:text-5xl">
                কেন Shikho-তে আস্থা রাখবে?
              </h2>
              <p className="max-w-md text-lg leading-relaxed opacity-90">
                সেরা মেন্টর ও সর্বাধুনিক প্রযুক্তির সাথে সারাদেশের ৩০ লক্ষ+ শিক্ষার্থীর মানসম্মত পড়ালেখা ও পরীক্ষা প্রস্তুতির নির্ভরযোগ্য প্রতিষ্ঠান Shikho!
              </p>
            </div>

            {/* Right Features Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {visibleFeatures.map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition-transform hover:scale-[1.02]"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-3xl">
                    {/* In production, replace {feature.icon} with an <Image /> if coming from API */}
                    <span>{feature.icon}</span>
                  </div>
                  <span className="text-[1.05rem] font-bold text-[#2d3a7d]">
                    {feature.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Overlapping Testimonial Card */}
          {activeTestimonial && (
            <div className="absolute  -bottom-24 mx-auto w-full max-w-5xl px-4 lg:-bottom-[28rem]">
              <div className="relative rounded-[2rem] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] lg:p-10">
                
                {/* Navigation Arrows */}
                <button onClick={goPrev} className="absolute -left-5 top-1/2 -translate-y-1/2 rounded-full bg-white p-3 text-blue-600 shadow-lg transition-hover hover:bg-slate-50 lg:-left-7">
                  <ChevronLeft size={28} />
                </button>
                <button onClick={goNext} className="absolute -right-5 top-1/2 -translate-y-1/2 rounded-full bg-white p-3 text-blue-600 shadow-lg transition-hover hover:bg-slate-50 lg:-right-7">
                  <ChevronRight size={28} />
                </button>

                <div className="grid items-center gap-8 lg:grid-cols-12">
                  {/* Testimonial Text */}
                  <div className="lg:col-span-7">
                    <div className="mb-4 flex gap-1">
                       <div className="h-8 w-8 rounded bg-blue-600/10 flex items-center justify-center text-blue-600 font-serif text-4xl pt-2">“</div>

                    </div>
                    <blockquote className="mb-6 text-lg font-medium leading-relaxed text-slate-600 italic">
                      &quot;{activeTestimonial.quote}&quot;
                    </blockquote>
                    <div>
                      <h4 className="text-2xl font-bold text-[#2d3a7d]">{activeTestimonial.name}</h4>
                      <p className="text-sm font-medium text-slate-400">{activeTestimonial.info}</p>
                    </div>
                  </div>

                  {/* Testimonial Media */}
                  <div className="lg:col-span-5">
                    <div className="group relative aspect-video overflow-hidden rounded-2xl bg-slate-100 shadow-inner">
                      {activeTestimonial.thumbnailUrl && (
                        <Image
                          src={activeTestimonial.thumbnailUrl}
                          alt="Video Thumbnail"
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                         <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl">
                            <Play fill="currentColor" size={24} />
                         </div>
                      </div>
                      {/* Video Title Overlay (Bottom Left) */}
                      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4">
                        <p className="text-sm font-bold text-white">সুন্দরবন থেকে নটর ডেম</p>
                        <p className="text-xs text-white/80">মুশফিকের স্বপ্ন পূরণের গল্প!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dot Indicators */}
              <div className="mt-10 flex justify-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTestimonialIndex(i)}
                    className={cn(
                      "h-2.5 rounded-full transition-all duration-300",
                      testimonialIndex === i ? "w-8 bg-[#d63384]" : "w-2.5 bg-slate-300"
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};