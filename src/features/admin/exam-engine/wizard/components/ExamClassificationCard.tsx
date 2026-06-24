'use client';

import {
  BookOpen,
  Building2,
  CalendarClock,
  FileText,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ExamType } from '@/types/exam';
import type { ExamWizardState } from '../../types';
import { EXAM_TYPE_OPTIONS } from '../../types';
import type { WizardFormAction } from '../examWizardReducer';

type Props = {
  state: ExamWizardState;
  dispatch: React.Dispatch<WizardFormAction>;
  allowedExamTypes?: ExamType[];
};

const CATEGORY_META: Record<
  ExamType,
  { icon: LucideIcon; tag: string; activeClass: string; iconActiveClass: string }
> = {
  MODEL: {
    icon: FileText,
    tag: 'Mock',
    activeClass: 'border-indigo-300 bg-indigo-50/80 text-indigo-950 shadow-[0_0_0_3px_rgba(99,102,241,0.08)]',
    iconActiveClass: 'border-indigo-400 bg-indigo-600 text-white',
  },
  PRACTICE: {
    icon: BookOpen,
    tag: 'Drill',
    activeClass: 'border-emerald-300 bg-emerald-50/80 text-emerald-950 shadow-[0_0_0_3px_rgba(16,185,129,0.08)]',
    iconActiveClass: 'border-emerald-500 bg-emerald-600 text-white',
  },
  SCHEDULED: {
    icon: CalendarClock,
    tag: 'Formal',
    activeClass: 'border-sky-300 bg-sky-50/80 text-sky-950 shadow-[0_0_0_3px_rgba(14,165,233,0.08)]',
    iconActiveClass: 'border-sky-500 bg-sky-600 text-white',
  },
  TALENT_HUNT: {
    icon: Trophy,
    tag: 'Stages',
    activeClass: 'border-fuchsia-300 bg-fuchsia-50/80 text-fuchsia-950 shadow-[0_0_0_3px_rgba(217,70,239,0.08)]',
    iconActiveClass: 'border-fuchsia-500 bg-fuchsia-600 text-white',
  },
  UNIVERSITY: {
    icon: Building2,
    tag: 'Admission',
    activeClass: 'border-amber-300 bg-amber-50/80 text-amber-950 shadow-[0_0_0_3px_rgba(245,158,11,0.08)]',
    iconActiveClass: 'border-amber-500 bg-amber-600 text-white',
  },
};

export function ExamClassificationFields({ state, dispatch, allowedExamTypes }: Props) {
  const typeOptions = allowedExamTypes
    ? EXAM_TYPE_OPTIONS.filter((opt) => allowedExamTypes.includes(opt.id))
    : EXAM_TYPE_OPTIONS;
  const currentTypeMissing = !typeOptions.some((opt) => opt.id === state.examType);
  const displayTypeOptions = currentTypeMissing
    ? [
        ...typeOptions,
        EXAM_TYPE_OPTIONS.find((opt) => opt.id === state.examType)!,
      ].filter(Boolean)
    : typeOptions;

  const selectCategory = (examType: ExamType) => {
    if (allowedExamTypes && !allowedExamTypes.includes(examType)) return;
    dispatch({
      type: 'MERGE',
      patch: {
        examType,
        ...(examType !== 'UNIVERSITY' ? { universityName: '' } : {}),
      },
    });
  };

  const activeOption = EXAM_TYPE_OPTIONS.find((opt) => opt.id === state.examType);

  return (
    <div className="md:col-span-2 space-y-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Exam category</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Pick how this exam is classified — badges, scheduling, and post-publish setup depend on it.
          </p>
        </div>
        {activeOption ? (
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            {activeOption.label}
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          'grid gap-2',
          displayTypeOptions.length <= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3',
        )}
        role="radiogroup"
        aria-label="Exam category"
      >
        {displayTypeOptions.map((opt) => {
          const meta = CATEGORY_META[opt.id];
          const Icon = meta.icon;
          const active = state.examType === opt.id;
          const disabled = Boolean(allowedExamTypes && !allowedExamTypes.includes(opt.id));

          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => selectCategory(opt.id)}
              className={cn(
                'rounded-xl border bg-white p-3 text-left transition-all',
                disabled
                  ? 'cursor-not-allowed border-slate-100 opacity-50'
                  : 'cursor-pointer hover:border-[#C8A96E]/70 hover:bg-[#FBF4E6]/40',
                active ? meta.activeClass : 'border-slate-200 text-slate-800',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600',
                    active && meta.iconActiveClass,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  {meta.tag}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold leading-tight text-slate-900">{opt.label}</p>
              <p className="mt-1 text-[11px] leading-snug text-slate-500">{opt.description}</p>
            </button>
          );
        })}
      </div>

      {state.examType === 'UNIVERSITY' ? (
        <div className="space-y-2 rounded-lg border border-amber-200/80 bg-white p-3">
          <Label>University / institution name</Label>
          <Input
            value={state.universityName}
            onChange={(event) => dispatch({ type: 'MERGE', patch: { universityName: event.target.value } })}
            placeholder="e.g. Dhaka University"
            className="border-slate-200 bg-white"
          />
          <p className="text-[11px] text-slate-500">Shown on the paper header and student-facing exam page.</p>
        </div>
      ) : null}

      {state.examType === 'TALENT_HUNT' ? (
        <div className="rounded-lg border border-fuchsia-200 bg-fuchsia-50/60 px-3 py-2.5 text-xs leading-relaxed text-fuchsia-900">
          After saving, open <strong>Exam details → Talent hunt</strong> to add stages, cutoffs, and prizes.
        </div>
      ) : null}
    </div>
  );
}
