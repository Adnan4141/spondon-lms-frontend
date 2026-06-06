'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function AuditExpandablePanel({
  expanded,
  children,
  className,
}: {
  expanded: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows] duration-200 ease-linear',
        className,
      )}
      style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
