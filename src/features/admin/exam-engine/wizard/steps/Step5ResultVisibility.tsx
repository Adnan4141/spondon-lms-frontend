'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import type { ExamWizardState } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
};

export function Step5ResultVisibility({ state, dispatch }: Props) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-lg text-[#0D1B35]">Result & visibility</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
          <span className="text-sm">Show leaderboard</span>
          <Switch
            checked={state.showLeaderboard}
            onCheckedChange={(v) => dispatch({ type: 'MERGE', patch: { showLeaderboard: v } })}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
          <span className="text-sm">Hide result immediately</span>
          <Switch checked={state.hideResult} onCheckedChange={(v) => dispatch({ type: 'MERGE', patch: { hideResult: v } })} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
          <span className="text-sm">Show solve sheet to students</span>
          <Switch checked={state.showSolve} onCheckedChange={(v) => dispatch({ type: 'MERGE', patch: { showSolve: v } })} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
          <span className="text-sm">Show percentile</span>
          <Switch checked={state.showPct} onCheckedChange={(v) => dispatch({ type: 'MERGE', patch: { showPct: v } })} />
        </div>
      </CardContent>
    </Card>
  );
}
