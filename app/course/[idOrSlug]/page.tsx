import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getPublicCourseBySlugCached } from '@/lib/api/courses-server';
import type { CourseDetails } from '@/types/course';
import {
  buildCoursePageDisplay,
  isCoursePubliclyVisible,
} from './_lib/course-page-display';
import { CourseHero } from './_components/CourseHero';
import { CourseDetailsStatic } from './_components/CourseDetailsStatic';
import { CourseEnrollmentIsland } from './_components/CourseEnrollmentIsland';

type PageProps = {
  params: Promise<{ idOrSlug: string }>;
};

export default async function CourseDetailsPage({ params }: PageProps) {
  const { idOrSlug } = await params;
  const res = await getPublicCourseBySlugCached(idOrSlug);

  if (!res.success || !res.data) {
    notFound();
  }

  const course = res.data as unknown as CourseDetails;
  if (!isCoursePubliclyVisible(course)) {
    notFound();
  }

  const display = buildCoursePageDisplay(course);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
      <Header />
      <CourseHero course={course} heroHeading={display.heroHeading} />

      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12">
        <CourseEnrollmentIsland idOrSlug={idOrSlug} display={display}>
          <CourseDetailsStatic course={course} display={display} />
        </CourseEnrollmentIsland>
      </div>

      <Footer />
    </div>
  );
}
