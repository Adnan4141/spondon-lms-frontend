'use client';

import dynamic from 'next/dynamic';

const CommunitiesPageContent = dynamic(
  () =>
    import('@/features/admin/communities/CommunitiesPageContent').then((m) => m.CommunitiesPageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading communities…
      </div>
    ),
  },
);

export default function AdminCommunitiesPage() {
  return <CommunitiesPageContent />;
}
