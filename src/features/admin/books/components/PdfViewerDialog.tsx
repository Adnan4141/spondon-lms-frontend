'use client';

import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink, Maximize2 } from 'lucide-react';
import { BookAdminModal } from './BookAdminModal';

export function PdfViewerDialog({
  isOpen,
  onClose,
  bookName,
  fileUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  bookName: string;
  fileUrl?: string | null;
}) {
  return (
    <BookAdminModal
      open={isOpen}
      onClose={onClose}
      title={bookName}
      subtitle="Preview the uploaded PDF or sample asset in a responsive viewer."
      maxWidth="max-w-5xl"
      bodyClassName="flex h-[78vh] flex-col bg-white p-0"
      contentClassName="h-[92vh]"
    >
        {fileUrl ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">{bookName}</p>
                <p className="text-xs text-muted-foreground">PDF read/demo preview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="rounded-xl">
                <a href={fileUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </a>
              </Button>
              <Button asChild size="sm" className="rounded-xl">
              <a href={fileUrl} target="_blank" rel="noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
            </div>
          </div>
        ) : null}
        {fileUrl ? (
          <div className="relative flex min-h-0 flex-1 bg-slate-100">
            <iframe title={bookName} src={`${fileUrl}#toolbar=1&navpanes=0`} className="h-full w-full flex-1 border-0 bg-white" />
          </div>
        ) : (
          <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 bg-white text-muted-foreground">
            <div className="rounded-full bg-muted p-4">
              <Maximize2 className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium">No PDF available for preview.</p>
            <p className="max-w-sm text-center text-xs text-muted-foreground">Upload a PDF in the Add/Edit Book modal to enable read/demo preview from the catalog.</p>
          </div>
        )}
    </BookAdminModal>
  );
}
