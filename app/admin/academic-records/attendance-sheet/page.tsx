'use client';

import React, { useEffect, useState } from 'react';
import { getAttendanceSheet, AttendanceSheet } from '@/lib/api/attendance';
import { getCourses } from '@/lib/api/courses';
import { getBranches } from '@/lib/api/branches';
import { getBatches } from '@/lib/api/batches';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Printer,
  FileText,
  Search,
  RefreshCw,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function AttendanceSheetPage() {
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({
    courseId: '',
    branchId: 'all',
    batchId: 'all'
  });

  const [sheetData, setAttendanceSheet] = useState<AttendanceSheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingFilters, setFetchingFilters] = useState(true);

  const loadFilters = async () => {
    try {
      setFetchingFilters(true);
      const [coursesRes, branchesRes] = await Promise.all([
        getCourses({ status: 'ACTIVE' }),
        getBranches()
      ]);
      if (coursesRes.success) setCourses(coursesRes.data || []);
      if (branchesRes.success) setBranches(branchesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingFilters(false);
    }
  };

  const loadBatches = async (courseId: string) => {
    if (!courseId || courseId === 'all') {
      setBatches([]);
      return;
    }
    const res = await getBatches({ courseId });
    if (res.success) setBatches(res.data || []);
  };

  useEffect(() => {
    loadFilters();
  }, []);

  const handleGenerateSheet = async () => {
    if (!filters.courseId) {
      toast({ title: 'Selection Required', description: 'Please select a course to generate the sheet.', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      const res = await getAttendanceSheet({
        courseId: filters.courseId,
        branchId: filters.branchId === 'all' ? undefined : filters.branchId,
        batchId: filters.batchId === 'all' ? undefined : filters.batchId
      });

      if (res.success) {
        setAttendanceSheet(res.data);
        toast({ title: 'Registry Synchronized', description: 'Offline attendance matrix generated successfully.', variant: 'success' });
      }
    } catch (err: any) {
      toast({ title: 'System Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (fetchingFilters) {
    return <div className="flex h-96 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
    </div>;
  }

  return (
    <div className="space-y-8 text-slate-900 pb-20">
      {/* Header & Print Logic */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2 print:hidden">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">Offline Attendance Registry</h1>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" />
            Course-wise institutional attendance tracking & reporting
          </p>
        </div>
        {sheetData && (
          <Button onClick={handlePrint} className="h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 transition-all">
            <Printer className="mr-2 h-4 w-4" />
            Print Registry
          </Button>
        )}
      </header>

      {/* Filter Section */}
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm print:hidden">
        <div className="grid gap-6 md:grid-cols-4 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Academic Course</label>
            <Select value={filters.courseId} onValueChange={(v) => { setFilters({...filters, courseId: v, batchId: 'all'}); loadBatches(v); }}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold shadow-inner">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-xl max-h-[300px]">
                {courses.map(c => <SelectItem key={c.id} value={c.id} className="font-bold py-3">{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Regional Branch</label>
            <Select value={filters.branchId} onValueChange={(v) => setFilters({...filters, branchId: v})}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold shadow-inner">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-xl">
                <SelectItem value="all" className="font-bold py-3">All Branches</SelectItem>
                {branches.map(b => <SelectItem key={b.id} value={b.id} className="font-bold py-3">{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Specific Batch</label>
            <Select value={filters.batchId} onValueChange={(v) => setFilters({...filters, batchId: v})} disabled={!filters.courseId}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold shadow-inner">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-xl">
                <SelectItem value="all" className="font-bold py-3">All Batches</SelectItem>
                {batches.map(b => <SelectItem key={b.id} value={b.id} className="font-bold py-3">{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleGenerateSheet} 
            disabled={loading || !filters.courseId}
            className="h-12 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-black uppercase tracking-widest text-xs shadow-lg transition-all"
          >
            {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Generate Sheet
          </Button>
        </div>
      </section>

      {/* Attendance Matrix */}
      {sheetData ? (
        <section className="rounded-[40px] border border-slate-200 bg-white overflow-hidden shadow-2xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-500 print:shadow-none print:border-none print:rounded-none">
          {/* Sheet Branding (Only for Print) */}
          <div className="hidden print:block p-10 border-b-2 border-slate-900 mb-8">
             <div className="flex justify-between items-start">
                <div>
                   <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Official Attendance Registry</h1>
                   <div className="mt-4 space-y-1">
                      <p className="text-lg font-bold text-slate-700">COURSE: {sheetData.course.name} ({sheetData.course.code})</p>
                      <p className="text-sm font-medium text-slate-500">BRANCH: {filters.branchId !== 'all' ? branches.find(b => b.id === filters.branchId)?.name : 'Consolidated Global'}</p>
                      <p className="text-sm font-medium text-slate-500">BATCH: {filters.batchId !== 'all' ? batches.find(b => b.id === filters.batchId)?.name : 'All Enrolled Batches'}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-xs font-black uppercase tracking-widest text-slate-400">Generation Identity</p>
                   <p className="text-sm font-bold text-slate-900 mt-1">{new Date().toLocaleString()}</p>
                </div>
             </div>
          </div>

          <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 print:hidden">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                   <FileText className="h-6 w-6" />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">Transmission Matrix</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{sheetData.enrollments.length} Students • {sheetData.sessions.length} Sessions Identified</p>
                </div>
             </div>
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 print:static">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-r border-slate-100 sticky left-0 bg-slate-50 z-20">Student Identity</th>
                  {sheetData.sessions.map(session => (
                    <th key={session.id} className="px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center min-w-[100px] border-r border-slate-100 last:border-r-0">
                      <div className="flex flex-col items-center gap-1">
                        <Calendar className="h-3 w-3 text-indigo-400" />
                        <span>{new Date(session.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </th>
                  ))}
                  {sheetData.sessions.length === 0 && (
                    <th className="px-8 py-10 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">No session nodes identified</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sheetData.enrollments.map(enrollment => (
                  <tr key={enrollment.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-5 border-r border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50 z-10 print:bg-white min-w-[250px]">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500 shadow-inner">
                          {enrollment.student.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-800 tracking-tight">{enrollment.student.fullName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{enrollment.batch?.name || 'No Batch'} • {enrollment.student.mobile}</p>
                        </div>
                      </div>
                    </td>
                    {sheetData.sessions.map(session => {
                      const record = session.attendanceRecords.find(r => r.studentUserId === enrollment.student.id);
                      return (
                        <td key={session.id} className="px-4 py-5 text-center border-r border-slate-100 last:border-r-0">
                          {record ? (
                            <div className="flex justify-center">
                              {record.status === 'PRESENT' ? (
                                <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                   <CheckCircle2 className="h-3.5 w-3.5" />
                                </div>
                              ) : record.status === 'ABSENT' ? (
                                <div className="h-6 w-6 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shadow-sm border border-rose-100">
                                   <XCircle className="h-3.5 w-3.5" />
                                </div>
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
                                   <Clock className="h-3.5 w-3.5" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-6 w-6 mx-auto border-2 border-dotted border-slate-200 rounded-lg bg-slate-50/50 print:border-slate-300" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Protocols */}
          <div className="p-10 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between print:mt-20 print:border-none print:bg-white">
             <div className="hidden print:block space-y-10 w-full">
                <div className="grid grid-cols-3 gap-20">
                   <div className="border-t border-slate-900 pt-2 text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest">Instructor Signature</p>
                   </div>
                   <div className="border-t border-slate-900 pt-2 text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest">Branch Controller</p>
                   </div>
                   <div className="border-t border-slate-900 pt-2 text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest">Internal Audit</p>
                   </div>
                </div>
             </div>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest print:hidden px-2">End of automated registry sequence.</p>
          </div>
        </section>
      ) : (
        <section className="flex flex-col items-center justify-center p-20 rounded-[40px] border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-6">
           <div className="h-20 w-20 rounded-[32px] bg-white border border-slate-200 flex items-center justify-center shadow-xl shadow-slate-200/50">
              <Users className="h-10 w-10 text-slate-200" />
           </div>
           <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-400 tracking-tight">Registry Node Offline</h3>
              <p className="text-sm font-medium text-slate-400 max-w-md mx-auto">Please select an academic course and branch filter parameters to generate the attendance transmission matrix.</p>
           </div>
           <Button onClick={() => setFilters({...filters, courseId: courses[0]?.id || ''})} variant="outline" className="h-10 rounded-xl border-slate-200 font-black uppercase tracking-widest text-[10px] text-indigo-600 hover:bg-indigo-50">
              Auto-Select Primary Node <ArrowRight className="ml-2 h-3.5 w-3.5" />
           </Button>
        </section>
      )}
    </div>
  );
}
