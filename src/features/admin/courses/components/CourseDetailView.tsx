'use client';

import { useEffect, useState } from 'react';
import { BookOpen, ChevronRight, GraduationCap, Info, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCourseById } from '@/lib/api/courses';
import type { Course } from '@/types/course';
import { CourseContentTab } from './CourseContentTab';

export function CourseDetailView({ course, onBack }: { course: Course; onBack: () => void }) {
  const [curriculumNodeCount, setCurriculumNodeCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCourseById(course.id).then((res) => {
      if (cancelled || !res.success || !res.data) return;
      const n = (res.data as Course).curriculumNodeCount;
      setCurriculumNodeCount(typeof n === 'number' ? n : 0);
    });
    return () => {
      cancelled = true;
    };
  }, [course.id]);

  const hasCurriculum = (curriculumNodeCount ?? 0) > 0;
  const typeCfg = course.type === 'OFFLINE'
    ? { label: 'Offline', tc: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' }
    : { label: 'Online',  tc: 'text-blue-700',  bg: 'bg-blue-50',  border: 'border-blue-200'  };
  const statusCfg = course.status === 'ACTIVE'
    ? { tc: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' }
    : { tc: 'text-slate-500',   bg: 'bg-slate-100',  border: 'border-slate-200',   dot: 'bg-slate-400'   };

  return (
    <div className="space-y-5">
      {/* ─── Breadcrumb ───────────────────────────────────────────────── */}
      <nav aria-label="breadcrumb" className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          onClick={onBack}
          className="gap-1.5 text-sm h-8 px-3 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Courses
        </Button>
        <span className="text-slate-300 text-sm select-none">/</span>
        <span className="text-sm font-bold text-slate-700 truncate max-w-[200px] sm:max-w-none">{course.name}</span>
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border',
          typeCfg.bg, typeCfg.tc, typeCfg.border,
        )}>
          {typeCfg.label}
        </span>
        <span className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border',
          statusCfg.bg, statusCfg.tc, statusCfg.border,
        )}>
          <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
          {course.status}
        </span>
      </nav>

      {/* ─── Hero Card ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex items-start gap-4 sm:gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-black text-white truncate">{course.name}</h2>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-sm text-white/50">
                {(course as Course & { program?: { name: string } }).program?.name ?? course.programId}
              </span>
              <span className="h-4 w-px bg-white/15" />
              <span className="text-sm font-bold text-rose-400">৳{Number(course.fee).toLocaleString()}/mo</span>
              {course.grade && (
                <>
                  <span className="h-4 w-px bg-white/15" />
                  <span className="text-xs text-white/40">Grade {course.grade}</span>
                </>
              )}
              {course.group && (
                <>
                  <span className="h-4 w-px bg-white/15" />
                  <span className="text-xs text-white/40">{course.group}</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right shrink-0 hidden sm:block">
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">slug</p>
            <p className="font-mono text-xs font-bold text-slate-300 mt-0.5">{course.slug}</p>
          </div>
        </div>
      </div>

      {/* ─── Content Section ──────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
            <Layers className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Course Content</h3>
            <p className="text-[11px] text-slate-400">Manage modules, sections, and lesson materials</p>
          </div>
        </div>

        <div className="mt-4">
          {curriculumNodeCount === null ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-slate-100"
                  style={{ animationDelay: `${i * 100}ms`, width: `${100 - i * 5}%` }}
                />
              ))}
            </div>
          ) : hasCurriculum ? (
            <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/80 to-violet-50/40 px-5 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 mt-0.5">
                  <Info className="h-4.5 w-4.5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-bold text-indigo-900 text-sm">Structured curriculum builder is active</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    Modules, sections, lessons, and resources are managed in the course editor under the{' '}
                    <span className="font-semibold text-slate-800">Content</span> tab. The legacy content list
                    is hidden to avoid duplicate structures.
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Open <span className="font-semibold">Edit course</span> → <span className="font-semibold">Content</span> tab to manage the curriculum.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <CourseContentTab courseId={course.id} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COURSES LIST VIEW (TABLE) ────────────────────────────────────────────────
