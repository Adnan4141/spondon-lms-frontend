import type { Dispatch, SetStateAction } from 'react';
import { Label } from '@/components/ui/label';
import type { Book } from '@/lib/api/books';
import { FileText, ImagePlus } from 'lucide-react';
import { BookFormFileDropZone } from './BookFormFileDropZone';
import { BookFormSectionCard } from './BookFormSectionCard';

export function BookFormMediaSection({
  book,
  isEbook,
  thumbnail,
  setThumbnail,
  file,
  setFile,
  demoFile,
  setDemoFile,
}: {
  book?: Book | null;
  isEbook: boolean;
  thumbnail: File | null;
  setThumbnail: Dispatch<SetStateAction<File | null>>;
  file: File | null;
  setFile: Dispatch<SetStateAction<File | null>>;
  demoFile: File | null;
  setDemoFile: Dispatch<SetStateAction<File | null>>;
}) {
  return (
    <BookFormSectionCard
      tone="sky"
      icon={ImagePlus}
      title="Media & files"
      subtitle="Cover image, optional public sample PDF, and the protected ebook file when this is digital."
    >
      <div className={isEbook ? 'grid gap-5 lg:grid-cols-3' : 'grid gap-5 sm:grid-cols-2'}>
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground">
            {book?.thumbnailUrl ? 'Replace cover image' : 'Cover image'}
          </Label>
          <BookFormFileDropZone
            id="book-cover-input"
            accept="image/*"
            label="Upload cover"
            sub="PNG or JPG · cards & hero"
            selectedName={thumbnail?.name}
            onFile={setThumbnail}
          />
          {book?.thumbnailUrl && !thumbnail ? (
            <p className="text-[11px] text-muted-foreground">Current cover stays until you choose a new image.</p>
          ) : null}
        </div>
        {isEbook ? (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">{book?.fileUrl ? 'Replace PDF' : 'PDF / e-book'}</Label>
              <BookFormFileDropZone
                id="book-pdf-input"
                accept="application/pdf,.pdf"
                label="Upload PDF"
                sub="Reader access & admin preview"
                selectedName={file?.name}
                onFile={setFile}
              />
              <p className="text-[11px] text-muted-foreground">
                {book?.fileUrl && !file ? 'Existing file is kept until you upload a replacement.' : null}
              </p>
            </div>
        ) : null}

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground">
            {book?.demoReadUrl ? 'Replace sample PDF' : 'Sample PDF (optional)'}
          </Label>
          <BookFormFileDropZone
            id="book-demo-pdf-input"
            accept="application/pdf,.pdf"
            label="Upload sample PDF"
            sub="Public book details preview"
            selectedName={demoFile?.name}
            onFile={setDemoFile}
          />
          <div className="flex items-start gap-2 rounded-2xl border border-dashed border-sky-200/70 bg-sky-50/60 px-3 py-3 text-[11px] text-muted-foreground dark:border-sky-900/50 dark:bg-sky-950/20">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-sky-600/70 dark:text-sky-300/70" />
            <div>
              This optional PDF is used for the public preview. For ebooks, the protected full PDF stays separate.
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {book?.demoReadUrl && !demoFile ? 'Existing sample stays active until you upload a replacement.' : null}
          </p>
        </div>
      </div>
    </BookFormSectionCard>
  );
}
