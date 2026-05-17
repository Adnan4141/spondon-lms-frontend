'use client';

import { MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { ExamWizardState } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
};

/**
 * Gates the auto-fire result SMS in the result-batch approval flow.
 * The toggle persists at `Exam.settings.examWorkflow.sms.enabled`.
 */
export function SmsNotificationCard({ state, dispatch }: Props) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <MessageCircle className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="font-serif text-base text-[#0D1B35]">Result SMS</CardTitle>
              <CardDescription className="mt-0.5">
                Send students an SMS automatically when their result batch is approved.
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={state.smsNotification}
            onCheckedChange={(checked) => dispatch({ type: 'MERGE', patch: { smsNotification: checked } })}
            aria-label="Enable result SMS"
          />
        </div>
      </CardHeader>
      {state.smsNotification ? (
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 text-xs">
            <Label className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">Preview</Label>
            <p className="mt-1 text-sm leading-snug text-emerald-900">
              Dear &lt;Student Name&gt;, your result for{' '}
              <span className="font-semibold">{state.title.trim() || 'this exam'}</span> has been published. Marks:
              &lt;Obtained&gt;/&lt;Total&gt;.
            </p>
          </div>
          <p className="text-[11px] text-slate-500">
            SMS only fire after a result batch reaches an approved state. Students with no mobile number on file are skipped.
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
}
