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
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
  bodyClassName?: string;
  contentClassName?: string;
  /** Renders below the scrollable body (e.g. form actions). */
  footer?: ReactNode;
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
        <div className="shrink-0 border-b border-border/70 bg-linear-to-r from-sky-50 via-white to-amber-50 px-4 py-4 dark:from-slate-950 dark:via-slate-950 dark:to-amber-950/30 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-black text-foreground sm:text-lg">{title}</h2>
              {subtitle ? <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className={cn('flex-1', footer ? 'flex min-h-0 flex-col overflow-hidden' : 'overflow-y-auto bg-white p-4 sm:p-6', !footer && bodyClassName)}>
          {footer ? (
            <>
              <div className={cn('min-h-0 flex-1', bodyClassName)}>{children}</div>
              {footer}
            </>
          ) : (
            children
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
