import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const sectionTones = {
  indigo: {
    header: 'bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white border-b border-white/10',
    iconWrap: 'rounded-2xl bg-white/15 text-white ring-1 ring-white/25 shadow-lg',
  },
  emerald: {
    header: 'bg-linear-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white border-b border-white/10',
    iconWrap: 'rounded-2xl bg-white/15 text-white ring-1 ring-white/25 shadow-lg',
  },
  violet: {
    header: 'bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-700 text-white border-b border-white/10',
    iconWrap: 'rounded-2xl bg-white/15 text-white ring-1 ring-white/25 shadow-lg',
  },
  sky: {
    header: 'bg-linear-to-br from-sky-600 via-blue-600 to-indigo-700 text-white border-b border-white/10',
    iconWrap: 'rounded-2xl bg-white/15 text-white ring-1 ring-white/25 shadow-lg',
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
    <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
      <CardHeader className={cn('px-5 py-4 sm:px-6 sm:py-5', t.header)}>
        <div className="flex items-start gap-3">
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center', t.iconWrap)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base font-bold tracking-tight text-white">{title}</CardTitle>
            <CardDescription className="text-sm text-white/80">{subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 bg-card/90 px-5 py-5 backdrop-blur-sm sm:px-6 sm:py-6">{children}</CardContent>
    </Card>
  );
}
