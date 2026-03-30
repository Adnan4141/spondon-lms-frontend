'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/** How the course is delivered (center vs remote). Not the same as payment channel (pay now vs later). */
export function CourseDeliveryBadge({
  type,
  className,
}: {
  type?: string | null;
  className?: string;
}) {
  const t = String(type ?? '').toUpperCase();
  if (t !== 'ONLINE' && t !== 'OFFLINE') return null;
  const isOnline = t === 'ONLINE';
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[8px] font-black uppercase tracking-wider',
        isOnline
          ? 'border-cyan-200 bg-cyan-50 text-cyan-800'
          : 'border-orange-200 bg-orange-50 text-orange-900',
        className,
      )}
      title={
        isOnline
          ? 'Online course — delivered remotely / via student portal'
          : 'Offline course — in-person at center or classroom'
      }
    >
      {isOnline ? 'Online' : 'Offline'}
    </Badge>
  );
}
