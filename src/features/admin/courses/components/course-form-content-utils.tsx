import { Calendar, Eye, FileCheck, FileText, Video } from 'lucide-react';
import type { ReactNode } from 'react';
import { compareChapterGroups } from '@/lib/course-content-order';

export type CourseResourceRow = {
  id: string;
  type: string;
  title: string;
  subjectTitle?: string | null;
  chapterTitle?: string | null;
  topicTitle?: string | null;
  topicSortOrder?: number | null;
  sortOrder?: number | null;
  durationMinutes?: number | null;
  isFree?: boolean;
  createdAt?: string;
};

export function getResourceIcon(type: string): ReactNode {
  switch (type) {
    case 'VIDEO':
      return <Video className="h-3.5 w-3.5" />;
    case 'SYLLABUS':
      return <FileCheck className="h-3.5 w-3.5" />;
    case 'LEAFLET':
      return <Eye className="h-3.5 w-3.5" />;
    case 'SCHEDULE':
      return <Calendar className="h-3.5 w-3.5" />;
    default:
      return <FileText className="h-3.5 w-3.5" />;
  }
}

export function groupContentBySubject(resources: CourseResourceRow[]) {
  const chapters = resources.reduce<Record<string, CourseResourceRow[]>>((acc, res) => {
    const subject = (res.subjectTitle || '').trim() || 'General';
    const chapter =
      (res.chapterTitle || '').trim() || (res.topicTitle || '').trim() || 'Ungrouped';
    const key = `${subject}:::${chapter}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(res);
    return acc;
  }, {});

  const sortedChapters = Object.entries(chapters).sort(([, a], [, b]) => {
    const subA = (a[0]?.subjectTitle || '').trim() || 'General';
    const subB = (b[0]?.subjectTitle || '').trim() || 'General';
    const subCmp = subA.localeCompare(subB);
    if (subCmp !== 0) return subCmp;
    const chapA = (a[0]?.chapterTitle || '').trim() || (a[0]?.topicTitle || '').trim() || 'Ungrouped';
    const chapB = (b[0]?.chapterTitle || '').trim() || (b[0]?.topicTitle || '').trim() || 'Ungrouped';
    return compareChapterGroups(a, chapA, b, chapB);
  });

  const subjectGroups = new Map<string, [string, CourseResourceRow[]][]>();
  for (const row of sortedChapters) {
    const subjectPart = row[0].split(':::')[0] || 'General';
    if (!subjectGroups.has(subjectPart)) subjectGroups.set(subjectPart, []);
    subjectGroups.get(subjectPart)!.push(row);
  }

  const orderedSubjects = [...subjectGroups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return { sortedChapters, orderedSubjects };
}
