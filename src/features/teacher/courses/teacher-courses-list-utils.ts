import { API_ORIGIN } from '@/lib/api';
import type { Course } from '@/types/course';

export type TeacherCourseSort = 'recent' | 'name' | 'enrollments';

export function thumbnailSrc(course: Course): string | null {
  if (!course.thumbnail) return null;
  return course.thumbnail.startsWith('/') ? `${API_ORIGIN}${course.thumbnail}` : course.thumbnail;
}

export function filterTeacherCourses(courses: Course[], search: string): Course[] {
  const q = search.trim().toLowerCase();
  if (!q) return courses;
  return courses.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.program?.name?.toLowerCase().includes(q) ?? false),
  );
}

export function sortTeacherCourses(courses: Course[], sort: TeacherCourseSort): Course[] {
  const copy = [...courses];
  if (sort === 'name') {
    return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
  if (sort === 'enrollments') {
    return copy.sort(
      (a, b) => (b._count?.enrollments ?? 0) - (a._count?.enrollments ?? 0),
    );
  }
  return copy.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function computeTeacherCoursesSummary(courses: Course[]) {
  let active = 0;
  let online = 0;
  let enrollments = 0;
  for (const c of courses) {
    if (c.status === 'ACTIVE') active += 1;
    if (c.type === 'ONLINE') online += 1;
    enrollments += c._count?.enrollments ?? 0;
  }
  return { total: courses.length, active, online, enrollments };
}
