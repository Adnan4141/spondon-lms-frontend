import type { CourseDetails } from '@/types/course';
import {
  DEFAULT_PUBLIC_COURSE_BENEFIT_BULLETS,
  normalizeCoursePublicPageDisplay,
  normalizeCourseSidebarFeatures,
  normalizeCourseWebsiteSections,
  type CoursePublicPageDisplay,
  type CourseWebsiteSection,
  type PublicCourseSidebarFeature,
} from '@/types/course';

export type CoursePageDisplay = {
  publicPage: CoursePublicPageDisplay;
  benefits: string[];
  websiteSections: CourseWebsiteSection[];
  sidebarFeaturesCustom: PublicCourseSidebarFeature[];
  sidebarCardTitle: string;
  heroHeading: string;
  benefitsSectionTitle: string;
  booksSectionTitle: string;
  booksSectionSubtitle: string;
  teachersSectionTitle: string;
};

export function buildCoursePageDisplay(course: CourseDetails): CoursePageDisplay {
  const outline = course.outline as Record<string, unknown> | null | undefined;
  const publicPage = normalizeCoursePublicPageDisplay(course.outline);

  const rawBenefits = outline?.benefits;
  const benefitsList = Array.isArray(rawBenefits)
    ? rawBenefits.map((item: unknown) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
    : null;
  const benefits = benefitsList === null ? [...DEFAULT_PUBLIC_COURSE_BENEFIT_BULLETS] : benefitsList;

  const websiteSectionsAll = normalizeCourseWebsiteSections(outline?.websiteSections);
  const websiteSections = publicPage.showWebsiteSections ? websiteSectionsAll : [];

  return {
    publicPage,
    benefits,
    websiteSections,
    sidebarFeaturesCustom: normalizeCourseSidebarFeatures(outline?.sidebarFeatures),
    sidebarCardTitle:
      typeof outline?.sidebarTitle === 'string' && outline.sidebarTitle.trim()
        ? outline.sidebarTitle.trim()
        : 'কোর্স ফিচারসমূহ',
    heroHeading:
      typeof outline?.heroTitle === 'string' && outline.heroTitle.trim()
        ? outline.heroTitle.trim()
        : course.name,
    benefitsSectionTitle:
      typeof outline?.whyTakeTitle === 'string' && outline.whyTakeTitle.trim()
        ? outline.whyTakeTitle.trim()
        : 'কোর্সটি কেন করবেন?',
    booksSectionTitle:
      typeof outline?.booksSectionTitle === 'string' && outline.booksSectionTitle.trim()
        ? outline.booksSectionTitle.trim()
        : 'সুপারিশকৃত বই',
    booksSectionSubtitle:
      typeof outline?.booksSectionSubtitle === 'string' && outline.booksSectionSubtitle.trim()
        ? outline.booksSectionSubtitle.trim()
        : '',
    teachersSectionTitle:
      typeof outline?.teachersSectionTitle === 'string' && outline.teachersSectionTitle.trim()
        ? outline.teachersSectionTitle.trim()
        : 'কোর্সের শিক্ষক',
  };
}

export function isCoursePubliclyVisible(course: CourseDetails): boolean {
  return course.status === 'ACTIVE' && course.websiteVisible !== false;
}
