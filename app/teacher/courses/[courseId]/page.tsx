'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getCourseById, getCourseContents, deleteCourseContent } from '@/lib/api/courses';
import { getCourseCollaborators, type CourseCollaborator } from '@/lib/api/course-collaborators';
import { API_ORIGIN } from '@/lib/api';
import type { CourseDetails, CourseDetailTeacher } from '@/types/course';
import {
  ArrowLeft,
  FileText,
  Video,
  ExternalLink,
  Calendar,
  Eye,
  FileCheck,
  Play,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CourseResourceForm } from '@/components/admin/courses/CourseResourceForm';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ContentRow {
  id: string;
  type: string;
  title: string;
  fileUrl?: string;
  textBody?: string;
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

function contentUploadAllowed(permissions: unknown): boolean {
  if (permissions == null || typeof permissions !== 'object') return true;
  return (permissions as Record<string, boolean>).contentUpload !== false;
}

function accessFlags(
  userId: string,
  course: CourseDetails,
  collaborators: CourseCollaborator[]
): { hasAccess: boolean; canEdit: boolean; teacherRow?: CourseDetailTeacher; collabRow?: CourseCollaborator } {
  const teacherRow = course.teachers?.find((t) => t.teacher?.id === userId);
  const collabRow = collaborators.find((c) => c.userId === userId);
  const hasAccess = !!(teacherRow || collabRow);
  let canEdit = false;
  if (teacherRow) {
    canEdit = contentUploadAllowed(teacherRow.permissions);
  } else if (collabRow) {
    canEdit = contentUploadAllowed(collabRow.permissions);
  }
  return { hasAccess, canEdit, teacherRow, collabRow };
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
  const { toast } = useToast();

  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [collaborators, setCollaborators] = useState<CourseCollaborator[]>([]);
  const [contents, setContents] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ContentRow | null>(null);
  const [addDefaults, setAddDefaults] = useState<{ topicTitle?: string; topicSortOrder?: number } | null>(null);

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
      const [courseRes, collabRes] = await Promise.all([
        getCourseById(courseId),
        getCourseCollaborators(courseId),
      ]);

      if (!courseRes.success || !courseRes.data) {
        setCourse(null);
        setCollaborators([]);
        setContents([]);
        return;
      }

      const c = courseRes.data as CourseDetails;
      const collabs = collabRes.success && collabRes.data ? collabRes.data : [];
      setCollaborators(collabs);

      const { hasAccess } = accessFlags(userId, c, collabs);
      if (!hasAccess) {
        setForbidden(true);
        setCourse(null);
        setContents([]);
        return;
      }

      setCourse(c);
      const contentRes = await getCourseContents({ courseId: c.id });
      if (contentRes.success && contentRes.data) {
        setContents(contentRes.data as ContentRow[]);
      } else {
        setContents([]);
      }
    } catch {
      setCourse(null);
      setCollaborators([]);
      setContents([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { canEdit, teacherRow, collabRow } = useMemo(() => {
    if (!course || !userId) {
      return { canEdit: false, teacherRow: undefined, collabRow: undefined };
    }
    return accessFlags(userId, course, collaborators);
  }, [course, userId, collaborators]);

  const groups = useMemo(() => groupByTopic(contents), [contents]);

  const openAdd = (topicTitle?: string, topicSortOrder?: number) => {
    setEditingResource(null);
    setAddDefaults(topicTitle != null ? { topicTitle, topicSortOrder } : null);
    setContentDialogOpen(true);
  };

  const openEdit = (row: ContentRow) => {
    setAddDefaults(null);
    setEditingResource(row);
    setContentDialogOpen(true);
  };

  const closeContentDialog = () => {
    setContentDialogOpen(false);
    setEditingResource(null);
    setAddDefaults(null);
  };

  const handleDelete = async (row: ContentRow) => {
    if (!canEdit || !confirm(`Delete “${row.title}”?`)) return;
    try {
      const res = await deleteCourseContent(row.id);
      if (res.success) {
        toast({ title: 'Removed', description: 'Segment deleted' });
        fetchData();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Delete failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

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
          <p className="font-bold text-rose-800">
            You do not have access to this course (not assigned as teacher or collaborator).
          </p>
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
          <p className="text-sm font-mono font-bold text-slate-400 mb-1">{course.slug}</p>
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
            {teacherRow && (
              <Badge className="rounded-lg font-black bg-indigo-600 text-white border-0">Teacher</Badge>
            )}
            {collabRow && (
              <Badge variant="secondary" className="rounded-lg font-black">
                Collaborator
              </Badge>
            )}
          </div>
        </div>
      </div>

      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Eye className="h-5 w-5 text-indigo-600" />
            Course content
            {!canEdit && <span className="text-sm font-bold text-slate-400">(view only)</span>}
          </h2>
          {canEdit && (
            <Button
              type="button"
              onClick={() => openAdd()}
              className="rounded-xl font-black uppercase text-xs h-11 bg-slate-900 hover:bg-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add segment
            </Button>
          )}
        </div>

        {groups.length === 0 ? (
          <p className="text-slate-500 font-medium">No segments yet. {canEdit ? 'Use “Add segment” to create one.' : ''}</p>
        ) : (
          <div className="space-y-8">
            {groups.map((g) => (
              <div key={g.topic} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-black text-slate-800">{g.topic}</h3>
                  {canEdit && g.topic !== 'General' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs font-black uppercase"
                      onClick={() => openAdd(g.topic, g.sortOrder)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add here
                    </Button>
                  )}
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
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {item.fileUrl ? (
                          <a
                            href={resolveFileUrl(item.fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black',
                              'bg-indigo-600 text-white hover:bg-indigo-700 transition-colors'
                            )}
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open
                          </a>
                        ) : null}
                        {canEdit && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 rounded-xl border-slate-200"
                              onClick={() => openEdit(item)}
                              aria-label="Edit segment"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 rounded-xl border-slate-200 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => handleDelete(item)}
                              aria-label="Delete segment"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog open={contentDialogOpen} onOpenChange={(open) => !open && closeContentDialog()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">
              {editingResource ? 'Edit segment' : 'Add segment'}
            </DialogTitle>
          </DialogHeader>
          <CourseResourceForm
            courseId={course.id}
            resource={editingResource || undefined}
            defaultTopicTitle={addDefaults?.topicTitle}
            defaultTopicSortOrder={addDefaults?.topicSortOrder}
            onSuccess={() => {
              closeContentDialog();
              fetchData();
            }}
            onCancel={closeContentDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
