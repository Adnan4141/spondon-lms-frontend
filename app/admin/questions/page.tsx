'use client';

import dynamic from 'next/dynamic';

const QuestionsPageContent = dynamic(
  () => import('@/features/admin/questions/QuestionsPageContent').then((m) => m.QuestionsPageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading questions…
      </div>
    ),
  },
);

export default function QuestionsPage() {
  return <QuestionsPageContent />;
}
