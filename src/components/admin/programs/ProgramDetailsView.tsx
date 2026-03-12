'use client';

import React, { useState, useEffect } from 'react';
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
  Box,
  Plus,
  Trash2,
  ExternalLink,
  Link2,
  Search,
  LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProgramById } from '@/lib/api/programs';
import { updateCourse } from '@/lib/api/courses';
import { useToast } from '@/hooks/use-toast';
import { LinkCourseForm } from './LinkCourseForm';

interface ProgramDetailsViewProps {
  program: Program & { courses?: any[]; _count?: { courses: number } };
}

export function ProgramDetailsView({ program: initialProgram }: ProgramDetailsViewProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'info' | 'courses'>('info');
  const [program, setProgram] = useState(initialProgram);
  const [loading, setLoading] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);

  const fetchProgramData = async () => {
    try {
      setLoading(true);
      const res = await getProgramById(program.id);
      if (res.success && res.data) setProgram(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleUnlinkCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to remove this course from the program? Note: Courses require a program, so this will need reassignment later.')) return;
    
    try {
      // In this system, courses MUST have a program. 
      // Unlinking here without a target program might be problematic if the backend enforces it.
      // But we'll try to update it to null if supported, or just show a message.
      toast({ title: 'Restriction', description: 'Courses must belong to a program. Please reassign from the Courses module.', variant: 'destructive' });
    } catch (err) { console.error(err); }
  };

  const courseCount = program._count?.courses || program.courses?.length || 0;

  return (
    <div className="flex flex-col h-[80vh] bg-white text-slate-900">
      {/* Tab Navigation */}
      <div className="px-8 pt-6 border-b border-slate-100 flex gap-8 bg-slate-50/30 shrink-0">
        {[
          { id: 'info', label: 'Primary Intelligence', icon: Info },
          { id: 'courses', label: 'Embedded Courses', icon: LayoutGrid },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center gap-2",
              activeTab === tab.id ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full shadow-[0_-2px_10px_rgba(79,70,229,0.4)]" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar">
        {activeTab === 'info' && (
          <div className="animate-in fade-in duration-500">
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

            <div className="space-y-6">
               <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4">
                  <Info className="h-4 w-4" />
                  Program Scope
               </h3>
               <p className="text-base font-medium leading-relaxed text-slate-600 bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 min-h-[120px]">
                  {program.description || 'No formal description has been outlined for this academic program yet.'}
               </p>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between mb-2">
               <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900">Embedded Curriculum</h3>
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mt-1">Manage courses associated with this program</p>
               </div>
               {!showLinkForm && (
                 <Button onClick={() => setShowLinkForm(true)} className="h-10 rounded-xl bg-slate-900 font-black uppercase tracking-widest text-[10px]">
                    <Plus className="mr-2 h-4 w-4" /> Embed Course
                 </Button>
               )}
            </div>

            {showLinkForm && (
              <LinkCourseForm 
                programId={program.id} 
                onSuccess={() => { setShowLinkForm(false); fetchProgramData(); }}
                onCancel={() => setShowLinkForm(false)}
              />
            )}

            <div className="grid gap-4">
               {program.courses && program.courses.length > 0 ? (
                 program.courses.map((course: any) => (
                   <div key={course.id} className="group flex items-center justify-between p-6 rounded-[28px] border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-xl transition-all">
                      <div className="flex items-center gap-5">
                         <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner font-black text-xs">
                            {course.code.charAt(0)}
                         </div>
                         <div>
                            <h4 className="text-base font-black text-slate-800">{course.name}</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{course.code} • {course.type}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200" onClick={() => handleUnlinkCourse(course.id)}>
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remove
                         </Button>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/30">
                    <BookOpen className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">No courses embedded in this program</p>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
