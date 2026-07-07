'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Loader2,
  Rocket,
  FileText,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExamStatus } from '@/types/exam';
import { cn } from '@/lib/utils';

export type LaunchPhase =
  | 'generate_paper'
  | 'generate_pdf'
  | 'ready_to_publish'
  | 'published'
  | 'closed';

export function resolveLaunchPhase(input: {
  examId?: string;
  status: ExamStatus | null;
  setCount?: number;
  pdfUrl?: string | null;
  publishOk: boolean;
}): LaunchPhase {
  if (input.status === 'CLOSED') return 'closed';
  if (input.status === 'PUBLISHED') return 'published';
  if (!input.setCount) return 'generate_paper';
  if (!input.pdfUrl) return 'generate_pdf';
  if (input.publishOk) return 'ready_to_publish';
  return 'generate_pdf';
}

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  hint?: string;
};

export function buildLaunchChecklist(input: {
  examId?: string;
  status: ExamStatus | null;
  setCount?: number;
  pdfUrl?: string | null;
  omrEnabled: boolean;
  isPublished: boolean;
}): ChecklistItem[] {
  const items: ChecklistItem[] = [
    {
      id: 'saved',
      label: 'Exam settings saved',
      done: Boolean(input.examId),
      hint: input.examId ? undefined : 'Save once to create the exam record',
    },
    {
      id: 'sets',
      label: 'Questions pulled from bank',
      done: Boolean(input.setCount && input.setCount > 0),
      hint: 'Generates shuffled sets from your folder rules',
    },
    {
      id: 'pdf',
      label: 'Master question paper PDF',
      done: Boolean(input.pdfUrl),
      hint: 'Created automatically when you generate the paper',
    },
    {
      id: 'publish',
      label: 'Published for students',
      done: input.isPublished,
      hint: 'Students can attempt when schedule & enrollment allow',
    },
  ];

  if (input.omrEnabled) {
    items.push({
      id: 'omr',
      label: 'Hall OMR sheets (offline)',
      done: false,
      hint: 'Optional before exam day — print from Advanced → Print & downloads',
    });
  }

  return items;
}

type Props = {
  phase: LaunchPhase;
  checklist: ChecklistItem[];
  primaryBusy: boolean;
  secondaryBusy: boolean;
  publishBlocker?: string;
  onPrimary: () => void;
  onSaveSettings: () => void;
  /** Admin workspace link after publish (not the student portal). */
  overviewHref?: string;
};

function primaryLabel(phase: LaunchPhase): string {
  switch (phase) {
    case 'generate_paper':
      return 'Generate question paper';
    case 'generate_pdf':
      return 'Generate question paper PDF';
    case 'ready_to_publish':
      return 'Publish to students';
    case 'published':
      return 'Open exam overview';
    case 'closed':
      return 'Exam closed';
    default:
      return 'Continue';
  }
}

export function Step6LaunchPanel({
  phase,
  checklist,
  primaryBusy,
  secondaryBusy,
  publishBlocker,
  onPrimary,
  onSaveSettings,
  overviewHref,
}: Props) {
  const isPublished = phase === 'published';
  const isClosed = phase === 'closed';
  const showSecondary = !isPublished && !isClosed;
  const primaryDisabled =
    primaryBusy || isClosed || (phase === 'ready_to_publish' && Boolean(publishBlocker));

  return (
    <Card className="border-[#C8A96E]/40 bg-gradient-to-br from-[#FBF4E6]/80 to-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-serif text-lg text-[#0D1B35]">
          <Rocket className="h-5 w-5 text-[#7A6035]" />
          Launch checklist
        </CardTitle>
        <CardDescription>
          One primary action at a time — generate the paper first, then publish when every required step is green.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-2">
          {checklist.map((item, index) => (
            <li
              key={item.id}
              className={cn(
                'flex gap-3 rounded-lg border px-3 py-2.5 text-sm',
                item.done
                  ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                  : 'border-slate-200 bg-white text-slate-700',
              )}
            >
              <span className="mt-0.5 shrink-0">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
                ) : (
                  <Circle className="h-4 w-4 text-slate-300" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  <span className="mr-1.5 text-xs font-black text-slate-400">{index + 1}.</span>
                  {item.label}
                </p>
                {!item.done && item.hint ? (
                  <p className="mt-0.5 text-xs text-slate-500">{item.hint}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        {publishBlocker && phase === 'ready_to_publish' ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
            <span className="font-bold">Cannot publish yet:</span> {publishBlocker}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {isPublished && overviewHref ? (
            <Button asChild className="gap-2 bg-emerald-800 text-white hover:bg-emerald-900">
              <Link href={overviewHref}>
                <ExternalLink className="h-4 w-4" />
                Open exam overview
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              className="gap-2 bg-gradient-to-br from-[#0D1B35] to-[#1E2F55] text-[#E2C98A] hover:opacity-95"
              disabled={primaryDisabled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPrimary();
              }}
            >
              {primaryBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : phase === 'ready_to_publish' ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {primaryLabel(phase)}
            </Button>
          )}

          {showSecondary ? (
            <Button
              type="button"
              variant="outline"
              disabled={secondaryBusy || primaryBusy}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSaveSettings();
              }}
            >
              {secondaryBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save settings only
            </Button>
          ) : null}

          {isPublished ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Live for students
            </span>
          ) : null}
          {isClosed ? (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
              Closed
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
