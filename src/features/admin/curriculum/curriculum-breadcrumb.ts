import type { CurriculumTreeNode } from './curriculum-types';

/** Returns ordered titles from root to the lesson node (inclusive), or empty if not found. */
export function findLessonAncestorTitles(tree: CurriculumTreeNode[], lessonId: string): string[] {
  const walk = (nodes: CurriculumTreeNode[], trail: string[]): string[] | null => {
    for (const n of nodes) {
      if (n.id === lessonId) return [...trail, n.title];
      if (n.children?.length) {
        const hit = walk(n.children, [...trail, n.title]);
        if (hit) return hit;
      }
    }
    return null;
  };
  return walk(tree, []) ?? [];
}
