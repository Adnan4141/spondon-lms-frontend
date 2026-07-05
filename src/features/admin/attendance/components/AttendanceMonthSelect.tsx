'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function AttendanceMonthSelect({
  value,
  onChange,
  options,
  label = 'Active month',
  hint,
  triggerClassName = 'h-9 w-44',
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  hint?: string;
  triggerClassName?: string;
}) {
  return (
    <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex max-w-md flex-wrap items-center gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className={triggerClassName}>
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}
