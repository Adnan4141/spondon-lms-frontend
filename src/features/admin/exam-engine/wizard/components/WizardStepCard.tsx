'use client';

import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  accent?: 'indigo' | 'gold' | 'emerald';
};

const accentBar = {
  indigo: 'from-indigo-500 to-[#5C2D91]',
  gold: 'from-[#C8A96E] to-[#0D1B35]',
  emerald: 'from-emerald-500 to-teal-600',
} as const;

export function WizardStepCard({
  title,
  description,
  children,
  className,
  contentClassName,
  accent = 'indigo',
}: Props) {
  return (
    <Card className={cn('overflow-hidden rounded-2xl border-slate-200 shadow-sm', className)}>
      <div className={cn('h-1 bg-gradient-to-r', accentBar[accent])} />
      <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-4">
        <CardTitle className="font-serif text-lg text-[#0D1B35]">{title}</CardTitle>
        {description ? <CardDescription className="text-slate-500">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={cn('pt-5', contentClassName)}>{children}</CardContent>
    </Card>
  );
}
