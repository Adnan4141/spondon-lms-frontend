import { getSiteSettings } from '@/lib/api/site-content';
import { FooterSettingsProvider } from '@/components/layout/FooterSettingsContext';

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
