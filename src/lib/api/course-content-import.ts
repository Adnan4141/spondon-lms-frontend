import { apiRequest } from '../api';
import { getActorUserIdFromStorage } from '../actor-user';
import type { ApiResponse } from '@/types/course';

export type ImportConflictStrategy = 'RENAME' | 'SKIP';

export type ImportCourseContentOptions = {
  conflictStrategy?: ImportConflictStrategy;
  copyFiles?: boolean;
  includeTeachers?: boolean;
  includeVisibility?: boolean;
  includePublishDates?: boolean;
};

export type ImportCourseContentResult = {
  added: { subjects: number; chapters: number; lessons: number; resources: number };
  skipped: { subjects: number; chapters: number; lessons: number; resources: number };
  warnings: string[];
};

export async function importCourseContent(
  targetCourseId: string,
  body: {
    sourceCourseId: string;
    nodeIds?: string[];
    legacyContentIds?: string[];
  } & ImportCourseContentOptions,
): Promise<ApiResponse<ImportCourseContentResult>> {
  const actorUserId = getActorUserIdFromStorage();
  return apiRequest<ApiResponse<ImportCourseContentResult>>(
    `/courses/${encodeURIComponent(targetCourseId)}/content/import`,
    {
      method: 'POST',
      body: JSON.stringify(actorUserId ? { ...body, actorUserId } : body),
    },
  );
}
