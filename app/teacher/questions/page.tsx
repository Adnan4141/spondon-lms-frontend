'use client';

import dynamic from 'next/dynamic';

const TeacherQuestionsPageContent = dynamic(
  () =>
    import('@/features/teacher/questions/TeacherQuestionsPageContent').then(
      (m) => m.TeacherQuestionsPageContent,
    ),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading questions…
      </div>
    ),
  },
);

export default function TeacherQuestionsPage() {
  return <TeacherQuestionsPageContent />;
}
