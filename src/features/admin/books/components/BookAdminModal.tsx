'use client';

import type { ReactNode } from 'react';
import { BookStandardModal } from '@/components/books/BookStandardModal';
import { cn } from '@/lib/utils';

export function BookAdminModal({
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
  footer?: ReactNode;
}) {
  return (
    <BookStandardModal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth={maxWidth}
      bodyClassName={cn('bg-background text-foreground', bodyClassName)}
      contentClassName={cn('border-border/70 bg-card shadow-2xl shadow-slate-950/10', contentClassName)}
      footer={footer}
    >
      {children}
    </BookStandardModal>
  );
}
