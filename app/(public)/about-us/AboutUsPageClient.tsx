'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { PlayCircle, Users, Lightbulb } from 'lucide-react';
import { API_ORIGIN } from '@/lib/api';
import Link from 'next/link';

interface CoreValue {
  title: string;
  imageUrl: string;
  color: string;
}

function resolveUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
  return url;
}

type Props = {
  settings: Record<string, string>;
};

export default function AboutUsPageClient({ settings: s }: Props) {
  const coreValues: CoreValue[] = useMemo(() => {
    try {
      return JSON.parse(s['about.values_items'] || '[]');
    } catch {
      return [];
    }
  }, [s]);

  return (
    <main className="min-h-screen bg-white">
      <section className="relative flex min-h-[70vh] items-center overflow-hidden sm:min-h-[75vh] md:h-[80vh]">
        <div className="absolute inset-0 z-0 bg-[#0F172A]" />
        <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-indigo-500/20 blur-[100px] sm:h-96 sm:w-96 sm:blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px] sm:h-64 sm:w-64 sm:blur-[100px]" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-8 px-4 pb-12 pt-16 sm:gap-10 sm:px-6 sm:pt-20 sm:pb-0 md:grid-cols-2 md:gap-12 lg:px-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="order-2 space-y-4 text-white sm:space-y-6 md:order-1 md:space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-400 backdrop-blur-sm sm:px-4 sm:py-2 sm:text-xs">
              {s['about.hero_badge']}
            </div>
            <h1 className="text-3xl font-black leading-[1.15] tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              {s['about.hero_title']} <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                {s['about.hero_title_highlight']}
              </span>
            </h1>
            <p className="max-w-lg text-sm font-medium leading-relaxed text-slate-400 sm:text-base md:text-lg lg:text-xl">
              {s['about.hero_description']}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative order-1 cursor-pointer md:order-2"
          >
            <div className="relative mx-auto aspect-video max-w-md overflow-hidden rounded-2xl border-4 border-white/5 shadow-2xl sm:rounded-[2.5rem] md:max-w-none md:rounded-[3rem] md:border-8">
              <Image
                src={resolveUrl(s['about.hero_video_url'])}
                alt="Spondon Journey"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-all duration-500 group-hover:bg-black/20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md transition-transform duration-500 group-hover:scale-110 sm:h-20 sm:w-20 md:h-24 md:w-24">
                  <PlayCircle className="h-8 w-8 fill-white/20 text-white sm:h-10 sm:w-10 md:h-12 md:w-12" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-50 py-16 sm:py-24 md:py-32">
        <div className="absolute left-0 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-[100px]" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 sm:gap-16 sm:px-6 md:grid-cols-2 md:gap-20 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/5] min-h-[280px] overflow-hidden rounded-[2rem] border-2 border-white shadow-2xl sm:rounded-[3rem] sm:border-4 md:rounded-[4rem]">
              <Image
                src={resolveUrl(s['about.story_image_url'])}
                alt="Our Team"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {s['about.story_philosophy'] ? (
              <div className="absolute -bottom-6 -right-4 hidden max-w-[220px] rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-2xl sm:-bottom-10 sm:-right-6 sm:block sm:max-w-[280px] sm:rounded-[2.5rem] sm:p-8">
                <p className="text-lg font-black leading-tight text-[#5C2D91] sm:text-2xl">
                  {s['about.story_philosophy']}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400 sm:mt-2 sm:text-sm">
                  Our Core Philosophy
                </p>
              </div>
            ) : null}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6 sm:space-y-8"
          >
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-2xl font-black leading-tight tracking-tighter text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                আমাদের{' '}
                <span className="text-[#5C2D91]">{s['about.story_title'].replace('আমাদের ', '')}</span>
              </h2>
              <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-[#5C2D91] to-[#FF2D8C] sm:h-2 sm:w-24" />
            </div>
            <div
              className="space-y-4 text-sm font-medium leading-relaxed text-slate-600 sm:space-y-6 sm:text-base md:text-lg [&_p]:mb-0"
              dangerouslySetInnerHTML={{ __html: s['about.story_body'] }}
            />
            <div className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 sm:gap-6 sm:pt-8">
              <div className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-500 hover:shadow-xl sm:gap-5 sm:rounded-[2rem] sm:p-6">
                <div className="shrink-0 rounded-xl bg-indigo-50 p-3 text-indigo-600 transition-all duration-500 group-hover:bg-[#5C2D91] group-hover:text-white sm:rounded-2xl sm:p-4">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <p className="text-sm font-black uppercase tracking-tight text-slate-900 sm:text-base">
                  এক্সপার্ট মেন্টর
                </p>
              </div>
              <div className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-500 hover:shadow-xl sm:gap-5 sm:rounded-[2rem] sm:p-6">
                <div className="shrink-0 rounded-xl bg-rose-50 p-3 text-rose-600 transition-all duration-500 group-hover:bg-[#FF2D8C] group-hover:text-white sm:rounded-2xl sm:p-4">
                  <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <p className="text-sm font-black uppercase tracking-tight text-slate-900 sm:text-base">
                  ক্রিয়েটিভ লজিক
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {coreValues.length > 0 ? (
        <section className="relative overflow-hidden py-16 sm:py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
            <div className="mb-12 space-y-3 text-center sm:mb-16 sm:space-y-4 md:mb-20">
              <h2 className="text-2xl font-black tracking-tighter text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                আমাদের মূল <span className="text-[#FF2D8C]">ভিত্তি</span>
              </h2>
              <p className="mx-auto max-w-2xl text-sm font-medium text-slate-500 sm:text-base md:text-lg">
                এই আদর্শগুলোই আমাদের প্রতিদিনের পথচলার অনুপ্রেরণা এবং সফলতার চাবিকাঠি
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 md:gap-8 lg:grid-cols-3">
              {coreValues.map((value, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className={`${value.color || 'bg-slate-50'} group overflow-hidden rounded-[2rem] border border-white transition-all duration-500 hover:shadow-2xl sm:rounded-[3rem]`}
                >
                  <div className="relative h-48 overflow-hidden sm:h-56 md:h-64">
                    {value.imageUrl ? (
                      <Image
                        src={resolveUrl(value.imageUrl)}
                        alt={value.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-200 font-black text-slate-400">
                        {value.title}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 transition-all duration-500 group-hover:bg-black/0" />
                  </div>
                  <div className="border-t border-white/50 bg-white/80 p-5 text-center backdrop-blur-md sm:p-6 md:p-8">
                    <p className="text-base font-black tracking-tighter text-slate-900 sm:text-lg">{value.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {s['about.mission_quote'] ? (
        <section className="relative overflow-hidden bg-[#0F172A] py-16 sm:py-24 md:py-32">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#5C2D91]/20 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px]" />
          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8 sm:space-y-12"
            >
              <p className="text-2xl font-black leading-relaxed tracking-tight text-white sm:text-3xl md:text-4xl">
                &ldquo;{s['about.mission_quote']}&rdquo;
              </p>
              {s['about.mission_cta_href'] ? (
                <Link
                  href={s['about.mission_cta_href']}
                  className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#5C2D91] to-[#FF2D8C] px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-2xl shadow-[#5C2D91]/30 transition-all hover:opacity-90 active:scale-95 sm:px-12 sm:py-5 sm:text-base"
                >
                  {s['about.mission_cta_text'] || 'যোগ দিন'}
                </Link>
              ) : null}
            </motion.div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
