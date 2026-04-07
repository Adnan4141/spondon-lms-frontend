'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function parseHm(value: string): { h: string; m: string } {
  const parts = (value || '09:00').split(':');
  const h = String(Math.min(23, Math.max(0, parseInt(parts[0] || '9', 10) || 9))).padStart(2, '0');
  const m = String(Math.min(59, Math.max(0, parseInt(parts[1] || '0', 10) || 0))).padStart(2, '0');
  return { h, m };
}

type Props = {
  label: string;
  value: string;
  onChange: (hhmm: string) => void;
  className?: string;
};

export function TimeHmSelect({ label, value, onChange, className }: Props) {
  const { h, m } = parseHm(value);
  const setPart = (part: 'h' | 'm', v: string) => {
    const nextH = part === 'h' ? v : h;
    const nextM = part === 'm' ? v : m;
    onChange(`${nextH}:${nextM}`);
  };

  return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-xs font-bold text-slate-600">{label}</Label>
      <div className="flex items-center gap-2">
        <Select value={h} onValueChange={(v) => setPart('h', v)}>
          <SelectTrigger className="mt-0 flex-1 font-mono text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-56">
            {HOURS.map((hour) => (
              <SelectItem key={hour} value={hour}>
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground font-bold pt-1">:</span>
        <Select value={m} onValueChange={(v) => setPart('m', v)}>
          <SelectTrigger className="mt-0 flex-1 font-mono text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-56">
            {MINUTES.map((min) => (
              <SelectItem key={min} value={min}>
                {min}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
