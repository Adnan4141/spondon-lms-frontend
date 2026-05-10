import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/api/site-content';
import { FooterSettingsProvider } from '@/components/layout/FooterSettingsContext';

export const metadata: Metadata = {
  title: 'Our Branches',
  description:
    'Find Spondon Academic branch locations across Bangladesh. Visit us for in-person SSC and HSC coaching.',
  alternates: { canonical: 'https://spondonedu.com/branches' },
  openGraph: {
    title: 'Our Branches | Spondon Academic',
    description:
      'Find Spondon Academic branch locations across Bangladesh. Visit us for in-person SSC and HSC coaching.',
    url: 'https://spondonedu.com/branches',
  },
};

export default async function BranchesLayout({
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
