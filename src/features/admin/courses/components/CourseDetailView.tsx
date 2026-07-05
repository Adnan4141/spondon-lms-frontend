'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronRight, GraduationCap, Layers, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCourseById, getCourseContents } from '@/lib/api/courses';
import { getCurriculumTree } from '@/lib/api/curriculum';
import type { Course } from '@/types/course';
import { CurriculumAdminView } from '@/features/admin/curriculum/CurriculumAdminView';
import { countCurriculumStats } from '@/features/admin/curriculum/curriculum-stats-utils';
import type { CurriculumTreeNode } from '@/features/admin/curriculum/curriculum-types';
import { CourseContentTab } from './CourseContentTab';
import { groupContents } from '../courseUtils';

type ContentStats = {
  subjectCount: number;
  chapterCount: number;
  lessonCount: number;
  videoCount: number;
};

function countLegacyContentStats(items: Awaited<ReturnType<typeof getCourseContents>>['data']): ContentStats {
  const list = items ?? [];
  const subjects = groupContents(list);
  const chapterCount = subjects.reduce((n, s) => n + s.chapters.length, 0);
  const videoCount = list.filter((item) => item.type === 'VIDEO').length;
  return {
    subjectCount: subjects.filter((s) => s.name !== '(No Subject)').length,
    chapterCount,
    lessonCount: list.length,
    videoCount,
  };
}

function CourseContentStatsBar({ stats }: { stats: ContentStats }) {
  const cards = [
    { label: 'Subjects', val: stats.subjectCount, icon: BookOpen },
    { label: 'Chapters', val: stats.chapterCount, icon: Layers },
    { label: 'Lessons', val: stats.lessonCount, icon: GraduationCap },
    { label: 'Videos', val: stats.videoCount, icon: PlayCircle },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(({ label, val, icon: Icon }) => (
        <div
          key={label}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 text-white/50">
            <Icon className="h-3.5 w-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
          </div>
          <p className="mt-1 text-2xl font-black text-white">{val}</p>
        </div>
      ))}
    </div>
  );
}

export function CourseDetailView({ course, onBack }: { course: Course; onBack: () => void }) {
  const [curriculumNodeCount, setCurriculumNodeCount] = useState<number | null>(null);
  const [curriculumTree, setCurriculumTree] = useState<CurriculumTreeNode[]>([]);
  const [legacyStats, setLegacyStats] = useState<ContentStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const res = await getCourseById(course.id);
      if (cancelled || !res.success || !res.data) return;

      const loaded = res.data as Course;
      const nodeCount = typeof loaded.curriculumNodeCount === 'number' ? loaded.curriculumNodeCount : 0;
      setCurriculumNodeCount(nodeCount);

      if (nodeCount > 0) {
        const treeRes = await getCurriculumTree(course.id);
        if (!cancelled && treeRes.success && treeRes.data) {
          setCurriculumTree(((treeRes.data as { tree?: CurriculumTreeNode[] }).tree ?? []) as CurriculumTreeNode[]);
        }
      } else {
        const contentsRes = await getCourseContents({ courseId: course.id });
        if (!cancelled) {
          setLegacyStats(countLegacyContentStats(contentsRes.data));
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [course.id]);

  const hasCurriculum = (curriculumNodeCount ?? 0) > 0;

  const contentStats = useMemo(() => {
    if (hasCurriculum) {
      const stats = countCurriculumStats(curriculumTree);
      return {
        subjectCount: stats.subjectCount,
        chapterCount: stats.chapterCount,
        lessonCount: stats.lessonCount,
        videoCount: stats.videoCount,
      };
    }
    return legacyStats;
  }, [curriculumTree, hasCurriculum, legacyStats]);

  const typeCfg = course.type === 'OFFLINE'
    ? { label: 'Offline', tc: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' }
    : { label: 'Online', tc: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
  const statusCfg = course.status === 'ACTIVE'
    ? { tc: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' }
    : { tc: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200', dot: 'bg-slate-400' };

  return (
    <div className="space-y-5">
      <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-8 gap-1.5 rounded-lg border-slate-200 px-3 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Courses
        </Button>
        <span className="select-none text-sm text-slate-300">/</span>
        <span className="max-w-[200px] truncate text-sm font-bold text-slate-700 sm:max-w-none">{course.name}</span>
        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold', typeCfg.bg, typeCfg.tc, typeCfg.border)}>
          {typeCfg.label}
        </span>
        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold', statusCfg.bg, statusCfg.tc, statusCfg.border)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
          {course.status}
        </span>
      </nav>

      <div
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative space-y-5">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-black text-white sm:text-xl">{course.name}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                <span className="text-sm text-white/50">
                  {(course as Course & { program?: { name: string } }).program?.name ?? course.programId}
                </span>
                <span className="h-4 w-px bg-white/15" />
                <span className="text-sm font-bold text-rose-400">৳{Number(course.fee).toLocaleString()}/mo</span>
                {course.grade ? (
                  <>
                    <span className="h-4 w-px bg-white/15" />
                    <span className="text-xs text-white/40">Grade {course.grade}</span>
                  </>
                ) : null}
                {course.group ? (
                  <>
                    <span className="h-4 w-px bg-white/15" />
                    <span className="text-xs text-white/40">{course.group}</span>
                  </>
                ) : null}
              </div>
            </div>
            <div className="hidden shrink-0 text-right sm:block">
              <p className="text-[10px] font-medium uppercase tracking-widest text-white/40">slug</p>
              <p className="mt-0.5 font-mono text-xs font-bold text-slate-300">{course.slug}</p>
            </div>
          </div>

          {contentStats ? <CourseContentStatsBar stats={contentStats} /> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
            <Layers className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">
              {hasCurriculum ? 'Subjects & Curriculum' : 'Course Content'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {hasCurriculum
                ? 'Manage subjects, chapters, lessons, and resources — same structure students see in their course hub.'
                : 'Manage subjects, chapters, and lesson materials'}
            </p>
          </div>
        </div>

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
          <div className="min-h-[640px] overflow-hidden rounded-xl border border-slate-200">
            <CurriculumAdminView
              courseId={course.id}
              courseNameOverride={course.name}
              variant="embedded"
            />
          </div>
        ) : (
          <CourseContentTab courseId={course.id} />
        )}
      </div>
    </div>
  );
}
