'use client';

import { useState } from 'react';
import { BookOpen, Building2, ClipboardCheck, Info, Layers, Library, Loader2, PenLine, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { EXAM_CATS, EXAM_WIZARD_ALL_BRANCHES } from '../constants';
import type { Step1FieldKey } from '../validateWizardStep';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
  courses: Course[];
  branches: Branch[];
  fieldErrors?: Partial<Record<Step1FieldKey, boolean>>;
  onSelectCategory: (id: UiExamCategory) => void;
  clearFieldError: (k: Step1FieldKey) => void;
  importSourceExams: { id: string; title: string }[];
  importBusy: boolean;
  onImportFromExam: (sourceExamId: string) => void;
};

export function Step1CategoryInfo({
  state,
  dispatch,
  courses,
  branches,
  fieldErrors,
  onSelectCategory,
  clearFieldError,
  importSourceExams,
  importBusy,
  onImportFromExam,
}: Props) {
  const err = (k: Step1FieldKey) => Boolean(fieldErrors?.[k]);
  const [importPick, setImportPick] = useState<string>('');
  const iconMap = {
    MCQ: ClipboardCheck,
    CQ: PenLine,
    MCQCQ: Layers,
    OFFLINE_RESULT: Building2,
    OMR: ScanLine,
    OMRB: BookOpen,
    MULTI: Library,
  } as const;

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg text-[#0D1B35]">Exam method</CardTitle>
          <CardDescription>Choose the real workflow students and teachers will use.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXAM_CATS.map((c) => {
            const Icon = iconMap[c.id];
            const active = state.uiCategory === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  clearFieldError('uiCategory');
                  onSelectCategory(c.id);
                }}
                className={cn(
                  'min-h-36 rounded-lg border bg-white p-4 text-left transition-all hover:border-[#C8A96E] hover:bg-[#FBF4E6]/60',
                  active && 'border-[#0D1B35] bg-[#0D1B35]/[0.04] shadow-[0_0_0_3px_rgba(13,27,53,0.06)]',
                  err('uiCategory') && !state.uiCategory && 'ring-2 ring-rose-200',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700',
                      active && 'border-[#0D1B35] bg-[#0D1B35] text-[#E2C98A]',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    {c.bestFor}
                  </span>
                </div>
                <div className="mt-3 font-semibold text-slate-900">{c.name}</div>
                <p className="mt-1 text-[11px] leading-snug text-slate-600">{c.desc}</p>
              </button>
            );
          })}
        </CardContent>
        {err('uiCategory') ? <p className="px-6 pb-2 text-xs text-rose-600">Select an exam category.</p> : null}
      </Card>

      {state.uiCategory && state.uiCategory !== 'OMRB' && state.uiCategory !== 'OFFLINE_RESULT' && state.uiCategory !== 'CQ' && state.uiCategory !== 'MCQCQ' && (
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

      {(state.uiCategory === 'CQ' || state.uiCategory === 'MCQCQ' || state.uiCategory === 'OFFLINE_RESULT') ? (
        <Card className="border-slate-200 bg-slate-50/70 shadow-sm">
          <CardContent className="grid gap-3 p-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Submission</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {state.uiCategory === 'OFFLINE_RESULT' ? 'Teacher result entry' : 'Student camera/PDF upload'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Evaluation</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {state.uiCategory === 'OFFLINE_RESULT' ? 'Physical script marked offline' : 'Teacher reviewed written marks'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Result input</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {state.uiCategory === 'OFFLINE_RESULT' ? 'Single, bulk manual, Excel' : 'MCQ auto + written finalize'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

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
                  dispatch({
                    type: 'MERGE',
                    patch: {
                      courseId: v,
                      additionalCourseIds: state.additionalCourseIds.filter((id) => id !== v),
                    },
                  });
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
              <Label>Additional Courses</Label>
              <div className="max-h-40 overflow-auto rounded-md border border-slate-200 bg-white p-2">
                {courses.filter((course) => course.id !== state.courseId).map((course) => {
                  const checked = state.additionalCourseIds.includes(course.id);
                  return (
                    <label key={course.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          const next = value
                            ? [...state.additionalCourseIds, course.id]
                            : state.additionalCourseIds.filter((id) => id !== course.id);
                          dispatch({ type: 'MERGE', patch: { additionalCourseIds: [...new Set(next)] } });
                        }}
                      />
                      <span className="truncate font-medium text-slate-700">{course.name}</span>
                    </label>
                  );
                })}
                {courses.filter((course) => course.id !== state.courseId).length === 0 ? (
                  <p className="px-2 py-3 text-sm text-slate-400">No additional courses available.</p>
                ) : null}
              </div>
              <p className="text-[11px] text-slate-500">
                Students enrolled in the primary course or any selected additional course can access this exam.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Branch (optional)</Label>
              <Select
                value={state.branchId || EXAM_WIZARD_ALL_BRANCHES}
                onValueChange={(v) => {
                  dispatch({ type: 'MERGE', patch: { branchId: v } });
                }}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Branch scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EXAM_WIZARD_ALL_BRANCHES}>All branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
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
            <div className="md:col-span-2 space-y-2">
              <Label>Syllabus</Label>
              <Textarea
                value={state.syllabusHtml}
                onChange={(e) => dispatch({ type: 'MERGE', patch: { syllabusHtml: e.target.value } })}
                placeholder="Physics: Motion, Force, Work; Chemistry: Atomic structure..."
                className="min-h-24 border-slate-200"
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
                    onCheckedChange={(checked) =>
                      dispatch({ type: 'MERGE', patch: { autoSubmitOnDisconnect: checked } })
                    }
                  />
                </div>
                {state.autoSubmitOnDisconnect ? (
                  <div className="mt-3 max-w-40 space-y-2">
                    <Label>Grace seconds</Label>
                    <Input
                      type="number"
                      min={5}
                      value={state.disconnectGraceSeconds}
                      onChange={(e) => dispatch({ type: 'MERGE', patch: { disconnectGraceSeconds: e.target.value } })}
                      className="border-slate-200"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
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

      {state.uiCategory && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-base text-[#0D1B35]">Import config</CardTitle>
            <CardDescription>
              Copy category, delivery, duration, language, sets, shuffle/naming, result visibility, sections (or
              multi-subject rules) from an existing exam in the same course. Branch, title, questions, attempts, and
              results are not copied. Use Save Draft to persist.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1 space-y-2">
              <Label>Source exam</Label>
              <Select
                value={importPick || '_none'}
                onValueChange={(v) => setImportPick(v === '_none' ? '' : v)}
                disabled={!state.courseId}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder={state.courseId ? 'Select source…' : 'Select a course first'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Select source exam…</SelectItem>
                  {importSourceExams.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="shrink-0"
              disabled={!importPick || importBusy}
              onClick={() => {
                if (importPick) onImportFromExam(importPick);
              }}
            >
              {importBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Apply import
            </Button>
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
