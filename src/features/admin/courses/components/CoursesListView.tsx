'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, DoorClosed, DoorOpen, Eye, EyeOff, Layers, Pencil, Plus, Search, Star, ToggleLeft, ToggleRight } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getCourses, toggleCourseFeatured, toggleCourseVisibility, updateCourse } from '@/lib/api/courses';
import { getPrograms } from '@/lib/api/programs';
import { getUsers, type User } from '@/lib/api/users';
import type { Course, Program } from '@/types/course';
import { CourseFormModal } from '../modals/CourseFormModal';

export function CoursesListView({
  onSelectContent,
}: {
  onSelectContent: (c: Course) => void;
}) {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editCourse, setEditCourse] = useState<Course | null | 'new'>(null);
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  const reload = useCallback(async () => {
    const [cRes, pRes, tRes] = await Promise.all([
      getCourses({ limit: 200 }),
      getPrograms(),
      getUsers({ role: 'TEACHER', status: 'ACTIVE', limit: 500 }),
    ]);
    if (cRes.success && cRes.data) setCourses(cRes.data);
    if (pRes.success && pRes.data) setPrograms(pRes.data);
    if (tRes.success && tRes.data) setTeachers(tRes.data);
  }, []);

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [reload]);

  const filtered = useMemo(() => courses.filter(c => {
    const matchSearch = !search
      || c.name.toLowerCase().includes(search.toLowerCase())
      || c.slug.toLowerCase().includes(search.toLowerCase());
    const matchProgram = programFilter === 'ALL' || c.programId === programFilter;
    const matchStatus  = statusFilter  === 'ALL' || c.status    === statusFilter;
    return matchSearch && matchProgram && matchStatus;
  }), [courses, search, programFilter, statusFilter]);

  const optimisticPatch = (id: string, patch: Partial<Course>) =>
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

  const handleToggleFeatured = async (course: Course) => {
    if (toggling[course.id + '_f']) return;
    setToggling(t => ({ ...t, [course.id + '_f']: true }));
    optimisticPatch(course.id, { featured: !course.featured });
    try {
      const res = await toggleCourseFeatured(course.id);
      if (res.success && res.data) optimisticPatch(course.id, { featured: res.data.featured });
    } catch { optimisticPatch(course.id, { featured: course.featured }); }
    finally { setToggling(t => ({ ...t, [course.id + '_f']: false })); }
  };

  const handleToggleVisible = async (course: Course) => {
    if (toggling[course.id + '_v']) return;
    setToggling(t => ({ ...t, [course.id + '_v']: true }));
    optimisticPatch(course.id, { websiteVisible: !course.websiteVisible });
    try {
      const res = await toggleCourseVisibility(course.id);
      if (res.success && res.data) optimisticPatch(course.id, { websiteVisible: res.data.websiteVisible });
    } catch { optimisticPatch(course.id, { websiteVisible: course.websiteVisible }); }
    finally { setToggling(t => ({ ...t, [course.id + '_v']: false })); }
  };

  const handleToggleAdmission = async (course: Course) => {
    if (toggling[course.id + '_a']) return;
    const next = course.admissionStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
    setToggling(t => ({ ...t, [course.id + '_a']: true }));
    optimisticPatch(course.id, { admissionStatus: next });
    try {
      const res = await updateCourse(course.id, { admissionStatus: next });
      if (res.success && res.data) optimisticPatch(course.id, { admissionStatus: res.data.admissionStatus });
    } catch { optimisticPatch(course.id, { admissionStatus: course.admissionStatus }); }
    finally { setToggling(t => ({ ...t, [course.id + '_a']: false })); }
  };

  const handleSaved = (saved: Course) => {
    setCourses(prev => {
      const idx = prev.findIndex(c => c.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    setEditCourse(null);
    toast({ description: editCourse === 'new' ? 'Course created!' : 'Course updated!' });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900">Course Manager</h1>
          <p className="text-sm text-slate-500 mt-0.5">{courses.length} courses total</p>
        </div>
        <Button onClick={() => setEditCourse('new')} className="gap-2 text-white bg-black" >
          <Plus className="h-4 w-4" /> Create Course
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses…" className="pl-9" />
        </div>
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Programs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Programs</SelectItem>
            {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          {(['ALL', 'ACTIVE', 'DISABLED', 'ARCHIVED'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer',
                statusFilter === s
                  ? 'text-white border-transparent bg-black'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300')}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">No courses found.</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Program</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Type</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pricing</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(course => {
                  const fee = Number(course.fee);
                  const offer = course.offerPrice ? Number(course.offerPrice) : null;
                  const pct = offer && offer < fee ? Math.round((1 - offer / fee) * 100) : 0;
                  const prog = programs.find(p => p.id === course.programId);
                  return (
                    <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Course name + slug */}
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                         
                           <Image src={course.thumbnail|| `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%235C2D91'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='28' font-family='sans-serif'%3ECourse%3C/text%3E%3C/svg%3E`}
                           alt={course.name}
                            height={36} width={36} className="w-full h-full object-cover rounded-lg" />
                         
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">{course.name}</p>
                            <p className="font-mono text-[11px] text-slate-400">{course.slug}</p>
                          </div>
                        </div>
                      </td>
                      {/* Program */}
                      <td className="px-4 py-3 text-xs text-slate-600 hidden md:table-cell">{prog?.name ?? '—'}</td>
                      {/* Type */}
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold',
                          course.type === 'ONLINE' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600')}>
                          {course.type}
                        </span>
                      </td>
                      {/* Pricing */}
                      <td className="px-4 py-3 text-right">
                        {offer && pct > 0 ? (
                          <div>
                            <span className="text-[10px] text-slate-400 line-through">৳{fee.toLocaleString()}</span>
                            <span className="ml-1 font-bold text-sm text-slate-900">৳{offer.toLocaleString()}</span>
                            <span className="ml-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black px-1.5 py-0.5 rounded">{pct}%</span>
                          </div>
                        ) : (
                          <span className="font-bold text-sm text-slate-900">৳{fee.toLocaleString()}</span>
                        )}
                      </td>
                      {/* Website toggles */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button type="button" title={course.featured ? 'Featured (click to unfeature)' : 'Not featured (click to feature)'}
                            onClick={() => handleToggleFeatured(course)}
                            disabled={!!toggling[course.id + '_f']}
                            className={cn('p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-40',
                              course.featured ? 'bg-amber-50 border-amber-300 text-amber-600' : 'bg-white border-slate-200 text-slate-300 hover:text-amber-400')}>
                            <Star className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" title={course.websiteVisible ? 'Visible (click to hide)' : 'Hidden (click to show)'}
                            onClick={() => handleToggleVisible(course)}
                            disabled={!!toggling[course.id + '_v']}
                            className={cn('p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-40',
                              course.websiteVisible ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-slate-200 text-slate-300 hover:text-blue-400')}>
                            {course.websiteVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                          <button type="button" title={course.admissionStatus === 'OPEN' ? 'Admission OPEN (click to close)' : 'Admission CLOSED (click to open)'}
                            onClick={() => handleToggleAdmission(course)}
                            disabled={!!toggling[course.id + '_a']}
                            className={cn('p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-40',
                              course.admissionStatus === 'OPEN' ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'bg-slate-100 border-slate-300 text-slate-600')}>
                            {course.admissionStatus === 'OPEN' ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold',
                          course.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700'
                          : course.status === 'DISABLED' ? 'bg-slate-100 text-slate-700'
                          : 'bg-slate-100 text-slate-500')}>
                          {course.status}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setEditCourse(course)}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-slate-200">
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          <button onClick={() => onSelectContent(course)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-indigo-200">
                            <Layers className="h-3 w-3" /> Content
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" /> Featured</span>
            <span className="flex items-center gap-1"><Eye className="h-3 w-3 text-blue-500" /> Website Visible</span>
            <span className="flex items-center gap-1">
              <DoorOpen className="h-3 w-3 text-emerald-500" /> Admission Open
              <span className="mx-1">/</span>
              <DoorClosed className="h-3 w-3 text-slate-500" /> Closed
            </span>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      <CourseFormModal
        open={editCourse !== null}
        onClose={() => setEditCourse(null)}
        onSaved={handleSaved}
        initial={editCourse === 'new' || editCourse === null ? null : editCourse}
        programs={programs}
        teachers={teachers}
      />
    </div>
  );
}
