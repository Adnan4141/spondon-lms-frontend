'use client';

import type { Dispatch } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Course } from '@/types/course';
import type { ExamType } from '@/types/exam';
import type { ExamWizardState } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import type { Step1FieldKey } from '../validateWizardStep';
import { DeliveryModeFields } from './DeliveryModeCard';
import { ExamClassificationFields } from './ExamClassificationCard';
import { wizardCardClass } from '../examWizardPageUi';

type Props = {
  state: ExamWizardState;
  dispatch: Dispatch<WizardFormAction>;
  deliveryMode: 'ONLINE' | 'OFFLINE';
  courses: Course[];
  allowedExamTypes?: ExamType[];
  fieldErrors?: Partial<Record<Step1FieldKey, boolean>>;
  clearFieldError: (key: Step1FieldKey) => void;
};

export function BasicExamInfoForm({
  state,
  dispatch,
  deliveryMode,
  courses,
  allowedExamTypes,
  fieldErrors,
  clearFieldError,
}: Props) {
  const err = (key: Step1FieldKey) => Boolean(fieldErrors?.[key]);

  return (
    <Card className={cn(wizardCardClass, 'h-full')}>
      <CardHeader className="border-b border-slate-100 bg-slate-50/30">
        <CardTitle className="font-serif text-base text-[#0D1B35]">Basic information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 space-y-2">
          <Label>Exam title *</Label>
          <Input
            value={state.title}
            onChange={(event) => {
              clearFieldError('title');
              dispatch({ type: 'MERGE', patch: { title: event.target.value } });
            }}
            placeholder="e.g. HSC Biology Model Test 2026"
            className={cn('border-slate-200', err('title') && 'border-rose-400')}
          />
          {err('title') ? <p className="text-xs text-rose-600">Enter at least 3 characters.</p> : null}
        </div>

        <div className="space-y-2">
          <Label>Language</Label>
          <Select value={state.language} onValueChange={(value) => dispatch({ type: 'MERGE', patch: { language: value } })}>
            <SelectTrigger className="border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bn">বাংলা</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Duration (minutes)</Label>
          <Input
            type="number"
            min={5}
            value={state.durationMinutes}
            onChange={(event) => dispatch({ type: 'MERGE', patch: { durationMinutes: event.target.value } })}
            className="border-slate-200"
          />
        </div>

        <ExamClassificationFields
          state={state}
          dispatch={dispatch}
          allowedExamTypes={allowedExamTypes}
        />

        <DeliveryModeFields
          courseId={state.courseId}
          courses={courses}
          deliveryMode={deliveryMode}
          dispatch={dispatch}
        />

        {deliveryMode === 'ONLINE' ? (
          <div className="space-y-2">
            <Label>Allowed attempts</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={state.allowedAttempts}
              onChange={(event) => dispatch({ type: 'MERGE', patch: { allowedAttempts: event.target.value } })}
              className="border-slate-200"
            />
            <p className="text-[11px] text-slate-500">
              How many times each student may complete this exam online.
            </p>
          </div>
        ) : null}

        {deliveryMode === 'ONLINE' ? (
          <div className="md:col-span-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Label className="text-sm font-semibold text-slate-900">Auto-submit on disconnect</Label>
                <p className="mt-1 text-[11px] text-slate-500">
                  Heartbeat protection closes stale browser sessions after the grace period.
                </p>
              </div>
              <Switch
                checked={state.autoSubmitOnDisconnect}
                onCheckedChange={(checked) => dispatch({ type: 'MERGE', patch: { autoSubmitOnDisconnect: checked } })}
              />
            </div>
            {state.autoSubmitOnDisconnect ? (
              <div className="mt-3 max-w-40 space-y-2">
                <Label>Grace seconds</Label>
                <Input
                  type="number"
                  min={5}
                  value={state.disconnectGraceSeconds}
                  onChange={(event) => dispatch({ type: 'MERGE', patch: { disconnectGraceSeconds: event.target.value } })}
                  className="border-slate-200"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {deliveryMode === 'ONLINE' ? (
          <div className="md:col-span-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Label className="text-sm font-semibold text-slate-900">Strict proctoring</Label>
                <p className="mt-1 text-[11px] text-slate-500">
                  Auto-submit after 3 tab switches or focus losses during the attempt.
                </p>
              </div>
              <Switch
                checked={state.proctorStrict}
                onCheckedChange={(checked) => dispatch({ type: 'MERGE', patch: { proctorStrict: checked } })}
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
