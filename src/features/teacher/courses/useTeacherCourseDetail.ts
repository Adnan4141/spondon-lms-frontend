'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCourseById, getCourseContents } from '@/lib/api/courses';
import { getCourseCollaborators } from '@/lib/api/course-collaborators';
import type { CourseDetails } from '@/types/course';
import type { CourseContent } from '@/types/course-content';
import type { CourseCollaborator } from '@/lib/api/course-collaborators';
import { accessFlags } from './teacher-course-utils';

export function useTeacherCourseDetail(courseId: string, userId: string | null) {
  const queryClient = useQueryClient();

  const courseQuery = useQuery({
    queryKey: ['teacher', 'course', courseId],
    enabled: Boolean(courseId && userId),
    queryFn: async () => {
      const [courseRes, collabRes] = await Promise.all([
        getCourseById(courseId),
        getCourseCollaborators(courseId),
      ]);

      if (!courseRes.success || !courseRes.data) {
        throw new Error(
          (courseRes as { message?: string }).message || 'Course not found',
        );
      }

      const course = courseRes.data as CourseDetails;
      const collaborators =
        collabRes.success && collabRes.data ? collabRes.data : [];

      const { hasAccess } = accessFlags(userId!, course, collaborators);
      if (!hasAccess) {
        return { forbidden: true as const, course: null, collaborators: [] as CourseCollaborator[] };
      }

      return {
        forbidden: false as const,
        course,
        collaborators,
      };
    },
  });

  const contentsQuery = useQuery({
    queryKey: ['teacher', 'course-contents', courseId],
    enabled: Boolean(
      courseId &&
        userId &&
        courseQuery.isSuccess &&
        courseQuery.data &&
        !courseQuery.data.forbidden,
    ),
    queryFn: async () => {
      const res = await getCourseContents({ courseId });
      if (!res.success) {
        throw new Error(
          (res as { message?: string }).message || 'Failed to load content',
        );
      }
      return (res.data ?? []) as CourseContent[];
    },
  });

  const refetchAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['teacher', 'course', courseId] }),
      queryClient.invalidateQueries({ queryKey: ['teacher', 'course-contents', courseId] }),
    ]);
  };

  const courseData = courseQuery.data;
  const course = courseData && !courseData.forbidden ? courseData.course : null;
  const collaborators =
    courseData && !courseData.forbidden ? courseData.collaborators : [];
  const forbidden = courseData?.forbidden === true;

  return {
    course,
    collaborators,
    contents: (contentsQuery.data ?? []) as CourseContent[],
    forbidden,
    isLoading: courseQuery.isLoading || contentsQuery.isLoading,
    isError: courseQuery.isError || contentsQuery.isError,
    error: courseQuery.error ?? contentsQuery.error ?? null,
    refetchAll,
    refetchContents: () => contentsQuery.refetch(),
  };
}
