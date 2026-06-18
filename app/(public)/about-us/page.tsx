import { getSiteSettings } from '@/lib/api/site-content';
import { ABOUT_DEFAULTS } from './about-defaults';
import AboutUsPageClient from './AboutUsPageClient';

export default async function AboutUsPage() {
  let siteSettings: Record<string, string> = {};

  try {
    const settingsRes = await getSiteSettings();
    if (settingsRes.success && settingsRes.data) {
      for (const item of settingsRes.data) {
        siteSettings[item.key] = item.value;
      }
    }
  } catch {
    // Keep defaults.
  }

  const settings = { ...ABOUT_DEFAULTS, ...siteSettings };

  return <AboutUsPageClient settings={settings} />;
}
