'use client';

import dynamic from 'next/dynamic';

const CommunityDetailPageContent = dynamic(
  () => import('@/features/admin/communities/CommunityDetailPageContent').then((m) => m.CommunityDetailPageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading community…
      </div>
    ),
  },
);

export default function CommunityDetailPage() {
  return <CommunityDetailPageContent />;
}
