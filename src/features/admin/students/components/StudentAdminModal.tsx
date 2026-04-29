'use client';

import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function StudentAdminModal({
  open, onClose, title, subtitle, children, maxWidth = 'max-w-5xl',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const smMaxWidth = `sm:${maxWidth}`;
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn('p-0 gap-0 max-h-[92vh] w-[96vw] flex flex-col overflow-hidden sm:w-[95vw]', maxWidth, smMaxWidth)}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{subtitle || `${title} dialog`}</DialogDescription>
        <div className="flex items-start justify-between gap-3 px-4 py-4 border-b border-slate-200 bg-slate-50 shrink-0 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="bg-red-100 hover:bg-red-200 text-red-700 rounded-lg p-1.5 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 bg-white sm:p-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
