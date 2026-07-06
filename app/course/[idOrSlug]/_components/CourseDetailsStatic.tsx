import type { CourseDetails } from '@/types/course';
import type { CoursePageDisplay } from '../_lib/course-page-display';
import type { PublicCourseContent } from '@/lib/api/courses';
import { CourseBenefits } from './CourseBenefits';
import { CourseWebsiteSections } from './CourseWebsiteSections';
import { CourseTeachers } from './CourseTeachers';
import { CourseCurriculumOutline } from './CourseCurriculumOutline';
import { CourseFreePreviewSection } from './CourseFreePreviewSection';

type Props = {
  course: CourseDetails;
  display: CoursePageDisplay;
  publicContent?: PublicCourseContent | null;
};

export function CourseDetailsStatic({ course, display, publicContent }: Props) {
  const outline = publicContent?.outline;
  const freePreview = publicContent?.freePreview ?? [];
  const meta = publicContent?.meta;

  return (
    <>
      {display.publicPage.showBenefits ? (
        <CourseBenefits benefits={display.benefits} title={display.benefitsSectionTitle} />
      ) : null}

      {freePreview.length > 0 ? (
        <CourseFreePreviewSection items={freePreview} courseName={course.name} />
      ) : null}

      {outline && outline.subjects.length > 0 && meta?.showCurriculum !== false ? (
        <CourseCurriculumOutline
          outline={outline}
          freeSegmentCount={meta?.freeSegmentCount ?? 0}
          totalSegmentCount={meta?.totalSegmentCount ?? outline.totals.segments}
          title="কোর্স কারিকুলাম"
        />
      ) : null}

      <CourseWebsiteSections sections={display.websiteSections} />

      {display.publicPage.showTeachers && course.teachers && course.teachers.length > 0 ? (
        <CourseTeachers teachers={course.teachers} title={display.teachersSectionTitle} />
      ) : null}
    </>
  );
}
