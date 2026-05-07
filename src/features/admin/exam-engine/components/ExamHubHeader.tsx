import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ExamHubHeader() {
  return (
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
  );
}
