import { getCourseById } from '@/lib/api/courses';
import type { CourseDetails } from '@/types/course';
import { CourseInitialDataProvider } from '@/components/course/CourseInitialDataContext';

export default async function CourseDetailsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ idOrSlug: string }>;
}) {
  const { idOrSlug } = await params;

  let initialCourse: CourseDetails | null = null;
  try {
    const res = await getCourseById(idOrSlug);
    if (res.success && res.data) {
      initialCourse = res.data as unknown as CourseDetails;
    }
  } catch {
    initialCourse = null;
  }

  return (
    <CourseInitialDataProvider initialCourse={initialCourse}>
      {children}
    </CourseInitialDataProvider>
  );
}
