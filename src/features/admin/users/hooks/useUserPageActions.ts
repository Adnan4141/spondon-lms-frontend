'use client';

import { useCallback, useState } from 'react';
import { deleteUser, getUserById, updateUser, type User } from '@/lib/api/users';
import { useToast } from '@/hooks/use-toast';

type Params = {
  refreshAll: () => Promise<void>;
};

export function useUserPageActions({ refreshAll }: Params) {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [blockTarget, setBlockTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const openCreate = useCallback(() => {
    setEditingUser(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((user: User) => {
    setEditingUser(user);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
  }, []);

  const handleFormSuccess = useCallback(async () => {
    setFormOpen(false);
    await refreshAll();
  }, [refreshAll]);

  const handleViewDetails = useCallback(async (user: User) => {
    try {
      const res = await getUserById(user.id);
      setDetailUser(res.data ?? user);
    } catch {
      setDetailUser(user);
    }
  }, []);

  const handleBlockToggle = useCallback(async () => {
    if (!blockTarget) return;
    setActionLoading(true);
    try {
      const newStatus = blockTarget.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
      const res = await updateUser(blockTarget.id, { status: newStatus });
      if (!res.success) throw new Error(res.message);
      toast({
        title: newStatus === 'BLOCKED' ? 'User blocked' : 'User activated',
        variant: 'success',
      });
      setBlockTarget(null);
      await refreshAll();
    } catch (err) {
      toast({
        title: 'Action failed',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  }, [blockTarget, refreshAll, toast]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const res = await deleteUser(deleteTarget.id);
      if (!res.success) throw new Error(res.message);
      toast({ title: 'User deleted', variant: 'success' });
      setDeleteTarget(null);
      await refreshAll();
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  }, [deleteTarget, refreshAll, toast]);

  const handleResetSuccess = useCallback(async () => {
    setResetTarget(null);
    await refreshAll();
  }, [refreshAll]);

  return {
    formOpen,
    setFormOpen,
    editingUser,
    detailUser,
    setDetailUser,
    blockTarget,
    setBlockTarget,
    deleteTarget,
    setDeleteTarget,
    resetTarget,
    setResetTarget,
    actionLoading,
    openCreate,
    openEdit,
    closeForm,
    handleFormSuccess,
    handleViewDetails,
    handleBlockToggle,
    handleDelete,
    handleResetSuccess,
  };
}
