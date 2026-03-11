'use client';

import { CourseDetails } from '@/types/course';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Users, 
  GraduationCap, 
  Info,
  DollarSign,
  Monitor,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface CourseDetailsViewProps {
  course: CourseDetails;
}

function getStatusBadgeClass(status: string) {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black';
  if (status === 'DISABLED') return 'bg-amber-50 text-amber-700 border-amber-100 font-black';
  if (status === 'ARCHIVED') return 'bg-slate-100 text-slate-600 border-slate-200 font-black';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

function getTypeBadgeClass(type: string) {
  if (type === 'ONLINE') return 'bg-blue-50 text-blue-700 border-blue-100 font-black';
  if (type === 'OFFLINE') return 'bg-violet-50 text-violet-700 border-violet-100 font-black';
  return 'bg-slate-50 text-slate-600 border-slate-100 font-black';
}


export function CourseDetailsView({ course }: CourseDetailsViewProps) {
  const outline = course.outline as any;

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar">
        {/* Top Header Card */}
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-50/50 p-8 shadow-sm mb-10">
           <div className="absolute top-0 right-0 p-6">
              <Badge variant="outline" className={cn("rounded-xl px-4 py-2 text-[10px] uppercase tracking-widest", getStatusBadgeClass(course.status))}>
                {course.status}
              </Badge>
           </div>
           
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-slate-200 text-indigo-600 shadow-sm">
                    <BookOpen className="h-5 w-5" />
                 </div>
                 <span className="font-mono text-base font-black text-slate-400 tracking-tighter">{course.code}</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">{course.name}</h2>
              <div className="flex flex-wrap gap-4 pt-2">
                 <div className="flex items-center gap-2 text-base font-bold text-slate-500">
                    <GraduationCap className="h-4 w-4 text-indigo-500" />
                    {course.program?.name}
                 </div>
                 <div className="h-4 w-[1px] bg-slate-200" />
                 <div className="flex items-center gap-2 text-base font-bold text-slate-500">
                    <Monitor className="h-4 w-4 text-emerald-500" />
                    {course.type}
                 </div>
              </div>
           </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
           {[
             { label: 'Enrollments', value: course._count?.enrollments || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
             { label: 'Tuition Fee', value: `৳${Number(course.fee).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
             { label: 'Classes', value: outline?.totalClasses || 'N/A', icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50' },
             { label: 'Duration', value: outline?.duration || 'N/A', icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
           ].map((stat, i) => (
             <div key={i} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-2xl", stat.bg, stat.color)}>
                   <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="mt-1 text-xl font-black text-slate-900">{stat.value}</p>
             </div>
           ))}
        </div>

        {/* Detailed Sections */}
        <div className="grid gap-10 md:grid-cols-2">
           <div className="space-y-6">
              <div>
                 <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4">
                    <Info className="h-4 w-4" />
                    Course Description
                 </h3>
                 <p className="text-base font-medium leading-relaxed text-slate-600 bg-slate-50/50 p-6 rounded-[24px] border border-slate-100">
                    {course.description || 'No description provided for this course.'}
                 </p>
              </div>

              <div>
                 <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-4">
                    <CheckCircle2 className="h-4 w-4" />
                    Admission Info
                 </h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl">
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Phase</p>
                       <p className="text-base font-bold text-slate-900 mt-1">{course.admissionStatus}</p>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl">
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Billing</p>
                       <p className="text-base font-bold text-slate-900 mt-1">{course.billingType}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div>
                 <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-violet-600 mb-4">
                    <FileText className="h-4 w-4" />
                    Curriculum Highlights
                 </h3>
                 <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white group hover:border-violet-200 transition-all">
                       <span className="text-base font-bold text-slate-500">Instructor</span>
                       <span className="text-base font-black text-slate-900">{outline?.instructor || 'TBA'}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white group hover:border-violet-200 transition-all">
                       <span className="text-base font-bold text-slate-500">Schedule</span>
                       <span className="text-base font-black text-slate-900">{outline?.schedule || 'Flexible'}</span>
                    </div>
                    
                    <div className="pt-4">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Prerequisites</p>
                       <div className="flex flex-wrap gap-2">
                          {outline?.prerequisites?.length > 0 ? (
                            outline.prerequisites.map((p: string, i: number) => (
                              <Badge key={i} variant="outline" className="rounded-lg bg-slate-50 border-slate-200 text-slate-600 font-bold px-3 py-1 text-[10px]">
                                {p}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-base font-medium text-slate-400 italic">No prerequisites required.</span>
                          )}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="rounded-[28px] border border-indigo-100 bg-indigo-50/30 p-6">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                       {course._count?.enrollments || 0}
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Active Students</p>
                       <p className="text-base font-medium text-indigo-400">Currently enrolled in this course</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
