import type { CurriculumTreeNode } from './curriculum-types';

export type CurriculumContentStats = {
  subjectCount: number;
  chapterCount: number;
  lessonCount: number;
  resourceCount: number;
  videoCount: number;
};

export function countCurriculumStats(tree: CurriculumTreeNode[]): CurriculumContentStats {
  const stats: CurriculumContentStats = {
    subjectCount: 0,
    chapterCount: 0,
    lessonCount: 0,
    resourceCount: 0,
    videoCount: 0,
  };

  const walk = (nodes: CurriculumTreeNode[]) => {
    for (const node of nodes) {
      if (node.type === 'SUBJECT') stats.subjectCount += 1;
      if (node.type === 'CHAPTER') stats.chapterCount += 1;
      if (node.type === 'LESSON') {
        stats.lessonCount += 1;
        const resources = node.resources ?? [];
        stats.resourceCount += resources.length || node.resourceCount || 0;
        stats.videoCount += resources.filter((r) => r.type === 'VIDEO').length;
      }
      if (node.children?.length) walk(node.children);
    }
  };

  walk(tree);
  return stats;
}
