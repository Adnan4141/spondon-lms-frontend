'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

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
    <section className="relative w-full h-[420px] sm:h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px] overflow-hidden bg-slate-900">
      <div className="overflow-hidden h-full touch-pan-y" ref={emblaRef}>
        <div className="flex h-full">
          {carouselItems.map((item, index) => (
            <div key={item.id} className="flex-[0_0_100%] min-w-0 relative h-full">
              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={item.image || 'https://placehold.co/1920x1080?text=Hero'}
                  alt={item.title}
                  fill
                  sizes="100vw"
                  className="object-contain md:object-cover object-center"
                  priority={index === 0}
                />
              </div>

              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

             
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Controls - responsive */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-10 lg:right-12 z-30 flex items-center gap-2 sm:gap-4">
        <button
          onClick={scrollPrev}
          className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full border border-white/20 bg-white/5 backdrop-blur-lg text-white flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all active:scale-90 cursor-pointer touch-manipulation"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <button
          onClick={scrollNext}
          className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full border border-white/20 bg-white/5 backdrop-blur-lg text-white flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all active:scale-90 cursor-pointer touch-manipulation"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Progress Indicators - responsive */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2 sm:gap-3">
        {carouselItems.map((_, index) => (
          <button
            key={index}
            className={`h-1 sm:h-1.5 transition-all rounded-full cursor-pointer touch-manipulation ${
              index === selectedIndex ? 'w-8 sm:w-12 bg-white' : 'w-4 bg-white/30'
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
