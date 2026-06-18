import { cache } from 'react';
import { getCourseById } from './courses';
import type { ApiResponse, Course } from '@/types/course';

/** Dedupes course fetches within a single request (layout metadata + page). */
export const getPublicCourseBySlugCached = cache((idOrSlug: string) =>
  getCourseById(idOrSlug) as Promise<ApiResponse<Course>>,
);
