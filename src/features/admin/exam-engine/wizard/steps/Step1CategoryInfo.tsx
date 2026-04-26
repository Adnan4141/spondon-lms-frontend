'use client';

import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import type { ExamWizardState, UiExamCategory } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';
import { EXAM_CATS } from '../constants';
import type { Step1FieldKey } from '../validateWizardStep';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
  courses: Course[];
  branches: Branch[];
  fieldErrors?: Partial<Record<Step1FieldKey, boolean>>;
  onSelectCategory: (id: UiExamCategory) => void;
  clearFieldError: (k: Step1FieldKey) => void;
};

export function Step1CategoryInfo({
  state,
  dispatch,
  courses,
  branches,
  fieldErrors,
  onSelectCategory,
  clearFieldError,
}: Props) {
  const err = (k: Step1FieldKey) => Boolean(fieldErrors?.[k]);

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-[#0D1B35]">Exam category</CardTitle>
          <CardDescription>Choose format — colors match the reference EduCore palette.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {EXAM_CATS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                clearFieldError('uiCategory');
                onSelectCategory(c.id);
              }}
              className={cn(
                'rounded-xl border p-4 text-left transition-all hover:border-[#C8A96E] hover:bg-[#FBF4E6]/60',
                state.uiCategory === c.id &&
                  'border-[#0D1B35] bg-[#0D1B35]/[0.04] shadow-[0_0_0_3px_rgba(13,27,53,0.06)]',
                err('uiCategory') && !state.uiCategory && 'ring-2 ring-rose-200',
              )}
            >
              <div className="text-2xl">{c.icon}</div>
              <div className="mt-1 font-semibold text-slate-900">{c.name}</div>
              <p className="mt-1 text-[11px] leading-snug text-slate-600">{c.desc}</p>
            </button>
          ))}
        </CardContent>
        {err('uiCategory') ? <p className="px-6 pb-2 text-xs text-rose-600">Select an exam category.</p> : null}
      </Card>

      {state.uiCategory && state.uiCategory !== 'OMRB' && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-serif text-base text-[#0D1B35]">Delivery</CardTitle>
            <Badge
              className={
                state.deliveryMode === 'ONLINE' ? 'bg-sky-100 text-sky-800' : 'bg-orange-100 text-orange-800'
              }
            >
              {state.deliveryMode === 'ONLINE' ? 'Online' : 'Offline'}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={state.deliveryMode === 'ONLINE' ? 'default' : 'outline'}
              className={state.deliveryMode === 'ONLINE' ? 'bg-[#0D1B35] text-[#E2C98A]' : ''}
              onClick={() => dispatch({ type: 'MERGE', patch: { deliveryMode: 'ONLINE' } })}
            >
              Online
            </Button>
            <Button
              type="button"
              variant={state.deliveryMode === 'OFFLINE' ? 'default' : 'outline'}
              className={state.deliveryMode === 'OFFLINE' ? 'bg-[#E65100] text-white hover:bg-[#bf4200]' : ''}
              onClick={() => dispatch({ type: 'MERGE', patch: { deliveryMode: 'OFFLINE' } })}
            >
              Offline
            </Button>
          </CardContent>
        </Card>
      )}

      {state.uiCategory && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-base text-[#0D1B35]">Basic information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <Label>Exam title *</Label>
              <Input
                value={state.title}
                onChange={(e) => {
                  clearFieldError('title');
                  dispatch({ type: 'MERGE', patch: { title: e.target.value } });
                }}
                placeholder="e.g. HSC Biology Model Test 2026"
                className={cn('border-slate-200', err('title') && 'border-rose-400')}
              />
              {err('title') ? <p className="text-xs text-rose-600">Enter at least 3 characters.</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Course *</Label>
              <Select
                value={state.courseId}
                onValueChange={(v) => {
                  clearFieldError('courseId');
                  dispatch({ type: 'MERGE', patch: { courseId: v } });
                }}
              >
                <SelectTrigger className={cn('border-slate-200', err('courseId') && 'border-rose-400')}>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err('courseId') ? <p className="text-xs text-rose-600">Course is required.</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Branch *</Label>
              <Select
                value={state.branchId}
                onValueChange={(v) => {
                  clearFieldError('branchId');
                  dispatch({ type: 'MERGE', patch: { branchId: v } });
                }}
              >
                <SelectTrigger className={cn('border-slate-200', err('branchId') && 'border-rose-400')}>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err('branchId') ? <p className="text-xs text-rose-600">Branch is required.</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={state.language} onValueChange={(v) => dispatch({ type: 'MERGE', patch: { language: v } })}>
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
                onChange={(e) => dispatch({ type: 'MERGE', patch: { durationMinutes: e.target.value } })}
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Institute / label</Label>
              <Input
                value={state.instituteLabel}
                onChange={(e) => dispatch({ type: 'MERGE', patch: { instituteLabel: e.target.value } })}
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Paper code</Label>
              <Input
                value={state.paperCode}
                onChange={(e) => dispatch({ type: 'MERGE', patch: { paperCode: e.target.value } })}
                className="border-slate-200"
              />
            </div>
            {state.deliveryMode === 'OFFLINE' && (
              <>
                <div className="space-y-2">
                  <Label>Result release date</Label>
                  <DatePicker
                    date={state.scheduleAt}
                    setDate={(d) => dispatch({ type: 'MERGE', patch: { scheduleAt: d } })}
                  />
                  <Input
                    type="time"
                    value={state.scheduleTime}
                    onChange={(e) => dispatch({ type: 'MERGE', patch: { scheduleTime: e.target.value } })}
                    className="border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Solve sheet visible from</Label>
                  <DatePicker date={state.solveAt} setDate={(d) => dispatch({ type: 'MERGE', patch: { solveAt: d } })} />
                  <Input
                    type="time"
                    value={state.solveTime}
                    onChange={(e) => dispatch({ type: 'MERGE', patch: { solveTime: e.target.value } })}
                    className="border-slate-200"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-950">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Navy & gold palette follows the reference design. All inputs use shadcn primitives (select, switch, date
          picker).
        </span>
      </div>
    </div>
  );
}
