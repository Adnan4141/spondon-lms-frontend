'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createBook, updateBook, type Book, type BookCategory, type CreateBookDto, type UpdateBookDto } from '@/lib/api/books';
import type { Program } from '@/lib/api/programs';
import { sanitizeRichTextDisplayHtml } from '@/lib/sanitize-rich-text-display';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, CircleAlert, FileImage, ScrollText, Wallet } from 'lucide-react';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { cn } from '@/lib/utils';
import { BookAdminModal } from './BookAdminModal';
import { BookFormCommerceSection } from './book-form/BookFormCommerceSection';
import { BookFormFooter } from './book-form/BookFormFooter';
import { BookFormIdentitySection } from './book-form/BookFormIdentitySection';
import { BookFormMediaSection } from './book-form/BookFormMediaSection';
import { BookFormStorySection } from './book-form/BookFormStorySection';
import { bookDateToPickerDate, initialCreateState, pickerDateToIsoDate } from './book-form/utils';

type FormTabKey = 'identity' | 'commerce' | 'story' | 'media';

type FormTabMeta = {
  value: FormTabKey;
  title: string;
  summary: string;
  description: string;
  badgeText: string;
  complete: boolean;
  icon: LucideIcon;
};

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
  const [publishedAt, setPublishedAt] = useState<Date | undefined>(undefined);
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FormTabKey>('identity');

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
      setPublishedAt(bookDateToPickerDate(book.publishedAt));
    } else {
      setForm(initialCreateState());
      setPublishedAt(undefined);
    }
    setFile(null);
    setThumbnail(null);
    setThumbnailPreview(null);
  }, [mode, book, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('identity');
    }
  }, [isOpen, mode, book?.id]);

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
  const safeDescriptionPreview = sanitizeRichTextDisplayHtml(form.description || '');
  const hasIdentity = Boolean(current.name?.trim()) && Boolean(current.sku?.trim()) && Boolean(form.categoryId);
  const hasCommerce = Number.isFinite(price) && price >= 0 && (mrp == null || mrp === 0 || mrp >= price);
  const hasStory = Boolean(form.description?.trim());
  const hasMedia = Boolean(coverUrl) && (!isEbook || Boolean(file || book?.fileUrl));

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

  const tabs = useMemo<FormTabMeta[]>(
    () => [
      {
        value: 'identity',
        title: 'Identity',
        summary: 'Title, SKU, category, and placement',
        description: 'Set the listing name, internal code, catalog shelf, and publishing context.',
        badgeText: form.categoryId ? 'Placed' : 'Needs category',
        complete: hasIdentity,
        icon: BookOpen,
      },
      {
        value: 'commerce',
        title: 'Commerce',
        summary: 'Price, MRP, stock, and format',
        description: 'Control how the title is sold, whether it is digital, and how stock behaves.',
        badgeText: isEbook ? 'Digital' : `${Number(form.centralQty || 0)} stock`,
        complete: hasCommerce,
        icon: Wallet,
      },
      {
        value: 'story',
        title: 'Story',
        summary: 'Description and selling narrative',
        description: 'Shape the book description that appears across the storefront and internal previews.',
        badgeText: hasStory ? 'Drafted' : 'Add description',
        complete: hasStory,
        icon: ScrollText,
      },
      {
        value: 'media',
        title: 'Media',
        summary: 'Cover artwork and ebook file',
        description: 'Upload the cover and, for ebooks, the PDF that students will access.',
        badgeText: hasMedia ? 'Assets ready' : 'Add assets',
        complete: hasMedia,
        icon: FileImage,
      },
    ],
    [form.categoryId, form.centralQty, hasCommerce, hasIdentity, hasMedia, hasStory, isEbook],
  );

  const completedSections = tabs.filter((tab) => tab.complete).length;
  const nextIncompleteTab = tabs.find((tab) => !tab.complete);
  const activeTabMeta = tabs.find((tab) => tab.value === activeTab) ?? tabs[0];

  const handleSubmit = async () => {
    if (!current.name?.trim() || !current.sku?.trim()) {
      setActiveTab('identity');
      toast({ title: 'Missing fields', description: 'Book name and SKU are required.', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setActiveTab('commerce');
      toast({ title: 'Invalid price', description: 'Price must be zero or greater.', variant: 'destructive' });
      return;
    }
    if (mrp != null && mrp > 0 && mrp < price) {
      setActiveTab('commerce');
      toast({
        title: 'Invalid MRP',
        description: 'MRP should be empty or greater than / equal to the selling price.',
        variant: 'destructive',
      });
      return;
    }

    const publishedIso = publishedAt ? pickerDateToIsoDate(publishedAt) : null;
    const basePayload = {
      ...form,
      centralQty: isEbook ? 0 : Number(form.centralQty || 0),
    };

    try {
      setSubmitting(true);
      if (mode === 'create') {
        const createPayload: CreateBookDto = {
          ...basePayload,
          ...(publishedIso ? { publishedAt: publishedIso } : {}),
        } as CreateBookDto;
        await createBook(createPayload, file || undefined, thumbnail || undefined);
      } else if (book) {
        const updatePayload: UpdateBookDto = {
          ...basePayload,
          publishedAt: publishedIso,
        };
        await updateBook(book.id, updatePayload, file || undefined, thumbnail || undefined);
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
      title={mode === 'create' ? 'Add book' : 'Edit book'}
      subtitle={
        mode === 'create'
          ? 'A tabbed catalog workspace for details, pricing, story, and assets.'
          : book?.name
            ? `Updating ${book.name}`
            : 'Update details, pricing, story, and assets before saving.'
      }
      maxWidth="max-w-6xl"
      bodyClassName={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden bg-linear-to-br from-slate-50 via-background to-sky-50/70 p-0 dark:from-slate-950/40 dark:via-background dark:to-sky-950/20',
      )}
      footer={
        <BookFormFooter
          formCompletion={formCompletion}
          submitting={submitting}
          mode={mode}
          onClose={onClose}
          onSubmit={() => void handleSubmit()}
        />
      }
    >
      <div className="flex min-h-0 w-full max-w-full flex-1 flex-col overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as FormTabKey)}
          className="flex min-h-0 w-full max-w-full flex-1 flex-col gap-0 overflow-hidden"
        >
          <div className="shrink-0 border-b border-border/70 bg-background/95 px-3 py-4 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/85 sm:px-5">
            <Card className="gap-3 rounded-3xl border-border/70 bg-card/95 py-0 shadow-sm">
              <CardHeader className="gap-3 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] font-semibold">
                        {completedSections}/{tabs.length} sections ready
                      </Badge>
                      {nextIncompleteTab ? (
                        <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                          Next: {nextIncompleteTab.title}
                        </Badge>
                      ) : (
                        <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white">Ready to save</Badge>
                      )}
                      <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] font-semibold">
                        {isEbook ? 'E-book' : 'Printed book'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-xl tracking-tight text-foreground sm:text-2xl">
                        {form.name?.trim() || (mode === 'create' ? 'Untitled book draft' : 'Book details')}
                      </CardTitle>
                      <CardDescription className="max-w-3xl text-sm leading-6">
                        {activeTabMeta.description}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs sm:min-w-80">
                    <div className="rounded-2xl border border-border/70 bg-muted/40 px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Category</p>
                      <p className="mt-1 truncate font-medium text-foreground">{selectedCategory?.name || 'Uncategorized'}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/40 px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Program</p>
                      <p className="mt-1 truncate font-medium text-foreground">{selectedProgram?.name || 'No program'}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

        <div className="shrink-0 border-b border-border/70 bg-background/90 px-3 py-3 backdrop-blur-sm sm:px-5">
  <TabsList
    variant="line"
    className={cn(
      'grid h-auto w-full min-w-0 grid-cols-2 gap-2 rounded-2xl bg-muted/40 p-1',
      'md:grid-cols-4',
    )}
  >
    {tabs.map((tab) => {
      const Icon = tab.icon;

      return (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          className={cn(
            'h-full min-h-[86px] min-w-0 items-stretch justify-start whitespace-normal rounded-xl border border-transparent bg-transparent px-3 py-3 text-left transition-all',
            'hover:bg-background/70',
            'data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:after:opacity-0',
          )}
        >
          <div className="flex w-full min-w-0 items-start gap-3">
            <div className="mt-0.5 shrink-0 rounded-xl border border-border/70 bg-muted/70 p-2 text-muted-foreground">
              <Icon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="truncate text-sm font-semibold text-foreground">
                  {tab.title}
                </span>

                <Badge
                  variant="outline"
                  className={cn(
                    'max-w-full truncate text-[10px]',
                    tab.complete
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                      : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
                  )}
                >
                  {tab.complete ? 'Ready' : tab.badgeText}
                </Badge>
              </div>

              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {tab.summary}
              </p>
            </div>
          </div>
        </TabsTrigger>
      );
    })}
  </TabsList>
</div>

          <div className="relative isolate min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 pt-4 [-webkit-overflow-scrolling:touch] sm:px-5 sm:pb-6 sm:pt-5">
            <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5">
            

              <TabsContent value="identity" className="mt-0 focus-visible:outline-none">
                <BookFormIdentitySection
                  mode={mode}
                  book={book}
                  form={form}
                  setForm={setForm}
                  categories={categories}
                  programs={programs}
                  publishedAt={publishedAt}
                  setPublishedAt={setPublishedAt}
                />
              </TabsContent>

              <TabsContent value="commerce" className="mt-0 focus-visible:outline-none">
                <BookFormCommerceSection form={form} setForm={setForm} isEbook={isEbook} />
              </TabsContent>

              <TabsContent value="story" className="mt-0 focus-visible:outline-none">
                <BookFormStorySection form={form} setForm={setForm} safeDescriptionPreview={safeDescriptionPreview} />
              </TabsContent>

              <TabsContent value="media" className="mt-0 focus-visible:outline-none">
                <BookFormMediaSection
                  book={book}
                  isEbook={isEbook}
                  thumbnail={thumbnail}
                  setThumbnail={setThumbnail}
                  file={file}
                  setFile={setFile}
                />
              </TabsContent>

              {!activeTabMeta.complete ? (
                <Card className="border-amber-200/70 bg-amber-50/70 shadow-none dark:border-amber-900/50 dark:bg-amber-950/20">
                  <CardContent className="flex items-start gap-3 px-5 py-4">
                    <div className="rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200">
                      <CircleAlert className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">This section still needs attention</p>
                      <p className="text-sm text-amber-800/80 dark:text-amber-200/80">
                        Finish the key fields here, then move to the next tab. The footer stays available so you can save once the essentials are in place.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        </Tabs>
      </div>
    </BookAdminModal>
  );
}

