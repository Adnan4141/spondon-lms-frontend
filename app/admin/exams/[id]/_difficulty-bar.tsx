'use client';

/**
 * 3-input DifficultyBar (EASY / MEDIUM / HARD percentages with live total).
 * Uses only shadcn Input + Label. Emits `{ easy, medium, hard }` via onChange
 * and highlights the total red when it's not 100.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export function DifficultyBar({
  value,
  onChange,
  idPrefix,
}: {
  value: DifficultyDistribution;
  onChange: (v: DifficultyDistribution) => void;
  idPrefix: string;
}) {
  const total = value.easy + value.medium + value.hard;
  const valid = total === 100;

  const setKey = (k: keyof DifficultyDistribution, raw: string) => {
    const n = Math.max(0, Math.min(100, Math.round(Number(raw) || 0)));
    onChange({ ...value, [k]: n });
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {(['easy', 'medium', 'hard'] as const).map((k) => (
          <div key={k} className="grid gap-1">
            <Label
              htmlFor={`${idPrefix}-${k}`}
              className="text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              {k}
            </Label>
            <Input
              id={`${idPrefix}-${k}`}
              type="number"
              min={0}
              max={100}
              value={value[k]}
              onChange={(e) => setKey(k, e.target.value)}
              className="h-8 text-right"
            />
          </div>
        ))}
      </div>

      {/* Visual bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="bg-emerald-500 transition-all"
          style={{ width: `${Math.min(100, value.easy)}%` }}
        />
        <div
          className="bg-amber-500 transition-all"
          style={{ width: `${Math.min(100, value.medium)}%` }}
        />
        <div
          className="bg-rose-500 transition-all"
          style={{ width: `${Math.min(100, value.hard)}%` }}
        />
      </div>

      <p
        className={cn(
          'text-[11px] font-medium',
          valid ? 'text-muted-foreground' : 'text-destructive',
        )}
      >
        Total: {total}% {valid ? '' : '(must equal 100%)'}
      </p>
    </div>
  );
}
