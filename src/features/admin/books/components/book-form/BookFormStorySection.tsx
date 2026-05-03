import type { Dispatch, SetStateAction } from 'react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type { CreateBookDto, UpdateBookDto } from '@/lib/api/books';
import { PenSquare } from 'lucide-react';
import { BookFormField } from './BookFormField';
import { BookFormSectionCard } from './BookFormSectionCard';

export function BookFormStorySection({
  form,
  setForm,
  safeDescriptionPreview,
}: {
  form: CreateBookDto | UpdateBookDto;
  setForm: Dispatch<SetStateAction<CreateBookDto | UpdateBookDto>>;
  safeDescriptionPreview: string;
}) {
  return (
    <BookFormSectionCard
      tone="violet"
      icon={PenSquare}
      title="Storefront story"
      subtitle="Rich text shoppers see on the public book page."
    >
      <BookFormField label="Description" hint="Headings, bullets, and emphasis are supported.">
        <RichTextEditor
          value={form.description || ''}
          onChange={(value) => setForm((p) => ({ ...p, description: value }))}
          placeholder="Who it is for, what is inside, delivery or access notes…"
          className="min-h-[220px] rounded-xl border border-border/80 bg-background/80 shadow-inner dark:border-border"
        />
      </BookFormField>
      {safeDescriptionPreview ? (
        <div className="rounded-xl border border-dashed border-violet-200/60 bg-violet-50/40 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Live render preview</p>
          <div
            className="prose prose-sm max-w-none text-foreground dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: safeDescriptionPreview }}
          />
        </div>
      ) : null}
    </BookFormSectionCard>
  );
}
