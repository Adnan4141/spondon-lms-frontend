'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { FlexibleImage } from '@/components/common/FlexibleImage';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HeroSlide } from '@/lib/api/site-content';
import { API_ORIGIN } from '@/lib/api';

// ─── Static fallback data ─────────────────────────────────────────────────

const STATIC_SLIDES: HeroSlide[] = [
  {
    id: 's1',
    title: 'একাডেমিক থেকে এডমিশন',
    highlight: 'সব প্রস্তুতি এক জায়গায়',
    subtitle: 'সেরা মেন্টর ও স্মার্ট প্রযুক্তির সাথে শুরু করো তোমার স্বপ্নের জয়যাত্রা।',
    imageUrl: '/images/carousel/carousel-1.jpg',
    btnText: 'কোর্সসমূহ দেখো',
    secondaryBtnText: 'শিখতে শুরু করো',
    sortOrder: 0,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 's2',
    title: 'সেরা মেন্টরদের সাথে',
    highlight: 'লাইভ ক্লাস',
    subtitle: 'দেশের সেরা শিক্ষকদের কাছ থেকে সরাসরি শেখার সুযোগ এখন তোমার হাতের মুঠোয়।',
    imageUrl: '/images/carousel/carousel-2.jpg',
    btnText: 'ব্যাচসমূহ দেখো',
    secondaryBtnText: 'ফ্রি ক্লাস করো',
    sortOrder: 1,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 's3',
    title: 'স্বপ্ন ছোঁয়ার লড়াইয়ে',
    highlight: 'SpondonPro তোমার সাথে',
    subtitle: 'মানসম্মত শিক্ষা পৌঁছে যাবে দেশের প্রতিটি প্রান্তে, স্বল্প খরচে সেরা মেন্টরদের সাথে।',
    imageUrl: '/images/carousel/carousel-3.jpg',
    btnText: 'ভর্তি হও এখনই',
    secondaryBtnText: 'সফলতার গল্প',
    sortOrder: 2,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
];

// ─── Image URL resolver ───────────────────────────────────────────────────

function resolveImageUrl(url: string): string {
  if (!url) return 'https://placehold.co/1920x1080/1e293b/ffffff?text=Slide';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/images/')) return url;
  if (url.startsWith('/uploads/')) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

// ─── Component ────────────────────────────────────────────────────────────

interface Props {
  slides?: HeroSlide[];
}

export const HeroCarousel: React.FC<Props> = ({ slides }) => {
  const displaySlides = slides && slides.length > 0 ? slides : STATIC_SLIDES;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    const initialIndex = emblaApi.selectedScrollSnap();
    if (initialIndex !== selectedIndex) setSelectedIndex(initialIndex);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect, selectedIndex]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  return (
    <section className="relative w-full overflow-hidden bg-slate-900 aspect-[9/4] md:max-h-[65vh] 2xl:max-h-[70vh]">
      <div className="overflow-hidden w-full h-full touch-pan-y" ref={emblaRef}>
        <div className="flex w-full h-full">
          {displaySlides.map((slide, index) => (
            <div key={slide.id} className="flex-[0_0_100%] min-w-0 w-full h-full relative shrink-0">
              <FlexibleImage
                src={resolveImageUrl(slide.imageUrl)}
                alt={slide.title}
                fill
                sizes="100vw"
                className="object-fit w-full h-full"
                priority={index === 0}
                loading={index === 0 ? undefined : 'lazy'}
              />
              {/* <div className="absolute inset-0 z-10 pointer-events-none bg-linear-to-t from-black/40 via-transparent to-transparent" /> */}
            </div>
          ))}
        </div>
      </div>
     {/* Navigation Controls */}
      <div className="absolute bottom-2 right-2 sm:bottom-6 sm:right-6 lg:bottom-10 lg:right-12 z-30 flex items-center gap-2 sm:gap-4">
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

      {/* Progress Indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 sm:bottom-4 z-30 flex gap-2 sm:gap-3">
        {displaySlides.map((_, index) => (
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
