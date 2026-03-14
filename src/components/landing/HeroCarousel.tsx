'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, PlayCircle, Star } from 'lucide-react';

const carouselItems = [
  {
    id: 1,
    title: 'একাডেমিক থেকে এডমিশন',
    highlight: 'সব প্রস্তুতি এক জায়গায়',
    subtitle: 'সেরা মেন্টর ও স্মার্ট প্রযুক্তির সাথে শুরু করো তোমার স্বপ্নের জয়যাত্রা।',
    image: '/images/carousel/carousel-1.jpg',
    btnText: 'কোর্সসমূহ দেখো',
    secondaryBtnText: 'শিখতে শুরু করো',
  },
  {
    id: 2,
    title: 'সেরা মেন্টরদের সাথে',
    highlight: 'লাইভ ক্লাস',
    subtitle: 'দেশের সেরা শিক্ষকদের কাছ থেকে সরাসরি শেখার সুযোগ এখন তোমার হাতের মুঠোয়।',
    image: '/images/carousel/carousel-2.jpg',
    btnText: 'ব্যাচসমূহ দেখো',
    secondaryBtnText: 'ফ্রি ক্লাস করো',
  },
  {
    id: 3,
    title: 'স্বপ্ন ছোঁয়ার লড়াইয়ে',
    highlight: 'SpondonPro তোমার সাথে',
    subtitle: 'মানসম্মত শিক্ষা পৌঁছে যাবে দেশের প্রতিটি প্রান্তে, স্বল্প খরচে সেরা মেন্টরদের সাথে।',
    image: '/images/carousel/carousel-3.jpg',
    btnText: 'ভর্তি হও এখনই',
    secondaryBtnText: 'সফলতার গল্প',
  },
];

export const HeroCarousel: React.FC = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000, stopOnInteraction: false })]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    // Register events
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    
    // Initial sync - using a check to avoid redundant setState
    const initialIndex = emblaApi.selectedScrollSnap();
    if (initialIndex !== selectedIndex) {
      setSelectedIndex(initialIndex);
    }
    
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect, selectedIndex]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  return (
    <section className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden bg-slate-900">
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {carouselItems.map((item, index) => (
            <div key={item.id} className="flex-[0_0_100%] min-w-0 relative h-full">
              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />

              </div>

           
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-10 right-6 lg:right-12 z-30 flex items-center gap-4">
        <button
          onClick={scrollPrev}
          className="w-14 h-14 rounded-full border border-white/20 bg-white/5 backdrop-blur-lg text-white flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all active:scale-90 cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={scrollNext}
          className="w-14 h-14 rounded-full border border-white/20 bg-white/5 backdrop-blur-lg text-white flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all active:scale-90 cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Progress Indicators */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {carouselItems.map((_, index) => (
          <button
            key={index}
            className={`h-1.5 transition-all rounded-full cursor-pointer ${
              index === selectedIndex ? 'w-12 bg-white' : 'w-4 bg-white/30'
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
