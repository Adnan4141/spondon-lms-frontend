import type { ExamWizardState } from '../types';

/** All courses selected for student audience (primary course first). */
export function allAudienceCourseIds(
  state: Pick<ExamWizardState, 'courseId' | 'linkedCourseIds'>,
): string[] {
  if (!state.courseId) return [...state.linkedCourseIds];
  const linked = state.linkedCourseIds.filter((id) => id !== state.courseId);
  return [state.courseId, ...linked];
}

/** Apply a new audience course list, preserving content source when possible. */
export function patchFromAudienceCourseIds(
  state: Pick<ExamWizardState, 'courseId' | 'linkedCourseIds'>,
  courseIds: string[],
  contentCourseId?: string,
): Pick<ExamWizardState, 'courseId' | 'linkedCourseIds'> {
  const unique = Array.from(new Set(courseIds.filter(Boolean)));
  if (unique.length === 0) {
    return { courseId: '', linkedCourseIds: [] };
  }

  const nextContent =
    contentCourseId && unique.includes(contentCourseId)
      ? contentCourseId
      : state.courseId && unique.includes(state.courseId)
        ? state.courseId
        : unique[0];

  const linkedCourseIds = unique.filter((id) => id !== nextContent);
  return {
    courseId: nextContent,
    linkedCourseIds,
  };
}

/** Swap content source with a course already in the audience list. */
export function patchContentCourse(
  state: Pick<ExamWizardState, 'courseId' | 'linkedCourseIds'>,
  nextContentId: string,
): Pick<ExamWizardState, 'courseId' | 'linkedCourseIds'> | null {
  if (!state.courseId || nextContentId === state.courseId) return null;
  const all = allAudienceCourseIds(state);
  if (!all.includes(nextContentId)) return null;
  const linkedCourseIds = all.filter((id) => id !== nextContentId);
  return { courseId: nextContentId, linkedCourseIds };
}
