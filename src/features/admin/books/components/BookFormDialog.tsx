'use client';

import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { createBook, updateBook, type Book, type BookCategory, type CreateBookDto, type UpdateBookDto } from '@/lib/api/books';
import type { Program } from '@/lib/api/programs';
import { sanitizeRichTextDisplayHtml } from '@/lib/sanitize-rich-text-display';
import { BookOpen, FileImage, ScrollText, UsersRound, Wallet } from 'lucide-react';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { BookAdminModal } from './BookAdminModal';
import { BookFormAttentionNotice } from './book-form/BookFormAttentionNotice';
import { BookFormCollaboratorsSection } from './book-form/BookFormCollaboratorsSection';
import { BookFormCommerceSection } from './book-form/BookFormCommerceSection';
import { BookFormDialogHeader } from './book-form/BookFormDialogHeader';
import { BookFormFooter } from './book-form/BookFormFooter';
import { BookFormIdentitySection } from './book-form/BookFormIdentitySection';
import { BookFormMediaSection } from './book-form/BookFormMediaSection';
import { BookFormStorySection } from './book-form/BookFormStorySection';
import { BookFormStepNavigation } from './book-form/BookFormStepNavigation';
import type { BookFormTabKey, BookFormTabMeta } from './book-form/book-form-dialog-types';
import { bookDateToPickerDate, initialCreateState, pickerDateToIsoDate } from './book-form/utils';

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
  const [demoFile, setDemoFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BookFormTabKey>('identity');
  const [collaboratorCount, setCollaboratorCount] = useState(book?.collaborators?.length ?? 0);

  useEffect(() => {
    if (mode === 'edit' && book) {
      setForm({
        name: book.name,
        sku: book.sku,
        price: Number(book.price),
        centralQty: Number(book.centralQty || 0),
        pageCount: Number(book.pageCount || 0),
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
    setDemoFile(null);
    setThumbnail(null);
    setThumbnailPreview(null);
    setCollaboratorCount(book?.collaborators?.length ?? 0);
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
  const canManageCollaborators = mode === 'edit' && Boolean(book?.id);
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

  const tabs = useMemo<BookFormTabMeta[]>(
    () => {
      const baseTabs: BookFormTabMeta[] = [
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
      ];

      if (canManageCollaborators) {
        baseTabs.push({
          value: 'collaborators',
          title: 'Collaborators',
          summary: 'Access control and revenue sharing',
          description: 'Add staff collaborators, assign roles, and record optional revenue shares.',
          badgeText: collaboratorCount > 0 ? `${collaboratorCount} assigned` : 'Optional',
          complete: true,
          icon: UsersRound,
        });
      }

      return baseTabs;
    },
    [canManageCollaborators, collaboratorCount, form.categoryId, form.centralQty, hasCommerce, hasIdentity, hasMedia, hasStory, isEbook],
  );

  const completedSections = tabs.filter((tab) => tab.complete).length;
  const nextIncompleteTab = tabs.find((tab) => !tab.complete);
  const activeTabMeta = tabs.find((tab) => tab.value === activeTab) ?? tabs[0];
  const dialogTitle = form.name?.trim() || (mode === 'create' ? 'Untitled book draft' : 'Book details');

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
        await createBook(createPayload, file || undefined, thumbnail || undefined, demoFile || undefined);
      } else if (book) {
        const updatePayload: UpdateBookDto = {
          ...basePayload,
          publishedAt: publishedIso,
        };
        await updateBook(book.id, updatePayload, file || undefined, thumbnail || undefined, demoFile || undefined);
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
      contentClassName="h-[92vh] rounded-xl"
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden bg-linear-to-br from-white via-sky-50/40 to-rose-50/40 p-0 dark:from-slate-950 dark:via-sky-950/10 dark:to-rose-950/10"
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
          onValueChange={(value) => setActiveTab(value as BookFormTabKey)}
          className="flex min-h-0 w-full max-w-full flex-1 flex-col gap-0 overflow-hidden"
        >
          <BookFormDialogHeader
            title={dialogTitle}
            description={activeTabMeta.description}
            completedSections={completedSections}
            totalSections={tabs.length}
            nextIncompleteTitle={nextIncompleteTab?.title}
            isEbook={isEbook}
            selectedCategoryName={selectedCategory?.name}
            selectedProgramName={selectedProgram?.name}
            coverUrl={coverUrl}
            sku={current.sku}
            price={price}
          />

          <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)]">
            <BookFormStepNavigation tabs={tabs} />

            <div className="relative isolate min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-3 pb-4 pt-4 [-webkit-overflow-scrolling:touch] [scrollbar-color:rgb(203_213_225)_transparent] [scrollbar-width:thin] sm:px-5 sm:pb-6 sm:pt-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400">
              <div className="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-5">
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
                    demoFile={demoFile}
                    setDemoFile={setDemoFile}
                  />
                </TabsContent>

                {canManageCollaborators && book?.id ? (
                  <TabsContent value="collaborators" className="mt-0 focus-visible:outline-none">
                    <BookFormCollaboratorsSection
                      bookId={book.id}
                      initialCollaborators={book.collaborators}
                      onCountChange={setCollaboratorCount}
                    />
                  </TabsContent>
                ) : null}

                {!activeTabMeta.complete ? <BookFormAttentionNotice sectionTitle={activeTabMeta.title} /> : null}
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </BookAdminModal>
  );
}
