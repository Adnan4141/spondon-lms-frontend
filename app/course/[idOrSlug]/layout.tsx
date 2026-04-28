import { getCourseById } from '@/lib/api/courses';
import { getSiteSettings } from '@/lib/api/site-content';
import type { CourseDetails } from '@/types/course';
import { CourseInitialDataProvider } from '@/components/course/CourseInitialDataContext';
import { FooterSettingsProvider } from '@/components/layout/FooterSettingsContext';

export default async function CourseDetailsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ idOrSlug: string }>;
}) {
  const { idOrSlug } = await params;

  let initialCourse: CourseDetails | null = null;
  let siteSettings: Record<string, string> = {};
  try {
    const [res, settingsRes] = await Promise.all([
      getCourseById(idOrSlug),
      getSiteSettings(),
    ]);
    if (res.success && res.data) {
      initialCourse = res.data as unknown as CourseDetails;
    }
    if (settingsRes.success && settingsRes.data) {
      for (const item of settingsRes.data as { key: string; value: string }[]) {
        siteSettings[item.key] = item.value;
      }
    }
  } catch {
    initialCourse = null;
    siteSettings = {};
  }

  return (
    <FooterSettingsProvider siteSettings={siteSettings}>
      <CourseInitialDataProvider initialCourse={initialCourse}>
        {children}
      </CourseInitialDataProvider>
    </FooterSettingsProvider>
  );
}
