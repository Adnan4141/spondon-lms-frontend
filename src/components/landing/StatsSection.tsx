'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Download, Star, Users as UsersIcon } from 'lucide-react';
import { StatItem } from './shared/StatItem';
import { SystemStatsData } from '@/lib/api/reports';

interface Props {
  systemStats: SystemStatsData | null;
}

export const StatsSection: React.FC<Props> = ({ systemStats }) => (
  <section className="relative z-20 -mt-20  pb-20">
    <div className="mx-auto max-w-7xl px-6 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-[40px] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.12)] p-10 md:p-14 grid grid-cols-2 lg:grid-cols-4 gap-12 border border-white/50">
          <StatItem icon={<UsersIcon />} value={systemStats ? `${systemStats.students}+` : '৩০ লক্ষ+'} label="শিক্ষার্থী" color="text-indigo-600" bg="bg-indigo-50" />
          <StatItem icon={<Star />} value={systemStats ? `${systemStats.teachers}+` : '২০ জন+'} label="অভিজ্ঞ মেন্টর" color="text-emerald-500" bg="bg-emerald-50" />
          <StatItem icon={<Download />} value="৪৫ লক্ষ+" label="অ্যাপ ডাউনলোড" color="text-blue-600" bg="bg-blue-50" />
          <StatItem icon={<BookOpen />} value={systemStats ? `${systemStats.contents}+` : '৫ লক্ষ+'} label="লার্নিং মেটেরিয়াল" color="text-amber-500" bg="bg-amber-50" />
        </div>
      </motion.div>
    </div>
  </section>
);
