'use client';

import dynamic from 'next/dynamic';

const TeacherStudentsPageContent = dynamic(
  () =>
    import('@/features/teacher/students/TeacherStudentsPageContent').then(
      (m) => m.TeacherStudentsPageContent,
    ),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading students…
      </div>
    ),
  },
);

export default function TeacherStudentsPage() {
  return <TeacherStudentsPageContent />;
}
