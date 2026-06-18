'use client';

import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
};

export function LedgerEntryDialogShell({ open, onOpenChange, title, children }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // DialogContent includes sm:max-w-lg; override the same breakpoint for ledger forms.
          'max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-6xl',
        )}
      >
        <DialogHeader>
          <DialogTitle className="font-black">{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
