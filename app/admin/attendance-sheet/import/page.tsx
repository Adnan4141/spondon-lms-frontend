'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { getBatches, type Batch } from '@/lib/api/batches';
import { importAttendanceFile } from '@/lib/api/attendance';
import { useAdminProgramCourseOptions } from '@/lib/query/hooks/useAdminProgramCourseOptions';
import { Button } from '@/components/ui/button';
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
import { Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';

function ImportInner() {
  const { toast } = useToast();
  const [selProgram, setSelProgram] = useState('');
  const [selCourse, setSelCourse] = useState('');
  const { programs, courses } = useAdminProgramCourseOptions(selProgram);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selBatch, setSelBatch] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selProgram) setSelCourse('');
  }, [selProgram]);

  useEffect(() => {
    if (!selCourse) { setBatches([]); setSelBatch(''); return; }
    getBatches({ courseId: selCourse }).then((r) => setBatches(r.data ?? [])).catch(() => {});
  }, [selCourse]);

  async function runImport() {
    if (!file || !selCourse || !selBatch) return;
    setImporting(true);
    setResult(null);
    try {
      const res = await importAttendanceFile(file, { courseId: selCourse, batchId: selBatch });
      if (res.success) {
        setResult(res.data ?? null);
        toast({ title: 'Imported', description: res.message ?? 'Done', variant: 'success' });
      } else {
        toast({ title: 'Failed', description: res.message ?? 'Unknown error', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Import failed', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      <Toaster />
      <div>
        <h1 className="text-xl font-bold tracking-tight">Import Attendance</h1>
        <p className="text-sm text-muted-foreground">Upload a filled Excel or CSV file to bulk-update attendance records.</p>
      </div>

      <Card className="border-0 shadow-sm max-w-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Upload file</CardTitle>
          <CardDescription>
            Supported formats: XLSX, XLS, CSV. Accepts both the offline blank sheet format (studentUserId + date columns) and flat row-per-record format.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Label className="text-xs text-muted-foreground">File</Label>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }} />
            <Button variant="outline" className="w-full justify-start" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              {file ? file.name : 'Choose file (xlsx, xls, csv)'}
            </Button>
          </div>

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={!file || !selCourse || !selBatch || importing}
            onClick={() => void runImport()}
          >
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import
          </Button>

          {result && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
              <p className="font-medium text-emerald-800">
                Imported {result.imported} record{result.imported !== 1 ? 's' : ''}
                {result.skipped > 0 && `, ${result.skipped} row${result.skipped !== 1 ? 's' : ''} skipped`}
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-rose-700">
                  {result.errors.slice(0, 15).map((e, i) => <li key={i}>• {e}</li>)}
                  {result.errors.length > 15 && <li>…and {result.errors.length - 15} more</li>}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>}>
      <ImportInner />
    </Suspense>
  );
}
