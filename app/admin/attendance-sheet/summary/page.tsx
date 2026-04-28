'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { getPrograms } from '@/lib/api/programs';
import { getCourses } from '@/lib/api/courses';
import { getBatches, type Batch } from '@/lib/api/batches';
import { getAttendanceSummary, type AttendanceSummaryRow } from '@/lib/api/attendance';
import type { Program, Course } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, RefreshCw, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

function pctColor(pct: number) {
  if (pct >= 75) return 'text-emerald-700 bg-emerald-50';
  if (pct >= 50) return 'text-amber-700 bg-amber-50';
  return 'text-rose-700 bg-rose-50';
}

function SummaryInner() {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selProgram, setSelProgram] = useState('');
  const [selCourse, setSelCourse] = useState('');
  const [selBatch, setSelBatch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rows, setRows] = useState<AttendanceSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPrograms().then((r) => setPrograms(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selProgram) { setCourses([]); setSelCourse(''); return; }
    getCourses({ programId: selProgram }).then((r) => setCourses(r.data ?? [])).catch(() => {});
  }, [selProgram]);

  useEffect(() => {
    if (!selCourse) { setBatches([]); setSelBatch(''); return; }
    getBatches({ courseId: selCourse }).then((r) => setBatches(r.data ?? [])).catch(() => {});
  }, [selCourse]);

  const load = useCallback(async () => {
    if (!selCourse || !selBatch) return;
    setLoading(true);
    try {
      const res = await getAttendanceSummary({ courseId: selCourse, batchId: selBatch, startDate: startDate || undefined, endDate: endDate || undefined });
      setRows(res.data ?? []);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to load', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [selCourse, selBatch, startDate, endDate, toast]);

  useEffect(() => { if (selCourse && selBatch) void load(); }, [selCourse, selBatch]);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <Toaster />
      <div>
        <h1 className="text-xl font-bold tracking-tight">Attendance Summary</h1>
        <p className="text-sm text-muted-foreground">Percentage breakdown per student</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Program</Label>
              <Select value={selProgram} onValueChange={(v) => { setSelProgram(v); setSelCourse(''); setSelBatch(''); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>{programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Course</Label>
              <Select value={selCourse} disabled={!selProgram} onValueChange={(v) => { setSelCourse(v); setSelBatch(''); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Batch</Label>
              <Select value={selBatch} disabled={!selCourse} onValueChange={setSelBatch}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Start date</Label>
              <Input type="date" className="h-9 text-xs" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">End date</Label>
              <div className="flex gap-2">
                <Input type="date" className="h-9 text-xs" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                <Button size="sm" className="h-9 bg-emerald-600 hover:bg-emerald-700 shrink-0" onClick={() => void load()} disabled={!selCourse || !selBatch || loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-base">Results — {rows.length} student{rows.length !== 1 ? 's' : ''}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-500" /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Select a course and batch to view summary.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/80">
                    <TableHead className="font-semibold">#</TableHead>
                    <TableHead className="font-semibold">Student ID</TableHead>
                    <TableHead className="text-center font-semibold">Total</TableHead>
                    <TableHead className="text-center font-semibold text-emerald-700">Present</TableHead>
                    <TableHead className="text-center font-semibold text-rose-700">Absent</TableHead>
                    <TableHead className="text-center font-semibold text-amber-700">Late</TableHead>
                    <TableHead className="text-center font-semibold">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={row.studentUserId}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{row.studentUserId}</TableCell>
                      <TableCell className="text-center">{row.totalSessions}</TableCell>
                      <TableCell className="text-center font-mono text-emerald-700">{row.presentCount}</TableCell>
                      <TableCell className="text-center font-mono text-rose-700">{row.absentCount}</TableCell>
                      <TableCell className="text-center font-mono text-amber-700">{row.lateCount}</TableCell>
                      <TableCell className="text-center">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', pctColor(row.attendancePercent))}>
                          {row.attendancePercent}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>}>
      <SummaryInner />
    </Suspense>
  );
}
