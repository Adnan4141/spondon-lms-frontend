'use client';

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
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import type { ExamWizardState } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import type { Step1FieldKey } from '../validateWizardStep';
import { EXAM_WIZARD_ALL_BRANCHES } from '../constants';
import { CourseMultiSelect } from './CourseMultiSelect';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
  courses: Course[];
  branches: Branch[];
  fieldErrors?: Partial<Record<Step1FieldKey, boolean>>;
  clearFieldError: (key: Step1FieldKey) => void;
};

export function BasicExamInfoForm({
  state,
  dispatch,
  courses,
  branches,
  fieldErrors,
  clearFieldError,
}: Props) {
  const err = (key: Step1FieldKey) => Boolean(fieldErrors?.[key]);

  if (!state.uiCategory) return null;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
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

        <div className="md:col-span-2 space-y-2">
          <Label>Courses *</Label>
          <CourseMultiSelect
            courses={courses}
            value={state.courseIds}
            invalid={err('courseId')}
            onChange={(courseIds) => {
              clearFieldError('courseId');
              dispatch({ type: 'MERGE', patch: { courseIds } });
            }}
          />
          {err('courseId') ? <p className="text-xs text-rose-600">Select at least one course.</p> : null}
        </div>

        <div className="space-y-2">
          <Label>Branch (optional)</Label>
          <Select
            value={state.branchId || EXAM_WIZARD_ALL_BRANCHES}
            onValueChange={(value) => dispatch({ type: 'MERGE', patch: { branchId: value } })}
          >
            <SelectTrigger className="border-slate-200">
              <SelectValue placeholder="Branch scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EXAM_WIZARD_ALL_BRANCHES}>All branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-500">
            All branches: any eligible enrolled student can see this exam regardless of centre.
          </p>
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

        {state.deliveryMode === 'ONLINE' ? (
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

        {state.deliveryMode === 'OFFLINE' ? (
          <>
            <div className="space-y-2">
              <Label>Result release date</Label>
              <DatePicker date={state.scheduleAt} setDate={(date) => dispatch({ type: 'MERGE', patch: { scheduleAt: date } })} />
              <Input
                type="time"
                value={state.scheduleTime}
                onChange={(event) => dispatch({ type: 'MERGE', patch: { scheduleTime: event.target.value } })}
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Solve sheet visible from</Label>
              <DatePicker date={state.solveAt} setDate={(date) => dispatch({ type: 'MERGE', patch: { solveAt: date } })} />
              <Input
                type="time"
                value={state.solveTime}
                onChange={(event) => dispatch({ type: 'MERGE', patch: { solveTime: event.target.value } })}
                className="border-slate-200"
              />
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
