'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function BookStandardModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-5xl',
  bodyClassName,
  contentClassName,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
  bodyClassName?: string;
  contentClassName?: string;
}) {
  const smMaxWidth = `sm:${maxWidth}`;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'flex max-h-[92vh] w-[96vw] flex-col gap-0 overflow-hidden p-0 sm:w-[95vw]',
          maxWidth,
          smMaxWidth,
          contentClassName,
        )}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{subtitle || `${title} dialog`}</DialogDescription>
        <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-black text-slate-900 sm:text-lg">{title}</h2>
              {subtitle ? <p className="mt-1 text-xs text-slate-500 sm:text-sm">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg bg-red-100 p-1.5 text-red-700 transition-colors hover:bg-red-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className={cn('flex-1 overflow-y-auto bg-white p-4 sm:p-6', bodyClassName)}>{children}</div>
      </DialogContent>
    </Dialog>
  );
}