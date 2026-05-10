import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/api/site-content';
import { FooterSettingsProvider } from '@/components/layout/FooterSettingsContext';

export const metadata: Metadata = {
  title: 'All Courses',
  description:
    'Browse SSC, HSC, and admission preparation courses by 150+ expert instructors on Spondon Academic.',
  alternates: { canonical: 'https://spondonedu.com/courses' },
  openGraph: {
    title: 'All Courses | Spondon Academic',
    description:
      'Browse SSC, HSC, and admission preparation courses by 150+ expert instructors on Spondon Academic.',
    url: 'https://spondonedu.com/courses',
  },
};

export default async function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let siteSettings: Record<string, string> = {};

  try {
    const settingsRes = await getSiteSettings();
    if (settingsRes.success && settingsRes.data) {
      for (const item of settingsRes.data as { key: string; value: string }[]) {
        siteSettings[item.key] = item.value;
      }
    }
  } catch {
    // Footer falls back to defaults.
  }

  return (
    <FooterSettingsProvider siteSettings={siteSettings}>
      {children}
    </FooterSettingsProvider>
  );
}
