'use client';

import { useCallback, useState } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  deleteUser,
  getUserById,
  reorderTeachers,
  updateUser,
  type User,
} from '@/lib/api/users';
import type { Branch } from '@/lib/api/branches';
import { useToast } from '@/hooks/use-toast';
import { useModalStore } from '@/store/modalStore';
import { ConfirmationModal } from '@/features/admin/shared';
import { TeacherDetailsView } from '../components/TeacherDetailsView';
import { TeacherForm } from '../components/TeacherForm';

type Params = {
  branches: Branch[];
  teachers: User[];
  actorRole: string | null;
  actorBranchId: string | null;
  invalidateTeachers: () => Promise<void>;
};

export function useTeacherPageActions({
  branches,
  teachers,
  actorRole,
  actorBranchId,
  invalidateTeachers,
}: Params) {
  const { openModal } = useModalStore();
  const { toast } = useToast();
  const [sortMode, setSortMode] = useState(false);
  const [orderedTeachers, setOrderedTeachers] = useState<User[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);

  const lockedBranchId = actorRole === 'BRANCH_ADMIN' ? actorBranchId : undefined;

  const syncOrderedTeachers = useCallback((items: User[]) => {
    setOrderedTeachers(items);
  }, []);

  const openCreate = useCallback(() => {
    openModal({
      title: 'Add Teacher',
      description: 'Create a new teacher account and assign them to a branch.',
      className: 'sm:max-w-5xl',
      content: (
        <TeacherForm
          branches={branches}
          lockedBranchId={lockedBranchId ?? undefined}
          onSuccess={invalidateTeachers}
        />
      ),
    });
  }, [branches, invalidateTeachers, lockedBranchId, openModal]);

  const openView = useCallback(
    async (id: string) => {
      try {
        const res = await getUserById(id);
        if (!res.success || !res.data) {
          toast({ title: 'Error', description: 'Failed to load teacher', variant: 'destructive' });
          return;
        }
        openModal({
          title: 'Teacher Profile',
          description: 'Full teacher profile.',
          className: 'sm:max-w-3xl',
          content: <TeacherDetailsView teacher={res.data} />,
        });
      } catch {
        toast({ title: 'Error', description: 'Failed to load teacher', variant: 'destructive' });
      }
    },
    [openModal, toast],
  );

  const openEdit = useCallback(
    async (id: string) => {
      try {
        const res = await getUserById(id);
        if (!res.success || !res.data) {
          toast({ title: 'Error', description: 'Failed to load teacher', variant: 'destructive' });
          return;
        }
        openModal({
          title: 'Edit Teacher',
          description: 'Update profile information, branch assignment, or account status.',
          className: 'sm:max-w-5xl',
          content: (
            <TeacherForm
              branches={branches}
              teacher={res.data}
              lockedBranchId={lockedBranchId ?? undefined}
              onSuccess={invalidateTeachers}
            />
          ),
        });
      } catch {
        toast({ title: 'Error', description: 'Failed to load teacher', variant: 'destructive' });
      }
    },
    [branches, invalidateTeachers, lockedBranchId, openModal, toast],
  );

  const setTeacherStatus = useCallback(
    (id: string, status: 'ACTIVE' | 'BLOCKED', label: string) => {
      openModal({
        title: label,
        description:
          status === 'BLOCKED'
            ? 'The teacher will no longer be able to sign in.'
            : 'The teacher will regain access to their portal.',
        className: 'sm:max-w-md',
        content: (
          <ConfirmationModal
            title="Confirm Status Change"
            description={
              status === 'BLOCKED'
                ? 'Are you sure you want to block this teacher?'
                : 'Are you sure you want to activate this teacher?'
            }
            variant={status === 'BLOCKED' ? 'danger' : 'info'}
            onConfirm={async () => {
              try {
                await updateUser(id, { status });
                await invalidateTeachers();
                toast({
                  title: 'Success',
                  description: `Teacher status updated to ${status}`,
                  variant: 'success',
                });
              } catch (e: unknown) {
                toast({
                  title: 'Error',
                  description: e instanceof Error ? e.message : 'Update failed',
                  variant: 'destructive',
                });
              }
            }}
          />
        ),
      });
    },
    [invalidateTeachers, openModal, toast],
  );

  const handleDelete = useCallback(
    (id: string, name: string) => {
      openModal({
        title: 'Delete Teacher',
        description: 'This action is permanent and cannot be undone.',
        className: 'sm:max-w-md',
        content: (
          <ConfirmationModal
            title="Delete Teacher Account"
            description={`Are you sure you want to permanently delete "${name}"? All their data will be removed.`}
            variant="danger"
            onConfirm={async () => {
              try {
                await deleteUser(id);
                await invalidateTeachers();
                toast({
                  title: 'Deleted',
                  description: `${name} has been removed.`,
                  variant: 'success',
                });
              } catch (e: unknown) {
                toast({
                  title: 'Error',
                  description: e instanceof Error ? e.message : 'Delete failed',
                  variant: 'destructive',
                });
              }
            }}
          />
        ),
      });
    },
    [invalidateTeachers, openModal, toast],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedTeachers((items) => {
        const oldIndex = items.findIndex((t) => t.id === active.id);
        const newIndex = items.findIndex((t) => t.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const handleSaveOrder = useCallback(async () => {
    try {
      setSavingOrder(true);
      const items = orderedTeachers.map((t, i) => ({ id: t.id, displayOrder: i }));
      await reorderTeachers(items);
      await invalidateTeachers();
      setSortMode(false);
      toast({
        title: 'Order saved',
        description: 'Teacher display order updated.',
        variant: 'success',
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to save order.', variant: 'destructive' });
    } finally {
      setSavingOrder(false);
    }
  }, [invalidateTeachers, orderedTeachers, toast]);

  const toggleSortMode = useCallback(() => {
    setSortMode((current) => {
      if (current) setOrderedTeachers(teachers);
      return !current;
    });
  }, [teachers]);

  return {
    sortMode,
    orderedTeachers,
    savingOrder,
    sensors,
    syncOrderedTeachers,
    openCreate,
    openView,
    openEdit,
    setTeacherStatus,
    handleDelete,
    handleDragEnd,
    handleSaveOrder,
    toggleSortMode,
  };
}
