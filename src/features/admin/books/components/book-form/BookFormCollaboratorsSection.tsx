'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { confirmAction } from '@/features/admin/shared/confirm-action';
import { getUsers, type User } from '@/lib/api/users';
import { addBookCollaborator, removeBookCollaborator, type Book } from '@/lib/api/books';
import { Plus, Trash2, UsersRound } from 'lucide-react';
import { BookFormField } from './BookFormField';
import { BookFormSectionCard } from './BookFormSectionCard';

type BookCollaboratorRow = NonNullable<Book['collaborators']>[number];

const COLLABORATOR_ROLES = [
  { value: 'UPLOADER', label: 'Uploader' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'VIEWER', label: 'Viewer' },
] as const;

export function BookFormCollaboratorsSection({
  bookId,
  initialCollaborators,
  onCountChange,
}: {
  bookId: string;
  initialCollaborators?: Book['collaborators'];
  onCountChange?: (count: number) => void;
}) {
  const toast = useAdminToast();
  const [collaborators, setCollaborators] = useState<BookCollaboratorRow[]>(initialCollaborators ?? []);
  const [staffOptions, setStaffOptions] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<(typeof COLLABORATOR_ROLES)[number]['value']>('EDITOR');
  const [revenueSharePercent, setRevenueSharePercent] = useState('');

  useEffect(() => {
    setCollaborators(initialCollaborators ?? []);
  }, [initialCollaborators]);

  useEffect(() => {
    onCountChange?.(collaborators.length);
  }, [collaborators.length, onCountChange]);

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await getUsers({ status: 'ACTIVE', staffOnly: true, minimal: true, limit: 200 });
        if (!cancelled && res.success && res.data) {
          setStaffOptions(res.data);
        }
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    };

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const assignableUsers = useMemo(
    () => staffOptions.filter((user) => !collaborators.some((collaborator) => collaborator.userId === user.id)),
    [collaborators, staffOptions],
  );

  const handleAddCollaborator = async () => {
    if (!selectedUserId) {
      toast({ title: 'Select a collaborator', description: 'Choose a staff member before adding.', variant: 'destructive' });
      return;
    }

    const revenueShare = revenueSharePercent.trim() === '' ? undefined : Number(revenueSharePercent);
    if (revenueShare != null && (!Number.isFinite(revenueShare) || revenueShare < 0 || revenueShare > 100)) {
      toast({ title: 'Invalid revenue share', description: 'Revenue share must be between 0 and 100.', variant: 'destructive' });
      return;
    }

    const selectedUser = staffOptions.find((user) => user.id === selectedUserId);
    if (!selectedUser) {
      toast({ title: 'User not found', description: 'Refresh the staff list and try again.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await addBookCollaborator({
        bookId,
        userId: selectedUserId,
        role: selectedRole,
        revenueSharePercent: revenueShare,
      });

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Could not add collaborator');
      }

      setCollaborators((prev) => [
        ...prev,
        {
          ...res.data,
          user: {
            id: selectedUser.id,
            fullName: selectedUser.fullName,
            email: selectedUser.email,
            mobile: selectedUser.mobile,
            profileImage: selectedUser.profileImage,
            role: selectedUser.role,
          },
        },
      ]);
      setSelectedUserId('');
      setSelectedRole('EDITOR');
      setRevenueSharePercent('');
      toast({ title: 'Collaborator added', variant: 'success' });
    } catch (error) {
      toast({
        title: 'Could not add collaborator',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveCollaborator = async (collaborator: BookCollaboratorRow) => {
    if (!(await confirmAction({
      title: 'Remove collaborator?',
      description: `${collaborator.user?.fullName || 'This user'} will lose collaborator access for this book.`,
      confirmLabel: 'Remove collaborator',
      variant: 'danger',
    }))) {
      return;
    }

    setRemovingUserId(collaborator.userId);
    try {
      const res = await removeBookCollaborator(bookId, collaborator.userId);
      if (!res.success) {
        throw new Error(res.message || 'Could not remove collaborator');
      }
      setCollaborators((prev) => prev.filter((item) => item.userId !== collaborator.userId));
      toast({ title: 'Collaborator removed', variant: 'success' });
    } catch (error) {
      toast({
        title: 'Could not remove collaborator',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setRemovingUserId(null);
    }
  };

  return (
    <BookFormSectionCard
      tone="indigo"
      icon={UsersRound}
      title="Collaborators"
      subtitle="Assign staff to help manage this book and optionally set revenue share percentages."
    >
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white/80 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_180px_180px_auto]">
        <BookFormField label="Staff member" hint="Only active staff accounts are shown.">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder={loadingUsers ? 'Loading staff...' : 'Select a collaborator'} />
            </SelectTrigger>
            <SelectContent>
              {assignableUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.fullName} {user.role ? `• ${user.role}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </BookFormField>

        <BookFormField label="Role">
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as (typeof COLLABORATOR_ROLES)[number]['value'])}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLLABORATOR_ROLES.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </BookFormField>

        <BookFormField label="Revenue Share %" optional hint="Leave blank if revenue share does not apply.">
          <Input
            type="number"
            min={0}
            max={100}
            step={1}
            value={revenueSharePercent}
            onChange={(event) => setRevenueSharePercent(event.target.value)}
            placeholder="0"
            className="bg-white"
          />
        </BookFormField>

        <div className="flex items-end">
          <Button
            type="button"
            onClick={() => void handleAddCollaborator()}
            disabled={submitting || loadingUsers || assignableUsers.length === 0}
            className="w-full rounded-xl bg-slate-900 text-white hover:bg-black"
          >
            <Plus className="mr-2 h-4 w-4" />
            {submitting ? 'Adding…' : 'Add'}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {collaborators.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm font-medium text-slate-500">
            No collaborators added yet.
          </div>
        ) : (
          collaborators.map((collaborator) => (
            <div
              key={collaborator.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {collaborator.user?.fullName || collaborator.userId}
                  </p>
                  <Badge variant="outline" className="rounded-full text-[10px] font-black uppercase tracking-wide">
                    {collaborator.role}
                  </Badge>
                  {collaborator.revenueSharePercent != null ? (
                    <Badge className="rounded-full bg-emerald-100 text-[10px] font-black text-emerald-800">
                      {Number(collaborator.revenueSharePercent)}%
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {collaborator.user?.email || collaborator.user?.mobile || collaborator.userId}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50"
                disabled={removingUserId === collaborator.userId}
                onClick={() => void handleRemoveCollaborator(collaborator)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {removingUserId === collaborator.userId ? 'Removing…' : 'Remove'}
              </Button>
            </div>
          ))
        )}
      </div>
    </BookFormSectionCard>
  );
}