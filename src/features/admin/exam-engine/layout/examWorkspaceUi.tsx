'use client';

import type { ElementType, ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Shared width shell for all /admin/exam/[examId]/* routes (wide tables, OMR, wizard). */
export const examWorkspaceHeaderClass = cn(
  'mx-auto w-full max-w-full min-w-0 px-4 sm:px-6',
);
export const examWorkspaceMainClass = cn(
  'mx-auto w-full max-w-full min-w-0 px-4 py-6 sm:px-6',
);
export const examWorkspacePageClass = cn('w-full max-w-full min-w-0 space-y-6');

export function sectionMarks(s: { questionCount?: number | null; marksPerQuestion?: number | string | null }): number {
  return (s.questionCount || 0) * Number(s.marksPerQuestion ?? 1);
}

export function StatTile({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: string | number;
  tone?: 'slate' | 'emerald' | 'amber' | 'rose' | 'blue';
}) {
  const tones = {
    slate: 'border-slate-200 bg-white text-slate-950',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
  };
  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

export function ReadinessRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-slate-100 bg-white px-3 py-2 text-sm">
      <CheckCircle2 className={`mt-0.5 h-4 w-4 ${ok ? 'text-emerald-600' : 'text-amber-600'}`} />
      <div>
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

export function WorkflowCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ElementType;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-start gap-3">
        <span className="rounded-md border border-slate-200 bg-white p-2 text-slate-700">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="font-semibold text-slate-950">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function DisabledReason({ children }: { children: string }) {
  return <span className="ml-1 text-[11px] font-semibold text-slate-400">({children})</span>;
}
