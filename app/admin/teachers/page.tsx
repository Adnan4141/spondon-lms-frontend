'use client';

import dynamic from 'next/dynamic';

const TeachersPageContent = dynamic(
  () => import('@/features/admin/teachers/TeachersPageContent').then((m) => m.TeachersPageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading teachers…
      </div>
    ),
  },
);

export default function AdminTeachersPage() {
  return <TeachersPageContent />;
}
