'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import { Loader2 } from 'lucide-react';
import type { ExamTakingView as ExamTakingViewType } from './ExamTakingView';

function ExamTakingSkeleton() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      <p className="text-sm font-medium">Loading exam…</p>
    </div>
  );
}

export const LazyExamTakingView = dynamic(
  () => import('./ExamTakingView').then((mod) => mod.ExamTakingView),
  { ssr: false, loading: () => <ExamTakingSkeleton /> },
) as React.ComponentType<ComponentProps<typeof ExamTakingViewType>>;
