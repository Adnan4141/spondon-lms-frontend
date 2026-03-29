'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getCourses } from '@/lib/api/courses';
import { API_ORIGIN } from '@/lib/api';
import type { Course } from '@/types/course';
import { BookOpen, ArrowRight, GraduationCap, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function thumbnailSrc(course: Course): string | null {
  if (!course.thumbnail) return null;
  return course.thumbnail.startsWith('/') ? `${API_ORIGIN}${course.thumbnail}` : course.thumbnail;
}

const statusStyle: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  DISABLED: 'bg-amber-50 text-amber-800 border-amber-100',
  ARCHIVED: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function TeacherCoursesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!raw) return;
      const u = JSON.parse(raw);
      setUserId(u?.id ?? null);
      setRole(u?.role ?? null);
    } catch {
      setUserId(null);
    }
  }, []);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await getCourses({ teacherUserId: userId, limit: 100 });
      if (res.success && res.data) setCourses(res.data);
      else setCourses([]);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!userId) {
    return (
      <div className="text-center py-20 rounded-[2rem] border border-dashed border-slate-200 bg-white">
        <p className="text-slate-600 mb-4 font-medium">Please log in to see your assigned courses.</p>
        <Link href="/login" className="text-indigo-600 font-black hover:underline">
          Log in
        </Link>
      </div>
    );
  }

  if (role && role !== 'TEACHER') {
    return (
      <div className="text-center py-20 rounded-[2rem] border border-slate-100 bg-white">
        <p className="text-slate-600 font-medium">This area is only for teacher accounts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">My lessons</h1>
        <p className="text-slate-500 mt-2 text-lg font-medium max-w-2xl">
          Courses you are assigned to teach. Open a course to review segments and materials. To edit content, use the admin course manager if you have access.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center">
          <BookOpen className="h-14 w-14 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-700 font-bold text-lg mb-2">No courses assigned yet</p>
          <p className="text-slate-500 font-medium max-w-md mx-auto">
            Ask an administrator to assign you on the course <strong className="text-slate-700">Info</strong> tab under{' '}
            <strong className="text-slate-700">Teachers assigned</strong>.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            const src = thumbnailSrc(course);
            return (
              <Link
                key={course.id}
                href={`/teacher/courses/${course.id}`}
                className="group rounded-[1.75rem] border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-video bg-slate-100">
                  {src ? (
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <GraduationCap className="h-16 w-16" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        'rounded-lg text-[10px] font-black uppercase tracking-wider border',
                        statusStyle[course.status] || 'bg-slate-50 text-slate-600'
                      )}
                    >
                      {course.status}
                    </Badge>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-xs font-mono font-bold text-slate-400 mb-1">{course.code}</p>
                  <h2 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">
                    {course.name}
                  </h2>
                  {course.program?.name && (
                    <p className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-4">
                      <BookOpen className="h-4 w-4 text-indigo-500" />
                      {course.program.name}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {course._count?.enrollments ?? '—'} enrolled
                    </span>
                    <span className="text-sm font-black text-indigo-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                      View
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
