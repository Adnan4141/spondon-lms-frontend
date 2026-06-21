'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  message?: string;
  onRetry: () => void;
};

export function QuestionsErrorState({
  message = 'Could not load question bank data. Please try again.',
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="max-w-md space-y-1">
        <p className="text-sm font-bold text-slate-800">Something went wrong</p>
        <p className="text-sm text-slate-500">{message}</p>
      </div>
      <Button type="button" variant="outline" onClick={onRetry} className="rounded-xl">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
