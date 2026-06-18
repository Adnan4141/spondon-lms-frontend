'use client';

import dynamic from 'next/dynamic';

const PartnersPageContent = dynamic(
  () => import('@/features/admin/partners/PartnersPageContent').then((m) => m.PartnersPageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading partners…
      </div>
    ),
  },
);

export default function AdminPartnersPage() {
  return <PartnersPageContent />;
}
