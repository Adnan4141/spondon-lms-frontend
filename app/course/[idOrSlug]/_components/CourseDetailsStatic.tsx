import type { CourseDetails } from '@/types/course';
import type { CoursePageDisplay } from '../_lib/course-page-display';
import { CourseBenefits } from './CourseBenefits';
import { CourseWebsiteSections } from './CourseWebsiteSections';
import { CourseTeachers } from './CourseTeachers';

type Props = {
  course: CourseDetails;
  display: CoursePageDisplay;
};

export function CourseDetailsStatic({ course, display }: Props) {
  return (
    <>
      {display.publicPage.showBenefits ? (
        <CourseBenefits benefits={display.benefits} title={display.benefitsSectionTitle} />
      ) : null}

      <CourseWebsiteSections sections={display.websiteSections} />

      {display.publicPage.showTeachers && course.teachers && course.teachers.length > 0 ? (
        <CourseTeachers teachers={course.teachers} title={display.teachersSectionTitle} />
      ) : null}
    </>
  );
}
