import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function BookFormField({
  label,
  hint,
  children,
  className,
  optional,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  optional?: boolean;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline gap-2">
        <Label className="text-xs font-semibold text-foreground">{label}</Label>
        {optional ? (
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Optional</span>
        ) : null}
      </div>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
