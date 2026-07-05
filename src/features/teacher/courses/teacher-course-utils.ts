import { API_ORIGIN } from '@/lib/api';
import type { CourseCollaborator } from '@/lib/api/course-collaborators';
import { groupContents } from '@/features/admin/courses/courseUtils';
import type { CourseDetails, CourseDetailTeacher } from '@/types/course';
import type { CourseContent } from '@/types/course-content';

export function thumbnailSrc(thumbnail?: string | null): string | null {
  if (!thumbnail) return null;
  return thumbnail.startsWith('/') ? `${API_ORIGIN}${thumbnail}` : thumbnail;
}

export function resolveFileUrl(url: string): string {
  return url.startsWith('/') ? `${API_ORIGIN}${url}` : url;
}

export function contentUploadAllowed(permissions: unknown): boolean {
  if (permissions == null || typeof permissions !== 'object') return true;
  return (permissions as Record<string, boolean>).contentUpload !== false;
}

export function accessFlags(
  userId: string,
  course: CourseDetails,
  collaborators: CourseCollaborator[],
): {
  hasAccess: boolean;
  canEdit: boolean;
  teacherRow?: CourseDetailTeacher;
  collabRow?: CourseCollaborator;
} {
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

export function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function computeContentStats(items: CourseContent[]) {
  const subjects = groupContents(items);
  const chapterCount = subjects.reduce((n, s) => n + s.chapters.length, 0);
  const segmentCount = items.length;
  const videoCount = items.filter((i) => i.type === 'VIDEO').length;
  const docCount = items.filter((i) =>
    ['PDF', 'NOTE', 'SYLLABUS', 'LEAFLET', 'SAMPLE'].includes(i.type),
  ).length;
  const totalDurationMinutes = items.reduce((n, i) => n + (i.durationMinutes ?? 0), 0);

  return {
    subjects,
    subjectCount: subjects.length,
    chapterCount,
    segmentCount,
    videoCount,
    docCount,
    totalDurationMinutes,
  };
}

export type TeacherAddSegmentContext = {
  subjectTitle?: string;
  chapterTitle?: string;
  topicTitle?: string;
  topicSortOrder?: number;
};
