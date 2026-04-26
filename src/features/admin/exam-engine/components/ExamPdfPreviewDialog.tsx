'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getExamPdfDownloadUrl } from '@/lib/api/exams';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  pdfUrl: string | null | undefined;
};

export function ExamPdfPreviewDialog({ open, onOpenChange, title, pdfUrl }: Props) {
  const src = pdfUrl ? getExamPdfDownloadUrl(pdfUrl) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-7xl flex-col gap-2 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-[#0D1B35]">{title}</DialogTitle>
        </DialogHeader>
        {src ? (
          <iframe
            title="PDF preview"
            src={src}
            className="min-h-[70vh] w-full flex-1 rounded-md border border-slate-200 bg-slate-50"
          />
        ) : (
          <p className="py-12 text-center text-sm text-slate-500">No PDF URL yet. Generate a set or master PDF first.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
