'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  badge?: string;
  gradientTitle?: string;
  className?: string;
}

const headerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  centered = true,
  badge,
  gradientTitle,
  className,
}) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "100px 0px" }}
    variants={headerVariants}
    className={cn('mb-10 sm:mb-14 md:mb-16 space-y-3 sm:space-y-4', centered && 'text-center', className)}
  >
    {badge && (
      <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-4 shadow-sm">
        {badge}
      </Badge>
    )}
    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-slate-900 leading-tight">
      {title}{' '}
      {gradientTitle && (
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5C2D91] to-[#FF2D8C]">
          {gradientTitle}
        </span>
      )}
    </h2>
    {subtitle && (
      <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
    )}
  </motion.div>
);
