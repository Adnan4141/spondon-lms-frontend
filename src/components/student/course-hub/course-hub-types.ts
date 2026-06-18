import { groupContentsBySubjectChapter, uniqueSubjectsFromGroups } from '@/lib/course-outline';
import {
  buildSubjectRouteTable,
  normalizeSubjectLabel,
  type SubjectRouteEntry,
} from '@/lib/course-subject-slugs';

export type HubContentItem = {
  id: string;
  type: string;
  title: string;
  fileUrl?: string | null;
  subjectTitle?: string | null;
  chapterTitle?: string | null;
  topicTitle?: string;
  durationMinutes?: number;
  sortOrder: number;
  lessonResourceId?: string | null;
  progress?: { completed: boolean; progressPercent?: number } | null;
};

export type SubjectRowStats = {
  segments: number;
  chapters: number;
  videos: number;
  progressPct: number;
};

export type SubjectRow = SubjectRouteEntry & { stats: SubjectRowStats };

export function subjectStats(contents: HubContentItem[], subjectTitle: string): SubjectRowStats {
  const f = contents.filter((c) => normalizeSubjectLabel(c.subjectTitle) === subjectTitle);
  const videos = f.filter((c) => c.type === 'VIDEO');
  const completed = videos.filter((c) => c.progress?.completed).length;
  const pct = videos.length ? Math.round((completed / videos.length) * 100) : 0;
  const chapters = new Set(
    f.map((c) => (c.chapterTitle || '').trim() || (c.topicTitle || '').trim() || 'General'),
  ).size;
  return { segments: f.length, chapters, videos: videos.length, progressPct: pct };
}

export function buildSubjectRows(contents: HubContentItem[]): SubjectRow[] {
  const groups = groupContentsBySubjectChapter(contents);
  const titles = uniqueSubjectsFromGroups(groups);
  const table = buildSubjectRouteTable(titles);
  return table
    .map((row) => ({
      ...row,
      stats: subjectStats(contents, row.title),
    }))
    .sort((a, b) => b.stats.progressPct - a.stats.progressPct || a.title.localeCompare(b.title));
}

export function countSubjectStatuses(subjects: SubjectRow[]) {
  let inProgress = 0;
  let completed = 0;
  for (const s of subjects) {
    if (s.stats.progressPct >= 100) completed += 1;
    else if (s.stats.progressPct > 0) inProgress += 1;
  }
  return { total: subjects.length, inProgress, completed };
}

export function computeCourseProgress(contents: HubContentItem[]): number {
  const videos = contents.filter((c) => c.type === 'VIDEO');
  if (!videos.length) return 0;
  const done = videos.filter((c) => c.progress?.completed).length;
  return Math.round((done / videos.length) * 100);
}

export type ResumeLesson = {
  subjectSlug: string;
  subjectTitle: string;
  lessonTitle: string;
  lessonId: string;
  href: string;
};

export function pickResumeLesson(
  contents: HubContentItem[],
  courseRouteId: string,
): ResumeLesson | null {
  if (contents.length === 0) return null;

  const table = buildSubjectRouteTable(
    uniqueSubjectsFromGroups(groupContentsBySubjectChapter(contents)),
  );
  const slugBySubject = new Map(table.map((r) => [r.title, r.slug]));

  const videos = contents
    .filter((c) => c.type === 'VIDEO')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (videos.length === 0) {
    const first = table[0];
    if (!first) return null;
    return {
      subjectSlug: first.slug,
      subjectTitle: first.title,
      lessonTitle: first.title,
      lessonId: '',
      href: `/student/courses/${courseRouteId}/${first.slug}`,
    };
  }

  const inProgress = [...videos]
    .reverse()
    .find(
      (v) =>
        v.progress &&
        !v.progress.completed &&
        ((v.progress.progressPercent ?? 0) > 0 || v.progress.completed === false),
    );

  const target =
    inProgress ??
    videos.find((v) => !v.progress?.completed) ??
    videos[videos.length - 1];

  const subjectTitle = normalizeSubjectLabel(target.subjectTitle);
  const subjectSlug = slugBySubject.get(subjectTitle);
  if (!subjectSlug) return null;

  return {
    subjectSlug,
    subjectTitle,
    lessonTitle: target.title,
    lessonId: target.id,
    href: `/student/courses/${courseRouteId}/${subjectSlug}?lesson=${encodeURIComponent(target.id)}`,
  };
}
