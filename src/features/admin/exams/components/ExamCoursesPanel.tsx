'use client';

import { useEffect, useState, useMemo } from 'react';
import { linkExamCourse, unlinkExamCourse } from '@/lib/api/exams';
import { getCourses } from '@/lib/api/courses';
import type { ExamCourseLink } from '@/types/exam';
import type { Course } from '@/types/course';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Link2, Loader2, Unlink, Users } from 'lucide-react';

interface ExamCoursesPanelProps {
  examId: string;
  primaryCourseId: string;
  primaryCourseName?: string;
  initialLinks?: ExamCourseLink[];
  onChanged?: () => void;
}

export function ExamCoursesPanel({
  examId,
  primaryCourseId,
  primaryCourseName,
  initialLinks,
  onChanged,
}: ExamCoursesPanelProps) {
  const { toast } = useToast();
  const [links, setLinks] = useState<ExamCourseLink[]>(initialLinks ?? []);
  const [courses, setCourses] = useState<Course[]>([]);
  const [pick, setPick] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLinks(initialLinks ?? []);
  }, [initialLinks, examId]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const cRes = await getCourses({ status: 'ACTIVE', limit: 500 });
        if (cRes.success && cRes.data) setCourses(cRes.data);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [examId]);

  const linkedIds = useMemo(() => new Set(links.map((l) => l.courseId)), [links]);

  const candidates = useMemo(
    () => courses.filter((c) => c.id !== primaryCourseId && !linkedIds.has(c.id)),
    [courses, primaryCourseId, linkedIds],
  );

  const handleLink = async () => {
    if (!pick) return;
    setBusy(true);
    try {
      const res = await linkExamCourse(examId, pick);
      if (res.success && res.data) {
        setLinks(res.data);
        setPick('');
        toast({ title: 'Linked', description: 'Course added to this exam.', variant: 'success' });
        onChanged?.();
      } else {
        toast({ title: 'Error', description: res.message || 'Could not link', variant: 'destructive' });
      }
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Link failed',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = async (courseId: string) => {
    setBusy(true);
    try {
      const res = await unlinkExamCourse(examId, courseId);
      if (res.success && res.data) {
        setLinks(res.data);
        toast({ title: 'Unlinked', variant: 'success' });
        onChanged?.();
      } else {
        toast({ title: 'Error', description: res.message || 'Could not unlink', variant: 'destructive' });
      }
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Unlink failed',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Primary course</h3>
            <p className="mt-1 text-sm text-slate-600">
              {primaryCourseName ?? primaryCourseId}{' '}
              <span className="text-xs text-slate-400">(always included; cannot unlink)</span>
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Link2 className="h-4 w-4 text-emerald-600" />
          Extra linked courses
        </div>
        <p className="mb-4 text-xs leading-relaxed text-slate-500">
          Students enrolled in any linked course (same branch/batch rules as the exam) can see and take this exam.
          The global leaderboard includes attempts from all of them.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Add course</label>
            <Select value={pick || undefined} onValueChange={setPick}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200">
                <SelectValue placeholder="Select a course to link…" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {candidates.length === 0 ? (
                  <div className="p-3 text-sm text-slate-500">No more courses to link</div>
                ) : (
                  candidates.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            className="h-11 rounded-xl"
            disabled={!pick || busy}
            onClick={handleLink}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Link course'}
          </Button>
        </div>
      </div>

      {links.length > 0 ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {links.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <BookOpen className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate text-sm font-medium text-slate-800">
                  {row.course?.name ?? row.courseId}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-rose-600 hover:bg-rose-50"
                disabled={busy}
                onClick={() => handleUnlink(row.courseId)}
              >
                <Unlink className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-500">
          No extra courses linked yet.
        </p>
      )}
    </div>
  );
}
