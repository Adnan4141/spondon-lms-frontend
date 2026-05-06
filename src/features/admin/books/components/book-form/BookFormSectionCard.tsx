import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const sectionTones = {
  indigo: {
    card: 'border-sky-200/80 bg-sky-50/30 dark:border-sky-900/60 dark:bg-sky-950/10',
    header: 'border-b border-sky-100 bg-linear-to-r from-sky-50 via-white to-cyan-50 text-foreground dark:border-sky-900/60 dark:from-sky-950/30 dark:via-slate-950 dark:to-cyan-950/20',
    iconWrap: 'rounded-lg bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:ring-sky-800',
  },
  emerald: {
    card: 'border-emerald-200/80 bg-emerald-50/25 dark:border-emerald-900/60 dark:bg-emerald-950/10',
    header: 'border-b border-emerald-100 bg-linear-to-r from-emerald-50 via-white to-teal-50 text-foreground dark:border-emerald-900/60 dark:from-emerald-950/30 dark:via-slate-950 dark:to-teal-950/20',
    iconWrap: 'rounded-lg bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-800',
  },
  violet: {
    card: 'border-violet-200/80 bg-violet-50/25 dark:border-violet-900/60 dark:bg-violet-950/10',
    header: 'border-b border-violet-100 bg-linear-to-r from-violet-50 via-white to-fuchsia-50 text-foreground dark:border-violet-900/60 dark:from-violet-950/30 dark:via-slate-950 dark:to-fuchsia-950/20',
    iconWrap: 'rounded-lg bg-violet-100 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950/60 dark:text-violet-200 dark:ring-violet-800',
  },
  sky: {
    card: 'border-rose-200/80 bg-rose-50/25 dark:border-rose-900/60 dark:bg-rose-950/10',
    header: 'border-b border-rose-100 bg-linear-to-r from-rose-50 via-white to-amber-50 text-foreground dark:border-rose-900/60 dark:from-rose-950/30 dark:via-slate-950 dark:to-amber-950/20',
    iconWrap: 'rounded-lg bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:ring-rose-800',
  },
} as const;

export type BookFormSectionTone = keyof typeof sectionTones;

export function BookFormSectionCard({
  tone,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  tone: BookFormSectionTone;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const t = sectionTones[tone];
  return (
    <Card className={cn('overflow-hidden rounded-xl shadow-sm', t.card)}>
      <CardHeader className={cn('px-4 py-3 sm:px-5 sm:py-3.5', t.header)}>
        <div className="flex items-start gap-2.5">
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center', t.iconWrap)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <CardTitle className="text-sm font-bold tracking-tight text-foreground sm:text-[15px]">{title}</CardTitle>
            <CardDescription className="text-xs leading-5 text-muted-foreground">{subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 bg-card/95 px-5 py-5 sm:px-6 sm:py-6">{children}</CardContent>
    </Card>
  );
}
