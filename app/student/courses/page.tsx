'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, ArrowRight, PlayCircle, Compass, Library } from 'lucide-react';
import { getMyCourses } from '@/lib/api/student-portal';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import {
  flattenEnrollmentCoursesForStudent,
  type StudentMyCourseFlatRow,
} from '@/lib/student-my-courses';

export default function StudentMyCoursesPage() {
  const [courses, setCourses] = useState<StudentMyCourseFlatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!u) {
        setLoading(false);
        return;
      }
      try {
        const user = JSON.parse(u);
        if (user?.id) {
          const r = await getMyCourses(user.id);
          if (r.success && r.data) {
            setCourses(flattenEnrollmentCoursesForStudent(r.data));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
            <Library className="h-5 w-5 text-indigo-600" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">
              {loading ? 'Loading…' : `${courses.length} enrolled ${courses.length === 1 ? 'course' : 'courses'}`}
            </p>
          </div>
        </div>
        <Link
          href="/courses"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md"
        >
          <Compass className="h-4 w-4" strokeWidth={2.25} />
          Browse Courses
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-600 border-t-transparent" />
        </div>
      ) : courses.length === 0 ? (
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm sm:p-16">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-100">
            <BookOpen className="h-10 w-10 text-slate-300" strokeWidth={1.75} />
          </div>
          <h3 className="mb-2 text-xl font-bold text-slate-900">No enrolled courses yet</h3>
          <p className="mx-auto mb-8 max-w-md text-sm font-medium text-slate-500">
            Browse the course catalog to find programs that match your goals and enroll to start learning.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200/50 transition-colors hover:bg-indigo-700"
          >
            <Compass className="h-4 w-4" />
            Browse Courses
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Card
              key={c.id}
              className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-100/30"
            >
              <CardContent className="p-0">
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                  {c.course.thumbnail ? (
                    <img
                      src={resolveAttachmentUrl(c.course.thumbnail, API_ORIGIN)}
                      alt={c.course.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-slate-300" strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <PlayCircle className="h-12 w-12 text-white drop-shadow-lg" strokeWidth={1.75} />
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {c.batch?.name ? (
                        <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600 ring-1 ring-indigo-100">
                          {c.batch.name}
                        </span>
                      ) : null}
                      {c.billingType === 'MONTHLY' ? (
                        <span className="inline-block rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700 ring-1 ring-violet-100">
                          Monthly
                          {c.billingStartMonth ? ` · ${c.billingStartMonth}` : ''}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="line-clamp-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-indigo-700">
                      {c.course.name}
                    </h3>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-indigo-600">{c.progress ?? 0}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                        style={{ width: `${c.progress ?? 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                      Active
                    </span>
                    <Link
                      href={`/student/courses/${c.course.slug ?? c.courseId}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white transition-colors hover:bg-indigo-600"
                      aria-label={`Open ${c.course.name}`}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
