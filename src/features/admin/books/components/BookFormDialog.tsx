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
  Check,
  ChevronRight,
  FileText,
  ImagePlus,
  Loader2,
  Package,
  PenSquare,
  Sparkles,
  Tags,
  Upload,
  WalletCards,
} from 'lucide-react';
import { BookAdminModal } from './BookAdminModal';

const TAB_ORDER = ['identity', 'commerce', 'story', 'media'] as const;
type TabId = (typeof TAB_ORDER)[number];

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
  optional,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  optional?: boolean;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline gap-2">
        <Label className="text-xs font-semibold text-foreground">{label}</Label>
        {optional ? (
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Optional</span>
        ) : null}
      </div>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/2 backdrop-blur-sm sm:p-6 dark:ring-white/5',
        className,
      )}
    >
      {children}
    </div>
  );
}

function CompletionRing({ value }: { value: number }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-emerald-500/15 to-teal-600/10 text-xs font-black tabular-nums text-emerald-800 ring-2 ring-emerald-500/25 dark:text-emerald-200 dark:ring-emerald-400/30"
      aria-hidden
    >
      {v}
    </div>
  );
}

function FileDropZone({
  id,
  accept,
  label,
  sub,
  selectedName,
  onFile,
}: {
  id: string;
  accept: string;
  label: string;
  sub: string;
  selectedName?: string | null;
  onFile: (file: File | null) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'group flex min-h-30 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/20 px-4 py-5 text-center transition-all',
        'hover:border-primary/40 hover:bg-primary/4 hover:shadow-md',
        'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
      )}
    >
      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0] || null)}
      />
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
        <Upload className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      </div>
      {selectedName ? (
        <Badge variant="secondary" className="mt-1 max-w-full truncate font-normal">
          {selectedName}
        </Badge>
      ) : null}
    </label>
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
  const [activeTab, setActiveTab] = useState<TabId>('identity');

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
  const stockLabel = isEbook ? 'Digital — no warehouse stock' : `${Number(form.centralQty || 0).toLocaleString()} units at central`;
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

  const tabHints = useMemo(() => {
    const identityOk = Boolean(current.name?.trim() && current.sku?.trim() && form.categoryId);
    const commerceOk = price >= 0 && (mrp == null || mrp <= 0 || mrp >= price);
    const storyOk = Boolean(form.description?.trim());
    const mediaOk = Boolean(coverUrl);
    return { identityOk, commerceOk, storyOk, mediaOk };
  }, [coverUrl, current.name, current.sku, form.categoryId, form.description, mrp, price]);

  const goNextTab = () => {
    const i = TAB_ORDER.indexOf(activeTab);
    if (i < TAB_ORDER.length - 1) setActiveTab(TAB_ORDER[i + 1]);
  };

  const handleSubmit = async () => {
    if (!current.name?.trim() || !current.sku?.trim()) {
      toast({ title: 'Missing fields', description: 'Book name and SKU are required.', variant: 'destructive' });
      setActiveTab('identity');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      toast({ title: 'Invalid price', description: 'Price must be zero or greater.', variant: 'destructive' });
      setActiveTab('commerce');
      return;
    }
    if (mrp != null && mrp > 0 && mrp < price) {
      toast({
        title: 'Invalid MRP',
        description: 'MRP should be empty or greater than / equal to the selling price.',
        variant: 'destructive',
      });
      setActiveTab('commerce');
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
    <DialogFooter className="shrink-0 border-t border-border bg-linear-to-t from-muted/50 to-card/95 px-4 py-4 backdrop-blur-md sm:px-6">
      <div className="flex w-full flex-col gap-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-500 transition-[width] duration-500 ease-out"
            style={{ width: `${formCompletion}%` }}
          />
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CompletionRing value={formCompletion} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Readiness {formCompletion}%</p>
              <p className="text-[11px] text-muted-foreground">
                {formCompletion >= 100 ? 'Ready to publish.' : 'Fill missing fields for a complete storefront listing.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" className="rounded-xl text-muted-foreground" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="button"
              className="min-w-36 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 font-semibold text-white shadow-md hover:from-emerald-500 hover:to-teal-500"
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4 opacity-90" />}
              {mode === 'create' ? 'Create book' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </DialogFooter>
  );

  const tabTriggerClass =
    'relative gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md sm:px-4 sm:text-sm';

  return (
    <BookAdminModal
      open={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Add book' : 'Edit book'}
      subtitle={
        mode === 'create'
          ? 'Build a polished catalog entry — tabs guide you from identity to media.'
          : book?.name
            ? `Updating “${book.name}”`
            : 'Update fields and assets; changes apply after you save.'
      }
      maxWidth="max-w-6xl"
      bodyClassName="bg-linear-to-br from-slate-100/90 via-background to-emerald-50/25 p-0 dark:from-background dark:via-background dark:to-emerald-950/20"
      footer={footer}
    >
      <div className="flex min-h-[min(560px,calc(92vh-11rem))] flex-col lg:grid lg:min-h-[520px] lg:grid-cols-[minmax(0,260px)_1fr]">
        <aside className="relative hidden shrink-0 overflow-hidden border-b border-border lg:block lg:border-b-0 lg:border-r">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(16,185,129,0.35),transparent_55%),linear-gradient(165deg,#0f172a_0%,#134e4a_45%,#1e1b4b_100%)]" />
          <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-size-[20px_20px]" />
          <div className="relative flex min-h-full flex-col p-5 text-white">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">Storefront preview</span>
              <Badge className="border-white/20 bg-white/10 text-[10px] font-bold text-white">{formCompletion}%</Badge>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/15 bg-black/20 shadow-2xl ring-1 ring-white/10">
              <div className="aspect-3/4 max-h-[260px]">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 bg-white/5 p-4 text-center">
                    <span className="text-5xl font-black text-white/20">{(form.name || 'B').slice(0, 1)}</span>
                    <p className="text-[11px] text-white/45">Add a cover in the Media tab</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <h4 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight">{form.name || 'Untitled book'}</h4>
              <p className="font-mono text-[10px] uppercase tracking-wider text-teal-200/80">{form.sku || 'SKU pending'}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge className="border-white/20 bg-white/10 text-[10px] text-white">{isEbook ? 'E-book' : 'Print'}</Badge>
              {selectedCategory ? (
                <Badge className="border-emerald-400/30 bg-emerald-500/20 text-[10px] text-emerald-100">
                  <Tags className="mr-1 h-3 w-3" />
                  {selectedCategory.name}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-400/40 bg-amber-500/15 text-[10px] text-amber-100">
                  No category
                </Badge>
              )}
              {form.featured ? (
                <Badge className="border-amber-300/40 bg-amber-400/20 text-[10px] text-amber-50">
                  <Sparkles className="mr-0.5 h-3 w-3" />
                  Featured
                </Badge>
              ) : null}
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Price</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight">৳{price.toLocaleString()}</span>
                {mrp != null && mrp > price ? (
                  <span className="text-sm font-medium text-white/45 line-through">৳{mrp.toLocaleString()}</span>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-white/50">{stockLabel}</p>
            </div>
            {selectedProgram ? (
              <p className="mt-3 text-xs text-white/55">
                Program: <span className="font-semibold text-white">{selectedProgram.name}</span>
              </p>
            ) : null}
            {file ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/15 px-2.5 py-2 text-[11px] text-cyan-50">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-border bg-card/90 p-3 backdrop-blur-sm lg:hidden">
            <div className="h-14 w-11 shrink-0 overflow-hidden rounded-xl border border-border bg-muted shadow-sm ring-1 ring-black/5">
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
              <p className="truncate text-sm font-bold text-foreground">{form.name || 'Untitled book'}</p>
              <p className="text-[11px] text-muted-foreground">{form.sku || 'Add SKU in Identity'}</p>
            </div>
            <CompletionRing value={formCompletion} />
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2 sm:px-5 sm:pb-5 sm:pt-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-2xl border border-border/80 bg-muted/50 p-1.5 shadow-inner sm:w-auto dark:bg-muted/30">
                <TabsTrigger value="identity" className={tabTriggerClass}>
                  <BookOpen className="h-3.5 w-3.5" />
                  Identity
                  {!tabHints.identityOk ? (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500 shadow-sm ring-2 ring-background" />
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="commerce" className={tabTriggerClass}>
                  <WalletCards className="h-3.5 w-3.5" />
                  Commerce
                  {!tabHints.commerceOk ? (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500 shadow-sm ring-2 ring-background" />
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="story" className={tabTriggerClass}>
                  <PenSquare className="h-3.5 w-3.5" />
                  Story
                  {!tabHints.storyOk ? (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500 shadow-sm ring-2 ring-background" />
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="media" className={tabTriggerClass}>
                  <ImagePlus className="h-3.5 w-3.5" />
                  Media
                  {!tabHints.mediaOk ? (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500 shadow-sm ring-2 ring-background" />
                  ) : null}
                </TabsTrigger>
              </TabsList>
              {activeTab !== 'media' ? (
                <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-xl gap-1 text-xs" onClick={goNextTab}>
                  Next section
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 [-webkit-overflow-scrolling:touch]">
              <TabsContent value="identity" className="mt-0 space-y-4 pb-4 data-[state=inactive]:hidden">
                <Panel>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 text-primary shadow-sm ring-1 ring-primary/10">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Who is this book?</h3>
                      <p className="text-xs text-muted-foreground">Title, SKU, and category power search, filters, and receipts.</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Title" className="sm:col-span-2">
                      <Input
                        value={form.name || ''}
                        placeholder="e.g. HSC Physics — 1st Paper"
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        className="h-11 rounded-xl border-border/80 text-base shadow-sm"
                      />
                    </Field>
                    <Field label="SKU" hint="Letters & numbers; we uppercase as you type.">
                      <Input
                        value={form.sku || ''}
                        placeholder="PHY-HSC-01"
                        onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value.toUpperCase() }))}
                        className="h-11 rounded-xl border-border/80 font-mono text-sm shadow-sm"
                      />
                    </Field>
                    <Field label="Author / team" optional>
                      <Input
                        value={form.author || ''}
                        placeholder="Publisher or lead author"
                        onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))}
                        className="h-11 rounded-xl border-border/80 shadow-sm"
                      />
                    </Field>
                    <Field label="Category" hint="Pick the shelf this book belongs on in the public catalog.">
                      <Select
                        value={form.categoryId ?? '__none__'}
                        onValueChange={(value) =>
                          setForm((p) => ({ ...p, categoryId: value === '__none__' ? undefined : value }))
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl border-border/80 shadow-sm">
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
                    <Field label="Program" optional hint="Optional link to a program for internal grouping.">
                      <Select
                        value={form.programId ?? '__none__'}
                        onValueChange={(value) =>
                          setForm((p) => ({ ...p, programId: value === '__none__' ? undefined : value }))
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl border-border/80 shadow-sm">
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
                    </Field>
                  </div>
                </Panel>
              </TabsContent>

              <TabsContent value="commerce" className="mt-0 space-y-4 pb-4 data-[state=inactive]:hidden">
                <Panel>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500/20 to-teal-500/10 text-emerald-700 shadow-sm ring-1 ring-emerald-500/15 dark:text-emerald-400">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Pricing & stock</h3>
                      <p className="text-xs text-muted-foreground">Choose format first — it controls inventory fields.</p>
                    </div>
                  </div>

                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Format</p>
                  <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, isEbook: false }))}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md',
                        !isEbook
                          ? 'border-primary bg-primary/6 shadow-md ring-2 ring-primary/20'
                          : 'border-border bg-muted/20 hover:border-primary/30',
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Printed book</p>
                        <p className="text-xs text-muted-foreground">Warehouse quantity & physical delivery.</p>
                      </div>
                      {!isEbook ? <Check className="ml-auto h-5 w-5 shrink-0 text-primary" /> : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, isEbook: true, centralQty: 0 }))}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md',
                        isEbook
                          ? 'border-primary bg-primary/6 shadow-md ring-2 ring-primary/20'
                          : 'border-border bg-muted/20 hover:border-primary/30',
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">E-book (PDF)</p>
                        <p className="text-xs text-muted-foreground">Digital access; stock field hidden.</p>
                      </div>
                      {isEbook ? <Check className="ml-auto h-5 w-5 shrink-0 text-primary" /> : null}
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Central stock"
                      hint={isEbook ? 'Not used for digital titles.' : 'Units available at the central warehouse.'}
                    >
                      <Input
                        type="number"
                        min={0}
                        disabled={isEbook}
                        value={String(form.centralQty ?? 0)}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, centralQty: Math.max(0, Number(e.target.value || 0)) }))
                        }
                        className="h-11 rounded-xl border-border/80 shadow-sm disabled:opacity-60"
                      />
                    </Field>
                    <Field label="Sale price" hint="What customers pay (৳).">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                          ৳
                        </span>
                        <Input
                          type="number"
                          min={0}
                          value={String(form.price ?? 0)}
                          onChange={(e) => setForm((p) => ({ ...p, price: Math.max(0, Number(e.target.value || 0)) }))}
                          className="h-11 rounded-xl border-border/80 pl-8 shadow-sm"
                        />
                      </div>
                    </Field>
                    <Field label="MRP" optional hint="Optional list price; shown struck-through when above sale price.">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                          ৳
                        </span>
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
                          className="h-11 rounded-xl border-border/80 pl-8 shadow-sm"
                        />
                      </div>
                    </Field>
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200/70 bg-linear-to-r from-amber-50/90 to-orange-50/40 px-4 py-4 sm:col-span-2 dark:border-amber-900/50 dark:from-amber-950/40 dark:to-orange-950/20">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Feature on storefront</p>
                          <p className="text-xs text-muted-foreground">Highlights this title in discovery and category rails.</p>
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
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500/20 to-fuchsia-500/10 text-violet-700 shadow-sm ring-1 ring-violet-500/15 dark:text-violet-400">
                      <PenSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Storefront story</h3>
                      <p className="text-xs text-muted-foreground">Rich text shoppers see on the public book page.</p>
                    </div>
                  </div>
                  <Field label="Description" hint="Headings, bullets, and emphasis are supported.">
                    <RichTextEditor
                      value={form.description || ''}
                      onChange={(value) => setForm((p) => ({ ...p, description: value }))}
                      placeholder="Who it is for, what is inside, delivery or access notes…"
                      className="min-h-[240px] rounded-xl border border-border/80 bg-background shadow-inner dark:border-border"
                    />
                  </Field>
                  {safeDescriptionPreview ? (
                    <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/25 p-4 dark:bg-muted/15">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Live render preview
                      </p>
                      <div
                        className="prose prose-sm max-w-none text-foreground dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: safeDescriptionPreview }}
                      />
                    </div>
                  ) : null}
                </Panel>
              </TabsContent>

              <TabsContent value="media" className="mt-0 space-y-4 pb-4 data-[state=inactive]:hidden">
                <Panel>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500/20 to-blue-500/10 text-sky-700 shadow-sm ring-1 ring-sky-500/15 dark:text-sky-400">
                      <ImagePlus className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Cover & files</h3>
                      <p className="text-xs text-muted-foreground">Drop files or tap a zone — large previews update on the left.</p>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-foreground">
                        {book?.thumbnailUrl ? 'Replace cover image' : 'Cover image'}
                      </Label>
                      <FileDropZone
                        id="book-cover-input"
                        accept="image/*"
                        label="Upload cover"
                        sub="PNG or JPG · shown on cards & preview"
                        selectedName={thumbnail?.name}
                        onFile={setThumbnail}
                      />
                      {book?.thumbnailUrl && !thumbnail ? (
                        <p className="text-[11px] text-muted-foreground">Current cover stays until you choose a new image.</p>
                      ) : null}
                    </div>
                    {isEbook ? (
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-foreground">
                          {book?.fileUrl ? 'Replace PDF' : 'PDF / e-book'}
                        </Label>
                        <FileDropZone
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
                    ) : (
                      <div className="flex min-h-22 flex-col justify-center rounded-2xl border border-dashed border-border bg-muted/15 p-5 text-center text-sm text-muted-foreground">
                        <Package className="mx-auto mb-2 h-8 w-8 opacity-40" />
                        Printed books do not need a PDF. You can add a sample later if you offer one.
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
