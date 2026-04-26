'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ClipboardList, BarChart3, LayoutList, Pencil, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getExams } from '@/lib/api/exams';
import type { Exam } from '@/types/exam';

export function ExamHub() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExams({ limit: 50, status: 'DRAFT' })
      .then((r) => {
        if (r.success && r.data) setExams(r.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto space-y-8 px-4 py-8 sm:px-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-normal tracking-tight text-[#0D1B35] md:text-3xl">Exam engine</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Create exams with the guided wizard, folder pools, and per-question exclude / pin controls. Open details for
            PDFs, leaderboard, and analytics after save.
          </p>
        </div>
        <Button asChild className="bg-[#0D1B35] text-[#E2C98A] hover:bg-[#1E2F55]">
          <Link href="/admin/exam/new" className="gap-2">
            <Plus className="h-4 w-4" /> New exam
          </Link>
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2 border-b border-slate-100 bg-[#FBF4E6]/50">
          <ClipboardList className="h-5 w-5 text-[#8B6700]" />
          <div>
            <CardTitle className="font-serif text-lg text-[#0D1B35]">Draft exams</CardTitle>
            <CardDescription>Details, PDFs, and rankings are available per exam after the first save.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-sm text-slate-500">Loading…</p>
          ) : exams.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">No draft exams yet. Create one to get started.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {exams.map((e) => (
                <li key={e.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{e.title}</p>
                    <p className="text-xs text-slate-500">
                      {e.course?.name ?? 'Course'} · {e.mode}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {e.status}
                    </Badge>
                    <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                      <Link href={`/admin/exam/${e.id}/details`} className="gap-1">
                        <LayoutList className="h-3.5 w-3.5" /> Details
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                      <Link href={`/admin/exam/${e.id}`} className="gap-1">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                      <Link href={`/admin/exam/${e.id}/pdf`} className="gap-1">
                        PDF
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                      <Link href={`/admin/exam/${e.id}/leaderboard`} className="gap-1">
                        <Trophy className="h-3.5 w-3.5" /> LB
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                      <Link href={`/admin/exam/${e.id}/results`} className="gap-1">
                        <BarChart3 className="h-3.5 w-3.5" /> Results
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
