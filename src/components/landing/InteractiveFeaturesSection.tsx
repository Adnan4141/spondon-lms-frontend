'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Users as UsersIcon, CalendarDays, PlayCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Feature } from './types';

interface Props {
  features: Feature[];
  activeTab: Feature;
  setActiveTab: (feature: Feature) => void;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>, text?: string) => void;
}

export const InteractiveFeaturesSection: React.FC<Props> = ({
  features,
  activeTab,
  setActiveTab,
  handleImageError
}) => (
  <section className="relative py-16 overflow-hidden bg-[#020617]">
    
    {/* Dynamic Background Elements - Slightly dimmed for a tighter feel */}
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-indigo-600/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-pink-600/10 blur-[100px] rounded-full" />
    </div>

    <div className="relative mx-auto max-w-6xl px-6">

      {/* Tighter Header */}
      <div className="text-center mb-12 space-y-3">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-[10px] font-bold tracking-widest uppercase"
        >
          <Star className="w-3 h-3 fill-indigo-400" /> লার্নিং অভিজ্ঞতা
        </motion.div>
        
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
          প্রোগ্রামে <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">যা যা থাকছে</span>
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center">

        {/* LEFT FEATURES - Compact Sidebar */}
        <div className="flex flex-col gap-3">
          {features.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item)}
              className={cn(
                "group relative w-full flex items-center gap-4 rounded-2xl p-4 transition-all duration-300 text-left border",
                activeTab.id === item.id
                  ? "bg-white/10 border-white/20 shadow-lg"
                  : "bg-transparent border-transparent hover:bg-white/5"
              )}
            >
              <div className={cn(
                "relative z-10 p-3 rounded-xl transition-all duration-300",
                activeTab.id === item.id
                  ? "bg-indigo-500 text-white scale-105 shadow-md shadow-indigo-500/40"
                  : "bg-slate-800 text-slate-400 group-hover:text-slate-200"
              )}>
                {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
              </div>

              <h3 className={cn(
                "text-base font-bold transition-colors flex-1",
                activeTab.id === item.id ? "text-white" : "text-slate-400 group-hover:text-slate-200"
              )}>
                {item.title}
              </h3>

              {activeTab.id === item.id && (
                <PlayCircle className="w-5 h-5 text-indigo-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* RIGHT PREVIEW - Scaled Down */}
        <div className="relative pt-4 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="relative max-w-[440px] mx-auto lg:ml-auto"
            >
              {/* Main Player Frame */}
              <div className="relative z-10 bg-slate-800/40 backdrop-blur-xl rounded-[32px] border border-white/10 p-2.5 shadow-2xl">
                <div className="bg-slate-950 rounded-[24px] overflow-hidden relative aspect-video sm:aspect-[4/3]">
                  
                  {/* Mini Status Bar */}
                  <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/70 to-transparent z-20 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[9px] text-white/80 font-bold uppercase tracking-widest">Live</span>
                    </div>
                  </div>

                  {/* Main Image */}
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=90"
                    alt="Instructor"
                    className="w-full h-full object-cover"
                    onError={(e) => handleImageError(e, 'Instructor')}
                  />

                  {/* Bottom Control Overlay */}
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-6 h-6 rounded-full border border-black bg-slate-800 flex items-center justify-center text-[8px] text-white">
                            <UsersIcon className="w-2.5 h-2.5" />
                          </div>
                        ))}
                      </div>
                      <button className="px-4 py-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                        যোগ দিন
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Floating Meta Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute -bottom-6 -left-4 md:-left-10 z-20 w-[220px] bg-white rounded-2xl p-4 shadow-2xl"
              >
                <div className="relative">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-600 uppercase mb-1">
                    <PlayCircle size={10} /> পরবর্তী লেকচার
                  </div>
                  <h4 className="text-slate-900 font-bold text-sm mb-2 line-clamp-1">
                    {activeTab.previewTitle}
                  </h4>
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] font-medium">
                    <CalendarDays size={12} />
                    {activeTab.previewTime}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>

    <style jsx global>{`
      @keyframes bounce-slow {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      .animate-bounce-slow {
        animation: bounce-slow 4s ease-in-out infinite;
      }
    `}</style>
  </section>
);