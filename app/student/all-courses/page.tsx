'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, ArrowRight, BookOpen, Loader2, Search, Users } from 'lucide-react';
import { getPortalCourses, type PortalCatalogCourse } from '@/lib/api/student-portal';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';

function formatFee(course: PortalCatalogCourse): { display: string; original?: string } {
  const fee = Number(course.fee) || 0;
  const offer = course.offerPrice != null ? Number(course.offerPrice) : null;
  if (offer != null && offer < fee) {
    return {
      display: `৳${offer.toLocaleString()}`,
      original: `৳${fee.toLocaleString()}`,
    };
  }
  return { display: `৳${fee.toLocaleString()}` };
}

export default function StudentAllCoursesPage() {
  const [courses, setCourses] = useState<PortalCatalogCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getPortalCourses();
        if (res.success && res.data) {
          setCourses(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.program?.name?.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q),
    );
  }, [courses, search]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="animate-pulse font-bold text-slate-500">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-fit items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-2 text-sm font-bold text-slate-400 shadow-sm">
          <GraduationCap className="h-4 w-4 text-indigo-500" />
          <span>{filtered.length} courses</span>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-100 bg-white py-3 pl-11 pr-4 font-medium transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="rounded-[2.5rem] border-none bg-white p-20 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50">
            <BookOpen className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="mb-2 text-2xl font-black text-slate-900">
            {courses.length === 0 ? 'No courses available' : 'No courses match your search'}
          </h3>
          <p className="mx-auto max-w-sm font-medium text-slate-500">
            {courses.length === 0
              ? 'Check back later for new courses in the catalog.'
              : 'Try a different search term.'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => {
            const fee = formatFee(course);
            const enrollCount = course._count?.enrollmentCourses ?? 0;
            return (
              <Card
                key={course.id}
                className="group relative overflow-hidden rounded-[2rem] border-none bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
              >
                <CardContent className="p-6">
                  <div className="relative mb-6 aspect-video overflow-hidden rounded-2xl bg-slate-100 transition-transform duration-500 group-hover:scale-[1.02]">
                    {course.thumbnail ? (
                      <img
                        src={resolveAttachmentUrl(course.thumbnail, API_ORIGIN)}
                        alt={course.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                    <div className="absolute left-4 top-4">
                      <span className="rounded-full border border-white/30 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                        {course.type === 'ONLINE' ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      {course.program?.name ? (
                        <span className="mb-2 inline-block rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                          {course.program.name}
                        </span>
                      ) : null}
                      <h3 className="line-clamp-2 text-xl font-black text-slate-900 transition-colors group-hover:text-indigo-600">
                        {course.name}
                      </h3>
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fee</p>
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-2xl font-black text-indigo-600">{fee.display}</span>
                          {fee.original ? (
                            <span className="text-sm font-medium text-slate-400 line-through">{fee.original}</span>
                          ) : null}
                        </div>
                      </div>
                      {enrollCount > 0 ? (
                        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                          <Users className="h-3.5 w-3.5" />
                          {enrollCount}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        View details
                      </span>
                      <Link
                        href={`/course/${course.slug || course.id}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-colors hover:bg-indigo-600"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

