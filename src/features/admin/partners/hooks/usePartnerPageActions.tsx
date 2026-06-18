'use client';

import { useCallback, useState } from 'react';
import NextLink from 'next/link';
import { deletePartner, patchPartner, type PartnerAdmin } from '@/lib/api/partners';
import { getCourseById } from '@/lib/api/courses';
import { getBookById } from '@/lib/api/books';
import type { CourseDetails } from '@/types/course';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useModalStore } from '@/store/modalStore';
import { ConfirmationModal } from '@/features/admin/shared';
import { CourseDetailsView } from '@/features/admin/courses';
import { PartnerAdminForm } from '../components/PartnerAdminForm';

type Params = {
  invalidatePartners: () => Promise<void>;
};

export function usePartnerPageActions({ invalidatePartners }: Params) {
  const { openModal, closeModal } = useModalStore();
  const { toast } = useToast();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [revenuePartner, setRevenuePartner] = useState<PartnerAdmin | null>(null);
  const [showRevenueDialog, setShowRevenueDialog] = useState(false);
  const [detailPartner, setDetailPartner] = useState<PartnerAdmin | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const openForm = useCallback(
    (existing?: PartnerAdmin) => {
      openModal({
        title: existing ? 'Edit partner' : 'Add partner',
        description:
          'Partners appear on the homepage carousel when active. Set sort order and upload a clear logo (PNG/SVG recommended).',
        className: 'sm:max-w-4xl max-h-[90vh] overflow-y-auto',
        content: (
          <PartnerAdminForm
            existing={existing}
            onCancel={() => closeModal()}
            onSaved={async () => {
              await invalidatePartners();
              closeModal();
              toast({
                title: existing ? 'Partner updated' : 'Partner created',
                variant: 'success',
              });
            }}
          />
        ),
      });
    },
    [closeModal, invalidatePartners, openModal, toast],
  );

  const remove = useCallback(
    (id: string) => {
      openModal({
        title: 'Remove partner',
        className: 'sm:max-w-md',
        content: (
          <ConfirmationModal
            title="Delete this partner?"
            description="Removes the logo and details from the admin list and the public homepage carousel."
            variant="danger"
            onConfirm={async () => {
              await deletePartner(id);
              await invalidatePartners();
              toast({ title: 'Partner deleted', variant: 'success' });
            }}
          />
        ),
      });
    },
    [invalidatePartners, openModal, toast],
  );

  const openPartnerDetails = useCallback((partner: PartnerAdmin) => {
    setDetailPartner(partner);
    setShowDetailDialog(true);
  }, []);

  const closePartnerDetails = useCallback((open: boolean) => {
    setShowDetailDialog(open);
    if (!open) setDetailPartner(null);
  }, []);

  const openLinkedCourse = useCallback(
    async (courseId: string) => {
      try {
        const res = await getCourseById(courseId);
        if (res.success && res.data) {
          openModal({
            title: res.data.name,
            description: 'Course details',
            className: 'sm:max-w-6xl max-h-[92vh] overflow-y-auto',
            content: (
              <CourseDetailsView
                course={res.data as CourseDetails}
                onAfterMutation={async () => {
                  closeModal();
                  await invalidatePartners();
                }}
              />
            ),
          });
        } else {
          toast({ title: 'Course not found', variant: 'destructive' });
        }
      } catch (err) {
        toast({
          title: 'Failed to open course',
          description: (err as Error).message,
          variant: 'destructive',
        });
      }
    },
    [closeModal, invalidatePartners, openModal, toast],
  );

  const openLinkedBook = useCallback(
    async (bookId: string) => {
      try {
        const res = await getBookById(bookId);
        if (res.success && res.data) {
          const b = res.data;
          openModal({
            title: b.name,
            description: `SKU ${b.sku}`,
            className: 'sm:max-w-md',
            content: (
              <div className="space-y-4 py-2 text-sm">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                  <p className="text-xs text-slate-500">Price</p>
                  <p className="text-lg font-bold text-slate-900">
                    ৳{Number(b.price ?? 0).toLocaleString()}
                  </p>
                  {b.author ? (
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-500">Author:</span> {b.author}
                    </p>
                  ) : null}
                </div>
                <Button asChild className="w-full rounded-xl" variant="outline">
                  <NextLink href="/admin/books" target="_blank" rel="noopener noreferrer">
                    Open Books admin
                  </NextLink>
                </Button>
              </div>
            ),
          });
        } else {
          toast({ title: 'Book not found', variant: 'destructive' });
        }
      } catch (err) {
        toast({
          title: 'Failed to open book',
          description: (err as Error).message,
          variant: 'destructive',
        });
      }
    },
    [openModal, toast],
  );

  const toggleActive = useCallback(
    async (partner: PartnerAdmin, next: boolean) => {
      try {
        setTogglingId(partner.id);
        await patchPartner(partner.id, { isActive: next });
        await invalidatePartners();
        toast({
          title: next ? 'Visible on site' : 'Hidden from site',
          variant: 'success',
        });
      } catch (e) {
        toast({
          title: 'Update failed',
          description: (e as Error).message,
          variant: 'destructive',
        });
      } finally {
        setTogglingId(null);
      }
    },
    [invalidatePartners, toast],
  );

  const openRevenueDialog = useCallback((partner: PartnerAdmin) => {
    setRevenuePartner(partner);
    setShowRevenueDialog(true);
  }, []);

  return {
    togglingId,
    revenuePartner,
    showRevenueDialog,
    setShowRevenueDialog,
    detailPartner,
    showDetailDialog,
    closePartnerDetails,
    openForm,
    remove,
    openPartnerDetails,
    openLinkedCourse,
    openLinkedBook,
    toggleActive,
    openRevenueDialog,
  };
}
