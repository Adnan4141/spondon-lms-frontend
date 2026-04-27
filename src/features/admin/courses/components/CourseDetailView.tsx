'use client';

import { BookOpen, ChevronRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Course } from '@/types/course';
import { CourseContentTab } from './CourseContentTab';

export function CourseDetailView({ course, onBack }: { course: Course; onBack: () => void }) {
  const typeCfg = course.type === 'OFFLINE'
    ? { label: 'Offline', tc: 'text-amber-600', bg: 'bg-amber-50' }
    : { label: 'Online',  tc: 'text-blue-600',  bg: 'bg-blue-50'  };
  const statusCfg = course.status === 'ACTIVE'
    ? { tc: 'text-emerald-600', bg: 'bg-emerald-50' }
    : { tc: 'text-slate-500',   bg: 'bg-slate-100'  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <Button variant="outline" onClick={onBack} className="gap-1.5 text-sm h-8 px-3">
          <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Courses
        </Button>
        <span className="text-slate-400 text-sm">/</span>
        <span className="text-sm font-bold text-slate-700">{course.name}</span>
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold', typeCfg.bg, typeCfg.tc)}>{typeCfg.label}</span>
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold', statusCfg.bg, statusCfg.tc)}>{course.status}</span>
      </div>
      <div className="rounded-xl p-5 mb-5 flex items-center gap-4" style={{ background: '#0f172a' }}>
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <BookOpen className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-white truncate">{course.name}</h2>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-sm text-white/50">{(course as Course & { program?: { name: string } }).program?.name ?? course.programId}</span>
            <span className="text-sm font-bold text-rose-400">৳{Number(course.fee).toLocaleString()}/mo</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-white/40 uppercase tracking-widest">slug</p>
          <p className="font-mono text-xs font-bold text-slate-300 mt-0.5">{course.slug}</p>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-black text-slate-900">Course Content</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">Organize subjects, chapters, and lecture materials</p>
        <CourseContentTab courseId={course.id} />
      </div>
    </div>
  );
}

// ─── COURSES LIST VIEW (TABLE) ────────────────────────────────────────────────
