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
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, ImagePlus, Loader2, Package, Sparkles, Tags } from 'lucide-react';
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
  const stockLabel = isEbook ? 'Digital item' : `${Number(form.centralQty || 0).toLocaleString()} central units`;
  const formCompletion = useMemo(() => {
    const checks = [
      Boolean(current.name?.trim()),
      Boolean(current.sku?.trim()),
      price >= 0,
      Boolean(form.categoryId),
      Boolean(coverUrl),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [coverUrl, current.name, current.sku, form.categoryId, price]);

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
      subtitle={mode === 'create' ? 'Create a new book entry with cover, stock, and pricing.' : 'Update metadata, files, pricing, and storefront visibility.'}
      maxWidth="max-w-6xl"
      bodyClassName="p-0"
    >
      <div className="grid max-h-[78vh] overflow-hidden lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-border bg-card p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary"><BookOpen className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-lg font-black">Basic Info</h3>
                  <p className="text-sm text-muted-foreground">Catalog identity and public grouping.</p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Book Name *</Label>
                  <Input value={form.name || ''} placeholder="e.g. HSC Physics Complete Guide" onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>SKU *</Label>
                  <Input value={form.sku || ''} placeholder="PHY-HSC-01" onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }))} />
                  <p className="text-xs text-muted-foreground">Use a stable code for inventory, invoices, and search.</p>
                </div>
                <div className="space-y-2">
                  <Label>Author</Label>
                  <Input value={form.author || ''} placeholder="Author or publication team" onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={form.categoryId ?? '__none__'}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, categoryId: value === '__none__' ? undefined : value }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
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
                    <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {programs.map((program) => <SelectItem key={program.id} value={program.id}>{program.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description || ''} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={5} placeholder="Short public-facing description for the book detail page." />
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-border bg-card p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600"><Package className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-lg font-black">Pricing & Inventory</h3>
                  <p className="text-sm text-muted-foreground">Controls receipt price, storefront display, and physical stock.</p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={isEbook ? 'ebook' : 'physical'}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, isEbook: value === 'ebook', centralQty: value === 'ebook' ? 0 : prev.centralQty }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">Physical</SelectItem>
                      <SelectItem value="ebook">E-Book</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Central Stock</Label>
                  <Input type="number" min={0} disabled={isEbook} value={String(form.centralQty ?? 0)} onChange={(e) => setForm((prev) => ({ ...prev, centralQty: Math.max(0, Number(e.target.value || 0)) }))} />
                  <p className="text-xs text-muted-foreground">{isEbook ? 'E-books do not use physical stock.' : 'Opening central warehouse stock.'}</p>
                </div>
                <div className="space-y-2">
                  <Label>Price *</Label>
                  <Input type="number" min={0} value={String(form.price ?? 0)} onChange={(e) => setForm((prev) => ({ ...prev, price: Math.max(0, Number(e.target.value || 0)) }))} />
                </div>
                <div className="space-y-2">
                  <Label>MRP</Label>
                  <Input type="number" min={0} value={form.mrp == null ? '' : String(form.mrp)} onChange={(e) => setForm((prev) => ({ ...prev, mrp: e.target.value ? Math.max(0, Number(e.target.value)) : undefined }))} placeholder="Optional strikethrough price" />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 px-4 py-3 md:col-span-2">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-semibold">Featured on storefront</p>
                      <p className="text-xs text-muted-foreground">Highlights this title in public browsing sections.</p>
                    </div>
                  </div>
                  <Switch checked={Boolean(form.featured)} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, featured: checked }))} />
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-border bg-card p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-600"><ImagePlus className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-lg font-black">Assets</h3>
                  <p className="text-sm text-muted-foreground">Cover and PDF files shown in catalog and preview flows.</p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{book?.thumbnailUrl ? 'Replace Cover Image' : 'Cover Image'}</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} />
                  {book?.thumbnailUrl && !thumbnail ? <p className="text-xs text-muted-foreground">Current cover will be kept unless a new image is selected.</p> : null}
                </div>
                {isEbook ? (
                  <div className="space-y-2">
                    <Label>{book?.fileUrl ? 'Replace PDF / Ebook File' : 'PDF / Ebook File'}</Label>
                    <Input type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    <p className="text-xs text-muted-foreground">{file?.name || (book?.fileUrl ? 'Current PDF will be kept unless replaced.' : 'Upload a PDF for read/demo preview.')}</p>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </div>

        <aside className="hidden border-l border-border bg-muted/20 p-5 lg:block">
          <div className="sticky top-0 space-y-4">
            <div className="rounded-[28px] border border-border bg-background p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Live Preview</p>
                <Badge variant="outline">{formCompletion}% ready</Badge>
              </div>
              <div className="overflow-hidden rounded-[24px] border border-border bg-muted">
                <div className="aspect-[3/4]">
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverUrl} alt={String(form.name || 'Book cover')} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl font-black text-muted-foreground">
                      {String(form.name || 'B').slice(0, 1)}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <h4 className="line-clamp-2 text-xl font-black text-foreground">{form.name || 'Untitled book'}</h4>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{form.sku || 'SKU-PENDING'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{isEbook ? 'E-Book' : 'Physical'}</Badge>
                  {selectedCategory ? <Badge variant="outline"><Tags className="mr-1 h-3 w-3" />{selectedCategory.name}</Badge> : null}
                  {form.featured ? <Badge className="border-amber-200 bg-amber-50 text-amber-700">Featured</Badge> : null}
                </div>
                <div className="rounded-2xl border border-border bg-muted/40 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Price</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-primary">৳{price.toLocaleString()}</span>
                    {mrp && mrp > price ? <span className="text-sm font-semibold text-muted-foreground line-through">৳{mrp.toLocaleString()}</span> : null}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-muted/40 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Inventory</p>
                  <p className="mt-1 font-black text-foreground">{stockLabel}</p>
                </div>
                {selectedProgram ? <p className="text-xs text-muted-foreground">Program: <span className="font-semibold text-foreground">{selectedProgram.name}</span></p> : null}
                {file ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
                    <FileText className="h-4 w-4" />
                    {file.name}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </aside>
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
