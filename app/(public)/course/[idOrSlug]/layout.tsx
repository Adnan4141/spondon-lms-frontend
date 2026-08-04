import type { Metadata } from 'next';
import { getPublicCourseBySlugCached } from '@/lib/api/courses-server';
import type { CourseDetails } from '@/types/course';
import { CourseInitialDataProvider } from '@/components/course/CourseInitialDataContext';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { isCoursePubliclyVisible } from './_lib/course-page-display';
import {
  absoluteSiteUrl,
  compactDescription,
  jsonLdScript,
  ORGANIZATION_NAME,
  SITE_NAME,
  SITE_URL,
  stripHtml,
  toAbsoluteImageUrl,
  truncateDescription,
} from '@/lib/seo';

type CourseRouteParams = Promise<{ idOrSlug: string }>;

function getCourseHeroTitle(course: CourseDetails): string {
  const outline = course.outline && typeof course.outline === 'object' && !Array.isArray(course.outline)
    ? (course.outline as Record<string, unknown>)
    : {};
  return typeof outline.heroTitle === 'string' && outline.heroTitle.trim()
    ? outline.heroTitle.trim()
    : course.name;
}

async function loadCourseForSeo(idOrSlug: string): Promise<CourseDetails | null> {
  try {
    const res = await getPublicCourseBySlugCached(idOrSlug);
    if (res.success && res.data) {
      const course = res.data as unknown as CourseDetails;
      if (!isCoursePubliclyVisible(course)) return null;
      return course;
    }
  } catch {
    // Metadata falls back to noindex below.
  }
  return null;
}

function courseCanonicalPath(course: CourseDetails, fallbackId: string): string {
  return `/course/${encodeURIComponent(course.slug || course.id || fallbackId)}`;
}

function courseImage(course: CourseDetails): string | undefined {
  if (!course.thumbnail) return undefined;
  return toAbsoluteImageUrl(resolveAttachmentUrl(course.thumbnail, API_ORIGIN));
}

export async function generateMetadata({ params }: { params: CourseRouteParams }): Promise<Metadata> {
  const { idOrSlug } = await params;
  const course = await loadCourseForSeo(idOrSlug);

  if (!course || course.websiteVisible === false || course.status !== 'ACTIVE') {
    return {
      title: 'Course Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title = getCourseHeroTitle(course);
  const description = compactDescription(
    course.description,
    `${course.name} from ${SITE_NAME}. Explore course details, instructors, pricing, and enrollment information.`,
  );
  const canonical = absoluteSiteUrl(courseCanonicalPath(course, idOrSlug));
  const image = courseImage(course);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'bn_BD',
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      url: canonical,
      images: image ? [{ url: image, alt: course.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: image ? [image] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

function buildCourseSchema(course: CourseDetails, idOrSlug: string) {
  const canonical = absoluteSiteUrl(courseCanonicalPath(course, idOrSlug));
  const image = courseImage(course);
  const description = truncateDescription(stripHtml(course.description) || `${course.name} from ${SITE_NAME}.`, 300);
  const price = Number(course.offerPrice ?? course.fee);
  const teachers = course.teachers
    ?.map((ct) => ct.teacher)
    .filter(Boolean)
    .map((teacher) => ({
      '@type': 'Person',
      name: teacher.fullName,
      jobTitle: teacher.designation || undefined,
      affiliation: teacher.institute ? { '@type': 'Organization', name: teacher.institute } : undefined,
      image: teacher.profileImage ? toAbsoluteImageUrl(resolveAttachmentUrl(teacher.profileImage, API_ORIGIN)) : undefined,
    }));

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: course.name,
      alternateName: getCourseHeroTitle(course) !== course.name ? getCourseHeroTitle(course) : undefined,
      description,
      url: canonical,
      image,
      provider: {
        '@type': 'EducationalOrganization',
        name: ORGANIZATION_NAME,
        url: SITE_URL,
      },
      offers: Number.isFinite(price)
        ? {
            '@type': 'Offer',
            price,
            priceCurrency: 'BDT',
            availability: course.admissionStatus === 'OPEN' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
            url: canonical,
          }
        : undefined,
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: course.type === 'ONLINE' ? 'online' : 'onsite',
        courseWorkload: course.type === 'ONLINE' ? 'Online classes' : 'Offline classes',
      },
      instructor: teachers && teachers.length > 0 ? teachers : undefined,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Courses', item: absoluteSiteUrl('/courses') },
        { '@type': 'ListItem', position: 3, name: course.name, item: canonical },
      ],
    },
  ];
}

export default async function CourseDetailsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: CourseRouteParams;
}) {
  const { idOrSlug } = await params;

  let initialCourse: CourseDetails | null = null;
  try {
    const res = await getPublicCourseBySlugCached(idOrSlug);
    if (res.success && res.data) {
      const course = res.data as unknown as CourseDetails;
      if (isCoursePubliclyVisible(course)) {
        initialCourse = course;
      }
    }
  } catch {
    initialCourse = null;
  }

  return (
    <CourseInitialDataProvider initialCourse={initialCourse}>
      {initialCourse ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(buildCourseSchema(initialCourse, idOrSlug)) }}
        />
      ) : null}
      {children}
    </CourseInitialDataProvider>
  );
}
