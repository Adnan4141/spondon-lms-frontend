type ContentWithProgress = {
  type?: string;
  progress?: { completed?: boolean; progressPercent?: number } | null;
};

/** Video completion % — matches course hub subjectStats logic. */
export function computeCourseProgressPct(contents: unknown[]): number | null {
  if (!Array.isArray(contents) || contents.length === 0) return null;
  const videos = contents.filter((raw) => (raw as ContentWithProgress).type === 'VIDEO');
  if (videos.length === 0) return null;
  const completed = videos.filter((raw) => (raw as ContentWithProgress).progress?.completed).length;
  return Math.round((completed / videos.length) * 100);
}
