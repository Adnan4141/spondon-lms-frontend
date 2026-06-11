'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const AttendanceSheetPageContent = dynamic(
  () =>
    import('@/features/admin/attendance/AttendanceSheetPageContent').then(
      (m) => m.AttendanceSheetPageContent,
    ),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    ),
  },
);

export default function AttendanceSheetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <AttendanceSheetPageContent />
    </Suspense>
  );
}
