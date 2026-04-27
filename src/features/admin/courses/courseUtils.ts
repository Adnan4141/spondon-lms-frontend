import { normalizeCourseSidebarFeatures, type Course } from '@/types/course';
import type { CourseContent } from '@/types/course-content';
import type { CourseForm, SubjectGroup } from './courseTypes';

export function groupContents(items: CourseContent[]): SubjectGroup[] {
  const subjectMap = new Map<string, Map<string, CourseContent[]>>();
  for (const item of items) {
    const subj = item.subjectTitle?.trim() || '(No Subject)';
    const chap = item.chapterTitle?.trim() || '(No Chapter)';
    if (!subjectMap.has(subj)) subjectMap.set(subj, new Map());
    const chapMap = subjectMap.get(subj)!;
    if (!chapMap.has(chap)) chapMap.set(chap, []);
    chapMap.get(chap)!.push(item);
  }
  return Array.from(subjectMap.entries()).map(([name, chapMap]) => ({
    name,
    chapters: Array.from(chapMap.entries()).map(([chapName, chapItems]) => ({
      name: chapName,
      items: [...chapItems].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    })),
  }));
}

export function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function courseToForm(course: Course): CourseForm {
  const outline = (course.outline && typeof course.outline === 'object' && !Array.isArray(course.outline))
    ? course.outline as Record<string, unknown>
    : {};
  const publicPageDisplay =
    outline.publicPageDisplay && typeof outline.publicPageDisplay === 'object' && !Array.isArray(outline.publicPageDisplay)
      ? outline.publicPageDisplay as Record<string, unknown>
      : {};
  const benefits = Array.isArray(outline.benefits)
    ? outline.benefits.map(v => typeof v === 'string' ? v.trim() : '').filter(Boolean).join('\n')
    : '';
  const sidebarFeaturesNorm = normalizeCourseSidebarFeatures(outline.sidebarFeatures);
  const sidebarFeatures = sidebarFeaturesNorm.map(r => ({
    id: r.id,
    label: r.label,
    value: r.value,
    icon: r.icon ?? '',
  }));
  return {
    name: course.name,
    slug: course.slug,
    programId: course.programId,
    grade: course.grade ?? '',
    group: course.group ?? '',
    type: course.type,
    admissionStatus: course.admissionStatus,
    status: course.status,
    startMonth: course.startMonth ?? '',
    durationMonths: course.durationMonths != null ? String(course.durationMonths) : '',
    description: course.description ?? '',
    branchAccessMode: course.branchAccessMode ?? 'ALL_BRANCH',
    settledOptionEnabled: course.settledOptionEnabled,
    featured: course.featured,
    websiteVisible: course.websiteVisible,
    enrollmentVisible: course.enrollmentVisible,
    heroTitle: (outline.heroTitle as string) ?? '',
    whyTakeTitle: (outline.whyTakeTitle as string) ?? '',
    fee: String(course.fee ?? ''),
    offerPrice: course.offerPrice != null ? String(course.offerPrice) : '',
    bookPrice: course.bookPrice != null ? String(course.bookPrice) : '',
    includePrintedBooks: Boolean(outline.includePrintedBooks),
    showBenefits: publicPageDisplay.showBenefits !== false,
    showWebsiteSections: publicPageDisplay.showWebsiteSections !== false,
    showBooks: publicPageDisplay.showBooks !== false,
    showSidebar: publicPageDisplay.showSidebar !== false,
    benefitsText: benefits,
    sidebarTitle: typeof outline.sidebarTitle === 'string' ? outline.sidebarTitle : '',
    sidebarFeatures,
  };
}
