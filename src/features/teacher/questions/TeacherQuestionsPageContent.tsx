'use client';

import { QuestionsPageContent } from '@/features/admin/questions/QuestionsPageContent';
import { useTeacherSession } from '@/components/teacher/useTeacherSession';

export function TeacherQuestionsPageContent() {
  const { user, authChecked } = useTeacherSession();

  if (!authChecked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Loading questions…
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm font-bold text-slate-700">Sign in required</p>
        <p className="text-sm text-slate-500">Please log in as a teacher to manage your question bank.</p>
      </div>
    );
  }

  return <QuestionsPageContent teacherUserId={user.id} showBulkImport={false} />;
}
