import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { getPublicTeacherById, type PublicTeacher } from '@/lib/api/teachers';
import {
  absoluteSiteUrl,
  buildPublicPageMetadata,
  compactDescription,
  jsonLdScript,
  ORGANIZATION_NAME,
  SITE_NAME,
  SITE_URL,
  toAbsoluteImageUrl,
} from '@/lib/seo';
import { TeacherProfileClient } from './TeacherProfileClient';

type TeacherRouteParams = Promise<{ id: string }>;

async function loadTeacher(id: string): Promise<PublicTeacher | null> {
  try {
    const res = await getPublicTeacherById(id);
    if (res.success && res.data) return res.data;
  } catch {
    // Handled by notFound/metadata fallback.
  }
  return null;
}

function teacherDescription(teacher: PublicTeacher): string {
  const parts = [
    teacher.designation,
    teacher.institute,
    teacher.experienceYears != null ? `${teacher.experienceYears} years experience` : null,
    teacher.courses.length ? `Courses: ${teacher.courses.map((course) => course.name).join(', ')}` : null,
  ].filter(Boolean);

  return compactDescription(
    parts.join('. '),
    `Learn with ${teacher.fullName}, an expert teacher at ${SITE_NAME}.`,
  );
}

function teacherImage(teacher: PublicTeacher): string | undefined {
  if (!teacher.profileImage) return undefined;
  return toAbsoluteImageUrl(resolveAttachmentUrl(teacher.profileImage, API_ORIGIN));
}

export async function generateMetadata({ params }: { params: TeacherRouteParams }): Promise<Metadata> {
  const { id } = await params;
  const teacher = await loadTeacher(id);

  if (!teacher) {
    return {
      title: 'Teacher Not Found',
      robots: { index: false, follow: false },
    };
  }

  const description = teacherDescription(teacher);
  const image = teacherImage(teacher);

  return buildPublicPageMetadata({
    title: `${teacher.fullName} | Spondon Teacher`,
    description,
    path: `/teachers/${encodeURIComponent(teacher.id)}`,
    imageUrl: image,
    imageAlt: teacher.fullName,
    type: 'profile',
    absoluteTitle: true,
  });
}

function buildTeacherSchema(teacher: PublicTeacher) {
  const canonical = absoluteSiteUrl(`/teachers/${encodeURIComponent(teacher.id)}`);
  const image = teacherImage(teacher);

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: teacher.fullName,
      url: canonical,
      image,
      jobTitle: teacher.designation || 'Teacher',
      worksFor: {
        '@type': 'EducationalOrganization',
        name: ORGANIZATION_NAME,
        url: SITE_URL,
      },
      affiliation: teacher.institute ? { '@type': 'Organization', name: teacher.institute } : undefined,
      knowsAbout: teacher.courses.map((course) => course.name),
      hasOccupation: {
        '@type': 'Occupation',
        name: 'Teacher',
        experienceRequirements:
          teacher.experienceYears != null ? `${teacher.experienceYears} years experience` : undefined,
      },
      subjectOf: teacher.courses.map((course) => ({
        '@type': 'Course',
        name: course.name,
        url: absoluteSiteUrl(`/course/${encodeURIComponent(course.slug || course.id)}`),
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Teachers', item: absoluteSiteUrl('/teachers') },
        { '@type': 'ListItem', position: 3, name: teacher.fullName, item: canonical },
      ],
    },
  ];
}

export default async function TeacherProfilePage({ params }: { params: TeacherRouteParams }) {
  const { id } = await params;
  const teacher = await loadTeacher(id);

  if (!teacher) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(buildTeacherSchema(teacher)) }}
      />
      <TeacherProfileClient teacher={teacher} />
    </>
  );
}
