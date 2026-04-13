'use client';

import { useEffect, useState, useCallback } from 'react';
import { getEnrollments, Enrollment } from '@/lib/api/enrollments';
import { getCourses } from '@/lib/api/courses';
import { getBatches } from '@/lib/api/batches';
import type { Course } from '@/types/course';
import type { Batch } from '@/lib/api/batches';
import { 
  Users, 
  Search, 
  RefreshCw, 
  Mail, 
  Phone, 
  BookOpen, 
  Layers, 
  Filter,
  User,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function TeacherStudentsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!raw) return;
      const u = JSON.parse(raw);
      setUserId(u?.id ?? null);
    } catch {
      setUserId(null);
    }
  }, []);

  const loadEnrollments = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const params: any = { teacherUserId: userId, limit: 100 };
      if (courseFilter !== 'all') params.courseId = courseFilter;
      if (batchFilter !== 'all') params.batchId = batchFilter;

      const res = await getEnrollments(params);
      if (res.success && res.data) {
        setEnrollments(res.data);
      } else {
        setEnrollments([]);
      }
    } catch (err) {
      console.error(err);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, [userId, courseFilter, batchFilter]);

  const loadFilters = useCallback(async () => {
    if (!userId) return;
    try {
      const [courseRes, batchRes] = await Promise.all([
        getCourses({ teacherUserId: userId, limit: 100 }),
        getBatches({ limit: 500 }) // In real app, filter batches by teacher's courses
      ]);
      if (courseRes.success && courseRes.data) setCourses(courseRes.data);
      if (batchRes.success && batchRes.data) setBatches(batchRes.data);
    } catch (err) { console.error(err); }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadEnrollments();
      loadFilters();
    }
  }, [userId, loadEnrollments, loadFilters]);

  const filteredEnrollments = enrollments.filter(e => 
    e.student?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.student?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.student?.mobile.includes(searchQuery)
  );

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">My Students</h1>
          <p className="text-lg font-medium text-slate-500">
            Manage and view all students enrolled in your assigned courses.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 p-1.5 shadow-sm">
           <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
             <Users className="h-5 w-5" />
           </div>
           <div className="pr-4">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Total Enrolled</p>
             <p className="text-lg font-black text-slate-900">{enrollments.length}</p>
           </div>
        </div>
      </header>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap flex-1 items-center gap-4">
            <div className="min-w-[300px] flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  placeholder="Search students by name, email or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 w-full rounded-2xl border-slate-200 bg-slate-50/50 pl-11 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                />
              </div>
            </div>
            
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="h-12 w-[200px] rounded-2xl border-slate-200 bg-white font-bold text-xs uppercase tracking-widest text-slate-600 shadow-sm">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                <SelectItem value="all" className="font-bold text-xs uppercase tracking-widest py-3">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id} className="font-bold text-xs uppercase tracking-widest py-3">
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white font-bold text-xs uppercase tracking-widest text-slate-600 shadow-sm">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-xl">
                <SelectItem value="all" className="font-bold text-xs uppercase tracking-widest py-3">All Batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id} className="font-bold text-xs uppercase tracking-widest py-3">
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              className="h-12 w-12 rounded-2xl border-slate-200 bg-white p-0 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm" 
              onClick={loadEnrollments}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50/30">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
               <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
               <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">Syncing Student Records...</p>
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="p-20 text-center">
               <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-300">
                 <User className="h-8 w-8" />
               </div>
               <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">No students found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-slate-100 bg-white">
                    <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Student Identity</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Course Assignment</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Batch / Group</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
                    <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Enrollment Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnrollments.map((e) => (
                    <TableRow key={e.id} className="group border-slate-50 transition-colors hover:bg-white">
                      <TableCell className="px-8 py-5">
                         <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-black text-lg shadow-sm">
                               {e.student?.fullName.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                               <span className="font-black text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">{e.student?.fullName}</span>
                               <div className="mt-1 flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                     <Mail className="h-3 w-3" />
                                     {e.student?.email || 'No email'}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                     <Phone className="h-3 w-3" />
                                     {e.student?.mobile}
                                  </div>
                               </div>
                            </div>
                         </div>
                      </TableCell>
                      <TableCell className="py-5">
                         <div className="flex items-center gap-2">
                            <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
                               <BookOpen className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{e.course?.slug}</span>
                               <span className="text-sm font-bold text-slate-700 leading-none">{e.course?.name}</span>
                            </div>
                         </div>
                      </TableCell>
                      <TableCell className="py-5">
                         <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                            <Layers className="h-4 w-4 text-slate-300" />
                            {e.batch?.name || 'Unassigned'}
                         </div>
                      </TableCell>
                      <TableCell className="py-5">
                         <Badge variant="outline" className={cn(
                           "rounded-lg text-[9px] font-black uppercase px-2 py-0.5 border shadow-none",
                           e.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"
                         )}>
                           {e.status}
                         </Badge>
                      </TableCell>
                      <TableCell className="px-8 py-5">
                         <div className="text-xs font-bold text-slate-500">
                            {format(new Date(e.createdAt), 'MMM do, yyyy')}
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
