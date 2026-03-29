'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  FileCheck,
  ChevronDown,
  ChevronRight,
  Play,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  getCourseContents, 
  deleteCourseContent, 
  getAssociatedCourses, 
  deleteAssociatedCourse,
  getCourses,
  addCourseTeacher,
  removeCourseTeacher,
} from '@/lib/api/courses';
import { getUsers } from '@/lib/api/users';
import type { CourseDetailTeacher } from '@/types/course';
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
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [addingToChapter, setAddingToChapter] = useState<string | null>(null);
  const [addingChapterOrder, setAddingChapterOrder] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [teacherPick, setTeacherPick] = useState('');
  const [teachersPool, setTeachersPool] = useState<{ id: string; fullName: string; email?: string }[]>([]);
  const [assignedTeachers, setAssignedTeachers] = useState<CourseDetailTeacher[]>(() => course.teachers || []);
  const [teacherActionLoading, setTeacherActionLoading] = useState(false);

  const outline = course.outline as any;

  useEffect(() => {
    setAssignedTeachers(course.teachers || []);
  }, [course.id, course.teachers?.length]);

  useEffect(() => {
    if (activeTab !== 'info') return;
    let cancelled = false;
    (async () => {
      const res = await getUsers({ role: 'TEACHER', status: 'ACTIVE', limit: 200 });
      if (!cancelled && res.success && res.data) setTeachersPool(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const identifier = course.slug || course.id;
      const [resRes, assocRes, coursesRes, schedRes] = await Promise.all([
        getCourseContents({ courseId: identifier }),
        getAssociatedCourses({ fromCourseId: course.id }),
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
    if (!confirm('Remove this resource?')) return;
    const res = await deleteCourseContent(id);
    if (res.success) {
      toast({ title: 'Deleted', description: 'Resource removed' });
      fetchData();
    }
  };

  const handleDeleteAssociation = async (id: string) => {
    if (!confirm('Remove this link?')) return;
    const res = await deleteAssociatedCourse(id);
    if (res.success) {
      toast({ title: 'Removed', description: 'Link removed' });
      fetchData();
    }
  };

  const toggleChapter = (chapter: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapter]: !prev[chapter] }));
  };

  const closeResourceForm = () => {
    setShowResourceForm(false);
    setEditingResource(null);
    setAddingToChapter(null);
    setAddingChapterOrder(null);
  };

  const assignableTeachers = teachersPool.filter(
    (t) => !assignedTeachers.some((a) => a.teacher?.id === t.id)
  );

  const handleAssignTeacher = async () => {
    if (!teacherPick) return;
    setTeacherActionLoading(true);
    try {
      const res = await addCourseTeacher(course.id, teacherPick);
      if (res.success && res.data) {
        const row = res.data as { id: string; teacher?: CourseDetailTeacher['teacher'] };
        setAssignedTeachers((prev) => [...prev, { id: row.id, teacher: row.teacher }]);
        setTeacherPick('');
        toast({ title: 'Teacher assigned', variant: 'success' });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to assign';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setTeacherActionLoading(false);
    }
  };

  const handleRemoveTeacher = async (teacherUserId: string) => {
    if (!confirm('Remove this teacher from the course?')) return;
    setTeacherActionLoading(true);
    try {
      const res = await removeCourseTeacher(course.id, teacherUserId);
      if (res.success) {
        setAssignedTeachers((prev) => prev.filter((a) => a.teacher?.id !== teacherUserId));
        toast({ title: 'Teacher removed' });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to remove';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setTeacherActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      {/* Navigation Header */}
      <div className="px-8 pt-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
         <div className="flex items-center gap-6">
         <div className="flex gap-8">
            {[
              { id: 'info', label: 'Info', icon: Info },
              { id: 'resources', label: 'Course Content', icon: FileUp },
              { id: 'schedule', label: 'Schedule', icon: Calendar },
              { id: 'links', label: 'Related Courses', icon: Link2 },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "pb-4 text-sm font-bold transition-all relative flex items-center gap-2",
                  activeTab === tab.id ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
              </button>
            ))}
         </div>
         {course.slug && (
           <Link
             href={`/course/${course.slug}`}
             target="_blank"
             rel="noopener noreferrer"
             className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-black transition-colors"
           >
             <ExternalLink className="h-4 w-4" /> View on website
           </Link>
         )}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar">
        {activeTab === 'info' && (
          <div className="animate-in fade-in duration-500">
            {/* Top Header Card */}
            <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-50/50 p-8 shadow-sm mb-10 flex flex-col md:flex-row gap-8">
               {course.thumbnail && (
                 <div className="w-full md:w-48 h-48 rounded-2xl overflow-hidden shadow-lg border border-white shrink-0">
                    <img src={course.thumbnail || 'https://placehold.co/800x450?text=Course'} alt={course.name} className="w-full h-full object-cover" />
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
                 { label: 'Enrolled', value: course._count?.enrollments || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                 { label: 'Fee', value: `৳${Number(course.fee).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                 { label: 'Classes', value: outline?.totalClasses || 'N/A', icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50' },
                 { label: 'Duration', value: outline?.duration || 'N/A', icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
               ].map((stat, i) => (
                 <div key={i} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                    <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-2xl", stat.bg, stat.color)}>
                       <stat.icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-500">{stat.label}</p>
                    <p className="mt-1 text-xl font-black text-slate-900">{stat.value}</p>
                 </div>
               ))}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm mb-10">
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-800 mb-4">
                <Users className="h-4 w-4 text-indigo-600" />
                Teachers assigned
              </h3>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <Select value={teacherPick || undefined} onValueChange={setTeacherPick}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 font-bold flex-1">
                    <SelectValue placeholder="Select teacher to assign" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-64">
                    {assignableTeachers.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="font-medium">
                        {t.fullName}
                        {t.email ? ` · ${t.email}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  disabled={!teacherPick || teacherActionLoading || assignableTeachers.length === 0}
                  className="h-11 rounded-xl font-black uppercase text-xs shrink-0"
                  onClick={handleAssignTeacher}
                >
                  Assign
                </Button>
              </div>
              {assignedTeachers.length === 0 ? (
                <p className="text-sm text-slate-500 font-medium">No teachers assigned yet.</p>
              ) : (
                <ul className="space-y-2">
                  {assignedTeachers.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-2.5"
                    >
                      <span className="font-bold text-slate-800">{row.teacher?.fullName || '—'}</span>
                      {row.teacher?.id ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-rose-600"
                          disabled={teacherActionLoading}
                          onClick={() => handleRemoveTeacher(row.teacher.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-10 md:grid-cols-2">
               <div className="space-y-6">
                  <div>
                     <h3 className="flex items-center gap-2 text-sm font-bold text-indigo-600 mb-4">
                        <Info className="h-4 w-4" />
                        Description
                     </h3>
                     <div 
                        className="text-base font-medium leading-relaxed text-slate-600 bg-slate-50/50 p-6 rounded-[24px] border border-slate-100 prose"
                        dangerouslySetInnerHTML={{ __html: course.description || 'No description.' }}
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
                           <p className="text-xs font-bold text-indigo-600">Enrolled</p>
                           <p className="text-sm font-medium text-indigo-400">Students in this course</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h3 className="text-xl font-bold tracking-tight">Schedule</h3>
            <p className="text-sm text-slate-500">Class routine</p>
            <CourseScheduleSection courseId={course.id} schedules={schedules} onRefresh={fetchData} />
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between">
               <div>
                  <h3 className="text-xl font-bold tracking-tight">Course Content</h3>
                  <p className="text-sm text-slate-500 mt-1">Chapters, segments &amp; materials</p>
               </div>
               <Button onClick={() => { setEditingResource(null); setAddingToChapter(null); setAddingChapterOrder(null); setShowResourceForm(true); }} className="h-10 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800">
                  <Plus className="mr-2 h-4 w-4" /> New Chapter
               </Button>
            </div>

            {/* Content form dialog */}
            <Dialog open={showResourceForm} onOpenChange={(open) => { if (!open) closeResourceForm(); }}>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0">
                <DialogHeader className="px-6 pt-6 pb-0">
                  <DialogTitle className="text-lg font-black tracking-tight">
                    {editingResource ? 'Edit Segment' : addingToChapter ? `Add Segment to "${addingToChapter}"` : 'Add New Content'}
                  </DialogTitle>
                </DialogHeader>
                <div className="px-6 pb-6">
                  <CourseResourceForm
                    courseId={course.id}
                    resource={editingResource}
                    defaultTopicTitle={addingToChapter === 'Ungrouped' ? '' : (addingToChapter ?? undefined)}
                    defaultTopicSortOrder={addingChapterOrder ?? undefined}
                    onSuccess={() => { closeResourceForm(); fetchData(); }}
                    onCancel={closeResourceForm}
                  />
                </div>
              </DialogContent>
            </Dialog>

            {/* Chapter-wise grouped content */}
            {(() => {
              const chapters = resources.reduce<Record<string, typeof resources>>((acc, res) => {
                const key = res.topicTitle || 'Ungrouped';
                if (!acc[key]) acc[key] = [];
                acc[key].push(res);
                return acc;
              }, {});

              const sortedChapters = Object.entries(chapters).sort(([, a], [, b]) => {
                const aOrder = a[0]?.topicSortOrder ?? 999;
                const bOrder = b[0]?.topicSortOrder ?? 999;
                return aOrder - bOrder;
              });

              if (sortedChapters.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                    <FileText className="h-12 w-12 mb-3" />
                    <p className="text-sm font-bold">No content yet</p>
                    <p className="text-xs mt-1">Click &quot;New Chapter&quot; to start building your course</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {sortedChapters.map(([chapterTitle, items], chapterIdx) => {
                    const isExpanded = !!expandedChapters[chapterTitle];
                    const totalDuration = items.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
                    const videoCount = items.filter((r: any) => r.type === 'VIDEO').length;
                    const chapterOrder = items[0]?.topicSortOrder ?? chapterIdx;

                    return (
                      <div key={chapterTitle} className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
                        {/* Chapter header */}
                        <button
                          type="button"
                          onClick={() => toggleChapter(chapterTitle)}
                          className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50/80 transition-colors"
                        >
                          {isExpanded
                            ? <ChevronDown className="h-4 w-4 text-slate-900 shrink-0" />
                            : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-slate-800 truncate">
                              {chapterTitle === 'Ungrouped' ? 'General Content' : chapterTitle}
                            </h4>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[10px] font-bold text-slate-400">
                                {items.length} {items.length === 1 ? 'segment' : 'segments'}
                              </span>
                              {videoCount > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                  <Play className="h-2.5 w-2.5" /> {videoCount} video{videoCount !== 1 ? 's' : ''}
                                </span>
                              )}
                              {totalDuration > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                  <Clock className="h-2.5 w-2.5" /> {totalDuration} min
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[8px] font-black uppercase shrink-0">
                            Ch {chapterIdx + 1}
                          </Badge>
                        </button>

                        {/* Chapter content items */}
                        {isExpanded && (
                          <div className="border-t border-slate-50">
                            {items
                              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                              .map((res, idx) => (
                              <div
                                key={res.id}
                                className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors border-b border-slate-50 last:border-b-0"
                              >
                                <span className="text-[10px] font-black text-slate-300 w-5 text-center shrink-0">
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-900 shrink-0">
                                  {getResourceIcon(res.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-[13px] font-bold text-slate-700 truncate">{res.title}</h5>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="outline" className="text-[7px] font-black uppercase">{res.type}</Badge>
                                    {res.isFree && (
                                      <Badge className="text-[7px] font-black uppercase bg-emerald-50 text-emerald-600 border-emerald-200">Free</Badge>
                                    )}
                                    {res.durationMinutes > 0 && (
                                      <span className="text-[10px] font-bold text-slate-400">{res.durationMinutes} min</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  {res.fileUrl && (
                                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-slate-200" onClick={() => window.open(res.fileUrl, '_blank')}>
                                      <ExternalLink className="h-3 w-3 text-slate-500" />
                                    </Button>
                                  )}
                                  <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-slate-200" onClick={() => { setEditingResource(res); setAddingToChapter(null); setShowResourceForm(true); }}>
                                    <Pencil className="h-3 w-3 text-amber-500" />
                                  </Button>
                                  <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-slate-200 hover:bg-rose-50" onClick={() => handleDeleteResource(res.id)}>
                                    <Trash2 className="h-3 w-3 text-rose-500" />
                                  </Button>
                                </div>
                              </div>
                            ))}

                            {/* Add segment button — opens modal */}
                            <button
                              type="button"
                              onClick={() => { setEditingResource(null); setAddingToChapter(chapterTitle); setAddingChapterOrder(chapterOrder); setShowResourceForm(true); }}
                              className="flex w-full items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors border-t border-dashed border-slate-100"
                            >
                              <Plus className="h-3 w-3" /> Add Segment
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between mb-2">
               <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">Related Courses</h3>
                  <p className="text-sm text-slate-500 mt-1">Linked courses</p>
               </div>
               {!showAssociationForm && (
                 <Button onClick={() => setShowAssociationForm(true)} className="h-10 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs">
                    <Link2 className="mr-2 h-4 w-4" /> Add Link
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
                       <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-bold text-xs px-3 py-1">
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
                    <p className="text-sm font-bold text-slate-400">No linked courses</p>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
