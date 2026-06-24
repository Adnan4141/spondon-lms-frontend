'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link2, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { getCourses } from '@/lib/api/courses';
import { getExamCourseLinks, linkExamCourse, unlinkExamCourse } from '@/lib/api/exams';
import type { ExamCourseLink } from '@/types/exam';
import type { Course } from '@/types/course';

type Props = {
  examId: string;
  primaryCourseId: string;
  primaryCourseName?: string;
};

export function ExamCourseLinksPanel({ examId, primaryCourseId, primaryCourseName }: Props) {
  const toast = useAdminToast();
  const [links, setLinks] = useState<ExamCourseLink[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pickCourseId, setPickCourseId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [linkRes, courseRes] = await Promise.all([
      getExamCourseLinks(examId),
      getCourses({ limit: 300, status: 'ACTIVE' }),
    ]);
    if (linkRes.success && linkRes.data) setLinks(linkRes.data);
    else setLinks([]);
    if (courseRes.success && courseRes.data) setCourses(courseRes.data);
    else setCourses([]);
    setLoading(false);
  }, [examId]);

  useEffect(() => {
    void load();
  }, [load]);

  const extraLinks = useMemo(
    () => links.filter((row) => row.courseId !== primaryCourseId),
    [links, primaryCourseId],
  );

  const addOptions = useMemo(() => {
    const linked = new Set(links.map((row) => row.courseId));
    return courses
      .filter((c) => c.id !== primaryCourseId && !linked.has(c.id))
      .map((c) => ({ value: c.id, label: c.name }));
  }, [courses, links, primaryCourseId]);

  const addCourse = async () => {
    if (!pickCourseId) return;
    setBusy(true);
    try {
      const res = await linkExamCourse(examId, pickCourseId);
      if (!res.success) {
        toast({ title: 'Could not link course', description: res.message, variant: 'destructive' });
        return;
      }
      setLinks(res.data ?? []);
      setPickCourseId('');
      toast({ title: 'Course linked' });
    } finally {
      setBusy(false);
    }
  };

  const removeCourse = async (courseId: string) => {
    setBusy(true);
    try {
      const res = await unlinkExamCourse(examId, courseId);
      if (!res.success) {
        toast({ title: 'Could not unlink course', description: res.message, variant: 'destructive' });
        return;
      }
      setLinks(res.data ?? []);
      toast({ title: 'Course unlinked' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-lg text-[#0D1B35] flex items-center gap-2">
          <Link2 className="h-5 w-5 text-indigo-600" />
          Audience courses
        </CardTitle>
        <CardDescription>
          Link extra audience courses here, or manage all courses and scopes in the exam wizard Audience section.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : (
          <>
            {extraLinks.length === 0 ? (
              <p className="text-sm text-slate-500">No additional audience courses linked.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                {extraLinks.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="font-medium text-slate-900">{row.course?.name ?? row.courseId}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                      disabled={busy}
                      onClick={() => void removeCourse(row.courseId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-2">
              <Label>Add audience course</Label>
              <div className="flex flex-wrap gap-2">
                <SearchableSelect
                  options={addOptions}
                  value={pickCourseId}
                  onValueChange={setPickCourseId}
                  placeholder="Select course to link"
                  searchPlaceholder="Search courses…"
                  emptyMessage="No courses available."
                  triggerClassName="h-10 min-w-[220px] flex-1 rounded-md border-slate-200 bg-white"
                />
                <Button type="button" size="sm" disabled={!pickCourseId || busy} onClick={() => void addCourse()}>
                  Link course
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
