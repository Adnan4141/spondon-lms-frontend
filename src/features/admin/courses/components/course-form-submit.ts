import {
  CreateCourseDto,
  UpdateCourseDto,
  type CourseDetails,
  type JsonValue,
  type Program,
  DEFAULT_PUBLIC_CURRICULUM_TYPES,
  newCourseWebsiteSectionId,
  normalizeCoursePublicPageDisplay,
  normalizeCourseWebsiteSections,
} from '@/types/course';
import { DEFAULT_BENEFITS, defaultForm, type FormState } from './course-form-types';

export type CourseSubmitResult =
  | { ok: true; payload: CreateCourseDto | UpdateCourseDto }
  | { ok: false; error: string };

export function buildCourseSubmitPayload(
  form: FormState,
  programs: Program[],
  course?: CourseDetails | null,
): CourseSubmitResult {
  if (!form.programId || !form.name.trim()) {
    return { ok: false, error: 'Program and course name are required.' };
  }

  const selectedProgram = programs.find((program) => program.id === form.programId);
  if (selectedProgram?.paymentCircle === 'MONTHLY' && !form.startMonth) {
    return { ok: false, error: 'Start month is required for monthly courses.' };
  }
  if (
    selectedProgram?.paymentCircle === 'MONTHLY' &&
    (!form.durationMonths || Number(form.durationMonths) < 1)
  ) {
    return { ok: false, error: 'Course duration is required for monthly courses.' };
  }

  if (form.offerPrice.trim()) {
    const opNum = Number(form.offerPrice);
    const feeNum = Number(form.fee);
    if (Number.isNaN(opNum) || opNum < 0) {
      return { ok: false, error: 'Offer price must be a valid non-negative number.' };
    }
    if (!Number.isNaN(feeNum) && feeNum > 0 && opNum >= feeNum) {
      return { ok: false, error: 'Offer price must be less than the actual price.' };
    }
  }

  if (form.publicShowCurriculum && form.publicCurriculumTypes.length === 0) {
    return { ok: false, error: 'Select at least one curriculum content type.' };
  }

  const filteredBenefits = form.benefits.map((b) => b.trim()).filter(Boolean);
  const existingOutline =
    course?.outline && typeof course.outline === 'object' && !Array.isArray(course.outline)
      ? (course.outline as Record<string, unknown>)
      : {};

  const websiteSectionsPayload = form.websiteSections
    .map((s) => ({
      id: (s.id && String(s.id).trim()) || newCourseWebsiteSectionId(),
      title: s.title.trim(),
      bodyHtml: s.bodyHtml.trim(),
    }))
    .filter((s) => s.title || s.bodyHtml);

  const outline: Record<string, unknown> = { ...existingOutline, benefits: filteredBenefits };
  if (websiteSectionsPayload.length > 0) {
    outline.websiteSections = websiteSectionsPayload;
  } else {
    delete outline.websiteSections;
  }

  const prevPub =
    existingOutline.publicPageDisplay &&
    typeof existingOutline.publicPageDisplay === 'object' &&
    !Array.isArray(existingOutline.publicPageDisplay)
      ? { ...(existingOutline.publicPageDisplay as Record<string, unknown>) }
      : {};

  outline.publicPageDisplay = {
    ...prevPub,
    showBenefits: form.publicShowBenefits,
    showWebsiteSections: form.publicShowWebsiteSections,
    showBooks: form.publicShowBooks,
    showCurriculum: form.publicShowCurriculum,
    curriculumContentTypes:
      form.publicCurriculumTypes.length > 0
        ? form.publicCurriculumTypes
        : [...DEFAULT_PUBLIC_CURRICULUM_TYPES],
  };

  const payload: CreateCourseDto | UpdateCourseDto = {
    programId: form.programId,
    name: form.name.trim(),
    thumbnail: form.thumbnail.trim() || undefined,
    type: form.type,
    fee: Number(form.fee ?? 0),
    offerPrice: form.offerPrice.trim() ? Number(form.offerPrice) : null,
    outline: outline as JsonValue,
    description: form.description.trim() || undefined,
    status: form.status,
    admissionStatus: form.admissionStatus,
    featured: form.featured,
    websiteVisible: form.websiteVisible,
    enrollmentVisible: form.enrollmentVisible,
    settledOptionEnabled: form.settledOptionEnabled,
    grade: form.grade || undefined,
    group: form.group || undefined,
    startMonth: form.startMonth || null,
    durationMonths: form.durationMonths ? Number(form.durationMonths) : null,
    bookPrice: form.bookPrice ? Number(form.bookPrice) : null,
  };

  return { ok: true, payload };
}

export function courseFormFromDetails(course: CourseDetails): FormState {
  const outlineData = course.outline as Record<string, unknown> | null;
  const loadedBenefits =
    Array.isArray(outlineData?.benefits) && outlineData.benefits.length > 0
      ? (outlineData.benefits as string[])
      : DEFAULT_BENEFITS;
  const loadedWebsiteSections = normalizeCourseWebsiteSections(outlineData?.websiteSections);
  const pub = normalizeCoursePublicPageDisplay(course.outline);

  return {
    ...defaultForm,
    programId: course.programId,
    name: course.name,
    slug: course.slug,
    thumbnail: course.thumbnail || '',
    type: course.type,
    fee: String(course.fee),
    offerPrice: course.offerPrice != null ? String(course.offerPrice) : '',
    description: course.description || '',
    status: course.status,
    admissionStatus: course.admissionStatus,
    featured: course.featured,
    websiteVisible: course.websiteVisible,
    enrollmentVisible: course.enrollmentVisible !== false,
    settledOptionEnabled: course.settledOptionEnabled,
    grade: course.grade || '',
    group: course.group || '',
    startMonth: course.startMonth ?? '',
    durationMonths: course.durationMonths != null ? String(course.durationMonths) : '',
    bookPrice: course.bookPrice != null ? String(course.bookPrice) : '',
    benefits: loadedBenefits,
    websiteSections: loadedWebsiteSections,
    publicShowBenefits: pub.showBenefits,
    publicShowWebsiteSections: pub.showWebsiteSections,
    publicShowBooks: pub.showBooks,
    publicShowCurriculum: pub.showCurriculum,
    publicCurriculumTypes: [...pub.curriculumContentTypes],
  };
}
