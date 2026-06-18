import { getCourses } from '@/lib/api/courses';
import { getPrograms } from '@/lib/api/programs';
import type { Course, Program } from '@/types/course';
import CoursesPageClient from './page.client';

export default async function CoursesPage() {
  let courses: Course[] = [];
  let programs: Program[] = [];

  try {
    const [programsRes, coursesRes] = await Promise.all([
      getPrograms(),
      getCourses({ websiteVisible: true, status: 'ACTIVE', limit: 100 }),
    ]);

    if (programsRes.success && programsRes.data) {
      programs = programsRes.data;
    }
    if (coursesRes.success && coursesRes.data) {
      courses = coursesRes.data;
    }
  } catch {
    courses = [];
    programs = [];
  }

  return <CoursesPageClient initialCourses={courses} initialPrograms={programs} />;
}
