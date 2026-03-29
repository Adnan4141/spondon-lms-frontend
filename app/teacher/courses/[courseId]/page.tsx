'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getCourseById, getCourseContents } from '@/lib/api/courses';
import { API_ORIGIN } from '@/lib/api';
import type { CourseDetails } from '@/types/course';
import {
  ArrowLeft,
  FileText,
  Video,
  ExternalLink,
  Calendar,
  Eye,
  FileCheck,
  Play,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ContentRow {
  id: string;
  type: string;
  title: string;
  fileUrl?: string;
  topicTitle?: string;
  topicSortOrder?: number;
  sortOrder: number;
  durationMinutes?: number;
}

function thumbnailSrc(course: CourseDetails): string | null {
  if (!course.thumbnail) return null;
  return course.thumbnail.startsWith('/') ? `${API_ORIGIN}${course.thumbnail}` : course.thumbnail;
}

function resolveFileUrl(url: string): string {
  return url.startsWith('/') ? `${API_ORIGIN}${url}` : url;
}

function iconForType(type: string) {
  switch (type) {
    case 'VIDEO':
      return <Video className="h-4 w-4" />;
    case 'SYLLABUS':
      return <FileCheck className="h-4 w-4" />;
    case 'LEAFLET':
    case 'SCHEDULE':
      return <Calendar className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function groupByTopic(contents: ContentRow[]) {
  const groups: { topic: string; sortOrder: number; items: ContentRow[] }[] = [];
  const map = new Map<string, ContentRow[]>();

  for (const c of contents) {
    const topic = c.topicTitle || 'General';
    const so = c.topicSortOrder ?? 999;
    if (!map.has(topic)) {
      map.set(topic, []);
      groups.push({ topic, sortOrder: so, items: [] });
    }
    map.get(topic)!.push(c);
  }

  for (const g of groups) {
    g.items = map.get(g.topic)!.sort((a, b) => a.sortOrder - b.sortOrder);
  }
  groups.sort((a, b) => a.sortOrder - b.sortOrder);

  return groups;
}

export default function TeacherCourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [contents, setContents] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

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

  const fetchData = useCallback(async () => {
    if (!courseId || !userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setForbidden(false);
      const [courseRes, contentRes] = await Promise.all([
        getCourseById(courseId),
        getCourseContents({ courseId }),
      ]);

      if (!courseRes.success || !courseRes.data) {
        setCourse(null);
        setContents([]);
        return;
      }

      const c = courseRes.data as CourseDetails;
      const isTeacher = c.teachers?.some((t) => t.teacher?.id === userId);
      if (!isTeacher) {
        setForbidden(true);
        setCourse(null);
        setContents([]);
        return;
      }

      setCourse(c);
      if (contentRes.success && contentRes.data) {
        setContents(contentRes.data as ContentRow[]);
      } else {
        setContents([]);
      }
    } catch {
      setCourse(null);
      setContents([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const groups = useMemo(() => groupByTopic(contents), [contents]);

  if (!userId) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-600 mb-4">Please log in.</p>
        <Link href="/login" className="text-indigo-600 font-bold">
          Log in
        </Link>
      </div>
    );
  }

  if (role && role !== 'TEACHER') {
    return (
      <div className="text-center py-20">
        <p className="text-slate-600">Teachers only.</p>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="space-y-6">
        <Link
          href="/teacher/courses"
          className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to my lessons
        </Link>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-8 text-center">
          <p className="font-bold text-rose-800">You are not assigned to this course.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <Link href="/teacher/courses" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <p className="text-slate-600">Course not found.</p>
      </div>
    );
  }

  const thumb = thumbnailSrc(course);

  return (
    <div className="space-y-10 pb-20">
      <Link
        href="/teacher/courses"
        className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        All my lessons
      </Link>

      <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
        <div className="w-full lg:w-72 aspect-video lg:aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-300">
              <Play className="h-16 w-16 opacity-40" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-bold text-slate-400 mb-1">{course.code}</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{course.name}</h1>
          {course.program?.name && (
            <p className="mt-2 text-slate-600 font-bold">{course.program.name}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="rounded-lg font-bold">
              {course.type}
            </Badge>
            <Badge variant="outline" className="rounded-lg font-bold">
              {course.status}
            </Badge>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
          <Eye className="h-5 w-5 text-indigo-600" />
          Course content (read-only)
        </h2>

        {groups.length === 0 ? (
          <p className="text-slate-500 font-medium">No segments uploaded for this course yet.</p>
        ) : (
          <div className="space-y-8">
            {groups.map((g) => (
              <div key={g.topic} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                  <h3 className="font-black text-slate-800">{g.topic}</h3>
                </div>
                <ul className="divide-y divide-slate-100">
                  {g.items.map((item) => (
                    <li
                      key={item.id}
                      className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="mt-0.5 text-slate-400">{iconForType(item.type)}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">{item.title}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] font-black uppercase">
                              {item.type}
                            </Badge>
                            {item.durationMinutes != null && item.durationMinutes > 0 && (
                              <span className="text-xs text-slate-400 font-bold">{item.durationMinutes} min</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {item.fileUrl ? (
                        <a
                          href={resolveFileUrl(item.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'inline-flex items-center gap-2 shrink-0 px-4 py-2 rounded-xl text-sm font-black',
                            'bg-indigo-600 text-white hover:bg-indigo-700 transition-colors'
                          )}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
