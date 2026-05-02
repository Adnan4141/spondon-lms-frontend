'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { BookOpen, FileText, ImagePlus, Loader2, Package, PenSquare, Sparkles, Tags, WalletCards } from 'lucide-react';
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
  const selectedCategory = categories.find((category) => category.id === form.categoryId);
  const selectedProgram = programs.find((program) => program.id === form.programId);
  const coverUrl = thumbnailPreview || book?.thumbnailUrl || null;
  const isEbook = Boolean(form.isEbook);
  const price = Number(form.price || 0);
  const mrp = form.mrp == null ? null : Number(form.mrp);
  const stockLabel = isEbook ? 'Digital access item' : `${Number(form.centralQty || 0).toLocaleString()} central units`;
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
      toast({ title: 'Invalid MRP', description: 'MRP should be empty or greater than/equal to the selling price.', variant: 'destructive' });
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

  return (
    <BookAdminModal
      open={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Add New Book' : `Edit Book${book?.name ? `: ${book.name}` : ''}`}
      subtitle={mode === 'create' ? 'Create a storefront-ready book entry with richer presentation.' : 'Refresh this title with stronger commerce and content presentation.'}
      maxWidth="max-w-6xl"
      bodyClassName="p-0"
    >
      <div className="grid max-h-[80vh] overflow-hidden xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200 bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 p-6 text-white xl:block">
          <div className="sticky top-0 space-y-5">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Store Preview</p>
                <Badge className="border-white/10 bg-white/10 text-white">{formCompletion}% ready</Badge>
              </div>
              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-800 shadow-2xl">
                <div className="aspect-3/4">
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverUrl} alt={String(form.name || 'Book cover')} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-6xl font-black text-white/20">
                      {String(form.name || 'B').slice(0, 1)}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 space-y-4">
                <div>
                  <h4 className="line-clamp-2 text-2xl font-black leading-tight text-white">{form.name || 'Untitled book'}</h4>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{form.sku || 'SKU-PENDING'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-white/10 bg-white/10 text-white">{isEbook ? 'E-Book' : 'Physical'}</Badge>
                  {selectedCategory ? <Badge className="border-emerald-500/20 bg-emerald-500/15 text-emerald-300"><Tags className="mr-1 h-3 w-3" />{selectedCategory.name}</Badge> : null}
                  {form.featured ? <Badge className="border-amber-500/20 bg-amber-500/15 text-amber-300">Featured</Badge> : null}
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pricing</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">৳{price.toLocaleString()}</span>
                    {mrp && mrp > price ? <span className="text-sm font-semibold text-slate-500 line-through">৳{mrp.toLocaleString()}</span> : null}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-300">{stockLabel}</p>
                </div>
                {selectedProgram ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    Program: <span className="font-black text-white">{selectedProgram.name}</span>
                  </div>
                ) : null}
                {safeDescriptionPreview ? (
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Description Preview</p>
                    <div
                      className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300"
                      dangerouslySetInnerHTML={{ __html: safeDescriptionPreview }}
                    />
                  </div>
                ) : null}
                {file ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200">
                    <FileText className="h-4 w-4" />
                    {file.name}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </aside>

        <div className="min-h-0 overflow-y-auto bg-slate-50/70 p-4 sm:p-6 md:p-8">
          <div className="space-y-6">
            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Book Publisher Workspace</p>
                  <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                    {mode === 'create' ? 'Launch a new catalog entry' : 'Refine this book presentation'}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Use the editor below to set inventory, storefront grouping, and a richer public description that fits the redesigned book details page.
                  </p>
                </div>
                <div className="grid min-w-55 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-500"><WalletCards className="h-4 w-4" /><span className="text-xs font-black uppercase tracking-[0.2em]">Price</span></div>
                    <p className="mt-3 text-2xl font-black text-slate-900">৳{price.toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-500"><Package className="h-4 w-4" /><span className="text-xs font-black uppercase tracking-[0.2em]">Stock</span></div>
                    <p className="mt-3 text-base font-black text-slate-900">{isEbook ? 'Digital access' : `${Number(form.centralQty || 0).toLocaleString()} units`}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-600"><BookOpen className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Book identity</h3>
                  <p className="text-sm text-slate-500">Primary catalog fields used across search, receipts, and storefront cards.</p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Book Name *</Label>
                  <Input value={form.name || ''} placeholder="e.g. HSC Physics Complete Guide" onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="h-12 rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label>SKU *</Label>
                  <Input value={form.sku || ''} placeholder="PHY-HSC-01" onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }))} className="h-12 rounded-2xl" />
                  <p className="text-xs text-slate-500">Stable inventory code for operations and receipts.</p>
                </div>
                <div className="space-y-2">
                  <Label>Author / Team</Label>
                  <Input value={form.author || ''} placeholder="Author, publication team, or editor" onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))} className="h-12 rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={form.categoryId ?? '__none__'}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, categoryId: value === '__none__' ? undefined : value }))}
                  >
                    <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Uncategorized</SelectItem>
                      {categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Program</Label>
                  <Select
                    value={form.programId ?? '__none__'}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, programId: value === '__none__' ? undefined : value }))}
                  >
                    <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="Select program" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {programs.map((program) => <SelectItem key={program.id} value={program.id}>{program.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600"><Package className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Pricing and stock</h3>
                  <p className="text-sm text-slate-500">Controls checkout amount, MRP presentation, and central inventory.</p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={isEbook ? 'ebook' : 'physical'}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, isEbook: value === 'ebook', centralQty: value === 'ebook' ? 0 : prev.centralQty }))}
                  >
                    <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">Physical</SelectItem>
                      <SelectItem value="ebook">E-Book</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Central Stock</Label>
                  <Input type="number" min={0} disabled={isEbook} value={String(form.centralQty ?? 0)} onChange={(e) => setForm((prev) => ({ ...prev, centralQty: Math.max(0, Number(e.target.value || 0)) }))} className="h-12 rounded-2xl" />
                  <p className="text-xs text-slate-500">{isEbook ? 'Digital books skip physical stock management.' : 'Opening quantity available at the central warehouse.'}</p>
                </div>
                <div className="space-y-2">
                  <Label>Price *</Label>
                  <Input type="number" min={0} value={String(form.price ?? 0)} onChange={(e) => setForm((prev) => ({ ...prev, price: Math.max(0, Number(e.target.value || 0)) }))} className="h-12 rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label>MRP</Label>
                  <Input type="number" min={0} value={form.mrp == null ? '' : String(form.mrp)} onChange={(e) => setForm((prev) => ({ ...prev, mrp: e.target.value ? Math.max(0, Number(e.target.value)) : undefined }))} placeholder="Optional strikethrough price" className="h-12 rounded-2xl" />
                </div>
                <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 md:col-span-2">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Feature on storefront</p>
                      <p className="text-xs text-slate-500">Highlight this title inside category sections and public discovery rails.</p>
                    </div>
                  </div>
                  <Switch checked={Boolean(form.featured)} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, featured: checked }))} />
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-fuchsia-500/10 p-3 text-fuchsia-600"><PenSquare className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Rich description</h3>
                  <p className="text-sm text-slate-500">Use formatted content for the redesigned public book details page.</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <RichTextEditor
                  value={form.description || ''}
                  onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
                  placeholder="Write a polished storefront description, chapter highlights, and buying notes..."
                  className="rounded-[24px] border-slate-200 bg-white"
                />
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-600"><ImagePlus className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Assets</h3>
                  <p className="text-sm text-slate-500">Cover art and PDF asset used in preview flows.</p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{book?.thumbnailUrl ? 'Replace cover image' : 'Cover image'}</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} className="h-12 rounded-2xl" />
                  {book?.thumbnailUrl && !thumbnail ? <p className="text-xs text-slate-500">The current cover remains unless you upload a new image.</p> : null}
                </div>
                {isEbook ? (
                  <div className="space-y-2">
                    <Label>{book?.fileUrl ? 'Replace PDF / ebook file' : 'PDF / ebook file'}</Label>
                    <Input type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="h-12 rounded-2xl" />
                    <p className="text-xs text-slate-500">{file?.name || (book?.fileUrl ? 'Current PDF will stay until replaced.' : 'Upload a PDF for reader access or preview.')}</p>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                    Physical titles skip PDF upload unless you later add a sample/demo asset.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      <DialogFooter className="border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-6">
        <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {mode === 'create' ? 'Create Book' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </BookAdminModal>
  );
}