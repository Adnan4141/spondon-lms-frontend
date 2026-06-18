'use client';

import dynamic from 'next/dynamic';

const StudentExamsPageContent = dynamic(
  () =>
    import('@/features/student/exams/StudentExamsPageContent').then((m) => m.StudentExamsPageContent),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading exams…
      </div>
    ),
  },
);

export default function StudentExamsPage() {
  return <StudentExamsPageContent />;
}
