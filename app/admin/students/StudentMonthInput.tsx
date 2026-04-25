'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function StudentMonthInput({
  value, onChange, min, max, disabled,
}: {
  value: string; onChange?: (v: string) => void; min?: string; max?: string; disabled?: boolean;
}) {
  return (
    <Input
      type="month"
      value={value}
      onChange={e => onChange?.(e.target.value)}
      min={min}
      max={max}
      disabled={disabled}
      className={cn('w-full text-sm', disabled ? 'cursor-not-allowed' : 'focus-visible:ring-indigo-400')}
    />
  );
}
