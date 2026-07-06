import { cache } from 'react';
import { getCourseById, getPublicCourseContent, type PublicCourseContent } from './courses';
import type { ApiResponse, Course } from '@/types/course';

/** Dedupes course fetches within a single request (layout metadata + page). */
export const getPublicCourseBySlugCached = cache((idOrSlug: string) =>
  getCourseById(idOrSlug) as Promise<ApiResponse<Course>>,
);

export const getPublicCourseContentCached = cache((idOrSlug: string) =>
  getPublicCourseContent(idOrSlug) as Promise<ApiResponse<PublicCourseContent>>,
);
