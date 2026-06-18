'use client';

import dynamic from 'next/dynamic';

const LandingPageContent = dynamic(
  () => import('@/features/admin/landing/LandingPageContent').then((m) => m.LandingPageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading landing CMS…
      </div>
    ),
  },
);

export default function LandingCMSPage() {
  return <LandingPageContent />;
}
