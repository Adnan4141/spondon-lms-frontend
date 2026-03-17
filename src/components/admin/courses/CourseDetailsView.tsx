'use client';

import React, { useState, useEffect } from 'react';
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
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Link2,
  FileUp,
  Video,
  Eye,
  FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  getCourseContents, 
  deleteCourseContent, 
  getAssociatedCourses, 
  deleteAssociatedCourse,
  getCourses 
} from '@/lib/api/courses';
import { getCourseSchedules, createCourseSchedule, deleteCourseSchedule } from '@/lib/api/course-schedules';
import { useToast } from '@/hooks/use-toast';
import { CourseResourceForm } from './CourseResourceForm';
import { CourseAssociationForm } from './CourseAssociationForm';
import { CourseScheduleSection } from './CourseScheduleSection';

interface CourseDetailsViewProps {
  course: CourseDetails;
}

function getStatusBadgeClass(status: string) {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-black';
  if (status === 'DISABLED') return 'bg-amber-50 text-amber-700 border-amber-100 font-black';
  if (status === 'ARCHIVED') return 'bg-slate-100 text-slate-600 border-slate-200 font-black';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'VIDEO': return <Video className="h-4 w-4" />;
    case 'SYLLABUS': return <FileCheck className="h-4 w-4" />;
    case 'LEAFLET': return <Eye className="h-4 w-4" />;
    case 'SCHEDULE': return <Calendar className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};

export function CourseDetailsView({ course }: CourseDetailsViewProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'info' | 'resources' | 'schedule' | 'links'>('info');
  const [resources, setResources] = useState<any[]>([]);
  const [associations, setAssociations] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [showAssociationForm, setShowAssociationForm] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const outline = course.outline as any;

  const fetchData = async () => {
    try {
      setLoading(true);
      const identifier = course.slug || course.id;
      const [resRes, assocRes, coursesRes, schedRes] = await Promise.all([
        getCourseContents({ courseId: identifier }),
        getAssociatedCourses({ fromCourseId: identifier }),
        getCourses({}),
        getCourseSchedules(course.id)
      ]);
      if (resRes.success) setResources(resRes.data || []);
      if (assocRes.success) setAssociations(assocRes.data || []);
      if (coursesRes.success) setAllCourses(coursesRes.data || []);
      if (schedRes.success) setSchedules(schedRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [course.id, course.slug]);

  const handleDeleteResource = async (id: string) => {
    if (!confirm('Permanently remove this resource?')) return;
    const res = await deleteCourseContent(id);
    if (res.success) {
      toast({ title: 'Deleted', description: 'Resource removed successfully' });
      fetchData();
    }
  };

  const handleDeleteAssociation = async (id: string) => {
    if (!confirm('Remove this course connection?')) return;
    const res = await deleteAssociatedCourse(id);
    if (res.success) {
      toast({ title: 'Connection Severed', description: 'Association removed successfully' });
      fetchData();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      {/* Navigation Header */}
      <div className="px-8 pt-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
         <div className="flex gap-8">
            {[
              { id: 'info', label: 'Primary Intelligence', icon: Info },
              { id: 'resources', label: 'Course Assets', icon: FileUp },
              { id: 'schedule', label: 'Schedule', icon: Calendar },
              { id: 'links', label: 'Strategic Linkages', icon: Link2 },
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
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
              </button>
            ))}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar">
        {activeTab === 'info' && (
          <div className="animate-in fade-in duration-500">
            {/* Top Header Card */}
            <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-50/50 p-8 shadow-sm mb-10 flex flex-col md:flex-row gap-8">
               {course.thumbnail && (
                 <div className="w-full md:w-48 h-48 rounded-2xl overflow-hidden shadow-lg border border-white shrink-0">
                    <img src={course.thumbnail} alt={course.name} className="w-full h-full object-cover" />
                 </div>
               )}
               
               <div className="relative flex-1">
                  <div className="absolute top-0 right-0">
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

            <div className="grid gap-10 md:grid-cols-2">
               <div className="space-y-6">
                  <div>
                     <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4">
                        <Info className="h-4 w-4" />
                        Course Description
                     </h3>
                     <div 
                        className="text-base font-medium leading-relaxed text-slate-600 bg-slate-50/50 p-6 rounded-[24px] border border-slate-100 prose"
                        dangerouslySetInnerHTML={{ __html: course.description || 'No description provided for this course.' }}
                     />
                  </div>
               </div>
               <div className="space-y-6">
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
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h3 className="text-xl font-black tracking-tight">Course Schedule / Timeline</h3>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Class routine / milestones</p>
            <CourseScheduleSection courseId={course.id} schedules={schedules} onRefresh={fetchData} />
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between mb-2">
               <div>
                  <h3 className="text-xl font-black tracking-tight">Course Asset Repository</h3>
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mt-1">Syllabus, Leaflets, & Learning Material</p>
               </div>
               {!showResourceForm && (
                 <Button onClick={() => { setEditingResource(null); setShowResourceForm(true); }} className="h-10 rounded-xl bg-slate-900 font-black uppercase tracking-widest text-[10px]">
                    <Plus className="mr-2 h-4 w-4" /> Deploy Resource
                 </Button>
               )}
            </div>

            {showResourceForm && (
              <CourseResourceForm 
                courseId={course.id} 
                resource={editingResource}
                onSuccess={() => { setShowResourceForm(false); fetchData(); }}
                onCancel={() => setShowResourceForm(false)}
              />
            )}

            <div className="grid gap-4">
               {resources.map(res => (
                 <div key={res.id} className="group flex items-center justify-between p-6 rounded-[28px] border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-xl transition-all">
                    <div className="flex items-center gap-5">
                       <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shadow-inner">
                          {getResourceIcon(res.type)}
                       </div>
                       <div>
                          <div className="flex items-center gap-2">
                             <h4 className="text-base font-black text-slate-800">{res.title}</h4>
                             <Badge variant="outline" className="text-[8px] font-black uppercase bg-slate-50">{res.type}</Badge>
                             {res.isFree && <Badge className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm">Free_Access</Badge>}
                          </div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1">
                             {res.fileUrl ? 'Media Attachment Verified' : 'Text Content Analysis'} • Sort: {res.sortOrder}
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       {res.fileUrl && (
                         <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200" onClick={() => window.open(res.fileUrl, '_blank')}>
                            <ExternalLink className="h-4 w-4 text-indigo-500" />
                         </Button>
                       )}
                       <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200" onClick={() => { setEditingResource(res); setShowResourceForm(true); }}>
                          <FileText className="h-4 w-4 text-amber-500" />
                       </Button>
                       <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 hover:bg-rose-50 hover:border-rose-200" onClick={() => handleDeleteResource(res.id)}>
                          <Trash2 className="h-4 w-4 text-rose-500" />
                       </Button>
                    </div>
                 </div>
               ))}
               {resources.length === 0 && !showResourceForm && (
                 <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[40px]">
                    <FileText className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Repository is Empty</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between mb-2">
               <div>
                  <h3 className="text-xl font-black tracking-tight text-indigo-900">Strategic Linkages</h3>
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mt-1">Related and Sequential Pathways</p>
               </div>
               {!showAssociationForm && (
                 <Button onClick={() => setShowAssociationForm(true)} className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-[10px]">
                    <Link2 className="mr-2 h-4 w-4" /> Establish Link
                 </Button>
               )}
            </div>

            {showAssociationForm && (
              <CourseAssociationForm 
                fromCourseId={course.id} 
                courses={allCourses}
                onSuccess={() => { setShowAssociationForm(false); fetchData(); }}
                onCancel={() => setShowAssociationForm(false)}
              />
            )}

            <div className="grid gap-6 sm:grid-cols-2">
               {associations.map(assoc => (
                 <div key={assoc.id} className="group p-6 rounded-[32px] border border-slate-100 bg-white hover:border-indigo-200 shadow-sm hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                       <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-black text-[9px] uppercase px-3 py-1">
                          {assoc.type}
                       </Badge>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-500" onClick={() => handleDeleteAssociation(assoc.id)}>
                          <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="h-14 w-14 rounded-[20px] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                          <BookOpen className="h-7 w-7" />
                       </div>
                       <div>
                          <h4 className="text-lg font-black text-slate-800 tracking-tight">{assoc.toCourse?.name}</h4>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{assoc.toCourse?.code}</p>
                       </div>
                    </div>
                 </div>
               ))}
               {associations.length === 0 && !showAssociationForm && (
                 <div className="sm:col-span-2 p-20 text-center border-2 border-dashed border-slate-100 rounded-[40px]">
                    <Link2 className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">No established linkages</p>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
