import { ClipboardList } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Exam } from '@/types/exam';
import { ExamDraftListItem } from './ExamDraftListItem';

type ExamDraftCardProps = {
  exams: Exam[];
  loading: boolean;
  onDelete: (exam: Exam) => void;
};

export function ExamDraftCard({ exams, loading, onDelete }: ExamDraftCardProps) {
  return (
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
            {exams.map((exam) => (
              <ExamDraftListItem key={exam.id} exam={exam} onDelete={onDelete} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
