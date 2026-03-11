'use client';

import { Program } from '@/types/course';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Clock, 
  Info,
  Users,
  ChevronRight,
  TrendingUp,
  Box
} from 'lucide-react';

interface ProgramDetailsViewProps {
  program: Program & { courses?: any[]; _count?: { courses: number } };
}

export function ProgramDetailsView({ program }: ProgramDetailsViewProps) {
  const courseCount = program._count?.courses || program.courses?.length || 0;

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar">
        {/* Header Hero Section */}
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-50/50 p-8 shadow-sm mb-10">
           <div className="absolute top-[-10%] right-[-5%] h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl" />
           
           <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                 <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-slate-200 text-indigo-600 shadow-sm">
                    <GraduationCap className="h-6 w-6" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Academic Program</span>
                    <span className="text-[10px] font-bold text-slate-400">ID: {program.id.slice(0, 12)}...</span>
                 </div>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">
                {program.name}
              </h2>
           </div>
        </div>

        {/* Analytics & Meta Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
           <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md group">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
                 <BookOpen className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Courses</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{courseCount}</p>
           </div>

           <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md group">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
                 <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Creation Date</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {new Date(program.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
           </div>

           <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md group col-span-2 md:col-span-1">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 transition-transform group-hover:scale-110">
                 <Box className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Managed</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {new Date(program.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
           </div>
        </div>

        {/* Content Section */}
        <div className="grid gap-10 lg:grid-cols-5">
           <div className="lg:col-span-3 space-y-8">
              <div>
                 <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4">
                    <Info className="h-4 w-4" />
                    Program Scope
                 </h3>
                 <div className="prose prose-slate max-w-none">
                    <p className="text-base font-medium leading-relaxed text-slate-600 bg-slate-50/50 p-6 rounded-[28px] border border-slate-100 min-h-[120px]">
                       {program.description || 'No formal description has been outlined for this academic program yet.'}
                    </p>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-2 space-y-8">
              <div>
                 <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                    Associated Curriculum
                 </h3>
                 <div className="space-y-3">
                    {program.courses && program.courses.length > 0 ? (
                      program.courses.map((course: any) => (
                        <div key={course.id} className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
                           <div className="flex flex-col">
                              <span className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{course.name}</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{course.code}</span>
                           </div>
                           <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-all group-hover:translate-x-1" />
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center p-10 rounded-3xl border border-dashed border-slate-200 bg-slate-50">
                         <BookOpen className="h-8 w-8 text-slate-300 mb-3" />
                         <p className="text-base font-bold text-slate-400">No courses linked yet</p>
                      </div>
                    )}
                 </div>
              </div>

              {/* Action Prompt */}
              <div className="rounded-[32px] bg-slate-900 p-6 text-white shadow-xl shadow-slate-200">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Platform Context</p>
                 <p className="text-base font-bold leading-relaxed">
                   This program acts as a root container for curriculum organization.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
