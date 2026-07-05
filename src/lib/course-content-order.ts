import { arrayMove } from '@dnd-kit/sortable';
import type { CourseContent } from '@/types/course-content';
import type { ChapterGroup, SubjectGroup } from '@/features/admin/courses/courseTypes';

export const CHAPTER_GAP = 1000;
export const LESSON_GAP = 1;

type OrderableItem = {
  sortOrder?: number | null;
  topicSortOrder?: number | null;
  createdAt?: string;
};

export function lessonSortKey(item: OrderableItem): number {
  return item.sortOrder ?? 0;
}

export function chapterSortKey(items: OrderableItem[]): number {
  if (items.length === 0) return 999_999;
  return Math.min(...items.map((i) => i.topicSortOrder ?? i.sortOrder ?? 999_999));
}

export function chapterCreatedAtMs(items: OrderableItem[]): number {
  if (items.length === 0) return Number.MAX_SAFE_INTEGER;
  return Math.min(
    ...items.map((i) => {
      if (!i.createdAt) return Number.MAX_SAFE_INTEGER;
      const t = new Date(i.createdAt).getTime();
      return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
    }),
  );
}

export function isExplicitChapterOrder(key: number): boolean {
  return key >= CHAPTER_GAP;
}

export function subjectUsesLegacyChapterOrder(chapters: ChapterGroup[]): boolean {
  return chapters.some((ch) => !isExplicitChapterOrder(chapterSortKey(ch.items)));
}

export function compareChapterGroups<T extends OrderableItem>(
  itemsA: T[],
  nameA: string,
  itemsB: T[],
  nameB: string,
): number {
  const keyA = chapterSortKey(itemsA);
  const keyB = chapterSortKey(itemsB);
  const explicitA = isExplicitChapterOrder(keyA);
  const explicitB = isExplicitChapterOrder(keyB);

  if (explicitA && explicitB) {
    if (keyA !== keyB) return keyA - keyB;
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
  }

  if (!explicitA && !explicitB) {
    const tA = chapterCreatedAtMs(itemsA);
    const tB = chapterCreatedAtMs(itemsB);
    if (tA !== tB) return tA - tB;
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
  }

  if (explicitA && !explicitB) return -1;
  return 1;
}

export function moduleSortKey(chapters: ChapterGroup[]): number {
  const all = chapters.flatMap((c) => c.items);
  if (all.length === 0) return 999_999;
  return Math.min(...all.map((i) => i.topicSortOrder ?? i.sortOrder ?? 999_999));
}

function compareByKeyThenName(aKey: number, aName: string, bKey: number, bName: string): number {
  if (aKey !== bKey) return aKey - bKey;
  return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
}

/** Sort chapters inside a subject group. */
export function sortChapters(chapters: ChapterGroup[]): ChapterGroup[] {
  return [...chapters]
    .map((ch) => ({
      ...ch,
      items: [...ch.items].sort((a, b) => lessonSortKey(a) - lessonSortKey(b)),
    }))
    .sort((a, b) => compareChapterGroups(a.items, a.name, b.items, b.name));
}

/** Sort subjects and their chapters for admin display (matches student tree logic). */
export function sortSubjectGroups(groups: SubjectGroup[]): SubjectGroup[] {
  return [...groups]
    .map((g) => ({ ...g, chapters: sortChapters(g.chapters) }))
    .sort((a, b) =>
      compareByKeyThenName(moduleSortKey(a.chapters), a.name, moduleSortKey(b.chapters), b.name),
    );
}

/** Assign sort orders when adding a lesson — new chapters append at the bottom of the subject. */
export function nextOrdersForNewLesson(
  items: CourseContent[],
  subject: string,
  chapter: string,
): { sortOrder: number; topicSortOrder: number } {
  const sub = subject.trim();
  const chap = chapter.trim();

  const inChapter = items.filter(
    (i) => (i.subjectTitle || '').trim() === sub && (i.chapterTitle || '').trim() === chap,
  );

  if (inChapter.length > 0) {
    const maxSort = inChapter.reduce((m, i) => Math.max(m, i.sortOrder ?? 0), -1);
    const maxTopic = inChapter.reduce((m, i) => Math.max(m, i.topicSortOrder ?? i.sortOrder ?? 0), -1);
    return { sortOrder: maxSort + 1, topicSortOrder: maxTopic + 1 };
  }

  const inSubject = items.filter((i) => (i.subjectTitle || '').trim() === sub);
  const maxTopicInSubject = inSubject.reduce(
    (m, i) => Math.max(m, i.topicSortOrder ?? i.sortOrder ?? 0),
    0,
  );
  const chapterBase =
    Math.floor(maxTopicInSubject / CHAPTER_GAP) * CHAPTER_GAP + CHAPTER_GAP;

  return { sortOrder: 1, topicSortOrder: chapterBase };
}

export type ContentOrderUpdate = {
  id: string;
  sortOrder?: number;
  topicSortOrder?: number;
};

/** Diff two flat item lists and return only changed order fields. */
export function diffOrderUpdates(prev: CourseContent[], next: CourseContent[]): ContentOrderUpdate[] {
  const updates: ContentOrderUpdate[] = [];
  for (const n of next) {
    const p = prev.find((x) => x.id === n.id);
    if (!p) continue;
    const sortChanged = (p.sortOrder ?? 0) !== (n.sortOrder ?? 0);
    const topicChanged = (p.topicSortOrder ?? p.sortOrder ?? 0) !== (n.topicSortOrder ?? n.sortOrder ?? 0);
    if (sortChanged || topicChanged) {
      updates.push({
        id: n.id,
        ...(sortChanged ? { sortOrder: n.sortOrder } : {}),
        ...(topicChanged ? { topicSortOrder: n.topicSortOrder ?? n.sortOrder } : {}),
      });
    }
  }
  return updates;
}

function applyUpdates(items: CourseContent[], updates: Map<string, Partial<CourseContent>>): CourseContent[] {
  if (updates.size === 0) return items;
  return items.map((item) => {
    const u = updates.get(item.id);
    return u ? { ...item, ...u } : item;
  });
}

/** Re-encode chapter order by creation time for subjects still using legacy (< CHAPTER_GAP) keys. */
export function normalizeLegacyChapterOrders(
  items: CourseContent[],
  groups: SubjectGroup[],
): { items: CourseContent[]; updates: ContentOrderUpdate[] } {
  const patch = new Map<string, Partial<CourseContent>>();

  for (const subj of groups) {
    if (!subjectUsesLegacyChapterOrder(subj.chapters)) continue;

    const sortedChapters = [...subj.chapters].sort((a, b) =>
      compareChapterGroups(a.items, a.name, b.items, b.name),
    );

    sortedChapters.forEach((chap, chapIndex) => {
      const chapterBase = (chapIndex + 1) * CHAPTER_GAP;
      const lessons = [...chap.items].sort((a, b) => lessonSortKey(a) - lessonSortKey(b));
      lessons.forEach((lesson, lessonIndex) => {
        patch.set(lesson.id, {
          topicSortOrder: chapterBase + lessonIndex * LESSON_GAP,
          sortOrder: lessonIndex + 1,
        });
      });
    });
  }

  const next = applyUpdates(items, patch);
  return { items: next, updates: diffOrderUpdates(items, next) };
}

/** Reassign topicSortOrder + sortOrder for all items following subject/chapter order. */
export function encodeFullOrder(groups: SubjectGroup[]): Map<string, Partial<CourseContent>> {
  const updates = new Map<string, Partial<CourseContent>>();
  let moduleBase = 0;

  for (const subj of groups) {
    moduleBase += CHAPTER_GAP;
    subj.chapters.forEach((chap, chapIndex) => {
      const chapterBase = moduleBase + (chapIndex + 1) * CHAPTER_GAP;
      const sortedLessons = [...chap.items].sort((a, b) => lessonSortKey(a) - lessonSortKey(b));
      sortedLessons.forEach((lesson, lessonIndex) => {
        updates.set(lesson.id, {
          topicSortOrder: chapterBase + lessonIndex * LESSON_GAP,
          sortOrder: lessonIndex + 1,
        });
      });
    });
  }

  return updates;
}

export function reorderModules(
  items: CourseContent[],
  groups: SubjectGroup[],
  fromIndex: number,
  toIndex: number,
): CourseContent[] {
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return items;
  const reordered = arrayMove([...groups], fromIndex, toIndex);
  const updates = encodeFullOrder(reordered);
  return applyUpdates(items, updates);
}

export function reorderChapters(
  items: CourseContent[],
  groups: SubjectGroup[],
  subjectName: string,
  fromChapter: string,
  toChapter: string,
): CourseContent[] {
  const subj = groups.find((s) => s.name === subjectName);
  if (!subj) return items;

  const oldIdx = subj.chapters.findIndex((c) => c.name === fromChapter);
  const newIdx = subj.chapters.findIndex((c) => c.name === toChapter);
  if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return items;

  const reorderedChapters = arrayMove([...subj.chapters], oldIdx, newIdx);
  const updates = new Map<string, Partial<CourseContent>>();

  reorderedChapters.forEach((chap, chapIndex) => {
    const chapterBase = (chapIndex + 1) * CHAPTER_GAP;
    const sortedLessons = [...chap.items].sort((a, b) => lessonSortKey(a) - lessonSortKey(b));
    sortedLessons.forEach((lesson, lessonIndex) => {
      updates.set(lesson.id, {
        topicSortOrder: chapterBase + lessonIndex * LESSON_GAP,
        sortOrder: lessonIndex + 1,
      });
    });
  });

  return applyUpdates(items, updates);
}

export function reorderLessons(
  items: CourseContent[],
  subjectName: string,
  chapterName: string,
  activeId: string,
  overId: string,
): CourseContent[] {
  const norm = (s?: string | null) => (s || '').trim();
  const sub = norm(subjectName) || '(No Subject)';
  const chap = norm(chapterName) || '(No Chapter)';

  const chapItems = items
    .filter((i) => (norm(i.subjectTitle) || '(No Subject)') === sub && (norm(i.chapterTitle) || '(No Chapter)') === chap)
    .sort((a, b) => lessonSortKey(a) - lessonSortKey(b));

  const oldIndex = chapItems.findIndex((i) => i.id === activeId);
  const newIndex = chapItems.findIndex((i) => i.id === overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return items;

  const reordered = arrayMove(chapItems, oldIndex, newIndex);
  const existingOrders = [...chapItems].map((i) => i.sortOrder ?? 0).sort((a, b) => a - b);
  const updates = new Map<string, Partial<CourseContent>>();

  reordered.forEach((item, index) => {
    const targetSortOrder = existingOrders[index];
    if ((item.sortOrder ?? 0) !== targetSortOrder) {
      updates.set(item.id, { sortOrder: targetSortOrder });
    }
  });

  return applyUpdates(items, updates);
}

/** DnD id helpers — use indices to avoid delimiter collisions in titles. */
export function moduleDndId(subjectIndex: number): string {
  return `mod::${subjectIndex}`;
}

export function chapterDndId(subjectIndex: number, chapterIndex: number): string {
  return `ch::${subjectIndex}::${chapterIndex}`;
}

export function lessonDndId(contentId: string): string {
  return `les::${contentId}`;
}

export function parseModuleDndId(id: string): number | null {
  const m = /^mod::(\d+)$/.exec(id);
  return m ? parseInt(m[1], 10) : null;
}

export function parseChapterDndId(id: string): { subjectIndex: number; chapterIndex: number } | null {
  const m = /^ch::(\d+)::(\d+)$/.exec(id);
  if (!m) return null;
  return { subjectIndex: parseInt(m[1], 10), chapterIndex: parseInt(m[2], 10) };
}

export function parseLessonDndId(id: string): string | null {
  const m = /^les::(.+)$/.exec(id);
  return m ? m[1] : null;
}
