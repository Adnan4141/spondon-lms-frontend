import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/api/site-content';
import { FooterSettingsProvider } from '@/components/layout/FooterSettingsContext';

export const metadata: Metadata = {
  title: 'Books & eBooks',
  description:
    'Explore SSC and HSC academic books, eBooks, and study materials from Spondon Academic.',
  alternates: { canonical: 'https://spondonedu.com/books' },
  openGraph: {
    title: 'Books & eBooks | Spondon Academic',
    description:
      'Explore SSC and HSC academic books, eBooks, and study materials from Spondon Academic.',
    url: 'https://spondonedu.com/books',
  },
};

export default async function BooksLayout({
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
