'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  createBook,
  updateBook,
  type Book,
  type BookCategory,
  type CreateBookDto,
  type UpdateBookDto,
} from '@/lib/api/books';
import type { Program } from '@/lib/api/programs';
import { sanitizeRichTextDisplayHtml } from '@/lib/sanitize-rich-text-display';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  FileText,
  ImagePlus,
  Loader2,
  Package,
  PenSquare,
  Sparkles,
  Tags,
  WalletCards,
} from 'lucide-react';
import { BookAdminModal } from './BookAdminModal';

function initialCreateState(): CreateBookDto {
  return {
    name: '',
    sku: '',
    price: 0,
    centralQty: 0,
    mrp: undefined,
    author: '',
    description: '',
    isEbook: false,
    featured: false,
    programId: undefined,
    categoryId: undefined,
  };
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6 dark:border-border dark:bg-card',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BookFormDialog({
  isOpen,
  onClose,
  onSuccess,
  mode,
  book,
  categories,
  programs,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  mode: 'create' | 'edit';
  book?: Book | null;
  categories: BookCategory[];
  programs: Program[];
}) {
  const toast = useAdminToast();
  const [form, setForm] = useState<CreateBookDto | UpdateBookDto>(initialCreateState());
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('identity');

  useEffect(() => {
    if (mode === 'edit' && book) {
      setForm({
        name: book.name,
        sku: book.sku,
        price: Number(book.price),
        centralQty: Number(book.centralQty || 0),
        mrp: book.mrp ? Number(book.mrp) : undefined,
        author: book.author || '',
        description: book.description || '',
        isEbook: book.isEbook,
        featured: Boolean(book.featured),
        programId: book.programId || null,
        categoryId: book.categoryId || null,
      });
    } else {
      setForm(initialCreateState());
    }
    setFile(null);
    setThumbnail(null);
    setThumbnailPreview(null);
    setActiveTab('identity');
  }, [mode, book, isOpen]);

  useEffect(() => {
    if (!thumbnail) {
      setThumbnailPreview(null);
      return;
    }
    const url = URL.createObjectURL(thumbnail);
    setThumbnailPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnail]);

  const current = form as CreateBookDto;
  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const selectedProgram = programs.find((p) => p.id === form.programId);
  const coverUrl = thumbnailPreview || book?.thumbnailUrl || null;
  const isEbook = Boolean(form.isEbook);
  const price = Number(form.price || 0);
  const mrp = form.mrp == null ? null : Number(form.mrp);
  const stockLabel = isEbook ? 'Digital — no warehouse qty' : `${Number(form.centralQty || 0).toLocaleString()} central units`;
  const safeDescriptionPreview = sanitizeRichTextDisplayHtml(form.description || '');

  const formCompletion = useMemo(() => {
    const checks = [
      Boolean(current.name?.trim()),
      Boolean(current.sku?.trim()),
      price >= 0,
      Boolean(form.categoryId),
      Boolean(form.description?.trim()),
      Boolean(coverUrl),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [coverUrl, current.name, current.sku, form.categoryId, form.description, price]);

  const handleSubmit = async () => {
    if (!current.name?.trim() || !current.sku?.trim()) {
      toast({ title: 'Missing fields', description: 'Book name and SKU are required.', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      toast({ title: 'Invalid price', description: 'Price must be zero or greater.', variant: 'destructive' });
      return;
    }
    if (mrp != null && mrp > 0 && mrp < price) {
      toast({
        title: 'Invalid MRP',
        description: 'MRP should be empty or greater than / equal to the selling price.',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      ...form,
      centralQty: isEbook ? 0 : Number(form.centralQty || 0),
    };

    try {
      setSubmitting(true);
      if (mode === 'create') {
        await createBook(payload as CreateBookDto, file || undefined, thumbnail || undefined);
      } else if (book) {
        await updateBook(book.id, payload as UpdateBookDto, file || undefined, thumbnail || undefined);
      }
      await onSuccess();
      toast({ title: mode === 'create' ? 'Book created' : 'Book updated', variant: 'success' });
      onClose();
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <DialogFooter className="shrink-0 border-t border-slate-200 bg-slate-50/95 px-4 py-4 backdrop-blur-sm sm:px-6 dark:border-border dark:bg-muted/40">
      <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center text-[11px] text-muted-foreground sm:text-left">
          {formCompletion}% checklist complete · unsaved changes lost if you close
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="rounded-xl" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" className="min-w-36 rounded-xl" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mode === 'create' ? 'Create book' : 'Save changes'}
          </Button>
        </div>
      </div>
    </DialogFooter>
  );

  return (
    <BookAdminModal
      open={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Add book' : 'Edit book'}
      subtitle={
        mode === 'create'
          ? 'Catalog entry for storefront, inventory, and course links.'
          : book?.name
            ? `Updating “${book.name}”`
            : 'Update catalog fields and assets.'
      }
      maxWidth="max-w-6xl"
      bodyClassName="bg-slate-50/80 p-0 dark:bg-background/80"
      footer={footer}
    >
      <div className="flex min-h-[min(560px,calc(92vh-11rem))] flex-col lg:grid lg:min-h-[520px] lg:grid-cols-[minmax(0,240px)_1fr]">
        {/* Live preview — desktop */}
        <aside className="hidden shrink-0 border-b border-slate-200 bg-linear-to-b from-slate-900 via-slate-900 to-slate-950 p-5 text-white lg:block lg:border-b-0 lg:border-r dark:border-border">
          <div className="sticky top-0 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live preview</span>
              <Badge variant="outline" className="border-white/20 bg-white/10 text-[10px] text-white">
                {formCompletion}%
              </Badge>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl">
              <div className="aspect-3/4 max-h-[280px]">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl font-black text-white/15">
                    {(form.name || 'B').slice(0, 1)}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="line-clamp-2 text-lg font-bold leading-snug">{form.name || 'Untitled'}</h4>
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{form.sku || '— no SKU —'}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge className="border-white/15 bg-white/10 text-[10px] text-white">{isEbook ? 'E-book' : 'Print'}</Badge>
              {selectedCategory ? (
                <Badge className="border-emerald-500/30 bg-emerald-500/15 text-[10px] text-emerald-200">
                  <Tags className="mr-1 h-3 w-3" />
                  {selectedCategory.name}
                </Badge>
              ) : null}
              {form.featured ? (
                <Badge className="border-amber-400/30 bg-amber-500/15 text-[10px] text-amber-100">Featured</Badge>
              ) : null}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Price</p>
              <p className="mt-1 text-2xl font-black">৳{price.toLocaleString()}</p>
              {mrp != null && mrp > price ? (
                <p className="text-xs text-slate-500 line-through">৳{mrp.toLocaleString()}</p>
              ) : null}
              <p className="mt-2 text-xs text-slate-400">{stockLabel}</p>
            </div>
            {selectedProgram ? (
              <p className="text-xs text-slate-400">
                Program: <span className="font-semibold text-slate-200">{selectedProgram.name}</span>
              </p>
            ) : null}
            {file ? (
              <div className="flex items-center gap-2 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2 py-1.5 text-[11px] text-cyan-100">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
            ) : null}
          </div>
        </aside>

        {/* Form */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Mobile preview strip */}
          <div className="flex items-center gap-3 border-b border-slate-200 bg-white p-3 lg:hidden dark:border-border dark:bg-card">
            <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg border bg-muted">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-black text-muted-foreground">
                  {(form.name || '?').slice(0, 1)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{form.name || 'Untitled book'}</p>
              <p className="text-[11px] text-muted-foreground">{form.sku || 'SKU required'}</p>
            </div>
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {formCompletion}%
            </Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2 sm:px-5 sm:pb-5 sm:pt-4">
            <TabsList className="mb-3 h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-white/90 p-1 shadow-sm dark:bg-card">
              <TabsTrigger value="identity" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm">
                <BookOpen className="h-3.5 w-3.5" />
                Identity
              </TabsTrigger>
              <TabsTrigger value="commerce" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm">
                <WalletCards className="h-3.5 w-3.5" />
                Commerce
              </TabsTrigger>
              <TabsTrigger value="story" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm">
                <PenSquare className="h-3.5 w-3.5" />
                Description
              </TabsTrigger>
              <TabsTrigger value="media" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm">
                <ImagePlus className="h-3.5 w-3.5" />
                Media
              </TabsTrigger>
            </TabsList>

            <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
              <TabsContent value="identity" className="mt-0 space-y-4 pb-4 data-[state=inactive]:hidden">
                <Panel>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Identity & placement</h3>
                      <p className="text-xs text-muted-foreground">Search, receipts, and public cards use these fields.</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Title *" className="sm:col-span-2">
                      <Input
                        value={form.name || ''}
                        placeholder="e.g. HSC Physics — 1st Paper"
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        className="h-11 rounded-xl"
                      />
                    </Field>
                    <Field label="SKU *" hint="Uppercase code; stable across inventory and invoices.">
                      <Input
                        value={form.sku || ''}
                        placeholder="PHY-HSC-01"
                        onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value.toUpperCase() }))}
                        className="h-11 rounded-xl font-mono text-sm"
                      />
                    </Field>
                    <Field label="Author / team">
                      <Input
                        value={form.author || ''}
                        placeholder="Publisher or lead author"
                        onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))}
                        className="h-11 rounded-xl"
                      />
                    </Field>
                    <Field label="Category">
                      <Select
                        value={form.categoryId ?? '__none__'}
                        onValueChange={(value) =>
                          setForm((p) => ({ ...p, categoryId: value === '__none__' ? undefined : value }))
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl">
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
                    </Field>
                    <Field label="Program">
                      <Select
                        value={form.programId ?? '__none__'}
                        onValueChange={(value) =>
                          setForm((p) => ({ ...p, programId: value === '__none__' ? undefined : value }))
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Optional program" />
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
                    </Field>
                  </div>
                </Panel>
              </TabsContent>

              <TabsContent value="commerce" className="mt-0 space-y-4 pb-4 data-[state=inactive]:hidden">
                <Panel>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Pricing & inventory</h3>
                      <p className="text-xs text-muted-foreground">Type, stock, MRP, and storefront spotlight.</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Format">
                      <Select
                        value={isEbook ? 'ebook' : 'physical'}
                        onValueChange={(value) =>
                          setForm((p) => ({
                            ...p,
                            isEbook: value === 'ebook',
                            centralQty: value === 'ebook' ? 0 : p.centralQty,
                          }))
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="physical">Physical book</SelectItem>
                          <SelectItem value="ebook">E-book (PDF)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field
                      label="Central stock"
                      hint={isEbook ? 'Digital titles do not use warehouse quantity here.' : 'Units at the central warehouse.'}
                    >
                      <Input
                        type="number"
                        min={0}
                        disabled={isEbook}
                        value={String(form.centralQty ?? 0)}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, centralQty: Math.max(0, Number(e.target.value || 0)) }))
                        }
                        className="h-11 rounded-xl"
                      />
                    </Field>
                    <Field label="Sale price *">
                      <Input
                        type="number"
                        min={0}
                        value={String(form.price ?? 0)}
                        onChange={(e) => setForm((p) => ({ ...p, price: Math.max(0, Number(e.target.value || 0)) }))}
                        className="h-11 rounded-xl"
                      />
                    </Field>
                    <Field label="MRP (optional)" hint="Shown struck-through when higher than sale price.">
                      <Input
                        type="number"
                        min={0}
                        value={form.mrp == null ? '' : String(form.mrp)}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            mrp: e.target.value ? Math.max(0, Number(e.target.value)) : undefined,
                          }))
                        }
                        placeholder="List price"
                        className="h-11 rounded-xl"
                      />
                    </Field>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-3 sm:col-span-2 dark:border-amber-900/40 dark:bg-amber-950/20">
                      <div className="flex items-start gap-2.5">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">Featured on storefront</p>
                          <p className="text-xs text-muted-foreground">Surfaces in discovery rails and category shelves.</p>
                        </div>
                      </div>
                      <Switch
                        checked={Boolean(form.featured)}
                        onCheckedChange={(checked) => setForm((p) => ({ ...p, featured: checked }))}
                      />
                    </div>
                  </div>
                </Panel>
              </TabsContent>

              <TabsContent value="story" className="mt-0 space-y-4 pb-4 data-[state=inactive]:hidden">
                <Panel>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-400">
                        <PenSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">Storefront story</h3>
                        <p className="text-xs text-muted-foreground">Rich HTML for the public book page.</p>
                      </div>
                    </div>
                  </div>
                  <Field label="Description">
                    <RichTextEditor
                      value={form.description || ''}
                      onChange={(value) => setForm((p) => ({ ...p, description: value }))}
                      placeholder="Outcomes, chapter highlights, who it is for, delivery notes…"
                      className="min-h-[220px] rounded-xl border border-slate-200 bg-background dark:border-border"
                    />
                  </Field>
                  {safeDescriptionPreview ? (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 dark:border-border dark:bg-muted/30">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Render preview
                      </p>
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: safeDescriptionPreview }}
                      />
                    </div>
                  ) : null}
                </Panel>
              </TabsContent>

              <TabsContent value="media" className="mt-0 space-y-4 pb-4 data-[state=inactive]:hidden">
                <Panel>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-400">
                      <ImagePlus className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Cover & files</h3>
                      <p className="text-xs text-muted-foreground">Thumbnail for cards; PDF only for e-books.</p>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label={book?.thumbnailUrl ? 'Replace cover' : 'Cover image'} hint="JPG / PNG recommended.">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                        className="h-11 cursor-pointer rounded-xl file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                      />
                      {book?.thumbnailUrl && !thumbnail ? (
                        <p className="text-[11px] text-muted-foreground">Existing cover is kept until you upload a new file.</p>
                      ) : null}
                    </Field>
                    {isEbook ? (
                      <Field label={book?.fileUrl ? 'Replace PDF' : 'PDF / e-book'} hint="Used for reader access and admin preview.">
                        <Input
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                          className="h-11 cursor-pointer rounded-xl file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          {file?.name || (book?.fileUrl ? 'Current file stays until replaced.' : 'No file selected yet.')}
                        </p>
                      </Field>
                    ) : (
                      <div className="flex flex-col justify-center rounded-xl border border-dashed border-slate-200 bg-muted/30 p-4 text-sm text-muted-foreground sm:min-h-22 dark:border-border">
                        Physical books do not require a PDF. Add one later if you ship a sample booklet.
                      </div>
                    )}
                  </div>
                </Panel>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </BookAdminModal>
  );
}
