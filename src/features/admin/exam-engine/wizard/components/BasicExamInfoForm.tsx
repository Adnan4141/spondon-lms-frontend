'use client';

import { useEffect, useState } from 'react';
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
import { SearchableSelect } from '@/components/ui/searchable-select';
import { cn } from '@/lib/utils';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import { getBatches, type Batch } from '@/lib/api/batches';
import type { ExamWizardState } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import type { Step1FieldKey } from '../validateWizardStep';
import { EXAM_WIZARD_ALL_BATCHES, EXAM_WIZARD_ALL_BRANCHES, resolveWizardBranchIdForApi } from '../constants';

type Props = {
  state: ExamWizardState;
  dispatch: Dispatch<WizardFormAction>;
  courses: Course[];
  branches: Branch[];
  deliveryMode: 'ONLINE' | 'OFFLINE';
  fieldErrors?: Partial<Record<Step1FieldKey, boolean>>;
  clearFieldError: (key: Step1FieldKey) => void;
  onCourseSelect: (course: Course) => void;
};

export function BasicExamInfoForm({
  state,
  dispatch,
  courses,
  branches,
  deliveryMode,
  fieldErrors,
  clearFieldError,
  onCourseSelect,
}: Props) {
  const err = (key: Step1FieldKey) => Boolean(fieldErrors?.[key]);
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    if (!state.courseId) {
      setBatches([]);
      return;
    }
    let cancelled = false;
    const branchId = resolveWizardBranchIdForApi(state.branchId);
    getBatches({
      all: true,
      status: 'ACTIVE',
      courseId: state.courseId,
      ...(branchId ? { branchId } : {}),
    })
      .then((res) => {
        if (cancelled) return;
        setBatches(res.success && res.data ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setBatches([]);
      });
    return () => {
      cancelled = true;
    };
  }, [state.courseId, state.branchId]);

  const handleCourseSelect = (courseId: string) => {
    clearFieldError('courseId');
    const selected = courses.find((c) => c.id === courseId);
    if (selected) {
      onCourseSelect(selected);
    }
  };

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
          <Label>Course *</Label>
          <SearchableSelect
            options={courses.map((course) => ({
              value: course.id,
              label: `${course.name} · ${course.type === 'ONLINE' ? 'ONLINE' : 'OFFLINE'}`,
            }))}
            value={state.courseId}
            onValueChange={handleCourseSelect}
            placeholder="Select a course"
            searchPlaceholder="Search courses..."
            emptyMessage="No courses found."
            triggerClassName={cn(
              'h-10 rounded-md bg-white px-3 font-normal text-black shadow-none hover:bg-white',
              err('courseId') ? 'border-rose-400' : 'border-slate-200',
            )}
          />
          {err('courseId') ? <p className="text-xs text-rose-600">Select a course.</p> : null}
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
          <Label>Batch (optional)</Label>
          <Select
            value={state.batchId || EXAM_WIZARD_ALL_BATCHES}
            onValueChange={(value) => dispatch({ type: 'MERGE', patch: { batchId: value } })}
            disabled={!state.courseId}
          >
            <SelectTrigger className="border-slate-200">
              <SelectValue placeholder={state.courseId ? 'Batch scope' : 'Select a course first'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EXAM_WIZARD_ALL_BATCHES}>All batches</SelectItem>
              {batches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.name}
                  {batch.branch?.name ? ` · ${batch.branch.name}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-500">
            Limit visibility to one batch, or leave as all batches for every enrolled student in scope.
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
