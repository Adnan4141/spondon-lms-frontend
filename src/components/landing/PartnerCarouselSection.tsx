'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const partners = [
  { name: 'Banglalink', logo: '/images/collaborator/banglalink-logo-png_seeklogo-411075.png' },
  { name: 'Bikash', logo: '/images/collaborator/bikash-logo.png' },
  { name: 'Prothom Alo', logo: '/images/collaborator/prothom-alo-logo-png_seeklogo-504130.png' },
  { name: 'Walton', logo: '/images/collaborator/walton-logo-png_seeklogo-251022.png' },
];

export const PartnerCarouselSection: React.FC = () => {
  // We double the content to ensure there is enough to fill the width for a seamless loop
  const scrollContent = [...partners, ...partners];

  return (
    <section className="relative py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
      
      {/* Section Header */}
      <div className="mx-auto max-w-7xl px-6 mb-10 sm:mb-16 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-bold text-indigo-600 uppercase tracking-[0.5em] mb-4"
        >
          TRUSTED BY
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight"
        >
          আমাদের পার্টনারসমূহ
        </motion.h2>
      </div>

      {/* Carousel Container */}
      <div className="relative flex items-center overflow-hidden">
        
        {/* Advanced Edge Masks (Glassy feel) */}
        <div className="absolute left-0 top-0 bottom-0 w-24 md:w-64 bg-gradient-to-r from-white via-white/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 md:w-64 bg-gradient-to-l from-white via-white/80 to-transparent z-20 pointer-events-none" />

        <motion.div
          className="flex gap-8 md:gap-12 items-center py-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 35, // Adjust speed here (higher = slower)
          }}
        >
          {scrollContent.map((partner, index) => (
            <motion.div
              key={`${partner.name}-${index}`}
              className="group relative flex-shrink-0 w-48 h-28 md:w-60 md:h-32 bg-white rounded-3xl border border-slate-200 flex items-center justify-center p-8 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)] hover:border-indigo-300 hover:-translate-y-1"
            >
              {/* Internal Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              
              <div className="relative w-full h-full">
                <Image
                  src={partner.logo || 'https://placehold.co/240x128?text=Logo'}
                  alt={`${partner.name} logo`}
                  fill
                  sizes="(max-width: 768px) 192px, 240px"
                  className="object-contain transition-all duration-500 group-hover:scale-110"
                  // Use priority for the first few items to improve LCP if this is high on the page
                  priority={index < 4}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
      
      {/* Bottom Border Accent */}
      <div className="mt-12 mx-auto max-w-xs h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

    </section>
  );
};