'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ExamWizardState, FolderRuleDraft } from '../../types';
import type { FolderCounts } from '../wizardHelpers';
import { folderCapacityForType } from '../wizardHelpers';

type LeafLookup = { id: string; path: string; q: number }[];

export interface SectionLike {
  localId: string;
  label: string;
  count: number;
  marks: number;
  neg: number;
  type: 'MCQ' | 'CQ' | 'SHORT';
  folderRules: FolderRuleDraft[];
}

interface Props {
  /** Optional title — defaults to a step-wide heading. */
  title?: string;
  sections: SectionLike[];
  leaves: LeafLookup;
  rollupCounts: Map<string, FolderCounts>;
  state: ExamWizardState;
  className?: string;
}

function formatSignedMark(value: number): string {
  if (!value) return '0';
  return value > 0 ? `-${value}` : String(value);
}

/**
 * "Selected folders summary" card — mirrors the spec mock so admins see
 * exactly what the random pull will produce before they hit Finalize.
 *
 * Used both at the top of Step 3 (aggregated across all sections / subjects)
 * and inside each section card (single section view).
 */
export function SelectedFoldersSummary({ title = 'Selected folders', sections, leaves, rollupCounts, state, className }: Props) {
  const allRows = sections.flatMap((section) =>
    section.folderRules.map((rule) => {
      const leaf = leaves.find((l) => l.id === rule.folderId);
      const counts = rollupCounts.get(rule.folderId);
      const available = folderCapacityForType(counts, section.type);
      const fits = available >= rule.questionCount;
      return {
        sectionLabel: section.label || section.type,
        sectionType: section.type,
        path: leaf?.path ?? rule.folderName ?? rule.folderId,
        requested: rule.questionCount,
        available,
        fits,
        marks: section.marks,
        neg: section.neg,
      };
    }),
  );

  const totalRequested = allRows.reduce((sum, row) => sum + row.requested, 0);
  const totalMarks = sections.reduce((sum, s) => sum + s.count * (s.marks || 0), 0);
  const negsList = [...new Set(sections.filter((s) => s.neg > 0).map((s) => s.neg))];
  const negativeLabel = negsList.length
    ? negsList.map((n) => `${formatSignedMark(n)} per wrong`).join(' · ')
    : 'No negative marking';
  const sectionTargets = sections.reduce((sum, s) => sum + s.count, 0);
  const allocationDelta = totalRequested - sectionTargets;
  const omrTarget = state.omrConfig?.questionCount ?? null;
  const omrParityOk = omrTarget == null ? true : sectionTargets === omrTarget;

  if (allRows.length === 0) {
    return (
      <Card className={cn('border-dashed border-slate-200 bg-slate-50/60 shadow-none', className)}>
        <CardHeader className="space-y-1 py-3">
          <CardTitle className="text-sm font-semibold text-[#0D1B35]">{title}</CardTitle>
          <CardDescription className="text-xs">
            Pick folders from the tree on the left. Each folder lets you pull a fixed count or all available questions.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn('border-slate-200 shadow-sm', className)}>
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="font-serif text-base text-[#0D1B35]">{title}</CardTitle>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              {allRows.length} folder{allRows.length === 1 ? '' : 's'}
            </Badge>
            <Badge
              variant={allocationDelta === 0 ? 'secondary' : 'destructive'}
              className="text-[10px]"
            >
              {totalRequested}/{sectionTargets} questions
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-hidden rounded-md border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Folder</th>
                <th className="px-3 py-2">Section</th>
                <th className="px-3 py-2 text-right">Pull</th>
                <th className="px-3 py-2 text-right">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allRows.map((row, idx) => (
                <tr key={`${row.path}-${idx}`}>
                  <td className="px-3 py-2 align-top">
                    <div className="flex items-center gap-1.5">
                      {row.fits ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                      )}
                      <span className="font-medium text-slate-800">{row.path}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-500">
                    {row.sectionLabel}
                    <span className="text-slate-400"> · {row.sectionType}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">{row.requested}</td>
                  <td
                    className={cn(
                      'px-3 py-2 text-right font-semibold',
                      row.fits ? 'text-slate-600' : 'text-rose-600',
                    )}
                  >
                    {row.available}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-md border border-slate-100 bg-slate-50/60 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Questions</p>
            <p className="mt-1 text-xl font-black text-[#0D1B35]">
              {totalRequested}
              <span className="ml-1 text-xs font-semibold text-slate-400">/ {sectionTargets}</span>
            </p>
          </div>
          <div className="rounded-md border border-slate-100 bg-slate-50/60 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Marks</p>
            <p className="mt-1 text-xl font-black text-[#0D1B35]">{totalMarks}</p>
          </div>
          <div className="rounded-md border border-slate-100 bg-slate-50/60 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Negative Marking</p>
            <p className="mt-1 text-sm font-bold text-slate-700">{negativeLabel}</p>
          </div>
        </div>

        {omrTarget != null ? (
          <div
            className={cn(
              'flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-[11px] font-semibold',
              omrParityOk
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-900',
            )}
          >
            <span>
              OMR sheet expects {omrTarget} questions; sections total {sectionTargets}.
            </span>
            <Badge variant={omrParityOk ? 'secondary' : 'destructive'} className="text-[10px]">
              {omrParityOk ? 'In sync' : 'Mismatch'}
            </Badge>
          </div>
        ) : null}

        {allocationDelta !== 0 ? (
          <p className="rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900">
            Section targets total {sectionTargets} but {totalRequested} are allocated. Adjust per-folder pulls before
            generating.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
