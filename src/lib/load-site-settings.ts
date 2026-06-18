import { getSiteSettings } from '@/lib/api/site-content';

/** Server-side footer / public layout settings map. */
export async function loadPublicSiteSettings(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  try {
    const settingsRes = await getSiteSettings();
    if (settingsRes.success && settingsRes.data) {
      for (const item of settingsRes.data) {
        map[item.key] = item.value;
      }
    }
  } catch {
    // Footer falls back to defaults.
  }
  return map;
}
