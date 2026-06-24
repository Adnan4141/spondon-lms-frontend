'use client';

import { useState } from 'react';
import { CalendarClock, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExamWizardState } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
};

function timeOfDay(date?: Date): string {
  if (!date) return '09:00';
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function combineDateTime(date: Date | undefined, time: string): Date | undefined {
  if (!date) return undefined;
  const [hh, mm] = time.split(':').map((part) => Number(part) || 0);
  const next = new Date(date);
  next.setHours(hh, mm, 0, 0);
  return next;
}

function formatScheduleSummary(startAt?: Date, endAt?: Date): string | null {
  const fmt = (date: Date) =>
    date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  if (startAt && endAt) return `${fmt(startAt)} → ${fmt(endAt)}`;
  if (startAt) return `From ${fmt(startAt)}`;
  if (endAt) return `Until ${fmt(endAt)}`;
  return null;
}

/**
 * Captures `startAt` and `endAt` for the published exam. Both are written
 * straight to `Exam.startAt`/`Exam.endAt` by the persistence hook and read
 * by ExamHub's "Upcoming" filter.
 */
export function ExamScheduleCard({ state, dispatch }: Props) {
  const hasSchedule = Boolean(state.startAt || state.endAt);
  const [expanded, setExpanded] = useState(hasSchedule);

  const setStart = (date: Date | undefined, time: string) =>
    dispatch({ type: 'MERGE', patch: { startAt: combineDateTime(date, time) } });
  const setEnd = (date: Date | undefined, time: string) =>
    dispatch({ type: 'MERGE', patch: { endAt: combineDateTime(date, time) } });

  const scheduleSummary = formatScheduleSummary(state.startAt, state.endAt);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-1 pb-2">
        <button
          type="button"
          className="flex w-full items-start gap-2 text-left"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
            <CalendarClock className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="font-serif text-base text-[#0D1B35]">Set exam window</CardTitle>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-slate-400 transition-transform',
                  expanded && 'rotate-180',
                )}
              />
            </div>
            <CardDescription className="mt-0.5">
              {expanded
                ? 'Optional. Leave blank to make the exam available any time after publish. Times use the admin timezone.'
                : scheduleSummary ?? 'Optional — exam available any time after publish.'}
            </CardDescription>
          </div>
        </button>
      </CardHeader>
      {expanded ? (
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="max-w-xs space-y-2">
            <Label>Starts at</Label>
            <DatePicker date={state.startAt} setDate={(date) => setStart(date, timeOfDay(state.startAt))} />
            <Input
              type="time"
              value={timeOfDay(state.startAt)}
              onChange={(event) => setStart(state.startAt, event.target.value)}
              className="max-w-xs border-slate-200"
              disabled={!state.startAt}
            />
            {state.startAt ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="px-0 text-[11px] text-slate-500"
                onClick={() => dispatch({ type: 'MERGE', patch: { startAt: undefined } })}
              >
                Clear start
              </Button>
            ) : null}
          </div>
          <div className="max-w-xs space-y-2">
            <Label>Ends at</Label>
            <DatePicker date={state.endAt} setDate={(date) => setEnd(date, timeOfDay(state.endAt))} />
            <Input
              type="time"
              value={timeOfDay(state.endAt)}
              onChange={(event) => setEnd(state.endAt, event.target.value)}
              className="max-w-xs border-slate-200"
              disabled={!state.endAt}
            />
            {state.endAt ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="px-0 text-[11px] text-slate-500"
                onClick={() => dispatch({ type: 'MERGE', patch: { endAt: undefined } })}
              >
                Clear end
              </Button>
            ) : null}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
