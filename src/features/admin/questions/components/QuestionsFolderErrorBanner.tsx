'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  message?: string;
  onRetry: () => void;
  className?: string;
};

export function QuestionsFolderErrorBanner({
  message = 'Could not load folders. Question list is still available.',
  onRetry,
  className,
}: Props) {
  return (
    <div
      className={
        className ??
        'flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900'
      }
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-medium leading-snug">{message}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="h-8 rounded-lg border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Retry folders
        </Button>
      </div>
    </div>
  );
}
