import { compareChapterGroups } from '@/lib/course-content-order';

/**
 * Client-side mirror of backend course-content-tree (for admin grouping).
 * Keep in sync with backend/src/utils/course-content-tree.ts
 */

export type FlatCourseContentRow = {
  id: string;
  title: string;
  type: string;
  sortOrder: number;
  subjectTitle?: string | null;
  chapterTitle?: string | null;
  topicTitle?: string | null;
  topicSortOrder?: number | null;
  durationMinutes?: number | null;
  isFree?: boolean;
  createdAt?: string;
};

export type OutlineSegment = {
  id: string;
  title: string;
  type: string;
  sortOrder: number;
  durationMinutes: number | null;
  isFree: boolean;
  topicTitle: string | null;
};

export type OutlineChapter = {
  id: string;
  title: string;
  sortOrder: number;
  segments: OutlineSegment[];
};

export type OutlineSubject = {
  id: string;
  title: string;
  sortOrder: number;
  chapters: OutlineChapter[];
};

export type CourseContentTree = {
  totals: {
    subjects: number;
    chapters: number;
    segments: number;
    videos: number;
    notes: number;
  };
  subjects: OutlineSubject[];
};

function slugPart(s: string, i: number) {
  const base = s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'item'}-${i}`;
}

const NOTE_LIKE = new Set(['NOTE', 'PDF', 'SYLLABUS', 'LEAFLET', 'SAMPLE', 'OTHER']);

export function buildCourseContentTree(
  rows: FlatCourseContentRow[],
  opts?: { subjectPrefix?: string },
): CourseContentTree {
  const prefix = opts?.subjectPrefix?.trim();
  const subjectMap = new Map<
    string,
    {
      title: string;
      sortOrder: number;
      chapters: Map<
        string,
        {
          title: string;
          sortOrder: number;
          segments: FlatCourseContentRow[];
        }
      >;
    }
  >();

  for (const row of rows) {
    let subject = (row.subjectTitle || '').trim() || 'Course';
    if (prefix) subject = `${prefix}: ${subject}`;

    const rawChapter = (row.chapterTitle || '').trim();
    const topic = (row.topicTitle || '').trim();
    const chapter = rawChapter || topic || 'General';

    const subSo = row.topicSortOrder ?? row.sortOrder ?? 999;
    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, { title: subject, sortOrder: subSo, chapters: new Map() });
    }
    const sub = subjectMap.get(subject)!;
    sub.sortOrder = Math.min(sub.sortOrder, subSo);

    if (!sub.chapters.has(chapter)) {
      sub.chapters.set(chapter, { title: chapter, sortOrder: subSo, segments: [] });
    }
    const ch = sub.chapters.get(chapter)!;
    ch.sortOrder = Math.min(ch.sortOrder, subSo);
    ch.segments.push(row);
  }

  const subjects: OutlineSubject[] = [];
  let si = 0;
  let totalChapters = 0;
  let totalSegments = 0;
  let videos = 0;
  let notes = 0;

  const sortedSubjects = [...subjectMap.entries()].sort((a, b) => {
    const so = a[1].sortOrder - b[1].sortOrder;
    if (so !== 0) return so;
    return a[1].title.localeCompare(b[1].title);
  });

  for (const [, sub] of sortedSubjects) {
    const chapters: OutlineChapter[] = [];
    let ci = 0;
    const sortedChapters = [...sub.chapters.entries()].sort((a, b) =>
      compareChapterGroups(a[1].segments, a[1].title, b[1].segments, b[1].title),
    );

    for (const [, ch] of sortedChapters) {
      const segs = [...ch.segments].sort((a, b) => a.sortOrder - b.sortOrder);
      const segments: OutlineSegment[] = segs.map((r) => {
        if (r.type === 'VIDEO') videos += 1;
        else if (NOTE_LIKE.has(r.type)) notes += 1;
        totalSegments += 1;
        return {
          id: r.id,
          title: r.title,
          type: r.type,
          sortOrder: r.sortOrder,
          durationMinutes: r.durationMinutes ?? null,
          isFree: r.isFree ?? false,
          topicTitle: (r.topicTitle || '').trim() || null,
        };
      });
      totalChapters += 1;
      chapters.push({
        id: slugPart(ch.title, ci++),
        title: ch.title,
        sortOrder: ch.sortOrder,
        segments,
      });
    }

    subjects.push({
      id: slugPart(sub.title, si++),
      title: sub.title,
      sortOrder: sub.sortOrder,
      chapters,
    });
  }

  return {
    totals: {
      subjects: subjects.length,
      chapters: totalChapters,
      segments: totalSegments,
      videos,
      notes,
    },
    subjects,
  };
}

/** Student sidebar: flat list grouped by subject + chapter (legacy CourseContent shape). */
export type SubjectChapterGroup<T> = {
  key: string;
  subject: string;
  chapter: string;
  sortOrder: number;
  /** Explicit chapter position when available (curriculum-backed); undefined for legacy content. */
  chapterSortOrder?: number;
  items: T[];
};

export function groupContentsBySubjectChapter<
  T extends {
    subjectTitle?: string | null;
    chapterTitle?: string | null;
    chapterSortOrder?: number;
    topicTitle?: string;
    topicSortOrder?: number;
    sortOrder: number;
    createdAt?: string;
  },
>(contents: T[]): SubjectChapterGroup<T>[] {
  const map = new Map<string, SubjectChapterGroup<T>>();

  for (const c of contents) {
    const subject = (c.subjectTitle || '').trim() || 'Course';
    const chapter =
      (c.chapterTitle || '').trim() || (c.topicTitle || '').trim() || 'General';
    const key = `${subject}\n${chapter}`;
    const itemSo = c.topicSortOrder ?? c.sortOrder ?? 999;
    if (!map.has(key)) {
      map.set(key, {
        key,
        subject,
        chapter,
        sortOrder: itemSo,
        chapterSortOrder: c.chapterSortOrder,
        items: [],
      });
    }
    const g = map.get(key)!;
    // Keep the smallest lesson order as the group's representative position.
    g.sortOrder = Math.min(g.sortOrder, itemSo);
    if (g.chapterSortOrder == null && c.chapterSortOrder != null) {
      g.chapterSortOrder = c.chapterSortOrder;
    }
    g.items.push(c);
  }

  const groups = [...map.values()].map((g) => ({
    ...g,
    items: g.items.sort((a, b) => a.sortOrder - b.sortOrder),
  }));

  groups.sort((a, b) => {
    const s = a.subject.localeCompare(b.subject);
    if (s !== 0) return s;
    if (a.chapterSortOrder != null && b.chapterSortOrder != null) {
      if (a.chapterSortOrder !== b.chapterSortOrder) {
        return a.chapterSortOrder - b.chapterSortOrder;
      }
    } else if (a.chapterSortOrder != null) {
      return -1;
    } else if (b.chapterSortOrder != null) {
      return 1;
    }
    return compareChapterGroups(a.items, a.chapter, b.items, b.chapter);
  });

  return groups;
}

export function uniqueSubjectsFromGroups<T>(groups: SubjectChapterGroup<T>[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const g of groups) {
    if (!seen.has(g.subject)) {
      seen.add(g.subject);
      out.push(g.subject);
    }
  }
  return out;
}
