'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Ban,
  Scale,
  Zap,
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
  disableCourse,
  settleCourse,
} from '@/lib/api/courses';
import { getUsers } from '@/lib/api/users';
import type { CourseDetailTeacher } from '@/types/course';
import { getCourseSchedules, createCourseSchedule, deleteCourseSchedule } from '@/lib/api/course-schedules';
import { getCourseFeatures, createCourseFeature, updateCourseFeature, deleteCourseFeature, type CourseFeature } from '@/lib/api/course-features';
import { updateCourseTeacherPermissions } from '@/lib/api/courses';
import { confirmAction } from '@/features/admin/shared/confirm-action';
import { useToast } from '@/hooks/use-toast';
import { CourseResourceForm } from './CourseResourceForm';
import { CourseAssociationForm } from '../forms/CourseAssociationForm';
import { CourseScheduleSection } from './CourseScheduleSection';
import { buildCourseContentTree } from '@/lib/course-outline';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface CourseDetailsViewProps {
  course: CourseDetails;
  /** Called after disable admission or full course settle (e.g. refresh list and close modal). */
  onAfterMutation?: () => void | Promise<void>;
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

export function CourseDetailsView({ course, onAfterMutation }: CourseDetailsViewProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'info' | 'resources' | 'schedule' | 'links' | 'features'>('info');
  const [features, setFeatures] = useState<CourseFeature[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [editingFeature, setEditingFeature] = useState<CourseFeature | null>(null);
  const [featureForm, setFeatureForm] = useState({ icon: '', label: '', value: '' });
  const [showFeatureForm, setShowFeatureForm] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [associations, setAssociations] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [showAssociationForm, setShowAssociationForm] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [addingToChapter, setAddingToChapter] = useState<string | null>(null);
  const [addingChapterOrder, setAddingChapterOrder] = useState<number | null>(null);
  const [addingSubjectTitle, setAddingSubjectTitle] = useState<string | null>(null);
  const [addingChapterTitle, setAddingChapterTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [teacherPick, setTeacherPick] = useState('');
  const [teachersPool, setTeachersPool] = useState<{ id: string; fullName: string; email?: string }[]>([]);
  const [assignedTeachers, setAssignedTeachers] = useState<CourseDetailTeacher[]>(() => course.teachers || []);
  const [teacherActionLoading, setTeacherActionLoading] = useState(false);
  const [courseOpLoading, setCourseOpLoading] = useState<'disable' | 'settle' | null>(null);

  const outline = course.outline as any;
  const courseApiId = course.slug || course.id;

  const handleDisableAdmission = async () => {
    if (course.status === 'DISABLED' || course.status === 'ARCHIVED') {
      toast({ title: 'Skipped', description: 'Course is already disabled or archived.', variant: 'destructive' });
      return;
    }
    if (!(await confirmAction({
      title: 'ভর্তি বন্ধ করবেন?',
      description: 'কোনও ব্রাঞ্চ বা অ্যাডমিন নতুন ভর্তি নিতে পারবে না; বিদ্যমান স্টুডেন্টরা কোর্স কন্টেন্ট দেখতে পারবে।',
      confirmLabel: 'ভর্তি বন্ধ করুন',
      variant: 'warning',
    }))) {
      return;
    }
    try {
      setCourseOpLoading('disable');
      const res = await disableCourse(courseApiId);
      if (res.success) {
        toast({
          title: 'Admission stopped',
          description: res.message || 'Course disabled. Existing students keep content access.',
          variant: 'success',
        });
        await onAfterMutation?.();
      } else {
        toast({ title: 'Failed', description: res.message, variant: 'destructive' });
      }
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Request failed',
        variant: 'destructive',
      });
    } finally {
      setCourseOpLoading(null);
    }
  };

  const handleSettleCourse = async () => {
    if (!course.settledOptionEnabled) {
      toast({
        title: 'Not enabled',
        description: 'Turn on “Settle course option” in course settings first.',
        variant: 'destructive',
      });
      return;
    }
    if (!(await confirmAction({
      title: 'কোর্স সেটেল করবেন?',
      description:
        'সকল বাকি ইনভয়েস পরিশোধিত ধরা হবে, সকল এনরোলমেন্ট বাতিল হবে এবং স্টুডেন্ট পোর্টাল থেকে কোর্স সরে যাবে। কোর্স আর্কাইভ হবে।',
      confirmLabel: 'সেটেল করুন',
      variant: 'danger',
    }))) {
      return;
    }
    try {
      setCourseOpLoading('settle');
      const res = await settleCourse(courseApiId);
      if (res.success) {
        toast({ title: 'Course settled', description: res.message, variant: 'success' });
        await onAfterMutation?.();
      } else {
        toast({ title: 'Failed', description: res.message, variant: 'destructive' });
      }
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Request failed',
        variant: 'destructive',
      });
    } finally {
      setCourseOpLoading(null);
    }
  };

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

  useEffect(() => {
    if (activeTab !== 'features') return;
    setFeaturesLoading(true);
    getCourseFeatures(course.id)
      .then((res) => { if (res.success && res.data) setFeatures(res.data); })
      .catch(() => {})
      .finally(() => setFeaturesLoading(false));
  }, [activeTab, course.id]);

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
    if (!(await confirmAction({
      title: 'Remove resource?',
      description: 'This resource will be removed from the course.',
      confirmLabel: 'Remove resource',
      variant: 'danger',
    }))) return;
    const res = await deleteCourseContent(id);
    if (res.success) {
      toast({ title: 'Deleted', description: 'Resource removed' });
      fetchData();
    }
  };

  const handleDeleteAssociation = async (id: string) => {
    if (!(await confirmAction({
      title: 'Remove related course link?',
      description: 'This relationship will be removed from the course.',
      confirmLabel: 'Remove link',
      variant: 'danger',
    }))) return;
    const res = await deleteAssociatedCourse(id);
    if (res.success) {
      toast({ title: 'Removed', description: 'Link removed' });
      fetchData();
    }
  };

  const toggleChapter = (chapter: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapter]: !prev[chapter] }));
  };

  const isSubjectExpanded = (subjectId: string) => expandedSubjects[subjectId] === true;

  const toggleSubjectExpand = (subjectId: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjectId]: !isSubjectExpanded(subjectId),
    }));
  };

  const closeResourceForm = () => {
    setShowResourceForm(false);
    setEditingResource(null);
    setAddingToChapter(null);
    setAddingChapterOrder(null);
    setAddingSubjectTitle(null);
    setAddingChapterTitle(null);
  };

  const contentTree = useMemo(
    () =>
      buildCourseContentTree(
        resources.map((r: any) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          sortOrder: r.sortOrder ?? 0,
          subjectTitle: r.subjectTitle,
          chapterTitle: r.chapterTitle,
          topicTitle: r.topicTitle,
          topicSortOrder: r.topicSortOrder,
          durationMinutes: r.durationMinutes,
          isFree: r.isFree ?? false,
        })),
      ),
    [resources],
  );

  const resById = useMemo(() => new Map(resources.map((r: any) => [r.id, r])), [resources]);

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
    if (!(await confirmAction({
      title: 'Remove teacher from course?',
      description: 'The teacher will lose assignment access to this course.',
      confirmLabel: 'Remove teacher',
      variant: 'danger',
    }))) return;
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
              { id: 'features', label: 'Features', icon: Zap },
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
             className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-black"
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
                        <span className="font-mono text-base font-black text-slate-400 tracking-tighter">{course.slug}</span>
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
                 {
                   label: course.offerPrice != null && Number(course.offerPrice) < Number(course.fee) ? 'Offer Price' : 'Course fee',
                   value: course.offerPrice != null && Number(course.offerPrice) < Number(course.fee)
                     ? `৳${Number(course.offerPrice).toLocaleString()}`
                     : `৳${Number(course.fee).toLocaleString()}`,
                   icon: DollarSign,
                   color: 'text-emerald-600',
                   bg: 'bg-emerald-50',
                   extra: course.offerPrice != null && Number(course.offerPrice) < Number(course.fee)
                     ? `৳${Number(course.fee).toLocaleString()} · 🔥 ${Math.round(((Number(course.fee) - Number(course.offerPrice)) / Number(course.fee)) * 100)}% OFF`
                     : undefined,
                 },
                 { label: 'Classes', value: outline?.totalClasses || 'N/A', icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50' },
                 { label: 'Duration', value: outline?.duration || 'N/A', icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
               ].map((stat, i) => (
                 <div key={i} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                    <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-2xl", stat.bg, stat.color)}>
                       <stat.icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-500">{stat.label}</p>
                    <p className="mt-1 text-xl font-black text-slate-900">{stat.value}</p>
                    {'extra' in stat && stat.extra && (
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400 line-through-wrapper">
                        <span className="line-through">{(stat.extra as string).split(' · ')[0]}</span>
                        <span className="ml-1 text-emerald-600 no-underline">{(stat.extra as string).split(' · ')[1]}</span>
                      </p>
                    )}
                 </div>
               ))}
            </div>

            {course.status !== 'ARCHIVED' && (
              <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-slate-900">
                  <Scale className="h-4 w-4 text-indigo-600" />
                  Course operations
                </h3>
                <p className="mb-4 text-xs font-medium leading-relaxed text-slate-600">
                  <strong>Disable admission</strong>: ভর্তি বন্ধ; স্টুডেন্ট কন্টেন্ট দেখতে পারবে।{' '}
                  <strong>Settle course</strong> (যখন ফর্মে “settle option” চালু): বাকি ইনভয়েস বন্ধ, এনরোলমেন্ট বাতিল, স্টুডেন্ট
                  পোর্টাল থেকে সরে যাবে।
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl border-amber-200 bg-amber-50/50 font-bold text-amber-900 hover:bg-amber-100"
                    disabled={course.status === 'DISABLED' || courseOpLoading !== null}
                    onClick={handleDisableAdmission}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    {courseOpLoading === 'disable' ? 'Working…' : 'Disable admission only'}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-11 rounded-xl font-bold"
                    disabled={!course.settledOptionEnabled || courseOpLoading !== null}
                    onClick={handleSettleCourse}
                  >
                    {courseOpLoading === 'settle' ? 'Working…' : 'Settle course & remove from student portal'}
                  </Button>
                </div>
                {!course.settledOptionEnabled && (
                  <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Enable “Settle course option” in edit course to unlock full settlement.
                  </p>
                )}
              </div>
            )}

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
                  {assignedTeachers.map((row) => {
                    const perms = (row as any).permissions || { contentUpload: true, examManage: true };
                    return (
                      <li
                        key={row.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-slate-800 block">{row.teacher?.fullName || '—'}</span>
                          <div className="flex items-center gap-4 mt-2">
                            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                              <Checkbox
                                checked={perms.contentUpload !== false}
                                disabled={teacherActionLoading}
                                onCheckedChange={async (checked) => {
                                  if (!row.teacher?.id) return;
                                  const newPerms = { ...perms, contentUpload: !!checked };
                                  setTeacherActionLoading(true);
                                  try {
                                    const res = await updateCourseTeacherPermissions(course.id, row.teacher.id, newPerms);
                                    if (res.success) {
                                      setAssignedTeachers((prev) => prev.map((t) => t.id === row.id ? { ...t, permissions: newPerms } as any : t));
                                      toast({ title: 'Permission updated' });
                                    }
                                  } catch { toast({ title: 'Failed', variant: 'destructive' }); }
                                  finally { setTeacherActionLoading(false); }
                                }}
                              />
                              Content Upload
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                              <Checkbox
                                checked={perms.examManage !== false}
                                disabled={teacherActionLoading}
                                onCheckedChange={async (checked) => {
                                  if (!row.teacher?.id) return;
                                  const newPerms = { ...perms, examManage: !!checked };
                                  setTeacherActionLoading(true);
                                  try {
                                    const res = await updateCourseTeacherPermissions(course.id, row.teacher.id, newPerms);
                                    if (res.success) {
                                      setAssignedTeachers((prev) => prev.map((t) => t.id === row.id ? { ...t, permissions: newPerms } as any : t));
                                      toast({ title: 'Permission updated' });
                                    }
                                  } catch { toast({ title: 'Failed', variant: 'destructive' }); }
                                  finally { setTeacherActionLoading(false); }
                                }}
                              />
                              Exam Manage
                            </label>
                          </div>
                        </div>
                        {row.teacher?.id ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 shrink-0"
                            disabled={teacherActionLoading}
                            onClick={() => handleRemoveTeacher(row.teacher.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </li>
                    );
                  })}
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
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 text-sm text-slate-700">
              <p className="font-black text-indigo-900 text-xs uppercase tracking-widest mb-1">
                কোর্স → বিষয় → অধ্যায় → সেগমেন্ট
              </p>
              <p className="leading-relaxed">
                <strong className="text-slate-900">Subject</strong> (প্রথম পত্র / দ্বিতীয় পত্র ইত্যাদি) ফিল্ডে মান দিন—শিক্ষার্থী পোর্টালে প্রথমে কোর্স, তারপর{' '}
                <strong className="text-slate-900">বিষয় অনুযায়ী আলাদা রুট</strong> দেখবে। প্রতিটি বিষয়ের ভিতরে অধ্যায় ও সেগমেন্ট (ভিডিও, নোট, পিডিএফ) একই কাঠামোতে দেখায়।
              </p>
            </div>
            <div className="flex items-center justify-between">
               <div>
                  <h3 className="text-xl font-bold tracking-tight">Course Content</h3>
                  <p className="text-sm text-slate-500 mt-1">বিষয় → অধ্যায় → সেগমেন্ট ও ম্যাটেরিয়াল</p>
               </div>
               <Button
                  onClick={() => {
                    setEditingResource(null);
                    setAddingToChapter(null);
                    setAddingChapterOrder(null);
                    setAddingSubjectTitle(null);
                    setAddingChapterTitle(null);
                    setShowResourceForm(true);
                  }}
                  className="h-10 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
                >
                  <Plus className="mr-2 h-4 w-4" /> New content
               </Button>
            </div>

            {/* Content form dialog */}
            <Dialog open={showResourceForm} onOpenChange={(open) => { if (!open) closeResourceForm(); }}>
              <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-0">
                <DialogHeader className="px-6 pt-6 pb-0">
                  <DialogTitle className="text-lg font-black tracking-tight">
                    {editingResource ? 'Edit Segment' : addingToChapter ? `Add Segment to "${addingToChapter}"` : 'Add New Content'}
                  </DialogTitle>
                </DialogHeader>
                <div className="px-6 pb-6">
                  <CourseResourceForm
                    key={
                      editingResource?.id ??
                      `new-${addingSubjectTitle ?? ''}-${addingChapterTitle ?? ''}-${addingToChapter ?? ''}-${addingChapterOrder ?? ''}`
                    }
                    courseId={course.id}
                    resource={editingResource}
                    defaultSubjectTitle={addingSubjectTitle ?? undefined}
                    defaultChapterTitle={addingChapterTitle ?? undefined}
                    defaultTopicTitle={addingToChapter === 'Ungrouped' ? '' : addingToChapter ?? undefined}
                    defaultTopicSortOrder={addingChapterOrder ?? undefined}
                    onSuccess={() => { closeResourceForm(); fetchData(); }}
                    onCancel={closeResourceForm}
                  />
                </div>
              </DialogContent>
            </Dialog>

            {/* Subject → Chapter → Segment (aligned with student portal) */}
            {contentTree.subjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                <FileText className="h-12 w-12 mb-3" />
                <p className="text-sm font-bold">No content yet</p>
                <p className="text-xs mt-1">Add materials with subject &amp; chapter fields to match the student view</p>
              </div>
            ) : (
              <div className="space-y-6">
                {contentTree.subjects.map((sub, subIdx) => {
                  const subOpen = isSubjectExpanded(sub.id);
                  const segTotal = sub.chapters.reduce((n, ch) => n + ch.segments.length, 0);
                  return (
                  <div key={sub.id} className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleSubjectExpand(sub.id)}
                      className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50/80 transition-colors"
                    >
                      {subOpen ? (
                        <ChevronDown className="h-4 w-4 text-indigo-600 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-600">
                          Subject {subIdx + 1}
                          <span className="ml-2 font-bold text-slate-400">· {sub.chapters.length} chapters</span>
                        </h4>
                        <p className="text-sm font-black text-slate-800 truncate">{sub.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                          {segTotal} {segTotal === 1 ? 'segment' : 'segments'} (video, PDF, note, …)
                        </p>
                      </div>
                    </button>
                    {subOpen && (
                    <div className="space-y-3 border-t border-slate-50 p-3 bg-slate-50/40">
                    {sub.chapters.map((ch, chapterIdx) => {
                      const chapterKey = `${sub.id}::${ch.id}`;
                      const isExpanded = expandedChapters[chapterKey] === true;
                      const totalDuration = ch.segments.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
                      const videoCount = ch.segments.filter((s) => s.type === 'VIDEO').length;

                      return (
                        <div key={chapterKey} className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleChapter(chapterKey)}
                            className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50/80 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-slate-900 shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-black text-slate-800 truncate">{ch.title}</h4>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[10px] font-bold text-slate-400">
                                  {ch.segments.length} {ch.segments.length === 1 ? 'segment' : 'segments'}
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

                          {isExpanded && (
                            <div className="border-t border-slate-50">
                              {ch.segments.map((seg, idx) => {
                                const res = resById.get(seg.id);
                                if (!res) return null;
                                return (
                                  <div
                                    key={seg.id}
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
                                        <Badge variant="outline" className="text-[7px] font-black uppercase">
                                          {res.type}
                                        </Badge>
                                        {res.isFree && (
                                          <Badge className="text-[7px] font-black uppercase bg-emerald-50 text-emerald-600 border-emerald-200">
                                            Free
                                          </Badge>
                                        )}
                                        {res.durationMinutes > 0 && (
                                          <span className="text-[10px] font-bold text-slate-400">{res.durationMinutes} min</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                      {res.fileUrl && (
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-7 w-7 rounded-lg border-slate-200"
                                          onClick={() => window.open(res.fileUrl, '_blank')}
                                        >
                                          <ExternalLink className="h-3 w-3 text-slate-500" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg border-slate-200"
                                        onClick={() => {
                                          setEditingResource(res);
                                          setAddingToChapter(null);
                                          setAddingSubjectTitle(null);
                                          setAddingChapterTitle(null);
                                          setShowResourceForm(true);
                                        }}
                                      >
                                        <Pencil className="h-3 w-3 text-amber-500" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg border-slate-200 hover:bg-rose-50"
                                        onClick={() => handleDeleteResource(res.id)}
                                      >
                                        <Trash2 className="h-3 w-3 text-rose-500" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingResource(null);
                                  setAddingSubjectTitle(sub.title === 'Course' ? '' : sub.title);
                                  setAddingChapterTitle(ch.title);
                                  setAddingToChapter(ch.title);
                                  setAddingChapterOrder(ch.sortOrder);
                                  setShowResourceForm(true);
                                }}
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
                    )}
                  </div>
                );
                })}
              </div>
            )}
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
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{assoc.toCourse?.slug}</p>
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

        {/* ── Features Tab ─────────────────────────────────────────────── */}
        {activeTab === 'features' && (
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Course Features</h3>
                <p className="text-sm text-slate-500 mt-1">সাইডবারে দেখানো ফিচার লিস্ট (admin থেকে যোগ / সম্পাদনা / মুছুন)</p>
              </div>
              <Button
                onClick={() => { setEditingFeature(null); setFeatureForm({ icon: '', label: '', value: '' }); setShowFeatureForm(true); }}
                className="h-10 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Feature
              </Button>
            </div>

            {showFeatureForm && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <h4 className="text-sm font-black text-slate-800">{editingFeature ? 'Edit Feature' : 'New Feature'}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Icon (emoji or symbol)</label>
                    <div className="flex gap-2">
                      <Input
                        value={featureForm.icon}
                        onChange={(e) => setFeatureForm((f) => ({ ...f, icon: e.target.value }))}
                        placeholder="📚 or ✓"
                        className="flex-1 h-9 rounded-xl border-slate-200"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 shrink-0 text-lg">
                            😀
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-0" align="start">
                          <EmojiPicker
                            onEmojiClick={(emojiData: EmojiClickData) => {
                              setFeatureForm((f) => ({ ...f, icon: emojiData.emoji }));
                            }}
                            width={320}
                            height={400}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Label</label>
                    <Input
                      value={featureForm.label}
                      onChange={(e) => setFeatureForm((f) => ({ ...f, label: e.target.value }))}
                      placeholder="e.g. কোর্স মোড"
                      className="h-9 rounded-xl border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Value</label>
                    <Input
                      value={featureForm.value}
                      onChange={(e) => setFeatureForm((f) => ({ ...f, value: e.target.value }))}
                      placeholder="e.g. অনলাইন"
                      className="h-9 rounded-xl border-slate-200"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700"
                    disabled={featuresLoading}
                    onClick={async () => {
                      if (!featureForm.label.trim() || !featureForm.value.trim()) {
                        toast({ title: 'Label and Value are required', variant: 'destructive' });
                        return;
                      }
                      setFeaturesLoading(true);
                      try {
                        if (editingFeature) {
                          const res = await updateCourseFeature(editingFeature.id, featureForm);
                          if (res.success) {
                            setFeatures((prev) => prev.map((f) => f.id === editingFeature.id ? { ...f, ...featureForm } : f));
                            toast({ title: 'Feature updated' });
                          }
                        } else {
                          const res = await createCourseFeature({ courseId: course.id, ...featureForm, sortOrder: features.length });
                          if (res.success && res.data) {
                            setFeatures((prev) => [...prev, res.data!]);
                            toast({ title: 'Feature added' });
                          }
                        }
                        setShowFeatureForm(false);
                        setEditingFeature(null);
                      } catch {
                        toast({ title: 'Failed', variant: 'destructive' });
                      } finally {
                        setFeaturesLoading(false);
                      }
                    }}
                  >
                    {featuresLoading ? 'Saving...' : editingFeature ? 'Update' : 'Add'}
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => { setShowFeatureForm(false); setEditingFeature(null); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {featuresLoading && features.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">Loading…</div>
              )}
              {features.length === 0 && !featuresLoading && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
                  <Zap className="h-10 w-10 mb-3" />
                  <p className="text-sm font-bold">No features yet</p>
                  <p className="text-xs mt-1">Click &quot;Add Feature&quot; to add sidebar features for this course</p>
                </div>
              )}
              {features.map((f, idx) => (
                <div key={f.id} className="group flex items-center gap-4 px-5 py-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-sm transition-all">
                  <span className="text-xl w-8 text-center shrink-0">{f.icon || '✦'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{f.label}</p>
                    <p className="font-bold text-slate-800 text-sm truncate">{f.value}</p>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="outline" size="icon"
                      className="h-7 w-7 rounded-lg border-slate-200"
                      onClick={() => { setEditingFeature(f); setFeatureForm({ icon: f.icon, label: f.label, value: f.value }); setShowFeatureForm(true); }}
                    >
                      <Pencil className="h-3 w-3 text-amber-500" />
                    </Button>
                    <Button
                      variant="outline" size="icon"
                      className="h-7 w-7 rounded-lg border-slate-200 hover:bg-rose-50"
                      onClick={async () => {
                        if (!(await confirmAction({
                          title: 'Remove course feature?',
                          description: 'This feature will be removed from the course page.',
                          confirmLabel: 'Remove feature',
                          variant: 'danger',
                        }))) return;
                        const res = await deleteCourseFeature(f.id);
                        if (res.success) {
                          setFeatures((prev) => prev.filter((x) => x.id !== f.id));
                          toast({ title: 'Feature removed' });
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-rose-500" />
                    </Button>
                  </div>
                  <span className="text-[10px] text-slate-300 font-bold w-4 text-center shrink-0">#{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
