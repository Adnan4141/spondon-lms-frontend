import type { CurriculumTreeNode } from '@/features/admin/curriculum/curriculum-types';
import type { SubjectGroup } from './courseTypes';

export type ImportSelectionStats = {
  subjects: number;
  chapters: number;
  lessons: number;
  resources: number;
};

export function collectDescendantNodeIds(node: CurriculumTreeNode): string[] {
  const ids = [node.id];
  for (const child of node.children ?? []) {
    ids.push(...collectDescendantNodeIds(child));
  }
  return ids;
}

export function countCurriculumSelection(
  tree: CurriculumTreeNode[],
  selectedIds: Set<string>,
): ImportSelectionStats {
  const stats: ImportSelectionStats = { subjects: 0, chapters: 0, lessons: 0, resources: 0 };

  const walk = (node: CurriculumTreeNode) => {
    if (!selectedIds.has(node.id)) return;
    if (node.type === 'SUBJECT') stats.subjects += 1;
    if (node.type === 'CHAPTER') stats.chapters += 1;
    if (node.type === 'LESSON') {
      stats.lessons += 1;
      stats.resources += node.resources?.length ?? node.resourceCount ?? 0;
    }
    for (const child of node.children ?? []) walk(child);
  };

  for (const root of tree) walk(root);
  return stats;
}

export function toggleNodeSelection(
  node: CurriculumTreeNode,
  selectedIds: Set<string>,
  checked: boolean,
): Set<string> {
  const next = new Set(selectedIds);
  const ids = collectDescendantNodeIds(node);
  if (checked) {
    for (const id of ids) next.add(id);
  } else {
    for (const id of ids) next.delete(id);
  }
  return next;
}

export function selectAllCurriculumNodes(tree: CurriculumTreeNode[]): Set<string> {
  const ids = new Set<string>();
  const walk = (node: CurriculumTreeNode) => {
    ids.add(node.id);
    for (const child of node.children ?? []) walk(child);
  };
  for (const root of tree) walk(root);
  return ids;
}

/** Legacy grouped content → flat content IDs for a subject group. */
export function legacySubjectContentIds(subject: SubjectGroup): string[] {
  return subject.chapters.flatMap((c) => c.items.map((i) => i.id));
}

export function legacyChapterContentIds(chapter: SubjectGroup['chapters'][number]): string[] {
  return chapter.items.map((i) => i.id);
}

export function countLegacySelection(
  subjects: SubjectGroup[],
  selectedContentIds: Set<string>,
): ImportSelectionStats {
  const stats: ImportSelectionStats = { subjects: 0, chapters: 0, lessons: 0, resources: 0 };
  const subjectKeys = new Set<string>();
  const chapterKeys = new Set<string>();

  for (const subject of subjects) {
    for (const chapter of subject.chapters) {
      for (const item of chapter.items) {
        if (!selectedContentIds.has(item.id)) continue;
        stats.lessons += 1;
        stats.resources += 1;
        chapterKeys.add(`${subject.name}:::${chapter.name}`);
        subjectKeys.add(subject.name);
      }
    }
  }

  stats.subjects = subjectKeys.size;
  stats.chapters = chapterKeys.size;
  return stats;
}

export function selectAllLegacyContent(subjects: SubjectGroup[]): Set<string> {
  const ids = new Set<string>();
  for (const subject of subjects) {
    for (const id of legacySubjectContentIds(subject)) ids.add(id);
  }
  return ids;
}

export function toggleLegacySubjectSelection(
  subject: SubjectGroup,
  selectedIds: Set<string>,
  checked: boolean,
): Set<string> {
  const next = new Set(selectedIds);
  const ids = legacySubjectContentIds(subject);
  if (checked) {
    for (const id of ids) next.add(id);
  } else {
    for (const id of ids) next.delete(id);
  }
  return next;
}

export function toggleLegacyChapterSelection(
  chapter: SubjectGroup['chapters'][number],
  selectedIds: Set<string>,
  checked: boolean,
): Set<string> {
  const next = new Set(selectedIds);
  const ids = legacyChapterContentIds(chapter);
  if (checked) {
    for (const id of ids) next.add(id);
  } else {
    for (const id of ids) next.delete(id);
  }
  return next;
}

export function isLegacyChapterFullySelected(
  chapter: SubjectGroup['chapters'][number],
  selectedIds: Set<string>,
): boolean {
  const ids = legacyChapterContentIds(chapter);
  return ids.length > 0 && ids.every((id) => selectedIds.has(id));
}

export function isLegacySubjectFullySelected(subject: SubjectGroup, selectedIds: Set<string>): boolean {
  const ids = legacySubjectContentIds(subject);
  return ids.length > 0 && ids.every((id) => selectedIds.has(id));
}

export function isNodeFullySelected(node: CurriculumTreeNode, selectedIds: Set<string>): boolean {
  return collectDescendantNodeIds(node).every((id) => selectedIds.has(id));
}

export function isNodePartiallySelected(node: CurriculumTreeNode, selectedIds: Set<string>): boolean {
  const ids = collectDescendantNodeIds(node);
  const selected = ids.filter((id) => selectedIds.has(id)).length;
  return selected > 0 && selected < ids.length;
}
