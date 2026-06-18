'use client';

import { useCallback } from 'react';
import { deleteBatch, getBatchById } from '@/lib/api/batches';
import type { Course } from '@/types/course';
import type { Branch } from '@/lib/api/branches';
import { useToast } from '@/hooks/use-toast';
import { useModalStore } from '@/store/modalStore';
import { ConfirmationModal } from '@/features/admin/shared';
import { BatchDetailsView } from '../components/BatchDetailsView';
import { BatchForm } from '../components/BatchForm';
import { BatchRoutineModal } from '../components/BatchRoutineModal';
import { getErrorMessage } from '../batches-page-utils';

type Params = {
  courses: Course[];
  branches: Branch[];
  scopedBranchId: string | null;
  invalidateBatches: () => Promise<void>;
};

export function useBatchPageActions({
  courses,
  branches,
  scopedBranchId,
  invalidateBatches,
}: Params) {
  const { openModal } = useModalStore();
  const { toast } = useToast();

  const formBranches = scopedBranchId
    ? branches.filter((b) => b.id === scopedBranchId)
    : branches;

  const handleViewBatch = useCallback(
    async (id: string) => {
      try {
        const response = await getBatchById(id);
        if (response.success && response.data) {
          openModal({
            title: 'Batch Details',
            description: 'View batch details.',
            className: 'w-[calc(100vw-1rem)] sm:max-w-4xl',
            content: <BatchDetailsView batch={response.data} />,
          });
        }
      } catch {
        toast({ title: 'Error', description: 'Failed to load batch details', variant: 'destructive' });
      }
    },
    [openModal, toast],
  );

  const handleRoutineBatch = useCallback(
    async (id: string) => {
      try {
        const response = await getBatchById(id);
        if (response.success && response.data) {
          const batch = response.data;
          openModal({
            title: 'Batch Routine',
            description: 'View weekly class times for this batch.',
            className: 'w-[calc(100vw-1rem)] sm:max-w-3xl',
            content: (
              <BatchRoutineModal
                batchId={batch.id}
                batchName={batch.name}
                courseName={batch.course?.name}
                branchId={batch.branchId}
              />
            ),
          });
        }
      } catch {
        toast({ title: 'Error', description: 'Failed to open routine', variant: 'destructive' });
      }
    },
    [openModal, toast],
  );

  const handleEditBatch = useCallback(
    async (id: string) => {
      try {
        const response = await getBatchById(id);
        if (response.success && response.data) {
          openModal({
            title: 'Edit Batch',
            description: 'Update batch details.',
            className: 'w-[calc(100vw-1rem)] sm:max-w-2xl',
            content: (
              <BatchForm
                courses={courses}
                branches={branches}
                batch={response.data}
                onSuccess={invalidateBatches}
              />
            ),
          });
        }
      } catch {
        toast({ title: 'Error', description: 'Failed to load batch for editing', variant: 'destructive' });
      }
    },
    [branches, courses, invalidateBatches, openModal, toast],
  );

  const handleCreateBatch = useCallback(() => {
    openModal({
      title: 'Create Batch',
      description: 'Add a new batch for a course and branch.',
      className: 'w-[calc(100vw-1rem)] sm:max-w-2xl',
      content: (
        <BatchForm courses={courses} branches={formBranches} onSuccess={invalidateBatches} />
      ),
    });
  }, [courses, formBranches, invalidateBatches, openModal]);

  const handleDeleteBatch = useCallback(
    (id: string) => {
      openModal({
        title: 'Delete Batch',
        description: 'This will remove the batch and may affect linked students and schedules.',
        className: 'w-[calc(100vw-1rem)] sm:max-w-xl',
        content: (
          <ConfirmationModal
            title="Confirm Delete"
            description="Are you sure you want to delete this batch?"
            variant="danger"
            onConfirm={async () => {
              try {
                await deleteBatch(id);
                await invalidateBatches();
                toast({
                  title: 'Success',
                  description: 'Batch deleted successfully',
                  variant: 'success',
                });
              } catch (err) {
                toast({
                  title: 'Error',
                  description: getErrorMessage(err),
                  variant: 'destructive',
                });
              }
            }}
          />
        ),
      });
    },
    [invalidateBatches, openModal, toast],
  );

  return {
    handleViewBatch,
    handleRoutineBatch,
    handleEditBatch,
    handleCreateBatch,
    handleDeleteBatch,
  };
}
