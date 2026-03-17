'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const carouselItems = [
  {
    title: 'HSC 26 একাডেমিক প্রোগ্রাম',
    subtitle: 'সম্পূর্ণ সিলেবাস শেষ হবে ৪ মাসেই!',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000',
    color: 'bg-indigo-600',
  },
  {
    title: 'ভার্সিটি ক ইউনিটের এডমিশন কোর্স',
    subtitle: 'ঢাকা বিশ্ববিদ্যালয়ের স্বপ্ন পূরণে সেরা প্রস্তুতি',
    image: 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=1000',
    color: 'bg-emerald-600',
  },
  {
    title: 'মেডিকেল স্পেশাল ব্যাচ',
    subtitle: 'অভিজ্ঞ মেন্টরদের তত্ত্বাবধানে পূর্ণাঙ্গ প্রস্তুতি',
    image: 'https://images.unsplash.com/photo-1576091160550-2173bdd9962a?q=80&w=1000',
    color: 'bg-rose-600',
  },
];

export const FeaturedCarouselSection: React.FC = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    // Register events
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    
    // Initial sync
    const initialIndex = emblaApi.selectedScrollSnap();
    if (initialIndex !== 0) {
      setSelectedIndex(initialIndex);
    }
    
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="relative group">
          <div className="overflow-hidden rounded-[48px]" ref={emblaRef}>
            <div className="flex">
              {carouselItems.map((item, index) => (
                <div key={index} className="flex-[0_0_100%] min-w-0 relative h-[400px] md:h-[500px]">
                  <img
                    src={item.image || 'https://placehold.co/1200x500?text=Featured'}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className={`absolute inset-0 ${item.color} opacity-40 mix-blend-multiply`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-10 md:p-20">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
                        {item.title}
                      </h2>
                      <p className="text-lg md:text-2xl text-white/90 font-medium mb-8">
                        {item.subtitle}
                      </p>
                      <button className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 hover:text-white transition-all cursor-pointer">
                        বিস্তারিত জানো
                      </button>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all z-20 opacity-0 group-hover:opacity-100 cursor-pointer"
            onClick={scrollPrev}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all z-20 opacity-0 group-hover:opacity-100 cursor-pointer"
            onClick={scrollNext}
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {carouselItems.map((_, index) => (
              <button
                key={index}
                className={`h-2 transition-all rounded-full cursor-pointer ${
                  index === selectedIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
                }`}
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
