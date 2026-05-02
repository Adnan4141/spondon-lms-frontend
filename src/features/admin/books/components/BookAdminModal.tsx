'use client';

import type { ReactNode } from 'react';
import { BookStandardModal } from '@/components/books/BookStandardModal';

export function BookAdminModal({
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
  return (
    <BookStandardModal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth={maxWidth}
      bodyClassName={bodyClassName}
      contentClassName={contentClassName}
    >
      {children}
    </BookStandardModal>
  );
}