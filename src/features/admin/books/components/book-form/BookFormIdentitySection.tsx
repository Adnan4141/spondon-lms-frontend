import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Book, BookCategory, CreateBookDto, UpdateBookDto } from '@/lib/api/books';
import type { Program } from '@/lib/api/programs';
import { BookOpen } from 'lucide-react';
import { BookFormField } from './BookFormField';
import { BookFormSectionCard } from './BookFormSectionCard';
import { bookDateToPickerDate } from './utils';

export function BookFormIdentitySection({
  mode,
  book,
  form,
  setForm,
  categories,
  programs,
  publishedAt,
  setPublishedAt,
}: {
  mode: 'create' | 'edit';
  book?: Book | null;
  form: CreateBookDto | UpdateBookDto;
  setForm: Dispatch<SetStateAction<CreateBookDto | UpdateBookDto>>;
  categories: BookCategory[];
  programs: Program[];
  publishedAt: Date | undefined;
  setPublishedAt: Dispatch<SetStateAction<Date | undefined>>;
}) {
  const catalogListed = mode === 'edit' && book?.createdAt ? bookDateToPickerDate(book.createdAt) : undefined;

  return (
    <BookFormSectionCard
      tone="indigo"
      icon={BookOpen}
      title="Identity & placement"
      subtitle="Title, SKU, category, and optional program — what shoppers and staff search on."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <BookFormField label="Title" className="sm:col-span-2">
          <Input
            value={form.name || ''}
            placeholder="e.g. HSC Physics — 1st Paper"
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="h-11 rounded-xl border-border/80 bg-background/80 text-base shadow-sm"
          />
        </BookFormField>
        <BookFormField label="SKU" hint="Letters & numbers; we uppercase as you type.">
          <Input
            value={form.sku || ''}
            placeholder="PHY-HSC-01"
            onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value.toUpperCase() }))}
            className="h-11 rounded-xl border-border/80 bg-background/80 font-mono text-sm shadow-sm"
          />
        </BookFormField>
        <BookFormField label="Author / team" optional>
          <Input
            value={form.author || ''}
            placeholder="Publisher or lead author"
            onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))}
            className="h-11 rounded-xl border-border/80 bg-background/80 shadow-sm"
          />
        </BookFormField>
        <BookFormField label="Category" hint="Shelf for the public catalog.">
          <Select
            value={form.categoryId ?? '__none__'}
            onValueChange={(value) => setForm((p) => ({ ...p, categoryId: value === '__none__' ? undefined : value }))}
          >
            <SelectTrigger className="h-11 rounded-xl border-border/80 bg-background/80 shadow-sm">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Uncategorized</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </BookFormField>
        <BookFormField label="Program" optional hint="Internal grouping when linked to a program.">
          <Select
            value={form.programId ?? '__none__'}
            onValueChange={(value) => setForm((p) => ({ ...p, programId: value === '__none__' ? undefined : value }))}
          >
            <SelectTrigger className="h-11 rounded-xl border-border/80 bg-background/80 shadow-sm">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </BookFormField>
        <BookFormField
          label="Publication / edition date"
          optional
          hint="Stored on the book record for catalog context (date only)."
          className="sm:col-span-2"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <DatePicker
              date={publishedAt}
              setDate={setPublishedAt}
              placeholder="Pick a date"
              className="h-11 rounded-xl border-border/80 bg-background/80 shadow-sm"
            />
            {publishedAt ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 rounded-xl text-muted-foreground"
                onClick={() => setPublishedAt(undefined)}
              >
                Clear date
              </Button>
            ) : null}
          </div>
        </BookFormField>
        {mode === 'edit' && book?.createdAt ? (
          <BookFormField label="Catalog listed since" hint="System record — read only." className="sm:col-span-2">
            <DatePicker
              date={catalogListed}
              setDate={() => {}}
              disabled
              placeholder="—"
              className="h-11 rounded-xl border-border/80 opacity-90"
            />
          </BookFormField>
        ) : null}
      </div>
    </BookFormSectionCard>
  );
}
