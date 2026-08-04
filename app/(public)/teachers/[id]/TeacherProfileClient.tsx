'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { PublicTeacher } from '@/lib/api/teachers';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { getYoutubePrivacyEmbedUrl } from '@/lib/youtube-embed';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Building2,
  Clock,
  Phone,
  Play,
  BookOpen,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

export function TeacherProfileClient({ teacher }: { teacher: PublicTeacher }) {
  const demoRef = useRef<HTMLDivElement>(null);

  const scrollToDemo = () => {
    demoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const embedUrl = teacher.demoClassUrl ? getYoutubePrivacyEmbedUrl(teacher.demoClassUrl) : null;
  const resolvedPhoto = teacher.profileImage
    ? resolveAttachmentUrl(teacher.profileImage, API_ORIGIN)
    : null;

  const primaryCourse = teacher.courses[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Back button */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Link
          href="/teachers"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          শিক্ষকমণ্ডলীতে ফিরে যান
        </Link>
      </div>

      {/* ── Header Banner ── */}
      <section className="relative overflow-hidden bg-linear-to-br from-slate-800 via-slate-900 to-indigo-950 text-white mt-4 mx-4 max-w-4xl md:mx-auto rounded-3xl shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,var(--color-indigo-400),transparent_60%)]" />
        <div className="relative px-6 py-8 sm:px-10 sm:py-10 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden border-4 border-white/20 shadow-xl bg-indigo-900">
              {resolvedPhoto ? (
                <Image
                  src={resolvedPhoto}
                  alt={teacher.fullName}
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-3xl font-black text-indigo-200 select-none">
                  {teacher.fullName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{teacher.fullName}</h1>
              {primaryCourse && (
                <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/30 text-[10px] font-black uppercase tracking-widest">
                  {primaryCourse.name}
                </Badge>
              )}
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/20 text-[10px] font-black uppercase tracking-widest">
                Expert Teacher
              </Badge>
              <Badge className="bg-white/10 text-white/70 border-white/10 text-[10px] font-black uppercase tracking-widest">
                Active
              </Badge>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-white/70">
              {teacher.designation && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-indigo-300" />
                  {teacher.designation}
                </span>
              )}
              {teacher.institute && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-indigo-300" />
                  {teacher.institute}
                </span>
              )}
              {teacher.experienceYears != null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-300" />
                  {teacher.experienceYears} years experience
                </span>
              )}
              {teacher.mobile && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-indigo-300" />
                  {teacher.mobile}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Action Buttons ── */}
      <div className="max-w-4xl mx-auto px-4 mt-6 flex flex-wrap gap-3">
        <Button
          onClick={scrollToDemo}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm px-6 h-12 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95"
        >
          <Play className="mr-2 h-4 w-4" />
     ভিডিও ক্লাস দেখতে ক্লিক করুন
        </Button>
        <Button
          variant="outline"
          onClick={scrollToDemo}
          className="rounded-xl border-slate-200 bg-white text-slate-700 font-black text-sm px-6 h-12 hover:bg-slate-50 hover:border-indigo-200 transition-all"
        >
          <BookOpen className="mr-2 h-4 w-4 text-indigo-500" />
         শিক্ষক সম্পর্কে বিস্তারিত জানুন
        </Button>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8 pb-16">
        {/* ── Demo Class Section ── */}
        <section ref={demoRef} className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <Play className="h-4 w-4 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">পরিচিতিমূলক ক্লাস</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ক্লাসের ধরন ও মান সম্পর্কে পূর্বধারণা নিন</p>
            </div>
          </div>

          <div className="p-6">
            {embedUrl ? (
              <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={embedUrl}
                  title="Demo Class"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
                {/* Blocks casual clicks on YouTube logo / open-in-YouTube (best-effort; src is still inspectable). */}
                <div
                  className="absolute bottom-0 right-0 z-10 h-16 w-32 cursor-default bg-transparent"
                  aria-hidden
                />
              </div>
            ) : teacher.demoClassUrl ? (
              <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                <video
                  src={teacher.demoClassUrl}
                  controls
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-slate-300">
                <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                  <Play className="h-8 w-8 text-slate-200" />
                </div>
                <p className="text-sm font-black text-slate-400">বর্তমানে কোনো পরিচিতিমূলক ক্লাস যুক্ত করা হয়নি</p>
              </div>
            )}
          </div>
        </section>

        {/* ── Courses Section ── */}
        <section className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">কোর্সসমূহ</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">সকল কোর্সের তালিকা দেখুন এবং ভর্তি হোন</p>
            </div>
          </div>

          <div className="p-6">
            {teacher.courses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teacher.courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/course/${course.slug || course.id}`}
                    className="group flex flex-col rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    {course.thumbnail ? (
                      <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
                        <Image
                          src={resolveAttachmentUrl(course.thumbnail, API_ORIGIN)}
                          alt={course.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-linear-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-indigo-200" />
                      </div>
                    )}
                    <div className="p-4 flex flex-col flex-1 gap-2">
                      <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                        {course.name}
                      </p>
                      {course.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">{course.description}</p>
                      )}
                      {course.fee != null && course.fee !== '' && !Number.isNaN(Number(course.fee)) && (
                        <p className="text-sm font-black text-indigo-600 mt-auto">
                          ৳{Number(course.fee).toLocaleString('bn-BD')}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                        বিস্তারিত দেখুন <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-300">
                <BookOpen className="h-12 w-12 opacity-30" />
                <p className="text-sm font-black text-slate-400">এখানে কোর্স প্রদর্শিত হবে</p>
                <p className="text-xs text-slate-300">শীঘ্রই কোর্স যোগ হবে</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
