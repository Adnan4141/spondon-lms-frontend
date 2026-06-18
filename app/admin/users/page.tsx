'use client';

import dynamic from 'next/dynamic';

const UsersPageContent = dynamic(
  () => import('@/features/admin/users/UsersPageContent').then((m) => m.UsersPageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading users…
      </div>
    ),
  },
);

export default function AdminUsersPage() {
  return <UsersPageContent />;
}
