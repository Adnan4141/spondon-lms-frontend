'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { TeacherDoubtsPageContent } from '@/features/teacher/doubts/TeacherDoubtsPageContent';

export default function TeacherDoubtsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        </div>
      }
    >
      <TeacherDoubtsPageContent />
    </Suspense>
  );
}
