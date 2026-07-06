import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getPublicCourseBySlugCached, getPublicCourseContentCached } from '@/lib/api/courses-server';
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

  const publicContentRes = await getPublicCourseContentCached(idOrSlug);
  const publicContent = publicContentRes.success ? publicContentRes.data : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-indigo-100 relative overflow-hidden">
      {/* Background decorative glows */}
      <div className="absolute right-0 top-[20%] h-[600px] w-[600px] rounded-full bg-indigo-50/40 blur-[150px] pointer-events-none" />
      <div className="absolute left-[-10%] top-[40%] h-[500px] w-[500px] rounded-full bg-purple-50/30 blur-[130px] pointer-events-none" />
      <div className="absolute right-[10%] top-[75%] h-[500px] w-[500px] rounded-full bg-emerald-50/20 blur-[120px] pointer-events-none" />

      <Header />
      <CourseHero course={course} heroHeading={display.heroHeading} />

      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12">
        <CourseEnrollmentIsland idOrSlug={idOrSlug} display={display}>
          <CourseDetailsStatic course={course} display={display} publicContent={publicContent} />
        </CourseEnrollmentIsland>
      </div>

      <Footer />
    </div>
  );
}
