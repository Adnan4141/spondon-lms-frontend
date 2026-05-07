import Link from 'next/link';
import { BarChart3, LayoutList, Pencil, Trash2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Exam } from '@/types/exam';

type ExamDraftListItemProps = {
  exam: Exam;
  onDelete: (exam: Exam) => void;
};

export function ExamDraftListItem({ exam, onDelete }: ExamDraftListItemProps) {
  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-900">{exam.title}</p>
        <p className="text-xs text-slate-500">
          {exam.course?.name ?? 'Course'} · {exam.mode}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-[10px] uppercase">
          {exam.status}
        </Badge>
        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
          <Link href={`/admin/exam/${exam.id}/details`} className="gap-1">
            <LayoutList className="h-3.5 w-3.5" /> Details
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
          <Link href={`/admin/exam/${exam.id}`} className="gap-1">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
          <Link href={`/admin/exam/${exam.id}/pdf`} className="gap-1">
            PDF
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
          <Link href={`/admin/exam/${exam.id}/leaderboard`} className="gap-1">
            <Trophy className="h-3.5 w-3.5" /> LB
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
          <Link href={`/admin/exam/${exam.id}/results`} className="gap-1">
            <BarChart3 className="h-3.5 w-3.5" /> Results
          </Link>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 border-rose-200 text-xs text-rose-700 hover:bg-rose-50"
          onClick={() => onDelete(exam)}
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>
    </li>
  );
}
