'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, ArrowRight, PlayCircle } from 'lucide-react';
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
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">আমার কোর্স</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">কোর্স দেখুন ও শিখুন</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-400 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
          <BookOpen className="h-4 w-4 text-indigo-500" />
          <span>{courses.length} কোর্স</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {courses.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3 rounded-[2.5rem] border-none bg-white p-20 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-12 w-12 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">No enrolled courses yet</h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">
                Explore our wide range of courses and start your learning journey today!
              </p>
              <Link href="/courses" className="inline-block px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                Browse All Courses
              </Link>
            </Card>
          ) : (
            courses.map((c) => (
              <Card key={c.id} className="group relative overflow-hidden rounded-[2rem] border-none bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500">
                <CardContent className="p-6">
                  <div className="aspect-video bg-slate-100 rounded-2xl mb-6 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                     {c.course.thumbnail ? (
                       <img
                         src={resolveAttachmentUrl(c.course.thumbnail, API_ORIGIN)}
                         alt={c.course.name}
                         className="absolute inset-0 w-full h-full object-cover"
                       />
                     ) : (
                       <div className="absolute inset-0 flex items-center justify-center">
                         <BookOpen className="h-12 w-12 text-slate-300" />
                       </div>
                     )}
                     <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayCircle className="h-12 w-12 text-white drop-shadow-lg" />
                     </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {c.batch?.name ? (
                          <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                            {c.batch.name}
                          </span>
                        ) : null}
                        {c.billingType === 'MONTHLY' ? (
                          <span className="inline-block px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-[10px] font-black uppercase tracking-widest">
                            মাসিক বিলিং
                            {c.billingStartMonth ? ` · ${c.billingStartMonth}` : ''}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {c.course.name}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400 uppercase tracking-widest">অগ্রগতি</span>
                        <span className="text-indigo-600">{c.progress ?? 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                          style={{ width: `${c.progress ?? 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                        চলমান
                      </span>
                      <Link
                        href={`/student/courses/${c.course.slug ?? c.courseId}`}
                        className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-indigo-600 transition-colors shadow-lg"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
