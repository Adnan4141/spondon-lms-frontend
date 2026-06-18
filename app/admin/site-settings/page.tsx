'use client';

import dynamic from 'next/dynamic';

const SiteSettingsPageContent = dynamic(
  () => import('@/features/admin/site-settings/SiteSettingsPageContent').then((m) => m.SiteSettingsPageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading site settings…
      </div>
    ),
  },
);

export default function SiteSettingsPage() {
  return <SiteSettingsPageContent />;
}
