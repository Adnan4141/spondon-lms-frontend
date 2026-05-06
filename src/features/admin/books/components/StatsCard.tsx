'use client';

import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-card border-border text-foreground',
  green: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  blue: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400',
  sky: 'bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-400',
  orange: 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400',
  red: 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400',
  purple: 'bg-violet-500/10 border-violet-500/20 text-violet-700 dark:text-violet-400',
} as const;

export function StatsCard({
  label,
  value,
  icon: Icon,
  sub,
  variant = 'default',
  className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <Card className={cn('rounded-xl border shadow-sm', variants[variant], className)}>
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="text-2xl font-black tracking-tight">{value}</p>
          {sub ? <p className="text-sm text-muted-foreground">{sub}</p> : null}
        </div>
        <div className="rounded-lg border border-current/10 bg-background/60 p-2.5">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
