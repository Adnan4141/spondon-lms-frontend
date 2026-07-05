'use client';

import { ExamHub } from '@/features/admin/exam-engine/ExamHub';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTeacherSession } from '@/components/teacher/useTeacherSession';

export function TeacherExamsPageContent() {
  const { user, authChecked } = useTeacherSession();

  if (!authChecked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-600">Please log in to manage exams.</p>
        <Button asChild className="mt-4">
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    );
  }

  return <ExamHub portal="teacher" teacherUserId={user.id} />;
}
