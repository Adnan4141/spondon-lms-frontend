import { getSiteSettings } from '@/lib/api/site-content';
import BranchesPageClient from './page.client';

export default async function BranchesPage() {
  let initialSiteSettings: Record<string, string> = {};
  try {
    const settingsRes = await getSiteSettings();
    if (settingsRes.success && settingsRes.data) {
      for (const s of settingsRes.data as { key: string; value: string }[]) {
        initialSiteSettings[s.key] = s.value;
      }
    }
  } catch {
    // Keep Footer defaults.
  }

  return <BranchesPageClient initialSiteSettings={initialSiteSettings} />;
}
