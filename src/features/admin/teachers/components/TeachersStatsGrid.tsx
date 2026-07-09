'use client';

import type { ComponentType } from 'react';
import { Ban, Building2, UserCheck, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Branch } from '@/lib/api/branches';
import type { User } from '@/lib/api/users';
import { cn } from '@/lib/utils';

type Tone = 'violet' | 'emerald' | 'rose' | 'sky';

const toneClass: Record<Tone, string> = {
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  sky: 'bg-sky-50 text-sky-700 ring-sky-100',
};

type TeachersStatsGridProps = {
  teachers: User[];
  branches: Branch[];
  loading?: boolean;
};

export function TeachersStatsGrid({ teachers, branches, loading }: TeachersStatsGridProps) {
  const active = teachers.filter((t) => t.status === 'ACTIVE').length;
  const blocked = teachers.filter((t) => t.status === 'BLOCKED').length;
  const assignedBranches = new Set(
    teachers.map((t) => t.branch?.id).filter((id): id is string => Boolean(id)),
  ).size;

  const rows: Array<{
    label: string;
    value: number | string;
    icon: ComponentType<{ className?: string }>;
    tone: Tone;
    hint: string;
  }> = [
    {
      label: 'Total Teachers',
      value: loading ? '…' : teachers.length,
      icon: Users,
      tone: 'violet',
      hint: 'On your roster',
    },
    {
      label: 'Active',
      value: loading ? '…' : active,
      icon: UserCheck,
      tone: 'emerald',
      hint: 'Can access portal',
    },
    {
      label: 'Blocked',
      value: loading ? '…' : blocked,
      icon: Ban,
      tone: 'rose',
      hint: 'Access restricted',
    },
    {
      label: 'Branches',
      value: loading ? '…' : `${assignedBranches}/${branches.length}`,
      icon: Building2,
      tone: 'sky',
      hint: 'Assigned / total',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {rows.map(({ label, value, icon: Icon, tone, hint }) => (
        <Card key={label} className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{hint}</p>
            </div>
            <div className={cn('rounded-2xl p-3 ring-1', toneClass[tone])}>
              <Icon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
