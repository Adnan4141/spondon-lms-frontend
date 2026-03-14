'use client';

import React from 'react';
import { motion } from 'framer-motion';

const partners = [
  { name: 'Partner 1', logo: 'https://placehold.co/200x80/f3f4f6/1f2937?text=Partner+1' },
  { name: 'Partner 2', logo: 'https://placehold.co/200x80/f3f4f6/1f2937?text=Partner+2' },
  { name: 'Partner 3', logo: 'https://placehold.co/200x80/f3f4f6/1f2937?text=Partner+3' },
  { name: 'Partner 4', logo: 'https://placehold.co/200x80/f3f4f6/1f2937?text=Partner+4' },
  { name: 'Partner 5', logo: 'https://placehold.co/200x80/f3f4f6/1f2937?text=Partner+5' },
  { name: 'Partner 6', logo: 'https://placehold.co/200x80/f3f4f6/1f2937?text=Partner+6' },
  { name: 'Partner 7', logo: 'https://placehold.co/200x80/f3f4f6/1f2937?text=Partner+7' },
  { name: 'Partner 8', logo: 'https://placehold.co/200x80/f3f4f6/1f2937?text=Partner+8' },
];

export const PartnerCarouselSection: React.FC = () => {
  // Duplicate the partners to create a seamless loop
  const duplicatedPartners = [...partners, ...partners];

  return (
    <section className="py-20 bg-slate-50 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-12 mb-12 text-center">
        <h2 className="text-2xl font-bold text-slate-400 uppercase tracking-[0.3em] mb-4">আমাদের পার্টনারসমূহ</h2>
        <div className="h-1 w-20 bg-indigo-600 mx-auto rounded-full" />
      </div>

      <div className="relative flex overflow-hidden group">
        <motion.div
          className="flex gap-12 items-center"
          animate={{
            x: ['0%', '-50%'],
          }}
          transition={{
            duration: 30,
            ease: 'linear',
            repeat: Infinity,
          }}
        >
          {duplicatedPartners.map((partner, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-48 h-24 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center p-6 grayscale hover:grayscale-0 transition-all duration-500 hover:shadow-md hover:-translate-y-1"
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ))}
        </motion.div>
        
        {/* Gradient overlays for smooth fading at the edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10" />
      </div>
    </section>
  );
};
