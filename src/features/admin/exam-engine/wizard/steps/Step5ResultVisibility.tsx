'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ExamWizardState, SolveSheetVisibility } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import { ResultInputModeSelector } from '../components/ResultInputModeSelector';
import { SmsNotificationCard } from '../components/SmsNotificationCard';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
};

const SOLVE_OPTIONS: { id: SolveSheetVisibility; label: string; description: string }[] = [
  { id: 'IMMEDIATELY', label: 'Immediately', description: 'Visible right after the student submits.' },
  { id: 'HIDDEN', label: 'Hidden', description: 'Solve sheet never shown to students.' },
  { id: 'SCHEDULED', label: 'Scheduled', description: 'Released at a specific date and time.' },
];

function timeOfDay(date?: Date): string {
  if (!date) return '17:00';
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

export function Step5ResultVisibility({ state, dispatch }: Props) {
  const setSolve = (visibility: SolveSheetVisibility) => {
    const patch: Partial<ExamWizardState> = {
      solveVisibility: visibility,
      showSolve: visibility !== 'HIDDEN',
    };
    if (visibility !== 'SCHEDULED') patch.solveScheduledAt = undefined;
    dispatch({ type: 'MERGE', patch });
  };

  const setSolveDate = (date: Date | undefined) => {
    dispatch({
      type: 'MERGE',
      patch: { solveScheduledAt: combineDateTime(date, timeOfDay(state.solveScheduledAt)) },
    });
  };

  const setSolveTime = (time: string) => {
    dispatch({
      type: 'MERGE',
      patch: { solveScheduledAt: combineDateTime(state.solveScheduledAt ?? new Date(), time) },
    });
  };

  return (
    <div className="space-y-4">
      <ResultInputModeSelector state={state} dispatch={dispatch} />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-[#0D1B35]">Result visibility</CardTitle>
          <CardDescription>Control what students see after they submit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
            <div>
              <span className="text-sm font-semibold text-slate-900">Show leaderboard</span>
              <p className="text-[11px] text-slate-500">Public ranking after submission.</p>
            </div>
            <Switch
              checked={state.showLeaderboard}
              onCheckedChange={(v) => dispatch({ type: 'MERGE', patch: { showLeaderboard: v } })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
            <div>
              <span className="text-sm font-semibold text-slate-900">Hide result immediately</span>
              <p className="text-[11px] text-slate-500">Withhold the marks until manually released.</p>
            </div>
            <Switch
              checked={state.hideResult}
              onCheckedChange={(v) => dispatch({ type: 'MERGE', patch: { hideResult: v } })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
            <div>
              <span className="text-sm font-semibold text-slate-900">Show percentile</span>
              <p className="text-[11px] text-slate-500">Compare each student against the cohort.</p>
            </div>
            <Switch
              checked={state.showPct}
              onCheckedChange={(v) => dispatch({ type: 'MERGE', patch: { showPct: v } })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-[#0D1B35]">Solve sheet release</CardTitle>
          <CardDescription>When students should see the explained answer sheet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {SOLVE_OPTIONS.map((option) => {
              const active = state.solveVisibility === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSolve(option.id)}
                  className={cn(
                    'rounded-lg border bg-white p-3 text-left transition-all',
                    active
                      ? 'border-[#0D1B35] bg-[#0D1B35]/[0.04] shadow-[0_0_0_3px_rgba(13,27,53,0.06)]'
                      : 'border-slate-200 hover:border-[#C8A96E] hover:bg-[#FBF4E6]/60',
                  )}
                >
                  <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{option.description}</p>
                </button>
              );
            })}
          </div>

          {state.solveVisibility === 'SCHEDULED' ? (
            <div className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Release date</Label>
                <DatePicker date={state.solveScheduledAt} setDate={setSolveDate} />
              </div>
              <div className="space-y-2">
                <Label>Release time</Label>
                <Input
                  type="time"
                  value={timeOfDay(state.solveScheduledAt)}
                  onChange={(event) => setSolveTime(event.target.value)}
                  className="border-slate-200"
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <SmsNotificationCard state={state} dispatch={dispatch} />
    </div>
  );
}
