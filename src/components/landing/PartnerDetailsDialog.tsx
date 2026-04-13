'use client';

import React from 'react';
import { ExternalLink, Globe, GraduationCap, Sparkles, BookOpen } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Partner } from '@/lib/api/partners';
import type { PublicCatalogBook } from '@/lib/api/books';
import type { Course } from '@/types/course';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';

interface PartnerDetailsDialogProps {
  selectedPartner: Partner | null;
  setSelectedPartner: (partner: Partner | null) => void;
  courses: Course[];
  dynamicEbooks: PublicCatalogBook[];
}

export const PartnerDetailsDialog: React.FC<PartnerDetailsDialogProps> = ({
  selectedPartner,
  setSelectedPartner,
  courses,
  dynamicEbooks,
}) => {
  return (
    <Dialog open={!!selectedPartner} onOpenChange={(open) => !open && setSelectedPartner(null)}>
      <DialogContent className="sm:max-w-4xl overflow-hidden border-none p-0 bg-white/95 backdrop-blur-2xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.15)] rounded-3xl">
        <div className="relative h-44 bg-[#f8fafc]">
          <div className="absolute inset-0 bg-linear-to-br from-indigo-600/10 via-purple-600/5 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-size-[24px_24px] opacity-40"></div>

          <div className="absolute -bottom-16 left-10 p-1.5 rounded-[2.5rem] bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100/50 backdrop-blur-sm">
            <div className="relative h-32 w-32 rounded-[2.2rem] overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100">
              {selectedPartner?.logo ? (
                <img
                  src={resolveAttachmentUrl(selectedPartner.logo, API_ORIGIN)}
                  alt={selectedPartner.name}
                  className="h-full w-full object-contain p-4 transition-transform duration-500 hover:scale-110"
                />
              ) : (
                <Globe className="h-12 w-12 text-slate-300" />
              )}
            </div>
          </div>

          <div className="absolute top-6 right-10 flex gap-3">
            {selectedPartner?.websiteUrl && (
              <a
                href={selectedPartner.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 hover:bg-white text-slate-900 rounded-2xl text-sm font-bold transition-all hover:shadow-xl hover:shadow-indigo-500/10 active:scale-95 border border-slate-200/50 backdrop-blur-md"
              >
                <ExternalLink className="h-4 w-4 text-indigo-600" />
                ওয়েবসাইট
              </a>
            )}
          </div>
        </div>

        <div className="pt-20 px-10 pb-10 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {selectedPartner?.type && (
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-[0.15em] border border-indigo-100/50">
                  {selectedPartner.type}
                </span>
              )}
              <div className="h-px flex-1 bg-linear-to-r from-slate-100 to-transparent"></div>
            </div>

            <div className="space-y-3">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {selectedPartner?.name}
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed max-w-2xl font-medium">
                {selectedPartner?.description || 'আমাদের সম্মানিত পার্টনার প্রতিষ্ঠানের সাথে আপনার শেখার যাত্রা হোক আরও আনন্দদায়ক।'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-200">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">প্রস্তাবিত কোর্সসমূহ</h4>
                </div>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg">Top Rated</span>
              </div>

              <div className="space-y-3">
                {courses.slice(0, 3).map((c) => (
                  <div
                    key={c.id}
                    className="group relative rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-indigo-100 hover:-translate-y-1 cursor-default"
                  >
                    <div className="flex justify-between items-center">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">{c.slug}</p>
                        <p className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug">{c.name}</p>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                        <Sparkles className="h-5 w-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-200">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">ডিজিটাল প্রোডাক্ট</h4>
                </div>
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-lg">Popular</span>
              </div>

              <div className="space-y-3">
                {dynamicEbooks.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    className="group relative rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-rose-100 hover:-translate-y-1 cursor-default"
                  >
                    <div className="flex justify-between items-center">
                      <div className="space-y-1.5">
                        <p className="text-base font-bold text-slate-800 group-hover:text-rose-600 transition-colors leading-snug">{b.name}</p>
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-rose-400"></div>
                          <p className="text-[11px] font-black text-rose-500 uppercase tracking-wider">৳{b.price}</p>
                        </div>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-rose-50 transition-colors">
                        <div className="h-2 w-2 rounded-full bg-rose-200 group-hover:scale-150 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};