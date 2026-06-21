'use client';

import type { ReactNode } from 'react';
import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type SmsFocusDrawerShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  meta?: ReactNode;
  infoBanner?: ReactNode;
  children: ReactNode;
};

export function SmsFocusDrawerShell({
  open,
  onOpenChange,
  title,
  eyebrow = 'Focused SMS Workspace',
  description,
  meta,
  infoBanner,
  children,
}: SmsFocusDrawerShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'fixed inset-y-0 right-0 left-auto top-0 z-50 flex h-full w-full max-w-6xl translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 border-l p-0 shadow-2xl',
          'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
          'data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100',
        )}
      >
        <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white">
          <div className="flex items-start justify-between gap-3 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-wider text-blue-600">{eyebrow}</p>
              <DialogTitle className="truncate text-lg font-bold text-slate-950">{title}</DialogTitle>
              {description ? (
                <DialogDescription asChild>
                  <div className="mt-1 text-sm text-slate-600">{description}</div>
                </DialogDescription>
              ) : (
                <DialogDescription className="sr-only">{title} workspace</DialogDescription>
              )}
              {meta ? <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div> : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {infoBanner ? (
            <div className="flex items-start gap-2 border-t border-slate-100 bg-amber-50 px-5 py-2.5 text-sm text-amber-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <div>{infoBanner}</div>
            </div>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
